// --- src/commands/edit.js ---
import { db } from "../database/db.js";
import { parseRelativeDate } from "../utils/dateUtils.js";

/**
 * Edits an existing task in the database based on the provided ID (or prefix) and options.
 * @param {string} id - The ID (or prefix) of the task to edit.
 * @param {Object} options - Options for updating title, due date, urgency, tag, and hide until date.
 * @throws {Error} If task editing fails due to invalid input or database errors.
 */
function editTask(id, options) {
  try {
    if (!id || id.trim() === "") {
      throw new Error("Task ID is required.");
    }
    const taskIdPrefix = id.trim();

    db.transaction(() => {
      // Check if task exists (using partial match)
      const task = db
        .prepare("SELECT * FROM tasks WHERE id LIKE ?")
        .get(`${taskIdPrefix}%`);
      if (!task) {
        throw new Error(`Task with ID prefix "${taskIdPrefix}" not found.`);
      }

      const { title, due, urgency, tag, hide } = options;
      const updates = [];
      const values = [];

      // Title update
      if (title !== undefined) {
        const trimmedTitle = title.trim();
        if (trimmedTitle === "") {
          throw new Error("Title cannot be empty.");
        }
        updates.push("title = ?");
        values.push(trimmedTitle);
      }

      // Urgency update
      if (urgency !== undefined) {
        if (urgency === null || urgency.trim() === "") {
          updates.push("urgency_id = NULL");
        } else {
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
          updates.push("urgency_id = ?");
          values.push(urgencyValue.id);
        }
      }

      // Tag update
      if (tag !== undefined) {
        if (tag === null || tag.trim() === "") {
          updates.push("tag_id = NULL");
        } else {
          const tagName = tag.toLowerCase();
          if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tagName)) {
            throw new Error(
              "Invalid tag format. Use lowercase letters, numbers, and hyphens (e.g., 'work', 'urgent-task')."
            );
          }
          const existingTag = db
            .prepare("SELECT id FROM tags WHERE name = ?")
            .get(tagName);
          const tagId = existingTag
            ? existingTag.id
            : db.prepare("INSERT INTO tags (name) VALUES (?)").run(tagName)
                .lastInsertRowid;
          updates.push("tag_id = ?");
          values.push(tagId);
        }
      }

      // Due date update
      if (due !== undefined) {
        const parsedDue = parseDateOption(due, "due");
        updates.push("due = ?");
        values.push(parsedDue);
      }

      // Hide until date update
      if (hide !== undefined) {
        const parsedHide = parseDateOption(hide, "hide");
        updates.push("hide_until = ?");
        values.push(parsedHide);
      }

      // Apply updates if any
      if (updates.length > 0) {
        const sql = `UPDATE tasks SET ${updates.join(", ")} WHERE id LIKE ?`;
        values.push(`${taskIdPrefix}%`);
        db.prepare(sql).run(...values);
        console.log(
          `Task(s) with ID prefix "${taskIdPrefix}" updated successfully.`
        );
      } else {
        console.log(
          `No changes provided for task(s) with ID prefix "${taskIdPrefix}".`
        );
      }
    })();
  } catch (error) {
    console.error("Error editing task:", error.message);
    throw error; // Propagate error to caller
  }
}

/**
 * Parses a date option (due or hide) and returns a formatted date or null.
 * @param {string|null|undefined} value - The date value to parse.
 * @param {string} fieldName - The name of the field (for error messages).
 * @returns {string|null} The parsed date in YYYY-MM-DD format or null.
 * @throws {Error} If the date format is invalid.
 */
function parseDateOption(value, fieldName) {
  if (value === undefined || value === null || value.trim() === "") {
    return null;
  }
  const parsedDate = parseRelativeDate(value);
  if (!parsedDate || isNaN(new Date(parsedDate).getTime())) {
    throw new Error(
      `Invalid ${fieldName} date format. Use YYYY-MM-DD or relative formats (e.g., 'today', 'tomorrow', '+3d', 'next monday').`
    );
  }
  return parsedDate;
}

export default editTask;
