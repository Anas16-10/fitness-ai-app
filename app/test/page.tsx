"use client";

// app/test/page.tsx
// Simple test page that fetches data from `workout_logs`
// and prints it to the browser console to verify Supabase is working.

import { supabase } from "@/lib/supabase";
import { TopNav } from "@/components/ui/TopNav";

export default function TestPage() {
  async function handleFetch() {
    // Fetch a few workout logs and print them.
    const { data, error } = await supabase
      .from("workout_logs")
      .select("*")
      .limit(5);

    if (error) {
      console.error("Error fetching workout_logs:", error);
    } else {
      console.log("workout_logs sample:", data);
    }
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-semibold">Supabase Test</h1>
        <p className="mb-3 text-sm text-gray-600">
          Click the button below, then open your browser console (F12) to see
          the results from the <code>workout_logs</code> table.
        </p>
        <button
          type="button"
          onClick={handleFetch}
          className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Fetch workout_logs
        </button>
      </main>
    </div>
  );
}


