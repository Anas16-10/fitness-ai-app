// lib/utils.ts
// Small utility helpers that can be reused across the app.

// Format a JavaScript Date object (or date string) into a simple readable format.
export function formatDate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format a time string (e.g. from a timestamp) into a short time.
export function formatTime(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}


