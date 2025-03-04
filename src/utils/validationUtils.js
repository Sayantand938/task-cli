// src/utils/validationUtils.js

import { parseRelativeDate } from "./dateUtils.js";

/**
 * Validates a tag name.
 * @param {string} tagName - The tag name to validate.
 * @returns {boolean} True if the tag name is valid, false otherwise.
 * @throws {Error} If the tag name is invalid.
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
 * Parses a date option (due or hide) and returns a formatted date or null.
 * @param {string|null|undefined} value - The date value to parse.
 * @param {string} fieldName - The name of the field (for error messages).
 * @returns {string|null} The parsed date in YYYY-MM-DD format or null.
 * @throws {Error} If the date format is invalid.
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
