// lib/progress.ts
// Utility functions related to progressive overload tracking.
// Progressive overload means gradually increasing the weight or reps
// over time so your muscles are always challenged.
//
// In this file we take a new workout entry and update the
// `exercise_progress` table to keep track of personal records.

import { supabase } from "@/lib/supabase";
import type { ExerciseProgress } from "@/types/database";

/**
 * Update the exercise_progress table for a specific user + exercise.
 *
 * We:
 * 1. Calculate an estimated 1RM (one-rep max) using the Epley formula:
 *    1RM = weight * (1 + reps / 30)
 * 2. Check if a progress record exists for this exercise.
 * 3. Insert a new record if none exists.
 * 4. If it exists, update best_weight, best_reps, and estimated_1rm
 *    whenever the new values are higher.
 *
 * Returns true if any "personal record" was broken (weight, reps, or 1RM).
 */
export async function updateExerciseProgress(
  userId: string,
  exerciseName: string,
  weight: number,
  reps: number
): Promise<boolean> {
  // Safety guard: don't run if inputs are obviously invalid.
  if (!userId || !exerciseName || weight <= 0 || reps <= 0) {
    return false;
  }

  // 1RM (one-rep max) estimate using a simple and popular formula.
  // This is not perfect, but it's a useful approximation to track strength.
  const estimated1RM = weight * (1 + reps / 30);

  // Try to find an existing progress row for this user + exercise.
  const { data: existing, error: selectError } = await supabase
    .from("exercise_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("exercise_name", exerciseName)
    .maybeSingle();

  if (selectError && selectError.code !== "PGRST116") {
    // PGRST116 is "Results contain 0 rows", which is fine.
    console.error("DEBUG: Full selectError:", JSON.stringify(selectError, null, 2));
    return false;
  }

  const now = new Date().toISOString();

  // If there is no existing record, insert a new one.
  if (!existing) {
    const { error: insertError } = await supabase
      .from("exercise_progress")
      .insert({
        user_id: userId,
        exercise_name: exerciseName,
        best_weight: weight,
        best_reps: reps,
        estimated_1rm: estimated1RM,
        last_updated: now,
      });

    if (insertError) {
      console.error("DEBUG: Full insertError:", JSON.stringify(insertError, null, 2));
      return false;
    }

    // New record is automatically a personal record.
    return true;
  }

  const progress = existing as ExerciseProgress;
  let newBestWeight = progress.best_weight;
  let newBestReps = progress.best_reps;
  let newBest1RM = progress.estimated_1rm;
  let isPR = false;

  // If the new weight is heavier than before, that's a PR for weight.
  if (weight > newBestWeight) {
    newBestWeight = weight;
    isPR = true;
  }

  // If the new reps are higher than before, that's a PR for reps.
  if (reps > newBestReps) {
    newBestReps = reps;
    isPR = true;
  }

  // If the new estimated 1RM is higher, that's a PR for strength.
  if (estimated1RM > newBest1RM) {
    newBest1RM = estimated1RM;
    isPR = true;
  }

  const { error: updateError } = await supabase
    .from("exercise_progress")
    .update({
      best_weight: newBestWeight,
      best_reps: newBestReps,
      estimated_1rm: newBest1RM,
      last_updated: now,
    })
    .eq("id", progress.id);

  if (updateError) {
    console.error("DEBUG: Full updateError:", JSON.stringify(updateError, null, 2));
    return false;
  }

  return isPR;
}


