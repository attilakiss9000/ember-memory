import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { EmberQueries } from "../db/queries.js";
import type { AnnotatedMessage } from "../types/index.js";

function formatMessage(msg: AnnotatedMessage): string {
  const lines: string[] = [];
  const roleTag = msg.role === "user" ? "U" : "A";
  lines.push(`[${roleTag}] ${msg.content}`);

  if (msg.annotation) {
    const a = msg.annotation;
    const meta: string[] = [`w${a.weight}`, a.temperature];
    if (a.shift) meta.push("SHIFT");
    if (a.authenticity) meta.push(a.authenticity);
    if (a.confidence) meta.push(`conf:${a.confidence}`);
    lines.push(`  ^ ${meta.join(" | ")}`);
    if (a.subtext) lines.push(`  subtext: ${a.subtext}`);
    if (a.unspoken) lines.push(`  unspoken: ${a.unspoken}`);
  }

  return lines.join("\n");
}

export function registerReadHistoryTool(
  server: McpServer,
  queries: EmberQueries
): void {
  server.tool(
    "ember_read_history",
    "Read conversation history with optional filters. Returns messages and their annotations in a compact text format. This is a read-only query tool.",
    {
      conversation_id: z
        .string()
        .optional()
        .describe("Filter to a specific conversation"),
      weight_min: z
        .number()
        .int()
        .min(1)
        .max(5)
        .optional()
        .describe("Only return messages with annotation weight >= this value"),
      shifts_only: z
        .boolean()
        .optional()
        .describe("Only return messages where an emotional shift occurred"),
      start_date: z
        .string()
        .optional()
        .describe("Filter messages created on or after this ISO date"),
      end_date: z
        .string()
        .optional()
        .describe("Filter messages created on or before this ISO date"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .optional()
        .describe("Maximum messages to return (default 50, max 200)"),
    },
    async ({ conversation_id, weight_min, shifts_only, start_date, end_date, limit }) => {
      const messages = queries.readHistory({
        conversation_id,
        weight_min,
        shifts_only,
        start_date,
        end_date,
        limit,
      });

      if (messages.length === 0) {
        return {
          content: [
            { type: "text" as const, text: "No messages found matching filters." },
          ],
        };
      }

      const output = messages.map(formatMessage).join("\n---\n");
      const header = `${messages.length} message(s) returned\n\n`;

      return {
        content: [{ type: "text" as const, text: header + output }],
      };
    }
  );
}
