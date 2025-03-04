// --- src/commands/done.js ---
import { db, getISOTimestamp } from "../database/db.js";

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
      return; // Exit early if already done
    }

    // Update the task status and completed_at
    const stmt = db.prepare(
      "UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?"
    );
    const result = stmt.run("done", getISOTimestamp(), id);

    if (result.changes > 0) {
      console.log(`Task "${id}" marked as done.`);
    } else {
      throw new Error(`Failed to update task "${id}".`);
    }
  } catch (error) {
    console.error("Error marking task as done:", error);
    throw error;
  }
}

export default done;
