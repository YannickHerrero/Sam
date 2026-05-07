import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";

const sqlite = SQLite.openDatabaseSync("sam.db");

export const db = drizzle(sqlite);

export function bootstrapDatabase(): void {
  sqlite.execSync("PRAGMA journal_mode = WAL;");
  sqlite.execSync("PRAGMA foreign_keys = ON;");
  sqlite.execSync(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      start_at INTEGER NOT NULL,
      end_at INTEGER,
      location TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS events_start_at_idx ON events(start_at);

    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      due_at INTEGER,
      priority INTEGER NOT NULL DEFAULT 0,
      done_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS todos_done_at_idx ON todos(done_at);
  `);
}
