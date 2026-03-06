import { supabase } from "./supabase";

/**
 * Progressive Overload Advisor
 * 
 * Logic to analyze exercise progress and suggest specific increases
 * in weight or repetitions to ensure continuous improvement.
 */

export interface OverloadSuggestion {
    exercise_name: string;
    current_best_weight: number;
    current_best_reps: number;
    suggestion_type: "weight" | "reps" | "maintain";
    suggested_weight: number;
    suggested_reps: number;
    reason: string;
}

export async function getProgressiveOverloadSuggestions(userId: string): Promise<OverloadSuggestion[]> {
    // Fetch the latest progress for all exercises
    const { data: progressLogs, error } = await supabase
        .from("exercise_progress")
        .select("*")
        .eq("user_id", userId)
        .order("last_updated", { ascending: false });

    if (error || !progressLogs) {
        console.error("Error fetching progress for overload suggestions:", error);
        return [];
    }

    const suggestions: OverloadSuggestion[] = progressLogs.map((log) => {
        let suggestion_type: "weight" | "reps" | "maintain" = "maintain";
        let suggested_weight = log.best_weight;
        let suggested_reps = log.best_reps;
        let reason = "";

        /**
         * Simple Heuristic for Progressive Overload:
         * 1. If reps are high (e.g. >= 12), suggest increasing weight by 2.5kg - 5kg.
         * 2. If weight is static but reps are low, suggest increasing reps by 1-2.
         * 3. Else, maintain and focus on form.
         */

        if (log.best_reps >= 10) {
            suggestion_type = "weight";
            // Suggest 2.5kg increase for upper body, 5kg for lower body (rough estimate)
            const increment = log.exercise_name.toLowerCase().includes("squat") ||
                log.exercise_name.toLowerCase().includes("deadlift") ||
                log.exercise_name.toLowerCase().includes("leg") ? 5 : 2.5;
            suggested_weight = log.best_weight + increment;
            suggested_reps = 8; // Reset reps to a lower range for the new weight
            reason = `You hit ${log.best_reps} reps at ${log.best_weight}kg. It's time to increase the intensity! Try ${suggested_weight}kg for 8 reps.`;
        } else if (log.best_reps < 10 && log.best_reps > 0) {
            suggestion_type = "reps";
            suggested_reps = log.best_reps + 1;
            reason = `Great work on ${log.best_weight}kg. Aim for one more rep (${suggested_reps}) next time to build more volume.`;
        } else {
            reason = "Keep focus on consistent form and tracking your reps accurately.";
        }

        return {
            exercise_name: log.exercise_name,
            current_best_weight: log.best_weight,
            current_best_reps: log.best_reps,
            suggestion_type,
            suggested_weight,
            suggested_reps,
            reason,
        };
    });

    return suggestions;
}
