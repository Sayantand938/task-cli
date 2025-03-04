// --- src/commands/done.js ---
import { db, getISOTimestamp } from "../database/db.js";
import { logError } from "../utils/logUtils.js";

function done(id) {
  try {
    if (!id) {
      throw new Error("Task ID is required.");
    }

    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

    if (!task) {
      throw new Error(`Task with ID "${id}" not found.`);
    }

    if (task.status === "done") {
      console.log(`Task "${id}" is already marked as done.`);
      return true; // Already done, consider it a success
    }

    const stmt = db.prepare(
      "UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?"
    );
    const result = stmt.run("done", getISOTimestamp(), id);

    if (result.changes > 0) {
      console.log(`Task "${id}" marked as done.`);
      return true; // Return true for success
    } else {
      throw new Error(`Failed to update task "${id}".`);
    }
  } catch (error) {
    logError("Error marking task as done:", error);
    throw error; // Consistent error handling
  }
}

export default done;
