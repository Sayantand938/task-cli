// src/utils/dateUtils.js
import {
  parse,
  isValid,
  format,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  nextMonday,
  nextTuesday,
  nextWednesday,
  nextThursday,
  nextFriday,
  nextSaturday,
  nextSunday,
} from "date-fns";

export function parseRelativeDate(dateString) {
  if (!dateString) return null;

  const lowerDateString = dateString.toLowerCase();
  let parsedDate = parse(lowerDateString, "yyyy-MM-dd", new Date());

  if (isValid(parsedDate)) {
    return format(parsedDate, "yyyy-MM-dd");
  }

  const today = new Date();

  // Handle specific keywords
  if (lowerDateString === "today") {
    parsedDate = today;
  } else if (lowerDateString === "tomorrow") {
    parsedDate = addDays(today, 1);
  } else if (lowerDateString === "next monday") {
    parsedDate = nextMonday(today);
  } else if (lowerDateString === "next tuesday") {
    parsedDate = nextTuesday(today);
  } else if (lowerDateString === "next wednesday") {
    parsedDate = nextWednesday(today);
  } else if (lowerDateString === "next thursday") {
    parsedDate = nextThursday(today);
  } else if (lowerDateString === "next friday") {
    parsedDate = nextFriday(today);
  } else if (lowerDateString === "next saturday") {
    parsedDate = nextSaturday(today);
  } else if (lowerDateString === "next sunday") {
    parsedDate = nextSunday(today);
  } else if (/^[+-]\d+[dwmy]$/.test(lowerDateString)) {
    // Handle +Xd, -Xw, +Xm, -Xy, etc. (single unit only)
    const match = lowerDateString.match(/^([+-])(\d+)([dwmy])$/);
    const sign = match[1];
    const amount = parseInt(match[2]);
    const unit = match[3];
    const multiplier = sign === "+" ? 1 : -1;

    if (unit === "d") {
      parsedDate = addDays(today, amount * multiplier);
    } else if (unit === "w") {
      parsedDate = addWeeks(today, amount * multiplier);
    } else if (unit === "m") {
      parsedDate = addMonths(today, amount * multiplier);
    } else if (unit === "y") {
      parsedDate = addYears(today, amount * multiplier);
    }
  } else {
    return null; // Invalid format
  }

  if (!isValid(parsedDate)) {
    return null; // Invalid date
  }

  return format(parsedDate, "yyyy-MM-dd");
}
