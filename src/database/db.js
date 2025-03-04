// --- src/database/db.js ---
import Database from "better-sqlite3";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "node:url";
import { format } from "date-fns";
import { logError } from "../utils/logUtils.js"; // Import for error logging

const dbFilename = fileURLToPath(import.meta.url);
const dbDirname = path.dirname(dbFilename);

const dbPath = path.resolve(dbDirname, "../../data/task_cli.db");

let db;
try {
  db = new Database(dbPath);
} catch (error) {
  logError("Failed to connect to the database:", error);
  process.exit(1); // Exit on database connection failure
}

// Use a migration tool for schema changes
db.exec(`
  CREATE TABLE IF NOT EXISTS urgencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    title TEXT NOT NULL,
    due TEXT,
    status TEXT DEFAULT 'pending',
    completed_at TEXT,
    urgency_id INTEGER,
    tag_id INTEGER,
    hide_until TEXT,
    FOREIGN KEY (urgency_id) REFERENCES urgencies(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
  )
`);

const urgencies = ["critical", "high", "medium", "low"];
const insertUrgency = db.prepare("INSERT INTO urgencies (name) VALUES (?)");
const checkUrgencies = db.prepare("SELECT COUNT(*) as count FROM urgencies");
const { count } = checkUrgencies.get();

if (count === 0) {
  urgencies.forEach((urgency) => insertUrgency.run(urgency));
}

function getISOTimestamp() {
  return new Date().toISOString();
}

function getCurrentDate() {
  return format(new Date(), "yyyy-MM-dd");
}

export { db, getISOTimestamp, uuidv4, getCurrentDate };
