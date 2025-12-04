/**
 * Utility functions
 */

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}
