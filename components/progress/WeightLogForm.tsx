// components/progress/WeightLogForm.tsx
// Form for logging body weight to track weight changes over time.

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getLocalDateString } from "@/lib/date-utils";
import { Card } from "@/components/ui/Card";

interface WeightLogFormProps {
  onSaved?: () => void;
}

export function WeightLogForm({ onSaved }: WeightLogFormProps) {
  const [weight, setWeight] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (weight === "" || Number(weight) <= 0) {
      setError("Please enter a valid weight.");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You must be logged in to log weight.");
        return;
      }

      const todayStr = getLocalDateString();

      // Check if weight already logged today - if so, update instead of insert.
      const { data: existing } = await supabase
        .from("body_weight_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("log_date", todayStr)
        .maybeSingle();

      if (existing) {
        // Update existing entry.
        const { error: updateError } = await supabase
          .from("body_weight_logs")
          .update({ weight: Number(weight) })
          .eq("id", existing.id);

        if (updateError) {
          console.error(updateError);
          setError(updateError.message);
          return;
        }
      } else {
        // Insert new entry.
        const { error: insertError } = await supabase
          .from("body_weight_logs")
          .insert({
            user_id: user.id,
            weight: Number(weight),
            log_date: todayStr,
          });

        if (insertError) {
          console.error(insertError);
          setError(insertError.message);
          return;
        }
      }

      setSuccess("Weight logged!");
      setWeight("");

      if (onSaved) {
        onSaved();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Log Body Weight">
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <div>
          <label className="mb-2 block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
            Weight (kg)
          </label>
          <input
            type="number"
            min={0}
            step="0.1"
            value={weight}
            onChange={(e) =>
              setWeight(e.target.value ? Number(e.target.value) : "")
            }
            className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 focus:border-blue-500 transition-all shadow-sm"
            placeholder="75.5"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        {success && <p className="text-xs text-green-600">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Log Weight"}
        </button>
      </form>
    </Card>
  );
}

