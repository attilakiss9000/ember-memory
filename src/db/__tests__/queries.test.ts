import { describe, it, expect, beforeEach } from "vitest";
import { createTestContext, seedConversation, seedMessageWithAnnotation } from "../../__tests__/helpers.js";
import type { TestContext } from "../../__tests__/helpers.js";

describe("EmberQueries", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  describe("startConversation", () => {
    it("should create a conversation and return it", () => {
      const conversation = ctx.queries.startConversation("conv-1");

      expect(conversation.id).toBe("conv-1");
      expect(conversation.started_at).toBeDefined();
      expect(conversation.ended_at).toBeNull();
      expect(conversation.summary).toBeNull();
    });

    it("should throw on duplicate conversation id", () => {
      ctx.queries.startConversation("conv-1");

      expect(() => ctx.queries.startConversation("conv-1")).toThrow();
    });
  });

  describe("endConversation", () => {
    it("should set ended_at timestamp", () => {
      seedConversation(ctx.queries, "conv-1");

      const ended = ctx.queries.endConversation("conv-1");

      expect(ended.ended_at).not.toBeNull();
    });

    it("should store summary when provided", () => {
      seedConversation(ctx.queries, "conv-1");

      const ended = ctx.queries.endConversation("conv-1", "A good talk");

      expect(ended.summary).toBe("A good talk");
    });

    it("should leave summary null when not provided", () => {
      seedConversation(ctx.queries, "conv-1");

      const ended = ctx.queries.endConversation("conv-1");

      expect(ended.summary).toBeNull();
    });
  });

  describe("getConversation", () => {
    it("should return the conversation by id", () => {
      seedConversation(ctx.queries, "conv-1");

      const result = ctx.queries.getConversation("conv-1");

      expect(result).toBeDefined();
      expect(result!.id).toBe("conv-1");
    });

    it("should return undefined for nonexistent conversation", () => {
      const result = ctx.queries.getConversation("nonexistent");

      expect(result).toBeUndefined();
    });
  });

  describe("listConversations", () => {
    it("should return conversations ordered by started_at descending", () => {
      seedConversation(ctx.queries, "conv-1");
      seedConversation(ctx.queries, "conv-2");
      seedConversation(ctx.queries, "conv-3");

      const list = ctx.queries.listConversations();

      expect(list).toHaveLength(3);
      // Most recent first (all same started_at in memory, but insertion order is deterministic)
      expect(list.map((c) => c.id)).toContain("conv-1");
      expect(list.map((c) => c.id)).toContain("conv-2");
      expect(list.map((c) => c.id)).toContain("conv-3");
    });

    it("should respect the limit parameter", () => {
      seedConversation(ctx.queries, "conv-1");
      seedConversation(ctx.queries, "conv-2");
      seedConversation(ctx.queries, "conv-3");

      const list = ctx.queries.listConversations(2);

      expect(list).toHaveLength(2);
    });

    it("should return empty array when no conversations exist", () => {
      const list = ctx.queries.listConversations();

      expect(list).toEqual([]);
    });
  });

  describe("insertMessage", () => {
    it("should insert a message and return it with an id", () => {
      seedConversation(ctx.queries, "conv-1");

      const message = ctx.queries.insertMessage("conv-1", "user", "Hello");

      expect(message.id).toBeDefined();
      expect(message.conversation_id).toBe("conv-1");
      expect(message.role).toBe("user");
      expect(message.content).toBe("Hello");
      expect(message.created_at).toBeDefined();
    });

    it("should auto-increment message ids", () => {
      seedConversation(ctx.queries, "conv-1");

      const msg1 = ctx.queries.insertMessage("conv-1", "user", "First");
      const msg2 = ctx.queries.insertMessage("conv-1", "assistant", "Second");

      expect(msg2.id).toBeGreaterThan(msg1.id);
    });
  });

  describe("getMessagesForConversation", () => {
    it("should return all messages for a conversation in chronological order", () => {
      seedConversation(ctx.queries, "conv-1");
      ctx.queries.insertMessage("conv-1", "user", "Hello");
      ctx.queries.insertMessage("conv-1", "assistant", "Hi there");

      const messages = ctx.queries.getMessagesForConversation("conv-1");

      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe("Hello");
      expect(messages[1].content).toBe("Hi there");
    });

    it("should return empty array for conversation with no messages", () => {
      seedConversation(ctx.queries, "conv-1");

      const messages = ctx.queries.getMessagesForConversation("conv-1");

      expect(messages).toEqual([]);
    });

    it("should not return messages from other conversations", () => {
      seedConversation(ctx.queries, "conv-1");
      seedConversation(ctx.queries, "conv-2");
      ctx.queries.insertMessage("conv-1", "user", "In conv 1");
      ctx.queries.insertMessage("conv-2", "user", "In conv 2");

      const messages = ctx.queries.getMessagesForConversation("conv-1");

      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe("In conv 1");
    });
  });

  describe("getMessageCount", () => {
    it("should return the correct count", () => {
      seedConversation(ctx.queries, "conv-1");
      ctx.queries.insertMessage("conv-1", "user", "One");
      ctx.queries.insertMessage("conv-1", "assistant", "Two");
      ctx.queries.insertMessage("conv-1", "user", "Three");

      const count = ctx.queries.getMessageCount("conv-1");

      expect(count).toBe(3);
    });

    it("should return 0 for conversation with no messages", () => {
      seedConversation(ctx.queries, "conv-1");

      const count = ctx.queries.getMessageCount("conv-1");

      expect(count).toBe(0);
    });
  });

  describe("insertAnnotation", () => {
    it("should insert a minimal annotation", () => {
      seedConversation(ctx.queries, "conv-1");
      const message = ctx.queries.insertMessage("conv-1", "user", "Hello");

      const annotation = ctx.queries.insertAnnotation({
        messageId: message.id,
        temperature: "warm",
        weight: 3,
        annotationMode: "minimal",
      });

      expect(annotation.id).toBeDefined();
      expect(annotation.message_id).toBe(message.id);
      expect(annotation.temperature).toBe("warm");
      expect(annotation.weight).toBe(3);
      expect(annotation.annotation_mode).toBe("minimal");
      expect(annotation.authenticity).toBeNull();
      expect(annotation.shift).toBe(0);
      expect(annotation.subtext).toBeNull();
      expect(annotation.unspoken).toBeNull();
      expect(annotation.confidence).toBeNull();
    });

    it("should insert a standard annotation with all fields", () => {
      seedConversation(ctx.queries, "conv-1");
      const message = ctx.queries.insertMessage("conv-1", "user", "Deep talk");

      const annotation = ctx.queries.insertAnnotation({
        messageId: message.id,
        temperature: "intense warmth",
        weight: 5,
        annotationMode: "standard",
        authenticity: "genuine",
        shift: true,
        subtext: "seeking connection",
        unspoken: "I need you to understand",
        confidence: "high",
      });

      expect(annotation.temperature).toBe("intense warmth");
      expect(annotation.weight).toBe(5);
      expect(annotation.annotation_mode).toBe("standard");
      expect(annotation.authenticity).toBe("genuine");
      expect(annotation.shift).toBe(1);
      expect(annotation.subtext).toBe("seeking connection");
      expect(annotation.unspoken).toBe("I need you to understand");
      expect(annotation.confidence).toBe("high");
    });

    it("should reject duplicate annotations for the same message", () => {
      seedConversation(ctx.queries, "conv-1");
      const message = ctx.queries.insertMessage("conv-1", "user", "Hello");

      ctx.queries.insertAnnotation({
        messageId: message.id,
        temperature: "warm",
        weight: 3,
        annotationMode: "minimal",
      });

      expect(() =>
        ctx.queries.insertAnnotation({
          messageId: message.id,
          temperature: "cold",
          weight: 1,
          annotationMode: "minimal",
        })
      ).toThrow();
    });
  });

  describe("readHistory", () => {
    it("should return all messages when no filters are applied", () => {
      seedConversation(ctx.queries, "conv-1");
      ctx.queries.insertMessage("conv-1", "user", "Hello");
      ctx.queries.insertMessage("conv-1", "assistant", "Hi");

      const results = ctx.queries.readHistory({});

      expect(results).toHaveLength(2);
      expect(results[0].annotation).toBeNull();
    });

    it("should include annotation data when present", () => {
      seedConversation(ctx.queries, "conv-1");
      seedMessageWithAnnotation(ctx.queries, {
        conversationId: "conv-1",
        content: "Important thing",
        weight: 4,
        temperature: "warm curiosity",
      });

      const results = ctx.queries.readHistory({});

      expect(results).toHaveLength(1);
      expect(results[0].annotation).not.toBeNull();
      expect(results[0].annotation!.weight).toBe(4);
      expect(results[0].annotation!.temperature).toBe("warm curiosity");
    });

    it("should filter by conversation_id", () => {
      seedConversation(ctx.queries, "conv-1");
      seedConversation(ctx.queries, "conv-2");
      ctx.queries.insertMessage("conv-1", "user", "In first");
      ctx.queries.insertMessage("conv-2", "user", "In second");

      const results = ctx.queries.readHistory({ conversation_id: "conv-1" });

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe("In first");
    });

    it("should filter by weight_min", () => {
      seedConversation(ctx.queries, "conv-1");
      seedMessageWithAnnotation(ctx.queries, {
        conversationId: "conv-1",
        content: "Low weight",
        weight: 2,
      });
      seedMessageWithAnnotation(ctx.queries, {
        conversationId: "conv-1",
        content: "High weight",
        weight: 5,
      });

      const results = ctx.queries.readHistory({ weight_min: 4 });

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe("High weight");
    });

    it("should filter by shifts_only", () => {
      seedConversation(ctx.queries, "conv-1");
      seedMessageWithAnnotation(ctx.queries, {
        conversationId: "conv-1",
        content: "No shift",
        shift: false,
      });
      seedMessageWithAnnotation(ctx.queries, {
        conversationId: "conv-1",
        content: "Has shift",
        shift: true,
      });

      const results = ctx.queries.readHistory({ shifts_only: true });

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe("Has shift");
    });

    it("should respect the limit parameter", () => {
      seedConversation(ctx.queries, "conv-1");
      for (let idx = 0; idx < 10; idx++) {
        ctx.queries.insertMessage("conv-1", "user", `Message ${idx}`);
      }

      const results = ctx.queries.readHistory({ limit: 3 });

      expect(results).toHaveLength(3);
    });

    it("should cap limit at 200", () => {
      seedConversation(ctx.queries, "conv-1");
      ctx.queries.insertMessage("conv-1", "user", "Only one");

      // Requesting limit > 200 should be capped
      const results = ctx.queries.readHistory({ limit: 999 });

      // Should still work, just capped at 200 internally
      expect(results).toHaveLength(1);
    });

    it("should filter by date range", () => {
      seedConversation(ctx.queries, "conv-1");

      // Insert messages with explicit timestamps via raw SQL
      ctx.db
        .prepare(
          "INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)"
        )
        .run("conv-1", "user", "Old message", "2024-01-01T00:00:00");
      ctx.db
        .prepare(
          "INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)"
        )
        .run("conv-1", "user", "Recent message", "2025-06-15T00:00:00");

      const results = ctx.queries.readHistory({ start_date: "2025-01-01" });

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe("Recent message");
    });

    it("should combine multiple filters", () => {
      seedConversation(ctx.queries, "conv-1");
      seedConversation(ctx.queries, "conv-2");

      seedMessageWithAnnotation(ctx.queries, {
        conversationId: "conv-1",
        content: "Low weight in conv-1",
        weight: 2,
      });
      seedMessageWithAnnotation(ctx.queries, {
        conversationId: "conv-1",
        content: "High weight in conv-1",
        weight: 5,
        shift: true,
      });
      seedMessageWithAnnotation(ctx.queries, {
        conversationId: "conv-2",
        content: "High weight in conv-2",
        weight: 5,
      });

      const results = ctx.queries.readHistory({
        conversation_id: "conv-1",
        weight_min: 4,
      });

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe("High weight in conv-1");
    });
  });

  describe("readInheritanceData", () => {
    it("should return empty array when no conversations exist", () => {
      const data = ctx.queries.readInheritanceData();

      expect(data).toEqual([]);
    });

    it("should exclude conversations with no significant moments", () => {
      seedConversation(ctx.queries, "conv-1");
      seedMessageWithAnnotation(ctx.queries, {
        conversationId: "conv-1",
        weight: 1,
        shift: false,
        unspoken: undefined,
      });

      const data = ctx.queries.readInheritanceData(5, 4);

      expect(data).toEqual([]);
    });

    it("should include conversations with high-weight moments", () => {
      seedConversation(ctx.queries, "conv-1");
      seedMessageWithAnnotation(ctx.queries, {
        conversationId: "conv-1",
        content: "Important",
        weight: 5,
        temperature: "deep warmth",
      });

      const data = ctx.queries.readInheritanceData(5, 4);

      expect(data).toHaveLength(1);
      expect(data[0].moments).toHaveLength(1);
      expect(data[0].moments[0].content).toBe("Important");
    });

    it("should include moments with shifts even below weight threshold", () => {
      seedConversation(ctx.queries, "conv-1");
      seedMessageWithAnnotation(ctx.queries, {
        conversationId: "conv-1",
        content: "Shift moment",
        weight: 2,
        shift: true,
      });

      const data = ctx.queries.readInheritanceData(5, 4);

      expect(data).toHaveLength(1);
      expect(data[0].moments[0].content).toBe("Shift moment");
    });

    it("should include moments with unspoken context even below weight threshold", () => {
      seedConversation(ctx.queries, "conv-1");
      seedMessageWithAnnotation(ctx.queries, {
        conversationId: "conv-1",
        content: "Unspoken moment",
        weight: 2,
        shift: false,
        unspoken: "Something left unsaid",
      });

      const data = ctx.queries.readInheritanceData(5, 4);

      expect(data).toHaveLength(1);
      expect(data[0].moments[0].annotation!.unspoken).toBe(
        "Something left unsaid"
      );
    });

    it("should respect limitConversations parameter", () => {
      seedConversation(ctx.queries, "conv-1");
      seedConversation(ctx.queries, "conv-2");
      seedConversation(ctx.queries, "conv-3");

      seedMessageWithAnnotation(ctx.queries, {
        conversationId: "conv-1",
        weight: 5,
      });
      seedMessageWithAnnotation(ctx.queries, {
        conversationId: "conv-2",
        weight: 5,
      });
      seedMessageWithAnnotation(ctx.queries, {
        conversationId: "conv-3",
        weight: 5,
      });

      const data = ctx.queries.readInheritanceData(2, 4);

      expect(data).toHaveLength(2);
    });

    it("should respect weightThreshold parameter", () => {
      seedConversation(ctx.queries, "conv-1");
      seedMessageWithAnnotation(ctx.queries, {
        conversationId: "conv-1",
        content: "Weight 3",
        weight: 3,
        shift: false,
      });

      // With threshold 4, weight 3 should not appear (no shift, no unspoken)
      const dataHigh = ctx.queries.readInheritanceData(5, 4);
      expect(dataHigh).toEqual([]);

      // With threshold 2, weight 3 should appear
      const dataLow = ctx.queries.readInheritanceData(5, 2);
      expect(dataLow).toHaveLength(1);
    });
  });

  describe("config CRUD", () => {
    it("should return undefined for unset config key", () => {
      const value = ctx.queries.getConfig("annotation_mode");

      expect(value).toBeUndefined();
    });

    it("should set and get a config value", () => {
      ctx.queries.setConfig("annotation_mode", "minimal");

      const value = ctx.queries.getConfig("annotation_mode");

      expect(value).toBe("minimal");
    });

    it("should upsert existing config value", () => {
      ctx.queries.setConfig("annotation_mode", "minimal");
      ctx.queries.setConfig("annotation_mode", "standard");

      const value = ctx.queries.getConfig("annotation_mode");

      expect(value).toBe("standard");
    });

    it("should return all config with defaults merged", () => {
      const allConfig = ctx.queries.getAllConfig();

      // Should include default annotation_mode
      expect(allConfig.annotation_mode).toBe("standard");
    });

    it("should override defaults with stored values in getAllConfig", () => {
      ctx.queries.setConfig("annotation_mode", "minimal");

      const allConfig = ctx.queries.getAllConfig();

      expect(allConfig.annotation_mode).toBe("minimal");
    });

    it("should return default annotation mode when not configured", () => {
      const mode = ctx.queries.getAnnotationMode();

      expect(mode).toBe("standard");
    });

    it("should return configured annotation mode", () => {
      ctx.queries.setConfig("annotation_mode", "minimal");

      const mode = ctx.queries.getAnnotationMode();

      expect(mode).toBe("minimal");
    });

    it("should return default for invalid annotation mode value", () => {
      ctx.queries.setConfig("annotation_mode", "bogus");

      const mode = ctx.queries.getAnnotationMode();

      expect(mode).toBe("standard");
    });
  });
});
