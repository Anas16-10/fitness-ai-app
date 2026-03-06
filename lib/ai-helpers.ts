// lib/ai-helpers.ts
// Type-safe AI helper functions for the fitness app

import { getGeminiModel } from "./gemini";

interface UserProfile {
    age?: number | null;
    height?: number | null;
    weight?: number | null;
    goal?: string | null;
    experience_level?: string | null;
    activity_level?: string | null;
    gender?: string | null;
}

// Ensure the profile has fallbacks
function buildProfileContext(profile?: UserProfile | null) {
    if (!profile) {
        return "NOTE: The user hasn't filled out their profile yet. Provide general valid recommendations.";
    }

    return `User Profile Context:
- Age: ${profile.age ?? "Not specified"}
- Height: ${profile.height ?? "Not specified"} cm
- Weight: ${profile.weight ?? "Not specified"} kg
- Goal: ${profile.goal ?? "general fitness and health"}
- Experience level: ${profile.experience_level ?? "beginner"}
- Activity level: ${profile.activity_level ?? "moderate"}
- Gender: ${profile.gender ?? "not specified"}`;
}

/**
 * Standardize AI response format
 */
export type AIResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
};

/**
 * 1. Generate Workout Plan
 */
export async function generateWorkoutPlan(profile?: UserProfile | null): Promise<AIResponse<any>> {
    try {
        const model = getGeminiModel();

        // Using responseMimeType to force JSON output
        const generationConfig = {
            temperature: 0.7,
            responseMimeType: "application/json",
        };

        const prompt = `You are an expert fitness coach creating a personalized 7-day workout plan.

${buildProfileContext(profile)}

Create a 7-day workout plan:
1. Match the user's experience level and activity level.
2. Align with their primary goal.
3. Include specific exercises, sets, reps, and rest periods.

Output ONLY a valid JSON object with the following structure:
{
  "week_plan": [
    {
      "day": "Day 1",
      "focus": "Full Body (or whatever)",
      "exercises": [
        {
          "exercise": "Bodyweight Squats",
          "sets": 3,
          "reps": 12,
          "rest": "60s",
          "notes": "Keep chest up"
        }
      ]
    }
  ],
  "summary": "A brief encouraging message about this week's plan."
}`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig,
        });

        const text = result.response.text();
        if (!text) throw new Error("Empty response from AI");

        const parsed = JSON.parse(text);
        return { success: true, data: parsed };
    } catch (error: any) {
        console.error("[AI Helper] generateWorkoutPlan Error:", error);
        return { success: false, error: error.message || "Failed to generate workout plan" };
    }
}

/**
 * 2. Generate Diet Plan / Recommendation
 */
export async function generateDietPlan(
    profile?: UserProfile | null,
    todayNutrition?: { calories: number; protein: number; carbs: number; fat: number }
): Promise<AIResponse<any>> {
    try {
        const model = getGeminiModel();

        const generationConfig = {
            temperature: 0.7,
            responseMimeType: "application/json",
        };

        const nutritionContext = todayNutrition
            ? `Today's nutrition intake so far:
- Calories: ${todayNutrition.calories} kcal
- Protein: ${todayNutrition.protein} g
- Carbohydrates: ${todayNutrition.carbs} g
- Fat: ${todayNutrition.fat} g`
            : "No nutrition logged for today yet.";

        const prompt = `You are a professional nutrition coach providing dietary advice.

${buildProfileContext(profile)}

${nutritionContext}

Recommend specific diet changes, example meals, and macro targets based on their profile and today's intake.

Output ONLY a valid JSON object with the following structure:
{
  "daily_macro_targets": {
    "calories": 2000,
    "protein": 150,
    "carbs": 200,
    "fat": 65
  },
  "recommendations": [
    "Eat more protein with breakfast",
    "Drink 3L of water"
  ],
  "example_meals": [
    {
      "meal": "Breakfast",
      "suggestion": "Oatmeal with protein powder and berries"
    }
  ],
  "summary": "Brief encouraging summary of their nutrition."
}`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig,
        });

        const text = result.response.text();
        if (!text) throw new Error("Empty response from AI");

        const parsed = JSON.parse(text);
        return { success: true, data: parsed };
    } catch (error: any) {
        console.error("[AI Helper] generateDietPlan Error:", error);
        return { success: false, error: error.message || "Failed to generate diet plan" };
    }
}

/**
 * 3. Generate Weekly Report
 */
export async function generateWeeklyReport(
    profile?: UserProfile | null,
    summaryData?: {
        workoutCount: number;
        totalWorkoutVolume: number;
        avgDailyCalories: number;
        avgDailyProtein: number;
        overloadSuggestions?: any[];
    }
): Promise<AIResponse<any>> {
    try {
        const model = getGeminiModel();

        const generationConfig = {
            temperature: 0.7,
            responseMimeType: "application/json",
        };

        const statsContext = summaryData
            ? `Weekly Stats Summary:
- Total workouts: ${summaryData.workoutCount}
- Average Daily Calories: ${summaryData.avgDailyCalories.toFixed(0)} kcal
- Average Daily Protein: ${summaryData.avgDailyProtein.toFixed(0)} g
${summaryData.overloadSuggestions?.length ? `
Progressive Overload Advisor Suggestions:
${summaryData.overloadSuggestions.map(s => `- ${s.exercise_name}: ${s.reason}`).join('\n')}` : ''}`
            : "No sufficient data logged this week.";

        const prompt = `You are an online fitness coach analyzing a user's weekly progress.

${buildProfileContext(profile)}

${statsContext}

Generate a comprehensive weekly progress report.

Output ONLY a valid JSON object with the following structure:
{
  "summary_message": "General encouraging message about their week.",
  "strengths": ["Consistent workouts", "Good protein intake"],
  "areas_for_improvement": ["Track meals more carefully"],
  "next_week_strategy": "Focus on progressive overload and hitting calorie targets exactly.",
  "score_out_of_10": 8
}`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig,
        });

        const text = result.response.text();
        if (!text) throw new Error("Empty response from AI");

        const parsed = JSON.parse(text);
        return { success: true, data: parsed };
    } catch (error: any) {
        console.error("[AI Helper] generateWeeklyReport Error:", error);
        return { success: false, error: error.message || "Failed to generate weekly report" };
    }
}
