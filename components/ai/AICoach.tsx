"use client";

// components/ai/AICoach.tsx
// AI Coach component that provides three main features:
// 1. Generate Workout Plan - Creates personalized 7-day workout plans
// 2. Generate Diet Advice - Provides nutrition recommendations
// 3. Generate Weekly Report - Analyzes progress over the last 7 days
//
// All features call Next.js API routes which fetch data from Supabase
// and use the OpenAI API to generate AI responses.

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";

import { WorkoutPlanRenderer } from "./WorkoutPlanRenderer";
import { DietPlanRenderer } from "./DietPlanRenderer";
import { WeeklyReportRenderer } from "./WeeklyReportRenderer";

// ... existing code ...
type Tab = "workout" | "diet" | "weekly";

export interface AICoachProps {
  mode?: "all" | "workout" | "diet" | "weekly";
}

export function AICoach({ mode = "all" }: AICoachProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(mode === "all" ? "workout" : mode as Tab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [workoutPlan, setWorkoutPlan] = useState<any | null>(null);
  const [dietAdvice, setDietAdvice] = useState<any | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<any | null>(null);

  // Get the current user ID on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (authError) {
        console.error("[AICoach] Auth error:", authError);
        setError("Failed to authenticate. Please log in again.");
        return;
      }
      if (data.user) {
        setUserId(data.user.id);
      } else {
        setError("You must be logged in to use the AI coach.");
      }
    });
  }, []);

  /**
   * Generic function to call AI endpoints
   */
  async function callAIEndpoint(
    tab: Tab,
    url: string,
    setter: (value: any) => void
  ) {
    if (!userId) {
      setError("You must be logged in to use the AI coach.");
      return;
    }

    setActiveTab(tab);
    setLoading(true);
    setError(null);
    if (tab === "workout") setWorkoutPlan(null);
    if (tab === "diet") setDietAdvice(null);
    if (tab === "weekly") setWeeklyReport(null);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (parseError) {
        setError("Received invalid response from server.");
        setLoading(false);
        return;
      }

      if (!res.ok || !data.success) {
        setError(data.error || `HTTP ${res.status}: ${res.statusText}`);
        setLoading(false);
        return;
      }

      const content = data.data || data.planJson || null;

      if (!content) {
        setError("AI generated an empty response.");
        setLoading(false);
        return;
      }

      if (typeof content === "string") {
        try {
          setter(JSON.parse(content));
        } catch {
          setter(content);
        }
      } else {
        setter(content);
      }

      setError(null);
    } catch (err: any) {
      console.error(`[AICoach] Network error for ${tab}:`, err);
      setError(`Failed to contact AI service: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      className="w-full"
      title={`${mode === 'all' ? 'AI Coach' : mode === 'workout' ? 'AI Workout Generator' : mode === 'diet' ? 'AI Diet Advisor' : 'AI Weekly Progress'}`}
    >
      <p className="mb-4 text-xs font-medium text-slate-600 dark:text-slate-400">
        {mode === 'all'
          ? "Personalized training, nutrition, and progress insights."
          : `Customized AI analysis for your ${mode} journey.`}
      </p>

      {(mode === "all" || mode === activeTab) && (
        <div className="mb-5 flex flex-wrap gap-3">
          {(mode === "all" || mode === "workout") && (
            <button
              type="button"
              onClick={() => callAIEndpoint("workout", "/api/ai/generate-workout", setWorkoutPlan)}
              className={`rounded-full px-6 py-2.5 text-xs font-black shadow-md transition-all active:scale-95 ${activeTab === 'workout' ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'} disabled:opacity-60`}
              disabled={loading || !userId}
            >
              {loading && activeTab === "workout" ? "Analyzing Anatomy..." : "Generate Pro Plan"}
            </button>
          )}
          {(mode === "all" || mode === "diet") && (
            <button
              type="button"
              onClick={() => callAIEndpoint("diet", "/api/ai/diet", setDietAdvice)}
              className={`rounded-full px-6 py-2.5 text-xs font-black shadow-md transition-all active:scale-95 ${activeTab === 'diet' ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'} disabled:opacity-60`}
              disabled={loading || !userId}
            >
              {loading && activeTab === "diet" ? "Calculating Macros..." : "Get Diet Advice"}
            </button>
          )}
          {(mode === "all" || mode === "weekly") && new Date().getDay() === 0 && (
            <button
              type="button"
              onClick={() => callAIEndpoint("weekly", "/api/ai/weekly-report", setWeeklyReport)}
              className={`rounded-full px-6 py-2.5 text-xs font-black shadow-md transition-all active:scale-95 ${activeTab === 'weekly' ? 'bg-purple-700 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'} disabled:opacity-60`}
              disabled={loading || !userId}
            >
              {loading && activeTab === "weekly" ? "Crunching Stats..." : "Deep Weekly Analysis"}
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-700 dark:text-red-400 font-bold">{error}</p>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 min-h-[300px] shadow-inner">
        <div className="max-h-[600px] overflow-y-auto p-3 custom-scrollbar">
          {activeTab === "workout" && workoutPlan && <WorkoutPlanRenderer data={workoutPlan} />}
          {activeTab === "diet" && dietAdvice && <DietPlanRenderer data={dietAdvice} />}
          {activeTab === "weekly" && weeklyReport && <WeeklyReportRenderer data={weeklyReport} />}
        </div>

        {!workoutPlan && !dietAdvice && !weeklyReport && !loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-slate-800/20">
            <div className="h-12 w-12 text-slate-300 mb-3 grayscale opacity-30 select-none text-4xl">🤖</div>
            <p className="text-slate-400 dark:text-slate-500 font-black text-sm uppercase tracking-widest animate-pulse">Ready for analysis</p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 z-10 transition-all">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-blue-600 shadow-lg"></div>
            <p className="text-slate-900 dark:text-white font-black animate-pulse text-sm uppercase">Unleashing AI Intelligence...</p>
          </div>
        )}
      </div>
    </Card>
  );
}
