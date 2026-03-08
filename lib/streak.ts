import { supabase } from "./supabase";
import { getLocalDateString, getYesterdayDateString } from "./date-utils";

/**
 * Update workout streak when a new workout is logged.
 */
export async function updateWorkoutStreak(userId: string): Promise<number> {
  // Get user's profile to check current streak and last workout date.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("workout_streak, last_workout_date")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile for streak:", profileError);
    return 0;
  }

  const currentStreak = profile?.workout_streak ?? 0;
  const lastWorkoutDate = profile?.last_workout_date; // YYYY-MM-DD

  const todayStr = getLocalDateString();
  const yesterdayStr = getYesterdayDateString();

  if (lastWorkoutDate === todayStr) {
    // Already worked out today, no change to streak
    return currentStreak;
  }

  let newStreak = 1;

  if (lastWorkoutDate === yesterdayStr) {
    // Consecutive day, increment streak
    newStreak = currentStreak + 1;
  } else if (!lastWorkoutDate) {
    newStreak = 1;
  }

  // Update profile with new streak and today's date.
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      workout_streak: newStreak,
      last_workout_date: todayStr,
    })
    .eq("id", userId);

  if (updateError) {
    console.error("Error updating streak:", updateError);
    return currentStreak;
  }

  return newStreak;
}
