// --- src/commands/add.js ---
import { db, getISOTimestamp, uuidv4 } from "../database/db.js";
import { parseRelativeDate } from "../utils/dateUtils.js";
import { logError } from "../utils/logUtils.js";

/**
 * Adds a new task to the database.
 */
async function add(task, options) {
  try {
    if (!task || task.trim() === "") {
      throw new Error("Task description is required.");
    }

    const { due, urgency, tag, hide } = options;

    return db.transaction(() => {
      let urgencyId = null;
      if (urgency !== undefined) {
        const urgencyValue = db
          .prepare("SELECT id FROM urgencies WHERE name = ?")
          .get(urgency.toLowerCase());
        if (!urgencyValue) {
          const validUrgencies = db
            .prepare("SELECT name FROM urgencies")
            .all()
            .map((u) => u.name)
            .join(", ");
          throw new Error(
            `Invalid urgency "${urgency}". Valid options are: ${validUrgencies}.`
          );
        }
        urgencyId = urgencyValue.id;
      }

      let tagId = null;
      if (tag !== undefined) {
        const tagName = tag.toLowerCase();
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tagName)) {
          throw new Error(
            "Invalid tag format. Use lowercase letters, numbers, and hyphens (e.g., 'work', 'urgent-task')."
          );
        }
        const existingTag = db
          .prepare("SELECT id FROM tags WHERE name = ?")
          .get(tagName);
        tagId = existingTag
          ? existingTag.id
          : db.prepare("INSERT INTO tags (name) VALUES (?)").run(tagName)
              .lastInsertRowid;
      }

      const taskId = uuidv4();
      const createdAt = getISOTimestamp();
      const title = task.trim();
      const status = "pending";
      let dueDate = due ? parseRelativeDate(due) : null;
      let hideUntilDate = hide ? parseRelativeDate(hide) : null;

      db.prepare(
        "INSERT INTO tasks (id, created_at, title, due, status, urgency_id, tag_id, hide_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(
        taskId,
        createdAt,
        title,
        dueDate,
        status,
        urgencyId,
        tagId,
        hideUntilDate
      );

      console.log(`Task "${title}" added successfully with ID: ${taskId}`);
      return taskId; // Return the taskId
    })();
  } catch (error) {
    logError("Error adding task:", error);
    throw error;
  }
}

export default add;
