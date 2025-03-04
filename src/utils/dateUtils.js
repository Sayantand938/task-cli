// src/utils/dateUtils.js
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  isValid,
  nextFriday,
  nextMonday,
  nextSaturday,
  nextSunday,
  nextThursday,
  nextTuesday,
  nextWednesday,
  parse,
} from "date-fns";

const DATE_FORMAT = "yyyy-MM-dd";

function formatDate(date) {
  return format(date, DATE_FORMAT);
}

const RELATIVE_DATE_KEYWORDS = {
  today: (today) => today,
  tomorrow: (today) => addDays(today, 1),
  "next monday": (today) => nextMonday(today),
  "next tuesday": (today) => nextTuesday(today),
  "next wednesday": (today) => nextWednesday(today),
  "next thursday": (today) => nextThursday(today),
  "next friday": (today) => nextFriday(today),
  "next saturday": (today) => nextSaturday(today),
  "next sunday": (today) => nextSunday(today),
};

export function parseRelativeDate(dateString) {
  if (!dateString) return null;

  const lowerDateString = dateString.toLowerCase();
  const today = new Date();

  if (RELATIVE_DATE_KEYWORDS[lowerDateString]) {
    return formatDate(RELATIVE_DATE_KEYWORDS[lowerDateString](today));
  }

  if (/^[+-]\d+[dwmy]$/.test(lowerDateString)) {
    const match = lowerDateString.match(/^([+-])(\d+)([dwmy])$/);
    const sign = match[1];
    const amount = parseInt(match[2]);
    const unit = match[3];
    const multiplier = sign === "+" ? 1 : -1;

    let parsedDate;
    if (unit === "d") {
      parsedDate = addDays(today, amount * multiplier);
    } else if (unit === "w") {
      parsedDate = addWeeks(today, amount * multiplier);
    } else if (unit === "m") {
      parsedDate = addMonths(today, amount * multiplier);
    } else if (unit === "y") {
      parsedDate = addYears(today, amount * multiplier);
    }

    if (isValid(parsedDate)) {
      return formatDate(parsedDate);
    }
  }

  try {
    const parsedDate = parse(lowerDateString, DATE_FORMAT, today);
    if (isValid(parsedDate)) {
      return formatDate(parsedDate);
    }
  } catch (error) {
    // Ignore parse errors, handle invalid date strings
  }

  return null; // Invalid format
}
