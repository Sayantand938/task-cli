// --- src/commands/delete.js ---
import { db } from "../database/db.js";
import { logError } from "../utils/logUtils.js";
import inquirer from "inquirer";

async function deleteTask(id) {
  try {
    if (!id) {
      throw new Error("Task ID is required.");
    }

    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

    if (!task) {
      console.error(`Error: Task with ID "${id}" not found.`);
      return false; // Return false for not found
    }

    // Confirmation prompt
    const { confirmDelete } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmDelete",
        message: `Are you sure you want to delete task "${task.title}" (ID: ${id})?`,
        default: false,
      },
    ]);

    if (!confirmDelete) {
      console.log("Delete operation cancelled.");
      return false; // Return false for cancelled
    }

    const stmt = db.prepare("DELETE FROM tasks WHERE id = ?"); // Use exact match
    const result = stmt.run(id);

    if (result.changes > 0) {
      console.log(`Task "${id}" deleted successfully.`);
      return true; // Return true for success
    } else {
      console.error(`Error: Failed to delete task "${id}".`);
      return false; // Return false for failure
    }
  } catch (error) {
    logError("Error deleting task:", error);
    return false; // Return false for error
  }
}

export default deleteTask;
