// --- src/commands/doing.js ---
import { db } from "../database/db.js";
import { logError } from "../utils/logUtils.js";

function doing(id) {
  try {
    if (!id) {
      throw new Error("Task ID is required.");
    }

    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

    if (!task) {
      throw new Error(`Task with ID "${id}" not found.`);
    }

    if (task.status === "doing") {
      console.log(`Task "${id}" is already in progress.`);
      return true; // Already in progress, consider it a success
    }

    const stmt = db.prepare("UPDATE tasks SET status = ? WHERE id = ?");
    const result = stmt.run("doing", id);

    if (result.changes > 0) {
      console.log(`Task "${id}" is now in progress.`);
      return true; // Return true for success
    } else {
      throw new Error(`Failed to update task "${id}".`);
    }
  } catch (error) {
    logError("Error marking task as in progress:", error);
    throw error; // Consistent error handling
  }
}

export default doing;
