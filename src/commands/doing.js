// --- src/commands/doing.js ---
import { db } from "../database/db.js";

function doing(id) {
  try {
    if (!id) {
      console.error("Error: Task ID is required.");
      process.exit(1);
    }

    const task = db
      .prepare("SELECT * FROM tasks WHERE id LIKE ?")
      .get(`${id}%`);

    if (!task) {
      console.error(`Error: Task with ID "${id}" not found.`);
      process.exit(1);
    }

    if (task.status === "doing") {
      console.log(`Task "${id}" is already in progress.`);
      return;
    }

    // Update only the task status.  Don't modify completed_at here.
    const stmt = db.prepare("UPDATE tasks SET status = ? WHERE id LIKE ?");
    const result = stmt.run("doing", `${id}%`);

    if (result.changes > 0) {
      console.log(`Task "${id}" is now in progress.`);
    } else {
      console.error(`Error: Failed to update task "${id}".`);
      process.exit(1);
    }
  } catch (error) {
    console.error("Error marking task as in progress:", error.message);
    process.exit(1);
  }
}

export default doing;
