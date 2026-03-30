import type Database from "better-sqlite3";

type Migration = {
  version: number;
  description: string;
  up(db: Database.Database): void;
};

const MIGRATIONS: Migration[] = [
  // Future migrations go here:
  // { version: 1, description: "Add tags column", up(db) { db.exec("ALTER TABLE ..."); } },
];

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set(
    db
      .prepare("SELECT version FROM _migrations")
      .all()
      .map((row) => (row as { version: number }).version)
  );

  const pending = MIGRATIONS.filter((m) => !applied.has(m.version)).sort(
    (a, b) => a.version - b.version
  );

  for (const migration of pending) {
    const run = db.transaction(() => {
      migration.up(db);
      db.prepare(
        "INSERT INTO _migrations (version, description) VALUES (?, ?)"
      ).run(migration.version, migration.description);
    });
    run();
  }
}
