"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";

interface DailyWorkoutViewerProps {
    userId: string | null;
    onSelectExercise: (exercise: any) => void;
}

export function DailyWorkoutViewer({ userId, onSelectExercise }: DailyWorkoutViewerProps) {
    const [loading, setLoading] = useState(true);
    const [todaysPlan, setTodaysPlan] = useState<any | null>(null);

    useEffect(() => {
        if (!userId) return;

        async function fetchLatestPlan() {
            setLoading(true);
            try {
                // 1. Fetch AI Plan
                const { data: planData, error: planError } = await supabase
                    .from("workout_plans")
                    .select("plan_json, created_at")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (planError || !planData || !planData.plan_json?.week_plan) {
                    setTodaysPlan(null);
                    return;
                }

                // 2. Fetch Today's Logs to filter out exercises already completed
                const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local
                const { data: logsData, error: logsError } = await supabase
                    .from("workout_logs")
                    .select("exercise")
                    .eq("user_id", userId)
                    .gte("created_at", `${todayStr}T00:00:00.000Z`)
                    .lte("created_at", `${todayStr}T23:59:59.999Z`);

                const loggedExercises = new Set(
                    (logsData || []).map(log => log.exercise.toLowerCase())
                );

                const dayOfWeek = (new Date().getDay() + 6) % 7;
                let planForToday = planData.plan_json.week_plan[dayOfWeek] || planData.plan_json.week_plan[0];

                if (planForToday && planForToday.exercises) {
                    planForToday = {
                        ...planForToday,
                        exercises: planForToday.exercises.filter(
                            (ex: any) => !loggedExercises.has(ex.exercise.toLowerCase())
                        )
                    };
                }

                setTodaysPlan(planForToday);

            } catch (err) {
                console.error("Failed to load today's plan", err);
            } finally {
                setLoading(false);
            }
        }

        fetchLatestPlan();
    }, [userId]);

    if (loading) {
        return (
            <Card title="Today's AI Plan">
                <p className="text-xs text-gray-500 animate-pulse">Loading today's schedule...</p>
            </Card>
        );
    }

    if (!todaysPlan) {
        return (
            <Card title="Today's AI Plan">
                <p className="text-xs text-gray-500 mb-3">No active AI workout plan found.</p>
                <p className="text-xs text-gray-400">Head to the Dashboard and generate a new plan from the AI Coach to see your daily schedule here.</p>
            </Card>
        );
    }

    return (
        <Card title={`Today's Plan: ${todaysPlan.day}`}>
            <div className="mb-4 flex items-center gap-2">
                <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md uppercase tracking-wider shadow-sm border border-blue-200 dark:border-blue-800">
                    Focus: {todaysPlan.focus || "Rest Day"}
                </span>
            </div>

            {todaysPlan.exercises && todaysPlan.exercises.length > 0 ? (
                <ul className="space-y-2">
                    {todaysPlan.exercises.map((exercise: any, idx: number) => (
                        <li
                            key={idx}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/30 hover:border-blue-300 dark:hover:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer shadow-sm hover:shadow-md"
                            onClick={() => onSelectExercise(exercise)}
                        >
                            <div className="flex-1">
                                <p className="text-sm font-black text-gray-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 leading-tight">{exercise.exercise}</p>
                                {exercise.notes && <p className="text-[10px] font-medium text-gray-500 dark:text-slate-400 mt-1 italic">{exercise.notes}</p>}
                            </div>
                            <div className="flex gap-2 text-[10px] text-gray-600 dark:text-slate-300 mt-2 sm:mt-0 font-black uppercase tracking-tight">
                                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded bg-opacity-70 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 border border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-800">{exercise.sets} sets</span>
                                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded bg-opacity-70 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 border border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-800">{exercise.reps} reps</span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-600 font-medium">Enjoy your Rest Day! 🧘‍♂️</p>
                </div>
            )}

            {todaysPlan.exercises && todaysPlan.exercises.length > 0 && (
                <p className="text-[10px] text-gray-400 mt-3 text-center">Click an exercise above to quickly log it.</p>
            )}
        </Card>
    );
}
