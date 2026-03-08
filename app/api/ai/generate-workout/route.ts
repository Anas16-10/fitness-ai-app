// app/api/ai/generate-workout/route.ts
// AI Workout Plan generator with caching, rate-limit, and free-tier safe calls

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateWorkoutPlan } from "@/lib/ai-helpers";

export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("[Workout Plan] Failed to parse request body:", parseError);
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected JSON with userId." },
        { status: 400 }
      );
    }

    const { userId } = body as { userId?: string };
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ success: false, error: "Missing or invalid userId" }, { status: 400 });
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error("[Workout Plan] Invalid userId format:", userId);
      return NextResponse.json({ success: false, error: "Invalid user ID format" }, { status: 400 });
    }

    // ---------------------------
    // 1. Check for cached plan (last 24h)
    // ---------------------------
    const { data: cachedPlan } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    if (cachedPlan && new Date().getTime() - new Date(cachedPlan.created_at).getTime() < ONE_DAY_MS) {
      console.log("[Workout Plan] Returning cached plan");
      return NextResponse.json({
        success: true,
        data: cachedPlan.plan_json,
        // Providing backward compatibility for old frontend components
        plan: cachedPlan.plan_text,
        planJson: cachedPlan.plan_json,
      });
    }

    // ---------------------------
    // 3. Fetch user profile
    // ---------------------------
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[Workout Plan] Profile fetch error:", profileError);
      return NextResponse.json(
        { success: false, error: "Failed to load profile from database" },
        { status: 500 }
      );
    }

    // ---------------------------
    // 4. Call AI Helper
    // ---------------------------
    const aiResponse = await generateWorkoutPlan(profile);

    if (!aiResponse.success || !aiResponse.data) {
      return NextResponse.json(
        { success: false, error: aiResponse.error || "Failed to generate plan" },
        { status: 500 }
      );
    }

    const planJson = aiResponse.data;
    const planText = JSON.stringify(planJson, null, 2); // For legacy support/caching

    // ---------------------------
    // 5. Save to database
    // ---------------------------
    const { error: insertError } = await supabase.from("workout_plans").insert({
      user_id: userId,
      plan_json: planJson,
      created_at: new Date().toISOString(),
    });

    if (insertError) console.warn("[Workout Plan] Failed to save plan to database:", insertError);

    // ---------------------------
    // 6. Return response
    // ---------------------------
    return NextResponse.json({
      success: true,
      data: planJson,
      // Backward compatibility
      plan: planText,
      planJson
    });
  } catch (error: any) {
    console.error("[Workout Plan] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: `Failed to generate workout plan: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}