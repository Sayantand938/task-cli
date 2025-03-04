// --- src/commands/doing.js ---
import { db } from "../database/db.js";

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
      return;
    }

    // Update only the task status.  Don't modify completed_at here.
    const stmt = db.prepare("UPDATE tasks SET status = ? WHERE id = ?");
    const result = stmt.run("doing", id);

    if (result.changes > 0) {
      console.log(`Task "${id}" is now in progress.`);
    } else {
      throw new Error(`Failed to update task "${id}".`);
    }
  } catch (error) {
    console.error("Error marking task as in progress:", error);
    throw error;
  }
}

export default doing;
