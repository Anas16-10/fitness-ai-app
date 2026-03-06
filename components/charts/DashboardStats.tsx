"use client";

// components/charts/DashboardStats.tsx
// Shows high-level stats on the dashboard:
// - Today's workout (last log from today)
// - Calorie summary (from today's nutrition)
// - Quick stats like total workouts count
// - Basic body metrics (BMI, BMR, daily calorie target)

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getLocalDateString, getYesterdayDateString, validateProfileStreak } from "@/lib/date-utils";
import { Card } from "@/components/ui/Card";
import { WorkoutLog, NutritionLog, Profile } from "@/types/database";
import { Activity, Flame, BarChart3, TrendingUp } from "lucide-react";
import {
  calculateBMI,
  calculateBMR,
  calculateDailyCalories,
  calculateTDEE,
  calculateDailyCaloriesFromTDEE,
} from "@/lib/fitness";

interface DashboardData {
  todayWorkout: WorkoutLog | null;
  totalWorkouts: number;
  todayCalories: number;
  bmi: number | null;
  bmr: number | null;
  dailyCaloriesTarget: number | null;
  workoutsThisWeek: number;
  avgDailyCalories: number;
  avgDailyProtein: number;
  weightChange: number | null;
  workoutStreak: number | null;
  todayFocus: string | null;
}

export function DashboardStats() {
  const [data, setData] = useState<DashboardData>({
    todayWorkout: null,
    totalWorkouts: 0,
    todayCalories: 0,
    bmi: null,
    bmr: null,
    dailyCaloriesTarget: null,
    workoutsThisWeek: 0,
    avgDailyCalories: 0,
    avgDailyProtein: 0,
    weightChange: null,
    workoutStreak: null,
    todayFocus: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchStats() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("You must be logged in to see dashboard stats.");
      setLoading(false);
      return;
    }

    const todayStr = getLocalDateString();

    // Fetch workout logs for the user.
    const { data: workoutData, error: workoutError } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (workoutError) {
      console.error(workoutError);
      setError(workoutError.message);
      setLoading(false);
      return;
    }

    const allWorkouts = (workoutData ?? []) as WorkoutLog[];

    // Count unique workout days for "Total Sessions"
    // We prioritize the explicit workout_date field.
    const workoutDays = allWorkouts.map(w => w.workout_date).filter(Boolean);
    const uniqueSessionDays = new Set(workoutDays).size;

    // If they have logs with no workout_date, they are legacy or broken.
    // We won't count them towards sessions to keep it "today-focused" and clean.

    const todayWorkout =
      allWorkouts.find(
        (w) => w.workout_date === todayStr
      ) ?? null;

    // Fetch the latest workout plan to get "Today's Focus"
    const { data: planData } = await supabase
      .from("workout_plans")
      .select("plan_json")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let todayFocus = null;
    if (planData?.plan_json?.week_plan) {
      const dayOfWeek = (new Date().getDay() + 6) % 7; // Monday = 0
      const planForToday = planData.plan_json.week_plan[dayOfWeek] || planData.plan_json.week_plan[0];
      todayFocus = planForToday?.focus || null;
    }

    // Fetch today's nutrition logs for calorie summary.
    const { data: nutritionData, error: nutritionError } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", todayStr);

    if (nutritionError) {
      console.error(nutritionError);
      setError(nutritionError.message);
      setLoading(false);
      return;
    }

    const todayNutrition = (nutritionData ?? []) as NutritionLog[];
    const todayCalories = todayNutrition.reduce(
      (sum, item) => sum + item.calories,
      0
    );

    // Fetch profile so we can calculate BMI / BMR / daily calories / streak.
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("age, height, weight, goal, gender, activity_level, workout_streak")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError && profileError.code !== "PGRST116") {
      console.error(profileError);
      setError(profileError.message);
      setLoading(false);
      return;
    }

    // Calculate weekly stats (Starting from this Monday).
    const now = new Date();
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Adjust to Monday
    const monday = new Date(now.setDate(now.getDate() + diff));
    monday.setHours(0, 0, 0, 0);
    const weekStartStr = monday.toISOString().slice(0, 10);

    const { data: weekWorkoutsData } = await supabase
      .from("workout_logs")
      .select("workout_date")
      .eq("user_id", user.id)
      .gte("workout_date", weekStartStr);

    const workoutsThisWeek = new Set(weekWorkoutsData?.map(w => w.workout_date)).size;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weekStartBoundary = sevenDaysAgo.toISOString().slice(0, 10);

    const { data: weekNutrition } = await supabase
      .from("nutrition_logs")
      .select("calories, protein, log_date")
      .eq("user_id", user.id)
      .gte("log_date", weekStartBoundary);

    // Calculate average daily calories and protein.
    const dailyCaloriesMap: Record<string, number> = {};
    const dailyProteinMap: Record<string, number> = {};
    (weekNutrition ?? []).forEach((log) => {
      const date = log.log_date;
      dailyCaloriesMap[date] = (dailyCaloriesMap[date] || 0) + log.calories;
      dailyProteinMap[date] = (dailyProteinMap[date] || 0) + log.protein;
    });

    const uniqueDays = Object.keys(dailyCaloriesMap).length || 1;
    const avgDailyCalories =
      Object.values(dailyCaloriesMap).reduce((a, b) => a + b, 0) / uniqueDays;
    const avgDailyProtein =
      Object.values(dailyProteinMap).reduce((a, b) => a + b, 0) / uniqueDays;

    // Calculate weight change (last 7 days vs 7 days before that).
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().slice(0, 10);

    const { data: recentWeight } = await supabase
      .from("body_weight_logs")
      .select("weight, log_date")
      .eq("user_id", user.id)
      .gte("log_date", fourteenDaysAgoStr)
      .order("log_date", { ascending: true })
      .limit(10);

    let weightChange: number | null = null;
    if (recentWeight && recentWeight.length >= 2) {
      const firstHalf = recentWeight
        .filter((w) => w.log_date < sevenDaysAgo.toISOString().slice(0, 10))
        .slice(-1)[0];
      const secondHalf = recentWeight
        .filter((w) => w.log_date >= sevenDaysAgo.toISOString().slice(0, 10))
        .slice(-1)[0];
      if (firstHalf && secondHalf) {
        weightChange = Math.round((secondHalf.weight - firstHalf.weight) * 10) / 10;
      }
    }

    let bmi: number | null = null;
    let bmr: number | null = null;
    let dailyCaloriesTarget: number | null = null;

    if (profileData) {
      const profile = profileData as Profile;
      const { age, height, weight, goal, gender, activity_level, workout_streak } =
        profile;

      if (height && weight) {
        bmi = calculateBMI(weight, height);
      }

      // We only calculate BMR when we have all required fields and
      // a clear gender value ("male" or "female").
      if (
        age &&
        height &&
        weight &&
        (gender === "male" || gender === "female")
      ) {
        bmr = calculateBMR(age, weight, height, gender);

        // If activity_level is set, use TDEE-based calculation (more accurate).
        if (bmr && activity_level && goal) {
          const tdee = calculateTDEE(bmr, activity_level as any);
          dailyCaloriesTarget = calculateDailyCaloriesFromTDEE(tdee, goal as any);
        } else if (bmr && goal) {
          // Fallback to simple goal-based adjustment if activity level missing
          dailyCaloriesTarget = bmr + (goal === "muscle_gain" ? 300 : goal === "fat_loss" ? -500 : 0);
        }

      }
    }

    const profile = profileData as Profile || {};
    const lastWorkoutDate = profile.last_workout_date;

    const validatedStreak = validateProfileStreak(
      profile.workout_streak ?? 0,
      lastWorkoutDate ?? null,
      !!todayWorkout,
      uniqueSessionDays
    );

    setData({
      todayWorkout,
      totalWorkouts: uniqueSessionDays,
      todayCalories,
      bmi,
      bmr,
      dailyCaloriesTarget,
      workoutsThisWeek,
      avgDailyCalories: Math.round(avgDailyCalories),
      avgDailyProtein: Math.round(avgDailyProtein),
      weightChange,
      workoutStreak: validatedStreak,
      todayFocus,
    });
    setLoading(false);
  }

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card title="Dashboard Overview">
        <p className="text-xs text-gray-500">Loading...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Dashboard Overview">
        <p className="text-xs text-red-500">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Today's Workout</p>
              <div className="mt-1 text-sm font-black text-gray-900 dark:text-white leading-tight">
                {data.todayFocus ? (
                  <span className="text-blue-600 dark:text-blue-400">{data.todayFocus}</span>
                ) : data.todayWorkout ? (
                  data.todayWorkout.exercise
                ) : (
                  <span className="text-gray-400 font-bold italic">Rest day?</span>
                )}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          {data.todayWorkout && (
            <p className="mt-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded inline-block">
              Last: {data.todayWorkout.exercise}
            </p>
          )}
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Today's Intake</p>
              <div className="mt-1 text-sm font-black text-gray-900 dark:text-white leading-tight">
                {Math.round(data.todayCalories)} <span className="text-[10px] font-normal uppercase opacity-60 ml-0.5">kcal</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Sessions</p>
              <div className="mt-1 text-sm font-black text-gray-900 dark:text-white leading-tight">
                {data.totalWorkouts}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
              <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Second row of cards for weekly stats. */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Workouts This Week</p>
              <div className="mt-1 text-sm font-black text-gray-900 dark:text-white">
                {data.workoutsThisWeek}
              </div>
            </div>
            <Activity className="h-5 w-5 text-blue-600 opacity-80" />
          </div>
        </Card>
        <Card className="shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Avg Daily Calories</p>
              <div className="mt-1 text-sm font-black text-gray-900 dark:text-white">
                {data.avgDailyCalories} <span className="text-[10px] font-normal opacity-60">kcal</span>
              </div>
            </div>
            <Flame className="h-5 w-5 text-orange-500 opacity-80" />
          </div>
        </Card>
        <Card className="shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Avg Daily Protein</p>
              <div className="mt-1 text-sm font-black text-gray-900 dark:text-white">
                {data.avgDailyProtein} <span className="text-[10px] font-normal opacity-60">g</span>
              </div>
            </div>
            <TrendingUp className="h-5 w-5 text-green-600 opacity-80" />
          </div>
        </Card>
        <Card className="shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Workout Streak</p>
              <div className="mt-1 text-sm font-black text-gray-900 dark:text-white">
                {data.workoutStreak !== null ? (
                  <span className="flex items-center gap-1">
                    🔥 {data.workoutStreak} {data.workoutStreak === 1 ? "day" : "days"}
                  </span>
                ) : (
                  <span className="text-gray-400 font-bold italic">Start logging!</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Third row of cards for body metrics. */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card title="BMI" className="shadow-sm">
          <p className="text-sm font-black text-gray-900 dark:text-white">
            {data.bmi !== null ? data.bmi : <span className="text-xs font-bold text-slate-400 italic">Add height & weight</span>}
          </p>
        </Card>
        <Card title="BMR" className="shadow-sm">
          <p className="text-sm font-black text-gray-900 dark:text-white">
            {data.bmr !== null ? `${data.bmr} kcal` : <span className="text-xs font-bold text-slate-400 italic">Add profile info</span>}
          </p>
        </Card>
        <Card title="Daily Calories Target" className="shadow-sm">
          <p className="text-sm font-black text-gray-900 dark:text-white">
            {data.dailyCaloriesTarget !== null
              ? `${data.dailyCaloriesTarget} kcal`
              : <span className="text-xs font-bold text-slate-400 italic">Set goal in profile</span>}
          </p>
        </Card>
        <Card title="Weight Change (2 weeks)" className="shadow-sm">
          <p className="text-sm font-black text-gray-900 dark:text-white">
            {data.weightChange !== null
              ? `${data.weightChange > 0 ? "+" : ""}${data.weightChange} kg`
              : <span className="text-xs font-bold text-slate-400 italic">Log weight to track</span>}
          </p>
        </Card>
      </div>
    </div>
  );
}



