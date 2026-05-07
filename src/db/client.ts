import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";

const sqlite = SQLite.openDatabaseSync("sam.db");

export const db = drizzle(sqlite);

export function bootstrapDatabase(): void {
  sqlite.execSync("PRAGMA journal_mode = WAL;");
  sqlite.execSync("PRAGMA foreign_keys = ON;");
}
