// ABOUTME: Date formatting utilities for consistent date display across the app.
// ABOUTME: Provides formatDate for short dates and formatDateTime for full timestamps.

/**
 * Formats a date string to a short, readable format.
 * Example output: "Jan 15, 2024"
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a date string to a full date and time format.
 * Example output: "January 15, 2024, 02:30 PM"
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
