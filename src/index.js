#!/usr/bin/env node

import { program } from "commander";
import add from "./commands/add.js";
import list from "./commands/list.js";
import done from "./commands/done.js";
import doing from "./commands/doing.js";
import deleteTask from "./commands/delete.js";
import editTask from "./commands/edit.js";

program
  .command("add <task>")
  .description("Add a new task")
  .option("--due <date>", "Due date (YYYY-MM-DD)")
  .option("--urgency <urgency>", "Urgency (low, medium, high, critical)") // Changed option
  .option("--tag <tag>", "Tag for the task")
  .option("--hide <date>", "Hide task until date (YYYY-MM-DD)")
  .action(add);

program
  .command("list")
  .description("List all tasks")
  .option("--filter <filter-string>", "Filter by 'field:value OR field:value'")
  .option(
    "--sort <criteria>",
    "Sort by criteria (e.g., due:asc, urgency:desc)" //Allow sort by urgency
  )
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
  .option("--urgency <urgency>", "Urgency (low, medium, high, critical)") // Changed option
  .option("--tag <tag>", "Tag for the task")
  .option("--hide <date>", "Hide task until date (YYYY-MM-DD)")
  .action(editTask);

program.parse(process.argv);
