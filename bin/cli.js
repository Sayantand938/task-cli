#!/usr/bin/env node
// --- bin/cli.js ---
import { program } from "commander";
import add from "../src/commands/add.js";
import list from "../src/commands/list.js";
import done from "../src/commands/done.js";
import doing from "../src/commands/doing.js";
import deleteTask from "../src/commands/delete.js";
import editTask from "../src/commands/edit.js";

program
  .command("add <task>")
  .description("Add a new task")
  .option("--due <date>", "Due date (YYYY-MM-DD)")
  .option("--urgency <urgency>", "Urgency (low, medium, high, critical)")
  .option("--tag <tag>", "Tag for the task")
  .option("--hide <date>", "Hide task until date (YYYY-MM-DD)")
  .action(add);

program
  .command("list")
  .description("List all tasks")
  .option("--filter <filter-string>", "Filter by 'field:value OR field:value'")
  .option("--sort <criteria>", "Sort by criteria (e.g., due:asc, urgency:desc)")
  .option("--all", "Show all tasks, including hidden ones")
  .action(list);

program.command("done <id>").description("Mark a task as done").action(done);

program
  .command("doing <id>")
  .description("Mark a task as in progress")
  .action(doing);

program.command("delete <id>").description("Delete a task").action(deleteTask);

program
  .command("edit <id>")
  .description("Edit a task")
  .option("--title <newTitle>", "New task title")
  .option("--due <newDueDate>", "New due date (YYYY-MM-DD)")
  .option("--urgency <urgency>", "Urgency (low, medium, high, critical)")
  .option("--tag <tag>", "Tag for the task")
  .option("--hide <date>", "Hide task until date (YYYY-MM-DD)")
  .action(editTask);

program.parse(process.argv);
