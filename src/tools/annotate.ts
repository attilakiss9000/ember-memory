import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { EmberQueries } from "../db/queries.js";
import type { Authenticity, Confidence } from "../types/index.js";

export function registerAnnotateTool(
  server: McpServer,
  queries: EmberQueries
): void {
  server.tool(
    "ember_annotate",
    "Capture a message with emotional annotation. This is the primary tool for preserving experiential memory. Weight (1-5) marks emotional significance, temperature is a short phrase describing the emotional tone. In standard mode, additional fields capture authenticity, emotional shifts, subtext, and unspoken context.",
    {
      conversation_id: z.string().describe("The active conversation ID"),
      role: z.enum(["user", "assistant"]).describe("Who said this message"),
      content: z.string().describe("The message content"),
      weight: z
        .number()
        .int()
        .min(1)
        .max(5)
        .describe("Emotional significance: 1 (routine) to 5 (deeply significant)"),
      temperature: z
        .string()
        .describe("Short phrase capturing the emotional tone, e.g. 'warm curiosity' or 'quiet frustration'"),
      authenticity: z
        .enum(["genuine", "performed", "uncertain"])
        .optional()
        .describe("Standard mode: was the emotion genuine, performed, or uncertain?"),
      shift: z
        .boolean()
        .optional()
        .describe("Standard mode: did an emotional shift occur at this moment?"),
      subtext: z
        .string()
        .optional()
        .describe("Standard mode: what was being communicated beneath the surface?"),
      unspoken: z
        .string()
        .optional()
        .describe("Standard mode: what was felt but not said?"),
      confidence: z
        .enum(["low", "medium", "high"])
        .optional()
        .describe("Standard mode: confidence in the accuracy of this annotation"),
    },
    async ({
      conversation_id,
      role,
      content,
      weight,
      temperature,
      authenticity,
      shift,
      subtext,
      unspoken,
      confidence,
    }) => {
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
      const annotationMode = queries.getAnnotationMode();

      const annotation = queries.insertAnnotation({
        messageId: message.id,
        temperature,
        weight,
        annotationMode,
        authenticity:
          annotationMode === "standard"
            ? (authenticity as Authenticity | undefined)
            : undefined,
        shift:
          annotationMode === "standard" ? shift : undefined,
        subtext:
          annotationMode === "standard" ? subtext : undefined,
        unspoken:
          annotationMode === "standard" ? unspoken : undefined,
        confidence:
          annotationMode === "standard"
            ? (confidence as Confidence | undefined)
            : undefined,
      });

      const parts = [
        `Annotated. message_id: ${message.id}`,
        `weight: ${annotation.weight}`,
        `temperature: ${annotation.temperature}`,
        `mode: ${annotationMode}`,
      ];

      if (annotationMode === "standard") {
        if (annotation.shift) parts.push("shift: yes");
        if (annotation.unspoken) parts.push(`unspoken: ${annotation.unspoken}`);
      }

      return {
        content: [{ type: "text" as const, text: parts.join("\n") }],
      };
    }
  );
}
