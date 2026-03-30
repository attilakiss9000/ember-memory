import crypto from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { EmberQueries } from "../db/queries.js";

export function registerConversationTools(
  server: McpServer,
  queries: EmberQueries
): void {
  server.tool(
    "ember_start_conversation",
    "Start a new conversation and receive its unique ID. Call this at the beginning of every session so subsequent captures and annotations can be linked to this conversation.",
    {},
    async () => {
      const id = crypto.randomUUID();
      const conversation = queries.startConversation(id);
      return {
        content: [
          {
            type: "text" as const,
            text: `Conversation started.\nid: ${conversation.id}\nstarted_at: ${conversation.started_at}`,
          },
        ],
      };
    }
  );

  server.tool(
    "ember_end_conversation",
    "End an active conversation. Optionally provide a brief summary of what the conversation covered.",
    {
      conversation_id: z.string().describe("The conversation ID to end"),
      summary: z
        .string()
        .optional()
        .describe("Optional brief summary of the conversation"),
    },
    async ({ conversation_id, summary }) => {
      const existing = queries.getConversation(conversation_id);
      if (!existing) {
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

      if (existing.ended_at) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Conversation ${conversation_id} has already ended.`,
            },
          ],
          isError: true,
        };
      }

      const messageCount = queries.getMessageCount(conversation_id);
      const conversation = queries.endConversation(conversation_id, summary);

      return {
        content: [
          {
            type: "text" as const,
            text: `Conversation ended.\nid: ${conversation.id}\nmessages: ${messageCount}\nended_at: ${conversation.ended_at}${summary ? `\nsummary: ${summary}` : ""}`,
          },
        ],
      };
    }
  );
}
