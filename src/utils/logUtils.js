// src/utils/logUtils.js

// Simple logging utility, can be expanded with a library like winston or pino.

export function logError(message, error) {
    console.error(message, error);  // Log the full error object.
}