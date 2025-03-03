// --- src/commands/list.js ---
import { db } from "../database/db.js";
import { table, getBorderCharacters } from "table";
import chalk from "chalk";
import { parseRelativeDate } from "../utils/dateUtils.js";
import { format, startOfDay } from "date-fns";

// Constants for extensibility
const VALID_SORT_FIELDS = {
  due: "tasks.due",
  urgency: "u.id", // Changed from priority to urgency
};
const VALID_SORT_DIRECTIONS = ["asc", "desc"];
const STATUS_COLORS = {
  pending: chalk.bold.red,
  doing: chalk.bold.yellow,
  done: chalk.bold.green,
};

/**
 * Builds a SQL query for listing tasks based on options.
 */
function buildTaskQuery({ filter, sort, all }) {
  const params = [];
  const currentDate = startOfDay(new Date());
  const currentDateStr = format(currentDate, "yyyy-MM-dd");

  // Base query
  let query = `
    SELECT tasks.id, tasks.title, tasks.due, tasks.status, u.name as urgency, t.name as tag, tasks.hide_until
    FROM tasks
    LEFT JOIN urgencies u ON tasks.urgency_id = u.id
    LEFT JOIN tags t ON tasks.tag_id = t.id
  `;
  const conditions = [];

  // Filter handling
  if (filter) {
    const [whereClause, filterParams] = parseFilter(filter);
    if (whereClause) {
      conditions.push(whereClause);
      params.push(...filterParams);
    }
  }

  // Hide until logic
  if (!all) {
    conditions.push("(tasks.hide_until IS NULL OR tasks.hide_until <= ?)");
    params.push(currentDateStr);
  }

  // Combine conditions
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  // Sorting logic
  query += " ORDER BY u.id ASC NULLS LAST"; // Default sort by urgency
  if (sort) {
    const [field, direction = "asc"] = sort.split(":");
    const sqlField = VALID_SORT_FIELDS[field];
    if (sqlField && VALID_SORT_DIRECTIONS.includes(direction.toLowerCase())) {
      query = query.replace(
        "ORDER BY u.id ASC NULLS LAST",
        `ORDER BY ${sqlField} ${direction.toUpperCase()} NULLS LAST`
      );
    } else {
      throw new Error(
        `Invalid sort: ${sort}. Use format 'field:direction' (e.g., 'due:asc'). Valid fields: ${Object.keys(
          VALID_SORT_FIELDS
        ).join(", ")}`
      );
    }
  }

  return { query, params };
}

/**
 * Lists tasks based on provided filters and sorting options.
 * @returns {boolean} Success status
 */
function list(options) {
  try {
    const { query, params } = buildTaskQuery(options);
    const tasks = db.prepare(query).all(params);

    if (tasks.length === 0) {
      console.log("No tasks found.");
      return true;
    }

    const headers = options.all
      ? ["ID", "Title", "Due Date", "Status", "Urgency", "Tag", "Hide Until"]
      : ["ID", "Title", "Due Date", "Status", "Urgency", "Tag"]; // Changed header
    const data = [headers];
    const currentDate = startOfDay(new Date());

    tasks.forEach((task) => {
      data.push(formatTaskRow(task, currentDate, options.all));
    });

    const columnConfig = {
      columns: {
        0: { alignment: "center" }, // ID
        2: { alignment: "center" }, // Due Date
        3: { alignment: "center" }, // Status
        4: { alignment: "center" }, // Urgency
        5: { alignment: "center" }, // Tag
        ...(options.all ? { 6: { alignment: "center" } } : {}), // Hide Until
      },
      border: getBorderCharacters("norc"),
    };

    console.log(table(data, columnConfig));
    return true;
  } catch (error) {
    console.error(`Error listing tasks: ${error.message}`);
    return false;
  }
}

/**
 * Recursively parses a filter string into a SQL WHERE clause and parameters.
 * @param {string} filterStr Filter string (e.g., "status:done AND due:today")
 * @returns {[string, any[]]} SQL WHERE clause and parameters
 */
function parseFilter(filterStr) {
  const params = [];
  const trimmedStr = filterStr.trim();

  // Supported filter fields and their SQL mappings
  const filterFields = {
    title: (value) => {
      params.push(`%${value.replace("%", "%")}%`);
      return "tasks.title LIKE ?";
    },
    urgency: (value) => {
      // Changed from priority
      params.push(value.toLowerCase());
      return "u.name = ?";
    },
    status: (value) => {
      params.push(value.toLowerCase());
      return "tasks.status = ?";
    },
    tag: (value) => {
      params.push(value.toLowerCase());
      return "t.name = ?";
    },
    due: (value) => {
      const date = parseRelativeDate(value);
      if (!date) throw new Error(`Invalid due date: ${value}`);
      params.push(date);
      return "tasks.due = ?";
    },
    id: (value) => {
      // Add ID filtering
      params.push(`${value}%`);
      return "tasks.id LIKE ?";
    },
  };

  const stripParentheses = (str) => {
    if (str.startsWith("(") && str.endsWith(")")) {
      let balance = 0;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === "(") balance++;
        else if (str[i] === ")") balance--;
        if (balance === 0 && i < str.length - 1) return str; // Unbalanced within
      }
      return str.slice(1, -1);
    }
    return str;
  };

  const cleanStr = stripParentheses(trimmedStr);
  const parts = cleanStr.split(/\s+(AND|OR)\s+/i);
  if (parts.length > 1) {
    const conditions = [];
    let i = 0;
    while (i < parts.length) {
      if (i % 2 === 0) {
        const [subClause, subParams] = parseFilter(parts[i]);
        conditions.push(subClause);
        params.push(...subParams);
      } else {
        conditions.push(parts[i].toUpperCase());
      }
      i++;
    }
    return [`(${conditions.join(" ")})`, params];
  }

  const [field, value] = cleanStr.split(":");
  if (!field || !value || !filterFields[field]) {
    throw new Error(
      `Invalid filter: '${trimmedStr}'. Use 'field:value' (fields: ${Object.keys(
        filterFields
      ).join(", ")})`
    );
  }
  return [filterFields[field](value.trim()), params];
}

/**
 * Formats a task row for display.
 * @param {object} task Task data
 * @param {Date} currentDate Current date for comparison
 * @param {boolean} showAll Include hide_until column
 * @returns {string[]} Formatted row
 */
function formatTaskRow(task, currentDate, showAll) {
  const id = chalk.dim(task.id.substring(0, 8));
  const urgency = task.urgency || "-"; // Changed variable name
  const formattedUrgency =
    urgency.toLowerCase() === "critical" ? chalk.inverse(urgency) : urgency; // and here
  const formattedStatus =
    STATUS_COLORS[task.status]?.(task.status) || task.status;

  let dueDate = task.due || "-";
  if (task.due) {
    const parsedDueDate = startOfDay(new Date(task.due));
    if (parsedDueDate < currentDate && task.status !== "done") {
      dueDate = chalk.bgRed(dueDate);
    }
  }

  const row = [
    id,
    task.title,
    dueDate,
    formattedStatus,
    formattedUrgency, // and here
    task.tag || "-",
  ];
  if (showAll) row.push(task.hide_until || "-");
  return row;
}

export default list;
