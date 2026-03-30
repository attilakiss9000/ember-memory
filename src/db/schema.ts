import Database from "better-sqlite3";
import { getDbPath, ensureEmberDir } from "../utils/config.js";

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

export function initializeDatabase(dbPath?: string): Database.Database {
  ensureEmberDir();
  const resolvedPath = dbPath ?? getDbPath();
  const db = new Database(resolvedPath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(CREATE_TABLES);

  return db;
}
