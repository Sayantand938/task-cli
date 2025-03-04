// --- src/commands/list.js ---
import { db } from "../database/db.js";
import Table from "cli-table3";
import chalk from "chalk";
import { format, startOfDay } from "date-fns";
import { parseDateOption } from "../utils/validationUtils.js";
import { logError } from "../utils/logUtils.js";

const VALID_SORT_FIELDS = {
  due: "tasks.due",
  urgency: "u.id",
};
const VALID_SORT_DIRECTIONS = ["asc", "desc"];
const STATUS_COLORS = {
  pending: chalk.bold.red,
  doing: chalk.bold.yellow,
  done: chalk.bold.green,
};

function buildTaskQuery({ filter, sort, all }) {
  let query = `
    SELECT tasks.id, tasks.title, tasks.due, tasks.status, u.name as urgency, t.name as tag, tasks.hide_until
    FROM tasks
    LEFT JOIN urgencies u ON tasks.urgency_id = u.id
    LEFT JOIN tags t ON tasks.tag_id = t.id
  `;
  const params = [];
  const conditions = [];

  if (filter) {
    const [whereClause, filterParams] = parseFilter(filter);
    if (whereClause) {
      conditions.push(whereClause);
      params.push(...filterParams);
    }
  }

  if (!all) {
    conditions.push("(tasks.hide_until IS NULL OR tasks.hide_until <= ?)");
    const currentDate = format(startOfDay(new Date()), "yyyy-MM-dd");
    params.push(currentDate);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  let orderBy = "u.id ASC NULLS LAST";
  if (sort) {
    const [field, direction = "asc"] = sort.split(":");
    const sqlField = VALID_SORT_FIELDS[field];
    if (!sqlField || !VALID_SORT_DIRECTIONS.includes(direction.toLowerCase())) {
      throw new Error(
        `Invalid sort: ${sort}. Use format 'field:direction' (e.g., 'due:asc'). Valid fields: ${Object.keys(
          VALID_SORT_FIELDS
        ).join(", ")}`
      );
    }
    orderBy = `${sqlField} ${direction.toUpperCase()} NULLS LAST`;
  }

  query += ` ORDER BY ${orderBy}`;

  return { query, params };
}

function list(options) {
  try {
    const { query, params } = buildTaskQuery(options);
    const tasks = db.prepare(query).all(params);

    if (tasks.length === 0) {
      console.log(chalk.yellow("No tasks found."));
      return true;
    }

    const headers = options.all
      ? ["ID", "Title", "Due Date", "Status", "Urgency", "Tag", "Hide Until"]
      : ["ID", "Title", "Due Date", "Status", "Urgency", "Tag"];

    const table = new Table({
      head: headers.map((header) => chalk.bold.white(header)),
      style: {
        head: [],
        border: ["white"],
        compact: false,
      },
      colAligns: [
        "center",
        "left",
        "center",
        "center",
        "center",
        "center",
        ...(options.all ? ["center"] : []),
      ],
      chars: {
        top: "═",
        "top-mid": "╤",
        "top-left": "╔",
        "top-right": "╗",
        bottom: "═",
        "bottom-mid": "╧",
        "bottom-left": "╚",
        "bottom-right": "╝",
        left: "║",
        "left-mid": "╟",
        mid: "─",
        "mid-mid": "┼",
        right: "║",
        "right-mid": "╢",
        middle: "│",
      },
    });

    const currentDate = startOfDay(new Date());

    tasks.forEach((task) => {
      table.push(formatTaskRow(task, currentDate, options.all));
    });

    console.log(); // Blank line before
    console.log(table.toString());
    console.log(); // Blank line after
    return true;
  } catch (error) {
    logError("Error listing tasks:", error);
    return false;
  }
}

function parseFilter(filterStr) {
  const params = [];
  let trimmedStr = filterStr.trim();
  trimmedStr = trimmedStr.replace(/^\((.*)\)$/, "$1");

  const filterFields = {
    title: (value) => {
      params.push(value);
      return "tasks.title = ?";
    },
    urgency: (value) => {
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
      const date = parseDateOption(value, "due");
      if (!date) throw new Error(`Invalid due date: ${value}`);
      params.push(date);
      return "tasks.due = ?";
    },
    id: (value) => {
      params.push(value);
      return "tasks.id = ?";
    },
  };

  const parts = trimmedStr.split(/\s+(AND|OR)\s+/i);
  if (parts.length > 1) {
    const conditions = [];
    for (let i = 0; i < parts.length; i += 2) {
      const [subClause, subParams] = parseFilter(parts[i]);
      conditions.push(subClause);
      params.push(...subParams);
      if (i + 1 < parts.length) {
        conditions.push(parts[i + 1].toUpperCase());
      }
    }
    return [`(${conditions.join(" ")})`, params];
  }

  const [field, value] = trimmedStr.split(":");
  if (!field || !value) {
    throw new Error(`Invalid filter format.  Must be 'field:value'`);
  }
  if (!filterFields[field]) {
    throw new Error(
      `Invalid filter field: ${field}.  Valid fields: ${Object.keys(
        filterFields
      ).join(", ")}`
    );
  }
  return [filterFields[field](value.trim()), params];
}

function formatTaskRow(task, currentDate, showAll) {
  const id = chalk.dim(task.id.substring(0, 8));
  const urgency = task.urgency || "-";
  const formattedUrgency =
    urgency.toLowerCase() === "critical"
      ? chalk.bgRed.white.bold(urgency)
      : chalk.yellow(urgency);
  const formattedStatus =
    STATUS_COLORS[task.status]?.(task.status) || task.status;

  let dueDate = task.due || "-";
  if (task.due) {
    const parsedDueDate = startOfDay(new Date(task.due));
    if (parsedDueDate < currentDate && task.status !== "done") {
      dueDate = chalk.bgRed.white.bold(dueDate);
    }
  }

  const row = [
    id,
    chalk.white(task.title),
    dueDate,
    formattedStatus,
    formattedUrgency,
    task.tag || "-",
  ];
  if (showAll) row.push(chalk.gray(task.hide_until || "-"));
  return row;
}

export default list;
