// app/api/ai/diet/route.ts
// API route to generate AI diet recommendations using Gemini API
// Fetches today's nutrition data and provides personalized dietary advice

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateDietPlan } from "@/lib/ai-helpers";

export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("[Diet Advice] Failed to parse request body:", parseError);
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected JSON with userId." },
        { status: 400 }
      );
    }

    const { userId } = body as { userId?: string };

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid userId" },
        { status: 400 }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error("[Diet Advice] Invalid userId format:", userId);
      return NextResponse.json(
        { success: false, error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // 1. Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) console.error("[Diet Advice] Profile fetch error:", profileError);

    // 2. Fetch today's nutrition logs
    const todayStr = new Date().toISOString().slice(0, 10);

    const { data: nutritionLogs, error: nutritionError } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", todayStr)
      .order("created_at", { ascending: true });

    if (nutritionError) console.error("[Diet Advice] Nutrition logs fetch error:", nutritionError);

    // Calculate totals from today's nutrition
    const totalProtein = nutritionLogs?.reduce((sum, item) => sum + (item.protein || 0), 0) ?? 0;
    const totalCalories = nutritionLogs?.reduce((sum, item) => sum + (item.calories || 0), 0) ?? 0;
    const totalCarbs = nutritionLogs?.reduce((sum, item) => sum + (item.carbs || 0), 0) ?? 0;
    const totalFat = nutritionLogs?.reduce((sum, item) => sum + (item.fat || 0), 0) ?? 0;

    const todayNutrition = {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat
    };

    // 3. Call AI Helper
    const aiResponse = await generateDietPlan(profile, todayNutrition);

    if (!aiResponse.success || !aiResponse.data) {
      return NextResponse.json(
        { success: false, error: aiResponse.error || "Failed to generate diet advice" },
        { status: 500 }
      );
    }

    const adviceJson = aiResponse.data;
    const adviceText = JSON.stringify(adviceJson, null, 2);

    // 4. Save to database (optional)
    try {
      const { error: insertError } = await supabase.from("ai_recommendations").insert({
        user_id: userId,
        type: "diet",
        content: adviceText, // Store the stringified version for now
        created_at: new Date().toISOString(),
      });

      if (insertError) console.error("[Diet Advice] Database insert error:", insertError);
    } catch (dbError) {
      console.error("[Diet Advice] Database error (non-fatal):", dbError);
    }

    // 5. Return response
    return NextResponse.json({
      success: true,
      data: adviceJson,
      // Backward compatibility to avoid breaking frontend immediately
      advice: adviceText
    });
  } catch (error: any) {
    console.error("[Diet Advice] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to generate diet advice: ${error.message || "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
