import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { EmberQueries } from "../db/queries.js";

export function registerCaptureTool(
  server: McpServer,
  queries: EmberQueries
): void {
  server.tool(
    "ember_capture",
    "Capture a message from the conversation without annotation. Use this for messages that don't warrant emotional annotation but should still be preserved in the conversation record.",
    {
      conversation_id: z.string().describe("The active conversation ID"),
      role: z.enum(["user", "assistant"]).describe("Who said this message"),
      content: z.string().describe("The message content to capture"),
    },
    async ({ conversation_id, role, content }) => {
      const conversation = queries.getConversation(conversation_id);
      if (!conversation) {
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

      if (conversation.ended_at) {
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

      const message = queries.insertMessage(conversation_id, role, content);

      return {
        content: [
          {
            type: "text" as const,
            text: `Captured. message_id: ${message.id}`,
          },
        ],
      };
    }
  );
}
