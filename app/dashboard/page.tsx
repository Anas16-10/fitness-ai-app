"use client";

// app/dashboard/page.tsx
// Main dashboard shown after login. It displays:
// - high level stats (today's workout, calories, quick stats)
// - recent workout logs
// - today's nutrition summary

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TopNav } from "@/components/ui/TopNav";
import { DashboardStats } from "@/components/charts/DashboardStats";
import { WorkoutHistory } from "@/components/workout/WorkoutHistory";
import { NutritionSummary } from "@/components/nutrition/NutritionSummary";
import { AICoach } from "@/components/ai/AICoach";
import { WeeklyCaloriesChart } from "@/components/charts/WeeklyCaloriesChart";
import { WeeklyProteinChart } from "@/components/charts/WeeklyProteinChart";
import { WeightProgressChart } from "@/components/charts/WeightProgressChart";
import { WeightLogForm } from "@/components/progress/WeightLogForm";

export default function DashboardPage() {
  const router = useRouter();

  // Basic client-side auth guard: if there is no user, send to /login.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-6 text-3xl font-black text-slate-950 dark:text-white tracking-tight drop-shadow-sm">Dashboard</h1>

        <section className="mb-8">
          <DashboardStats />
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <WorkoutHistory limit={5} title="Today's Workouts" todayOnly={true} />
          <NutritionSummary />
        </div>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <WeeklyCaloriesChart />
          <WeeklyProteinChart />
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <WeightLogForm />
          <WeightProgressChart />
        </section>

        <section className="mt-8">
          <AICoach mode="weekly" />
        </section>
      </main>
    </div>
  );
}


