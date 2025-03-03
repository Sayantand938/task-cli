// --- src/commands/done.js ---
import { db, getISOTimestamp } from "../database/db.js";

function done(id) {
  try {
    if (!id) {
      console.error("Error: Task ID is required.");
      process.exit(1);
    }

    // Use parameterized query to prevent SQL injection
    const task = db
      .prepare("SELECT * FROM tasks WHERE id LIKE ?")
      .get(`${id}%`);

    if (!task) {
      console.error(`Error: Task with ID "${id}" not found.`);
      process.exit(1);
    }

    if (task.status === "done") {
      console.log(`Task "${id}" is already marked as done.`);
      return; // Exit early if already done
    }

    // Update the task status and completed_at
    const stmt = db.prepare(
      "UPDATE tasks SET status = ?, completed_at = ? WHERE id LIKE ?"
    );
    const result = stmt.run("done", getISOTimestamp(), `${id}%`);

    if (result.changes > 0) {
      console.log(`Task "${id}" marked as done.`);
    } else {
      console.error(`Error: Failed to update task "${id}".`);
      process.exit(1);
    }
  } catch (error) {
    console.error("Error marking task as done:", error.message);
    process.exit(1);
  }
}

export default done;
