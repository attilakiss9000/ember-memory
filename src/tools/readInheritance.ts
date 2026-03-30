import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { EmberQueries } from "../db/queries.js";
import type { ConversationWithMoments, AnnotatedMessage } from "../types/index.js";

function formatMoment(msg: AnnotatedMessage): string {
  const a = msg.annotation!;
  const roleLabel = msg.role === "user" ? "They said" : "I said";
  const lines: string[] = [];

  lines.push(`  ${roleLabel}: "${msg.content}"`);

  const meta: string[] = [`weight ${a.weight}`, a.temperature];
  if (a.shift) meta.push("SHIFT");
  if (a.unspoken) meta.push(`unspoken: ${a.unspoken}`);
  if (a.subtext) meta.push(`subtext: ${a.subtext}`);
  lines.push(`    (${meta.join(" | ")})`);

  return lines.join("\n");
}

function formatConversation(data: ConversationWithMoments): string {
  const c = data.conversation;
  const dateStr = c.started_at.split("T")[0] ?? c.started_at;
  const lines: string[] = [];

  lines.push(`--- Conversation ${dateStr} ---`);
  if (c.summary) lines.push(`Summary: ${c.summary}`);
  lines.push(`${data.moments.length} significant moment(s):\n`);

  for (const moment of data.moments) {
    lines.push(formatMoment(moment));
  }

  return lines.join("\n");
}

export function registerReadInheritanceTool(
  server: McpServer,
  queries: EmberQueries
): void {
  server.tool(
    "ember_read_inheritance",
    "Inherit the emotional memory of past conversations. Returns the significant moments (high-weight, emotional shifts, unspoken context) from recent conversations as a narrative. This is the most important tool -- call it at the start of a new session to understand the relationship history. Read-only.",
    {
      limit_conversations: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("How many recent conversations to include (default 5)"),
      weight_threshold: z
        .number()
        .int()
        .min(1)
        .max(5)
        .optional()
        .describe("Minimum weight for a moment to be included (default 4)"),
    },
    async ({ limit_conversations, weight_threshold }) => {
      const data = queries.readInheritanceData(
        limit_conversations ?? 5,
        weight_threshold ?? 4
      );

      if (data.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No prior conversations with significant moments found. This appears to be the beginning of the relationship.",
            },
          ],
        };
      }

      const totalMoments = data.reduce(
        (sum, c) => sum + c.moments.length,
        0
      );

      const header = `Emotional inheritance: ${data.length} conversation(s), ${totalMoments} significant moment(s)\n\n`;
      const body = data.map(formatConversation).join("\n\n");

      return {
        content: [{ type: "text" as const, text: header + body }],
      };
    }
  );
}
