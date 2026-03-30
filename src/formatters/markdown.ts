import type { ConversationRow, MessageRow, AnnotationRow } from "../types/index.js";

function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAnnotationBlock(annotation: AnnotationRow): string {
  const lines: string[] = [];

  lines.push("<details>");
  lines.push(`<summary>Annotation (weight: ${annotation.weight}, temperature: ${annotation.temperature})</summary>`);
  lines.push("");

  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| Weight | ${annotation.weight} |`);
  lines.push(`| Temperature | ${annotation.temperature} |`);
  lines.push(`| Mode | ${annotation.annotation_mode} |`);

  if (annotation.authenticity) {
    lines.push(`| Authenticity | ${annotation.authenticity} |`);
  }
  if (annotation.shift) {
    lines.push(`| Shift | yes |`);
  }
  if (annotation.subtext) {
    lines.push(`| Subtext | ${annotation.subtext} |`);
  }
  if (annotation.unspoken) {
    lines.push(`| Unspoken | ${annotation.unspoken} |`);
  }
  if (annotation.confidence) {
    lines.push(`| Confidence | ${annotation.confidence} |`);
  }

  lines.push("");
  lines.push("</details>");

  return lines.join("\n");
}

export function formatConversationMarkdown(
  conversation: ConversationRow,
  messages: MessageRow[],
  annotations: Map<number, AnnotationRow>
): string {
  const lines: string[] = [];

  lines.push(`# Conversation ${conversation.id}`);
  lines.push("");
  lines.push(`**Started:** ${formatTimestamp(conversation.started_at)}`);

  if (conversation.ended_at) {
    lines.push(`**Ended:** ${formatTimestamp(conversation.ended_at)}`);
  }

  if (conversation.summary) {
    lines.push(`**Summary:** ${conversation.summary}`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");

  for (const message of messages) {
    const roleHeading = message.role === "user" ? "User" : "Assistant";
    lines.push(`### ${roleHeading}`);
    lines.push(`*${formatTimestamp(message.created_at)}*`);
    lines.push("");
    lines.push(message.content);
    lines.push("");

    const annotation = annotations.get(message.id);
    if (annotation) {
      lines.push(formatAnnotationBlock(annotation));
      lines.push("");
    }
  }

  return lines.join("\n");
}
