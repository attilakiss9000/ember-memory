import fs from "node:fs";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { EmberQueries } from "../db/queries.js";
import type { AnnotatedMessage, ConversationRow } from "../types/index.js";
import { ensureExportsDir, getExportsDir } from "../utils/config.js";

function formatMessageMarkdown(msg: AnnotatedMessage): string {
  const roleLabel = msg.role === "user" ? "**User**" : "**Assistant**";
  const lines: string[] = [];

  lines.push(`${roleLabel}: ${msg.content}`);

  if (msg.annotation) {
    const a = msg.annotation;
    const parts: string[] = [
      `weight: ${a.weight}`,
      `temperature: ${a.temperature}`,
    ];
    if (a.authenticity) parts.push(`authenticity: ${a.authenticity}`);
    if (a.shift) parts.push(`shift: yes`);
    if (a.confidence) parts.push(`confidence: ${a.confidence}`);
    lines.push(`> ${parts.join(" | ")}`);
    if (a.subtext) lines.push(`> subtext: ${a.subtext}`);
    if (a.unspoken) lines.push(`> unspoken: ${a.unspoken}`);
  }

  return lines.join("\n");
}

function buildConversationMarkdown(
  conversation: ConversationRow,
  messages: AnnotatedMessage[]
): string {
  const lines: string[] = [];
  const date = conversation.started_at.split("T")[0] ?? conversation.started_at;

  lines.push(`# Conversation ${date}`);
  lines.push("");
  lines.push(`- **ID**: ${conversation.id}`);
  lines.push(`- **Started**: ${conversation.started_at}`);
  if (conversation.ended_at) lines.push(`- **Ended**: ${conversation.ended_at}`);
  if (conversation.summary) lines.push(`- **Summary**: ${conversation.summary}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const msg of messages) {
    lines.push(formatMessageMarkdown(msg));
    lines.push("");
  }

  return lines.join("\n");
}

export function registerExportTool(
  server: McpServer,
  queries: EmberQueries
): void {
  server.tool(
    "ember_export",
    "Export conversation data as markdown files to ~/.ember/exports/. Exports a single conversation by ID, or all conversations if no ID is given.",
    {
      conversation_id: z
        .string()
        .optional()
        .describe("Export a specific conversation. If omitted, exports all conversations."),
    },
    async ({ conversation_id }) => {
      ensureExportsDir();
      const exportsDir = getExportsDir();
      const exportedPaths: string[] = [];

      let conversations: ConversationRow[];
      if (conversation_id) {
        const conv = queries.getConversation(conversation_id);
        if (!conv) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Conversation ${conversation_id} not found.`,
              },
            ],
            isError: true,
          };
        }
        conversations = [conv];
      } else {
        conversations = queries.listConversations(1000);
      }

      if (conversations.length === 0) {
        return {
          content: [
            { type: "text" as const, text: "No conversations to export." },
          ],
        };
      }

      for (const conv of conversations) {
        const messages = queries.readHistory({ conversation_id: conv.id, limit: 200 });
        const markdown = buildConversationMarkdown(conv, messages);
        const date = conv.started_at.split("T")[0] ?? "unknown";
        const shortId = conv.id.slice(0, 8);
        const filename = `${date}_${shortId}.md`;
        const filePath = path.join(exportsDir, filename);

        fs.writeFileSync(filePath, markdown, "utf-8");
        exportedPaths.push(filePath);
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Exported ${exportedPaths.length} conversation(s):\n${exportedPaths.join("\n")}`,
          },
        ],
      };
    }
  );
}
