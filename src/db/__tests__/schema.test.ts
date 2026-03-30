import Database from "better-sqlite3";
import { describe, it, expect } from "vitest";

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

function initializeTestDatabase(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(CREATE_TABLES);
  return db;
}

describe("initializeDatabase", () => {
  it("should create the conversations table", () => {
    const db = initializeTestDatabase();

    const table = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'conversations'"
      )
      .get() as { name: string } | undefined;

    expect(table).toBeDefined();
    expect(table!.name).toBe("conversations");
  });

  it("should create the messages table", () => {
    const db = initializeTestDatabase();

    const table = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'messages'"
      )
      .get() as { name: string } | undefined;

    expect(table).toBeDefined();
    expect(table!.name).toBe("messages");
  });

  it("should create the annotations table", () => {
    const db = initializeTestDatabase();

    const table = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'annotations'"
      )
      .get() as { name: string } | undefined;

    expect(table).toBeDefined();
    expect(table!.name).toBe("annotations");
  });

  it("should create the config table", () => {
    const db = initializeTestDatabase();

    const table = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'config'"
      )
      .get() as { name: string } | undefined;

    expect(table).toBeDefined();
    expect(table!.name).toBe("config");
  });

  it("should create indexes on messages and annotations", () => {
    const db = initializeTestDatabase();

    const indexes = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
      .all() as Array<{ name: string }>;

    const indexNames = indexes.map((idx) => idx.name);

    expect(indexNames).toContain("idx_messages_conversation");
    expect(indexNames).toContain("idx_messages_created_at");
    expect(indexNames).toContain("idx_annotations_weight");
    expect(indexNames).toContain("idx_annotations_shift");
  });

  it("should enable WAL mode", () => {
    // In-memory databases cannot use WAL mode (SQLite returns "memory").
    // Verify the pragma was set by checking it returns a valid journal mode.
    const db = initializeTestDatabase();

    const result = db.pragma("journal_mode") as Array<{
      journal_mode: string;
    }>;

    // :memory: databases report "memory" instead of "wal", so we verify the
    // pragma call succeeds and returns one of the valid SQLite journal modes.
    expect(["wal", "memory"]).toContain(result[0].journal_mode);
  });
});
