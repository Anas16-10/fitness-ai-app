// components/workout/WorkoutForm.tsx
// Form for logging a workout (exercise, sets, reps, weight) to the `workout_logs` table.

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { updateExerciseProgress } from "@/lib/progress";
import { updateWorkoutStreak } from "@/lib/streak";
import { getLocalDateString } from "@/lib/date-utils";

interface WorkoutFormProps {
  // Optional callback so parent can refresh data after a new log is saved.
  onSaved?: () => void;
  // Support pre-filling the form from the DailyWorkoutViewer
  initialPrefill?: {
    exercise: string;
    sets: number | "";
    reps: number | "";
  } | null;
}

export function WorkoutForm({ onSaved, initialPrefill }: WorkoutFormProps) {
  const [exercise, setExercise] = useState("");
  const [sets, setSets] = useState<number | "">("");
  const [reps, setReps] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPR, setIsPR] = useState(false);

  // When a user clicks an exercise in the AI plan view, update the form
  useEffect(() => {
    if (initialPrefill) {
      setExercise(initialPrefill.exercise || "");

      // We parse the exact number if it's a specific string like "8-10" we take the low end (simplification)
      let parsedSets = initialPrefill.sets;
      let parsedReps = initialPrefill.reps;

      if (typeof parsedSets === 'string') parsedSets = parseInt(parsedSets) || "";
      if (typeof parsedReps === 'string') parsedReps = parseInt(parsedReps) || "";

      setSets(parsedSets);
      setReps(parsedReps);
      setWeight(""); // Clear out old weight 
    }
  }, [initialPrefill]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsPR(false);

    if (!exercise || sets === "" || reps === "" || weight === "") {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      // First, get the currently logged in user.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You must be logged in to log a workout.");
        return;
      }

      // Insert a new row into the `workout_logs` table.
      const numericSets = Number(sets);
      const numericReps = Number(reps);
      const numericWeight = Number(weight);

      const { error: insertError } = await supabase
        .from("workout_logs")
        .insert({
          user_id: user.id,
          exercise,
          sets: numericSets,
          reps: numericReps,
          weight: numericWeight,
          workout_date: getLocalDateString(),
        });

      if (insertError) {
        console.error(insertError);
        setError(insertError.message);
        return;
      }

      // After logging the workout, update progressive overload stats.
      const prAchieved = await updateExerciseProgress(
        user.id,
        exercise,
        numericWeight,
        numericReps
      );
      setIsPR(prAchieved);

      // Update workout streak
      await updateWorkoutStreak(user.id);

      setSuccess("Workout logged!");

      // Clear out the form after submission
      setExercise("");
      setSets("");
      setReps("");
      setWeight("");

      if (onSaved) {
        onSaved();
      }
    } finally {
      setLoading(false);
    }
  }

  // The rest of the form UI remains unchanged
  return (
    <Card title="Log Workout">
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
            Exercise
          </label>
          <input
            type="text"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 focus:border-blue-500 transition-all shadow-sm"
            placeholder="Bench Press"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
              Sets
            </label>
            <input
              type="number"
              min={1}
              value={sets}
              onChange={(e) =>
                setSets(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
              Reps
            </label>
            <input
              type="number"
              min={1}
              value={reps}
              onChange={(e) =>
                setReps(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
              Weight (kg)
            </label>
            <input
              type="number"
              min={0}
              value={weight}
              onChange={(e) =>
                setWeight(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        {success && <p className="text-xs text-green-600">{success}</p>}
        {isPR && (
          <p className="text-xs font-semibold text-purple-600">
            🎉 New Personal Record!
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "Saving..." : "Save Workout"}
        </button>
      </form>
    </Card>
  );
}


