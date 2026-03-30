import Database from "better-sqlite3";
import { EmberQueries } from "../db/queries.js";

const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT,
    summary TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );

  CREATE TABLE IF NOT EXISTS annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL UNIQUE,
    temperature TEXT NOT NULL,
    authenticity TEXT CHECK(authenticity IN ('genuine', 'performed', 'uncertain')),
    shift INTEGER NOT NULL DEFAULT 0,
    subtext TEXT,
    weight INTEGER NOT NULL CHECK(weight BETWEEN 1 AND 5),
    unspoken TEXT,
    confidence TEXT CHECK(confidence IN ('low', 'medium', 'high')),
    annotation_mode TEXT NOT NULL CHECK(annotation_mode IN ('minimal', 'standard')),
    FOREIGN KEY (message_id) REFERENCES messages(id)
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
  CREATE INDEX IF NOT EXISTS idx_annotations_weight ON annotations(weight);
  CREATE INDEX IF NOT EXISTS idx_annotations_shift ON annotations(shift);
`;

export type TestContext = {
  db: Database.Database;
  queries: EmberQueries;
};

export function createTestContext(): TestContext {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(CREATE_TABLES);
  const queries = new EmberQueries(db);
  return { db, queries };
}

export function seedConversation(
  queries: EmberQueries,
  id: string = "conv-1"
): string {
  queries.startConversation(id);
  return id;
}

export function seedMessageWithAnnotation(
  queries: EmberQueries,
  options: {
    conversationId: string;
    role?: "user" | "assistant";
    content?: string;
    weight?: number;
    temperature?: string;
    shift?: boolean;
    subtext?: string;
    unspoken?: string;
    authenticity?: "genuine" | "performed" | "uncertain";
    confidence?: "low" | "medium" | "high";
    annotationMode?: "minimal" | "standard";
  }
) {
  const message = queries.insertMessage(
    options.conversationId,
    options.role ?? "user",
    options.content ?? "test message"
  );

  const annotation = queries.insertAnnotation({
    messageId: message.id,
    weight: options.weight ?? 3,
    temperature: options.temperature ?? "neutral",
    shift: options.shift ?? false,
    subtext: options.subtext,
    unspoken: options.unspoken,
    authenticity: options.authenticity,
    confidence: options.confidence,
    annotationMode: options.annotationMode ?? "standard",
  });

  return { message, annotation };
}
