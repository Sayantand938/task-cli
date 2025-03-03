// --- src/database/db.js ---
import Database from "better-sqlite3";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../../data/task_cli.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS urgencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );
`);

db.exec(`
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

// Seed the urgencies table if it's empty.
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
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export { db, getISOTimestamp, uuidv4, getCurrentDate };
