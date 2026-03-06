// app/api/ai/weekly-report/route.ts
// API route to generate AI-powered weekly fitness reports using Gemini API
// Analyzes last 7 days of workouts, nutrition, and exercise progress

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateWeeklyReport } from "@/lib/ai-helpers";
import { getProgressiveOverloadSuggestions } from "@/lib/overload";

export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("[Weekly Report] Failed to parse request body:", parseError);
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
      console.error("[Weekly Report] Invalid userId format:", userId);
      return NextResponse.json(
        { success: false, error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Calculate date range for last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // 1. Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    // 2. Fetch last 7 days of workout logs
    const { data: workoutLogs } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", sevenDaysAgoISO)
      .order("created_at", { ascending: true });

    // 3. Fetch last 7 days of nutrition logs
    const { data: nutritionLogs } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("log_date", sevenDaysAgoStr)
      .order("log_date", { ascending: true });

    // Calculate summary statistics
    const workoutCount = workoutLogs?.length ?? 0;
    const totalWorkoutVolume = workoutLogs?.reduce(
      (sum, log) => sum + (log.weight || 0) * (log.reps || 0) * (log.sets || 0),
      0
    ) ?? 0;

    const totalCalories = nutritionLogs?.reduce((sum, log) => sum + (log.calories || 0), 0) ?? 0;
    const totalProtein = nutritionLogs?.reduce((sum, log) => sum + (log.protein || 0), 0) ?? 0;
    const avgDailyCalories = totalCalories / 7;
    const avgDailyProtein = totalProtein / 7;

    // 4. Fetch Overload Suggestions
    const overloadSuggestions = await getProgressiveOverloadSuggestions(userId);

    const summaryData = {
      workoutCount,
      totalWorkoutVolume,
      avgDailyCalories,
      avgDailyProtein,
      overloadSuggestions,
    };

    // 5. Call AI Helper
    const aiResponse = await generateWeeklyReport(profile, summaryData);

    if (!aiResponse.success || !aiResponse.data) {
      return NextResponse.json(
        { success: false, error: aiResponse.error || "Failed to generate weekly report" },
        { status: 500 }
      );
    }

    const reportJson = aiResponse.data;
    const reportText = JSON.stringify(reportJson, null, 2);

    // 5. Save to database (optional)
    try {
      const { error: insertError } = await supabase.from("ai_recommendations").insert({
        user_id: userId,
        type: "weekly_report",
        content: reportText,
        created_at: new Date().toISOString(),
      });

      if (insertError) console.error("[Weekly Report] Database insert error:", insertError);
    } catch (dbError) {
      console.error("[Weekly Report] Database error (non-fatal):", dbError);
    }

    // 6. Return response
    return NextResponse.json({
      success: true,
      data: reportJson,
      // Backward compatibility to avoid breaking frontend immediately
      report: reportText
    });
  } catch (error: any) {
    console.error("[Weekly Report] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to generate weekly report: ${error.message || "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
