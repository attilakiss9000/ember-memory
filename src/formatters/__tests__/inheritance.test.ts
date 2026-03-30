import { describe, it, expect } from "vitest";
import { formatInheritance } from "../inheritance.js";
import type { ConversationWithMoments } from "../../types/index.js";

function buildMoment(overrides: {
  id?: number;
  conversationId?: string;
  role?: "user" | "assistant";
  content?: string;
  weight?: number;
  temperature?: string;
  shift?: number;
  subtext?: string | null;
  unspoken?: string | null;
  authenticity?: "genuine" | "performed" | "uncertain" | null;
  confidence?: "low" | "medium" | "high" | null;
}) {
  return {
    id: overrides.id ?? 1,
    conversation_id: overrides.conversationId ?? "conv-1",
    role: overrides.role ?? ("user" as const),
    content: overrides.content ?? "test content",
    created_at: "2025-01-15T10:00:00",
    annotation: {
      id: 1,
      message_id: overrides.id ?? 1,
      temperature: overrides.temperature ?? "neutral",
      authenticity: overrides.authenticity ?? null,
      shift: overrides.shift ?? 0,
      subtext: overrides.subtext ?? null,
      weight: overrides.weight ?? 3,
      unspoken: overrides.unspoken ?? null,
      confidence: overrides.confidence ?? null,
      annotation_mode: "standard" as const,
    },
  };
}

describe("formatInheritance", () => {
  it("should return 'no previous conversations' message for empty data", () => {
    const result = formatInheritance([]);

    expect(result).toBe(
      "No previous conversations found. This is the beginning."
    );
  });

  it("should format a single conversation with a shift moment", () => {
    const data: ConversationWithMoments[] = [
      {
        conversation: {
          id: "conv-1",
          started_at: "2025-01-15T10:00:00",
          ended_at: "2025-01-15T11:00:00",
          summary: "A meaningful exchange",
        },
        moments: [
          buildMoment({
            content: "Something changed here",
            shift: 1,
            weight: 4,
            temperature: "tense vulnerability",
            subtext: "opening up",
          }),
        ],
      },
    ];

    const result = formatInheritance(data);

    expect(result).toContain("## Conversation from");
    expect(result).toContain("A meaningful exchange");
    expect(result).toContain("### Shifts:");
    expect(result).toContain("opening up");
    expect(result).toContain("tense vulnerability");
  });

  it("should format high-weight moments under Key Moments", () => {
    const data: ConversationWithMoments[] = [
      {
        conversation: {
          id: "conv-1",
          started_at: "2025-01-15T10:00:00",
          ended_at: null,
          summary: null,
        },
        moments: [
          buildMoment({
            content: "Very important",
            weight: 5,
            shift: 0,
            temperature: "warm excitement",
          }),
        ],
      },
    ];

    const result = formatInheritance(data);

    expect(result).toContain("### Key Moments:");
    expect(result).toContain("warm excitement");
  });

  it("should format unspoken-only moments under Unspoken", () => {
    const data: ConversationWithMoments[] = [
      {
        conversation: {
          id: "conv-1",
          started_at: "2025-01-15T10:00:00",
          ended_at: null,
          summary: null,
        },
        moments: [
          buildMoment({
            content: "Something casual",
            weight: 2,
            shift: 0,
            unspoken: "I was really worried",
          }),
        ],
      },
    ];

    const result = formatInheritance(data);

    expect(result).toContain("### Unspoken:");
    expect(result).toContain("I was really worried");
  });

  it("should format multiple conversations with separator", () => {
    const data: ConversationWithMoments[] = [
      {
        conversation: {
          id: "conv-1",
          started_at: "2025-01-15T10:00:00",
          ended_at: null,
          summary: null,
        },
        moments: [buildMoment({ weight: 5, shift: 0, id: 1 })],
      },
      {
        conversation: {
          id: "conv-2",
          started_at: "2025-01-16T10:00:00",
          ended_at: null,
          summary: null,
        },
        moments: [buildMoment({ weight: 5, shift: 0, id: 2, conversationId: "conv-2" })],
      },
    ];

    const result = formatInheritance(data);

    expect(result).toContain("---");
    // Should have two conversation headers
    const headers = result.match(/## Conversation from/g);
    expect(headers).toHaveLength(2);
  });

  it("should handle missing optional fields gracefully", () => {
    const data: ConversationWithMoments[] = [
      {
        conversation: {
          id: "conv-1",
          started_at: "2025-01-15T10:00:00",
          ended_at: null,
          summary: null,
        },
        moments: [
          buildMoment({
            content: "Simple message with no extras",
            weight: 5,
            shift: 0,
            subtext: null,
            unspoken: null,
          }),
        ],
      },
    ];

    const result = formatInheritance(data);

    // Should not contain "Unspoken:" when unspoken is null
    expect(result).not.toContain("Unspoken:");
    // Should still render the moment content
    expect(result).toContain("Simple message with no extras");
  });

  it("should use subtext as primary text when available", () => {
    const data: ConversationWithMoments[] = [
      {
        conversation: {
          id: "conv-1",
          started_at: "2025-01-15T10:00:00",
          ended_at: null,
          summary: null,
        },
        moments: [
          buildMoment({
            content: "The actual message",
            weight: 5,
            shift: 0,
            subtext: "What it really meant",
          }),
        ],
      },
    ];

    const result = formatInheritance(data);

    expect(result).toContain("What it really meant");
  });
});
