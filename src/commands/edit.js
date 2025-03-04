// --- src/commands/edit.js ---
import { db } from "../database/db.js";
import { validateTagName, parseDateOption } from "../utils/validationUtils.js";
import { logError } from "../utils/logUtils.js";

function editTask(id, options) {
  try {
    if (!id || id.trim() === "") {
      throw new Error("Task ID is required.");
    }
    const taskId = id.trim();

    return db.transaction(() => {
      const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
      if (!task) {
        throw new Error(`Task with ID "${taskId}" not found.`);
      }

      const { title, due, urgency, tag, hide } = options;
      const updates = [];
      const values = [];

      if (title !== undefined) {
        const trimmedTitle = title.trim();
        if (trimmedTitle === "") {
          throw new Error("Title cannot be empty.");
        }
        updates.push("title = ?");
        values.push(trimmedTitle);
      }

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

      if (tag !== undefined) {
        if (tag === null || tag.trim() === "") {
          updates.push("tag_id = NULL");
        } else {
          const tagName = tag.toLowerCase();
          try {
            validateTagName(tagName);
          } catch (error) {
            throw new Error(`Invalid tag: ${error.message}`);
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

      if (due !== undefined) {
        const parsedDue = parseDateOption(due, "due");
        updates.push("due = ?");
        values.push(parsedDue);
      }

      if (hide !== undefined) {
        const parsedHide = parseDateOption(hide, "hide");
        updates.push("hide_until = ?");
        values.push(parsedHide);
      }

      if (updates.length > 0) {
        let sql = `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`;
        values.push(taskId);
        const stmt = db.prepare(sql);
        stmt.run(...values);
        console.log(`Task "${taskId}" updated successfully.`);
        return true; // Return true for success
      } else {
        console.log(`No changes provided for task "${taskId}".`);
        return true; // No changes, but still successful
      }
    })();
  } catch (error) {
    logError("Error editing task:", error);
    throw error; // Consistent error handling
  }
}

export default editTask;
