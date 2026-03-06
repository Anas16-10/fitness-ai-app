"use client";

// app/workout/page.tsx
// Workout page where users can log exercises and view their workout history.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TopNav } from "@/components/ui/TopNav";
import { WorkoutForm } from "@/components/workout/WorkoutForm";
import { WorkoutHistory } from "@/components/workout/WorkoutHistory";
import { ProgressChart } from "@/components/charts/ProgressChart";
import { DailyWorkoutViewer } from "@/components/workout/DailyWorkoutViewer";
import { FullWorkoutPlanViewer } from "@/components/workout/FullWorkoutPlanViewer";
import { Calendar } from "lucide-react";
import { AICoach } from "@/components/ai/AICoach";

export default function WorkoutPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [exerciseName, setExerciseName] = useState("");
  const [prefillExercise, setPrefillExercise] = useState<{ exercise: string, sets: number | "", reps: number | "" } | null>(null);
  const [showFullPlan, setShowFullPlan] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUserId(data.user.id);
    });
  }, [router]);

  const [uniqueExercises, setUniqueExercises] = useState<string[]>([]);

  useEffect(() => {
    async function fetchUniqueExercises() {
      if (!userId) return;
      const { data } = await supabase
        .from("workout_logs")
        .select("exercise")
        .eq("user_id", userId);

      if (data) {
        const unique = Array.from(new Set(data.map(d => d.exercise))).filter(Boolean);
        setUniqueExercises(unique.sort());
      }
    }
    fetchUniqueExercises();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
            Workout Tracking
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFullPlan(true)}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
            >
              <Calendar size={18} /> View Full Plan
            </button>
          </div>
        </div>

        {showFullPlan && (
          <FullWorkoutPlanViewer
            userId={userId}
            onClose={() => setShowFullPlan(false)}
          />
        )}

        {/* Top Section: Daily AI Plan & Log Form */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <DailyWorkoutViewer
            userId={userId}
            onSelectExercise={setPrefillExercise}
          />
          <WorkoutForm initialPrefill={prefillExercise} onSaved={() => setPrefillExercise(null)} />
        </div>

        {/* Middle Section: Recent Logs */}
        <div className="mb-8">
          <WorkoutHistory title="Today's Logs" todayOnly={true} />
        </div>

        {/* Bottom Section: Progress Charts */}
        <section className="mt-8 space-y-4">
          <div className="max-w-md">
            <label className="mb-2 block text-sm font-black text-slate-900 dark:text-slate-200">
              Exercise name for progress chart
            </label>
            <div className="relative">
              <input
                type="text"
                list="exercise-list"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="Select or type an exercise..."
                className="w-full rounded-lg border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-sm"
              />
              <datalist id="exercise-list">
                {uniqueExercises.map((ex) => (
                  <option key={ex} value={ex} />
                ))}
              </datalist>
            </div>
          </div>
          {userId && (
            <div className="rounded-xl overflow-hidden shadow-xl border border-gray-100 dark:border-slate-800">
              <ProgressChart userId={userId} exerciseName={exerciseName} />
            </div>
          )}
        </section>

        {/* AI Coach at the very bottom */}
        <section className="mt-12">
          <AICoach mode="workout" />
        </section>
      </main>
    </div>
  );
}


