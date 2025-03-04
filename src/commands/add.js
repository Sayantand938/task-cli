// --- src/commands/add.js ---
import { db, getISOTimestamp, uuidv4 } from "../database/db.js";
import { parseRelativeDate } from "../utils/dateUtils.js";

/**
 * Adds a new task to the database with the specified options.
 * @param {string} task - The task description.
 * @param {Object} options - Options for due date, urgency, tag, and hide until date.
 * @throws {Error} If task creation fails due to invalid input or database errors.
 */
function add(task, options) {
  try {
    if (!task || task.trim() === "") {
      throw new Error("Task description is required.");
    }

    const { due, urgency, tag, hide } = options;

    db.transaction(() => {
      // Urgency validation
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

      // Tag validation and insertion
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

      // Task metadata
      const taskId = uuidv4();
      const createdAt = getISOTimestamp();
      const title = task.trim();
      const status = "pending";

      // Parse due and hide dates using a helper function
      const dueDate = parseRelativeDate(due);
      const hideUntilDate = parseRelativeDate(hide);

      // Insert task into database
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
    })();
  } catch (error) {
    console.error("Error adding task:", error.message);
    throw error; // Propagate error to caller
  }
}

export default add;
