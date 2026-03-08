// lib/utils.ts
// Small utility helpers that can be reused across the app.

// Helper to parse Supabase UTC timestamps correctly
function parseSupabaseDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  let str = date;
  // If it's a space-separated string from Supabase: "2026-03-08 11:35:00"
  str = str.replace(" ", "T");
  // If it doesn't specify a timezone offset, force it to be evaluated as UTC ('Z')
  if (!str.includes("Z") && !str.match(/[+-]\d{2}(:?\d{2})?$/)) {
    str += "Z";
  }
  return new Date(str);
}

// Format a JavaScript Date object (or date string) into a simple readable format.
export function formatDate(date: string | Date) {
  const d = parseSupabaseDate(date);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format a time string (e.g. from a timestamp) into a short time.
export function formatTime(date: string | Date) {
  const d = parseSupabaseDate(date);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}


