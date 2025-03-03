// --- src/commands/delete.js ---
import { db } from "../database/db.js";

function deleteTask(id) {
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

    // Delete the task
    const stmt = db.prepare("DELETE FROM tasks WHERE id LIKE ?");
    const result = stmt.run(`${id}%`);

    if (result.changes > 0) {
      console.log(`Task "${id}" deleted successfully.`);
    } else {
      console.error(`Error: Failed to delete task "${id}".`);
      process.exit(1);
    }
  } catch (error) {
    console.error("Error deleting task:", error.message);
    process.exit(1);
  }
}

export default deleteTask;
