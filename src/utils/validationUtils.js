// src/utils/validationUtils.js

import { parseRelativeDate } from "./dateUtils.js";

/**
 * Validates a tag name.
 */
export function validateTagName(tagName) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tagName)) {
    throw new Error(
      "Invalid tag format. Use lowercase letters, numbers, and hyphens (e.g., 'work', 'urgent-task')."
    );
  }
  return true;
}

/**
 * Parses a date option (due or hide).
 */
export function parseDateOption(value, fieldName) {
  if (value === undefined || value === null || value.trim() === "") {
    return null;
  }
  const parsedDate = parseRelativeDate(value);
  if (!parsedDate) {
    throw new Error(
      `Invalid ${fieldName} date format. Use YYYY-MM-DD or relative formats (e.g., 'today', 'tomorrow', '+3d', 'next monday').`
    );
  }
  return parsedDate;
}
