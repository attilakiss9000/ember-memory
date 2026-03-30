import type Database from "better-sqlite3";
import type {
  ConversationRow,
  MessageRow,
  AnnotationRow,
  AnnotatedMessage,
  ConversationWithMoments,
  AnnotationMode,
  MessageRole,
  Confidence,
  Authenticity,
} from "../types/index.js";
import { DEFAULT_CONFIG } from "../types/index.js";

type ReadHistoryFilters = {
  conversation_id?: string;
  weight_min?: number;
  shifts_only?: boolean;
  start_date?: string;
  end_date?: string;
  limit?: number;
};

export class EmberQueries {
  constructor(private db: Database.Database) {}

  startConversation(id: string): ConversationRow {
    this.db
      .prepare("INSERT INTO conversations (id) VALUES (?)")
      .run(id);
    return this.db
      .prepare("SELECT * FROM conversations WHERE id = ?")
      .get(id) as ConversationRow;
  }

  endConversation(id: string, summary?: string): ConversationRow {
    this.db
      .prepare(
        "UPDATE conversations SET ended_at = datetime('now'), summary = ? WHERE id = ?"
      )
      .run(summary ?? null, id);
    return this.db
      .prepare("SELECT * FROM conversations WHERE id = ?")
      .get(id) as ConversationRow;
  }

  getConversation(id: string): ConversationRow | undefined {
    return this.db
      .prepare("SELECT * FROM conversations WHERE id = ?")
      .get(id) as ConversationRow | undefined;
  }

  listConversations(limit: number = 20): ConversationRow[] {
    return this.db
      .prepare("SELECT * FROM conversations ORDER BY started_at DESC LIMIT ?")
      .all(limit) as ConversationRow[];
  }

  insertMessage(
    conversationId: string,
    role: MessageRole,
    content: string
  ): MessageRow {
    const result = this.db
      .prepare(
        "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)"
      )
      .run(conversationId, role, content);
    return this.db
      .prepare("SELECT * FROM messages WHERE id = ?")
      .get(result.lastInsertRowid) as MessageRow;
  }

  getMessagesForConversation(conversationId: string): MessageRow[] {
    return this.db
      .prepare(
        "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"
      )
      .all(conversationId) as MessageRow[];
  }

  getMessageCount(conversationId: string): number {
    const row = this.db
      .prepare(
        "SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?"
      )
      .get(conversationId) as { count: number };
    return row.count;
  }

  insertAnnotation(params: {
    messageId: number;
    temperature: string;
    weight: number;
    annotationMode: AnnotationMode;
    authenticity?: Authenticity;
    shift?: boolean;
    subtext?: string;
    unspoken?: string;
    confidence?: Confidence;
  }): AnnotationRow {
    const result = this.db
      .prepare(
        `INSERT INTO annotations
          (message_id, temperature, authenticity, shift, subtext, weight, unspoken, confidence, annotation_mode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        params.messageId,
        params.temperature,
        params.authenticity ?? null,
        params.shift ? 1 : 0,
        params.subtext ?? null,
        params.weight,
        params.unspoken ?? null,
        params.confidence ?? null,
        params.annotationMode
      );
    return this.db
      .prepare("SELECT * FROM annotations WHERE id = ?")
      .get(result.lastInsertRowid) as AnnotationRow;
  }

  readHistory(filters: ReadHistoryFilters): AnnotatedMessage[] {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.conversation_id) {
      conditions.push("m.conversation_id = ?");
      params.push(filters.conversation_id);
    }
    if (filters.weight_min) {
      conditions.push("a.weight >= ?");
      params.push(filters.weight_min);
    }
    if (filters.shifts_only) {
      conditions.push("a.shift = 1");
    }
    if (filters.start_date) {
      conditions.push("m.created_at >= ?");
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      conditions.push("m.created_at <= ?");
      params.push(filters.end_date);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = Math.min(filters.limit ?? 50, 200);

    const rows = this.db
      .prepare(
        `SELECT m.*, a.id as annotation_id, a.temperature, a.authenticity,
                a.shift, a.subtext, a.weight, a.unspoken, a.confidence, a.annotation_mode
         FROM messages m
         LEFT JOIN annotations a ON a.message_id = m.id
         ${whereClause}
         ORDER BY m.created_at ASC
         LIMIT ?`
      )
      .all(...params, limit) as Array<
      MessageRow & {
        annotation_id: number | null;
        temperature: string | null;
        authenticity: Authenticity | null;
        shift: number | null;
        subtext: string | null;
        weight: number | null;
        unspoken: string | null;
        confidence: Confidence | null;
        annotation_mode: AnnotationMode | null;
      }
    >;

    return rows.map((row) => ({
      id: row.id,
      conversation_id: row.conversation_id,
      role: row.role,
      content: row.content,
      created_at: row.created_at,
      annotation: row.annotation_id
        ? {
            id: row.annotation_id,
            message_id: row.id,
            temperature: row.temperature!,
            authenticity: row.authenticity,
            shift: row.shift!,
            subtext: row.subtext,
            weight: row.weight!,
            unspoken: row.unspoken,
            confidence: row.confidence,
            annotation_mode: row.annotation_mode!,
          }
        : null,
    }));
  }

  readInheritanceData(
    limitConversations: number = 5,
    weightThreshold: number = 4
  ): ConversationWithMoments[] {
    const conversations = this.db
      .prepare(
        "SELECT * FROM conversations ORDER BY started_at DESC LIMIT ?"
      )
      .all(limitConversations) as ConversationRow[];

    return conversations
      .map((conversation) => {
        const moments = this.db
          .prepare(
            `SELECT m.*, a.id as annotation_id, a.temperature, a.authenticity,
                    a.shift, a.subtext, a.weight, a.unspoken, a.confidence, a.annotation_mode
             FROM messages m
             INNER JOIN annotations a ON a.message_id = m.id
             WHERE m.conversation_id = ?
               AND (a.weight >= ? OR a.shift = 1 OR a.unspoken IS NOT NULL)
             ORDER BY m.created_at ASC`
          )
          .all(conversation.id, weightThreshold) as Array<
          MessageRow & {
            annotation_id: number;
            temperature: string;
            authenticity: Authenticity | null;
            shift: number;
            subtext: string | null;
            weight: number;
            unspoken: string | null;
            confidence: Confidence | null;
            annotation_mode: AnnotationMode;
          }
        >;

        return {
          conversation,
          moments: moments.map((row) => ({
            id: row.id,
            conversation_id: row.conversation_id,
            role: row.role,
            content: row.content,
            created_at: row.created_at,
            annotation: {
              id: row.annotation_id,
              message_id: row.id,
              temperature: row.temperature,
              authenticity: row.authenticity,
              shift: row.shift,
              subtext: row.subtext,
              weight: row.weight,
              unspoken: row.unspoken,
              confidence: row.confidence,
              annotation_mode: row.annotation_mode,
            },
          })),
        };
      })
      .filter((c) => c.moments.length > 0);
  }

  getConfig(key: string): string | undefined {
    const row = this.db
      .prepare("SELECT value FROM config WHERE key = ?")
      .get(key) as { value: string } | undefined;
    return row?.value;
  }

  setConfig(key: string, value: string): void {
    this.db
      .prepare(
        "INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?"
      )
      .run(key, value, value);
  }

  getAllConfig(): Record<string, string> {
    const rows = this.db
      .prepare("SELECT key, value FROM config")
      .all() as Array<{ key: string; value: string }>;
    const config: Record<string, string> = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }
    return { ...DEFAULT_CONFIG, ...config };
  }

  getAnnotationMode(): AnnotationMode {
    const mode = this.getConfig("annotation_mode");
    if (mode === "minimal" || mode === "standard") return mode;
    return DEFAULT_CONFIG.annotation_mode;
  }

  isEnabled(): boolean {
    const enabled = this.getConfig("enabled");
    return enabled !== "false";
  }
}
