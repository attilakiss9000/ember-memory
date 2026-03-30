import { describe, it, expect } from "vitest";
import { formatConversationMarkdown } from "../markdown.js";
import type {
  ConversationRow,
  MessageRow,
  AnnotationRow,
} from "../../types/index.js";

describe("formatConversationMarkdown", () => {
  const baseConversation: ConversationRow = {
    id: "conv-123",
    started_at: "2025-01-15T10:30:00",
    ended_at: null,
    summary: null,
  };

  it("should render conversation header with id and started timestamp", () => {
    const result = formatConversationMarkdown(baseConversation, [], new Map());

    expect(result).toContain("# Conversation conv-123");
    expect(result).toContain("**Started:**");
  });

  it("should include ended timestamp when present", () => {
    const conversation: ConversationRow = {
      ...baseConversation,
      ended_at: "2025-01-15T11:30:00",
    };

    const result = formatConversationMarkdown(conversation, [], new Map());

    expect(result).toContain("**Ended:**");
  });

  it("should not include ended line when ended_at is null", () => {
    const result = formatConversationMarkdown(baseConversation, [], new Map());

    expect(result).not.toContain("**Ended:**");
  });

  it("should include summary when present", () => {
    const conversation: ConversationRow = {
      ...baseConversation,
      summary: "A productive discussion",
    };

    const result = formatConversationMarkdown(conversation, [], new Map());

    expect(result).toContain("**Summary:** A productive discussion");
  });

  it("should render messages with role headings", () => {
    const messages: MessageRow[] = [
      {
        id: 1,
        conversation_id: "conv-123",
        role: "user",
        content: "Hello there",
        created_at: "2025-01-15T10:30:00",
      },
      {
        id: 2,
        conversation_id: "conv-123",
        role: "assistant",
        content: "Hi! How can I help?",
        created_at: "2025-01-15T10:31:00",
      },
    ];

    const result = formatConversationMarkdown(
      baseConversation,
      messages,
      new Map()
    );

    expect(result).toContain("### User");
    expect(result).toContain("Hello there");
    expect(result).toContain("### Assistant");
    expect(result).toContain("Hi! How can I help?");
  });

  it("should render annotation details for annotated messages", () => {
    const messages: MessageRow[] = [
      {
        id: 1,
        conversation_id: "conv-123",
        role: "user",
        content: "I have been thinking about this a lot",
        created_at: "2025-01-15T10:30:00",
      },
    ];

    const annotation: AnnotationRow = {
      id: 1,
      message_id: 1,
      temperature: "reflective warmth",
      authenticity: "genuine",
      shift: 1,
      subtext: "seeking deeper connection",
      weight: 4,
      unspoken: "I need to be heard",
      confidence: "high",
      annotation_mode: "standard",
    };

    const annotations = new Map<number, AnnotationRow>();
    annotations.set(1, annotation);

    const result = formatConversationMarkdown(
      baseConversation,
      messages,
      annotations
    );

    expect(result).toContain("<details>");
    expect(result).toContain("weight: 4");
    expect(result).toContain("reflective warmth");
    expect(result).toContain("| Authenticity | genuine |");
    expect(result).toContain("| Shift | yes |");
    expect(result).toContain("| Subtext | seeking deeper connection |");
    expect(result).toContain("| Unspoken | I need to be heard |");
    expect(result).toContain("| Confidence | high |");
    expect(result).toContain("</details>");
  });

  it("should not render annotation block for unannotated messages", () => {
    const messages: MessageRow[] = [
      {
        id: 1,
        conversation_id: "conv-123",
        role: "user",
        content: "Just a plain message",
        created_at: "2025-01-15T10:30:00",
      },
    ];

    const result = formatConversationMarkdown(
      baseConversation,
      messages,
      new Map()
    );

    expect(result).not.toContain("<details>");
    expect(result).toContain("Just a plain message");
  });

  it("should render minimal annotation without optional fields", () => {
    const messages: MessageRow[] = [
      {
        id: 1,
        conversation_id: "conv-123",
        role: "assistant",
        content: "A response",
        created_at: "2025-01-15T10:30:00",
      },
    ];

    const annotation: AnnotationRow = {
      id: 1,
      message_id: 1,
      temperature: "calm",
      authenticity: null,
      shift: 0,
      subtext: null,
      weight: 2,
      unspoken: null,
      confidence: null,
      annotation_mode: "minimal",
    };

    const annotations = new Map<number, AnnotationRow>();
    annotations.set(1, annotation);

    const result = formatConversationMarkdown(
      baseConversation,
      messages,
      annotations
    );

    expect(result).toContain("weight: 2");
    expect(result).toContain("calm");
    expect(result).toContain("| Mode | minimal |");
    // Should not contain optional fields
    expect(result).not.toContain("| Authenticity |");
    expect(result).not.toContain("| Shift |");
    expect(result).not.toContain("| Subtext |");
    expect(result).not.toContain("| Unspoken |");
    expect(result).not.toContain("| Confidence |");
  });
});
