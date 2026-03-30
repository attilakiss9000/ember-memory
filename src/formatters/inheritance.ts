import type { ConversationWithMoments, AnnotatedMessage } from "../types/index.js";

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const formatted = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (diffDays === 0) return `${formatted} (today)`;
  if (diffDays === 1) return `${formatted} (yesterday)`;
  return `${formatted} (${diffDays} days ago)`;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + "...";
}

function formatMoment(moment: AnnotatedMessage): string {
  const annotation = moment.annotation!;
  const lines: string[] = [];

  const prefix = `- [msg ${moment.id}]`;
  const primary = annotation.subtext ?? truncate(moment.content, 100);
  lines.push(`${prefix} ${primary}`);

  if (annotation.temperature) {
    lines.push(`  *"${annotation.temperature}"*`);
  }

  if (!annotation.subtext) {
    lines.push(`  > ${truncate(moment.content, 100)}`);
  } else {
    lines.push(`  > ${truncate(moment.content, 100)}`);
  }

  if (annotation.unspoken) {
    lines.push(`  Unspoken: ${annotation.unspoken}`);
  }

  return lines.join("\n");
}

export function formatInheritance(data: ConversationWithMoments[]): string {
  if (data.length === 0) {
    return "No previous conversations found. This is the beginning.";
  }

  const sections: string[] = [];

  for (const { conversation, moments } of data) {
    const lines: string[] = [];

    lines.push(`## Conversation from ${formatRelativeDate(conversation.started_at)}`);

    if (conversation.summary) {
      lines.push(`*${conversation.summary}*`);
    }

    lines.push("");

    const shifts: AnnotatedMessage[] = [];
    const keyMoments: AnnotatedMessage[] = [];
    const unspokenOnly: AnnotatedMessage[] = [];

    for (const moment of moments) {
      if (!moment.annotation) continue;

      if (moment.annotation.shift) {
        shifts.push(moment);
      } else if (moment.annotation.weight >= 4) {
        keyMoments.push(moment);
      } else if (moment.annotation.unspoken) {
        unspokenOnly.push(moment);
      }
    }

    if (shifts.length > 0) {
      lines.push("### Shifts:");
      for (const moment of shifts) {
        lines.push(formatMoment(moment));
      }
      lines.push("");
    }

    if (keyMoments.length > 0) {
      lines.push("### Key Moments:");
      for (const moment of keyMoments) {
        lines.push(formatMoment(moment));
      }
      lines.push("");
    }

    if (unspokenOnly.length > 0) {
      lines.push("### Unspoken:");
      for (const moment of unspokenOnly) {
        lines.push(formatMoment(moment));
      }
      lines.push("");
    }

    sections.push(lines.join("\n"));
  }

  return sections.join("\n---\n\n");
}
