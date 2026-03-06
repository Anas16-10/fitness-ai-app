"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { X, Edit2, Check, Plus, Trash2 } from "lucide-react";

interface FullWorkoutPlanViewerProps {
    userId: string | null;
    onClose: () => void;
}

export function FullWorkoutPlanViewer({ userId, onClose }: FullWorkoutPlanViewerProps) {
    const [loading, setLoading] = useState(true);
    const [planId, setPlanId] = useState<string | null>(null);
    const [weekPlan, setWeekPlan] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        async function fetchPlan() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("workout_plans")
                    .select("id, plan_json")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (error || !data) {
                    console.error("No plan found");
                    return;
                }

                setPlanId(data.id);
                setWeekPlan(data.plan_json?.week_plan || []);
            } catch (err) {
                console.error("Failed to load plan", err);
            } finally {
                setLoading(false);
            }
        }

        fetchPlan();
    }, [userId]);

    async function handleSave() {
        if (!planId || !userId) return;
        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from("workout_plans")
                .update({ plan_json: { week_plan: weekPlan } })
                .eq("id", planId);

            if (error) throw error;
            setMessage("Plan updated successfully!");
            setIsEditing(false);
        } catch (err: any) {
            console.error(err);
            setMessage("Error: " + err.message);
        } finally {
            setSaving(false);
        }
    }

    const updateExercise = (dayIdx: number, exIdx: number, field: string, value: any) => {
        const newPlan = [...weekPlan];
        newPlan[dayIdx].exercises[exIdx] = { ...newPlan[dayIdx].exercises[exIdx], [field]: value };
        setWeekPlan(newPlan);
    };

    const addExercise = (dayIdx: number) => {
        const newPlan = [...weekPlan];
        if (!newPlan[dayIdx].exercises) newPlan[dayIdx].exercises = [];
        newPlan[dayIdx].exercises.push({ exercise: "New Exercise", sets: 3, reps: 10, notes: "" });
        setWeekPlan(newPlan);
    };

    const removeExercise = (dayIdx: number, exIdx: number) => {
        const newPlan = [...weekPlan];
        newPlan[dayIdx].exercises.splice(exIdx, 1);
        setWeekPlan(newPlan);
    };

    const updateFocus = (dayIdx: number, value: string) => {
        const newPlan = [...weekPlan];
        newPlan[dayIdx].focus = value;
        setWeekPlan(newPlan);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4"></div>
                    <p className="text-sm font-bold text-gray-700">Loading your full plan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md p-4 md:p-8">
            <div className="mx-auto max-w-4xl bg-gray-50 rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                {/* Header */}
                <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Weekly Workout Plan</h2>
                        <p className="text-xs font-medium text-gray-500">View and manage your current AI-generated cycle</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                                <Edit2 size={14} /> Edit
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : <><Check size={14} /> Save Changes</>}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {message && (
                        <div className={`mb-6 p-3 rounded-xl text-xs font-bold border ${message.includes("Error") ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
                            {message}
                        </div>
                    )}

                    <div className="grid gap-6">
                        {weekPlan.map((day, dIdx) => (
                            <div key={dIdx} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900">{day.day}</h3>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={day.focus}
                                                onChange={(e) => updateFocus(dIdx, e.target.value)}
                                                className="mt-1 text-xs font-bold text-blue-600 border-b border-blue-200 bg-transparent outline-none focus:border-blue-500 w-full"
                                            />
                                        ) : (
                                            <p className="text-xs font-bold text-blue-600">{day.focus || "Rest Day"}</p>
                                        )}
                                    </div>
                                    {isEditing && (
                                        <button
                                            onClick={() => addExercise(dIdx)}
                                            className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-blue-600 transition-colors"
                                        >
                                            <Plus size={12} /> Add Exercise
                                        </button>
                                    )}
                                </div>

                                {day.exercises && day.exercises.length > 0 ? (
                                    <div className="space-y-3">
                                        {day.exercises.map((ex: any, eIdx: number) => (
                                            <div key={eIdx} className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100/50 hover:border-blue-100 transition-colors group/ex">
                                                <div className="flex-1">
                                                    {isEditing ? (
                                                        <div className="grid gap-2">
                                                            <input
                                                                type="text"
                                                                value={ex.exercise}
                                                                onChange={(e) => updateExercise(dIdx, eIdx, "exercise", e.target.value)}
                                                                className="text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200 outline-none focus:border-blue-500"
                                                            />
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Sets</label>
                                                                    <input
                                                                        type="number"
                                                                        value={ex.sets}
                                                                        onChange={(e) => updateExercise(dIdx, eIdx, "sets", Number(e.target.value))}
                                                                        className="w-full text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded border border-gray-200 outline-none focus:border-blue-500"
                                                                    />
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Reps</label>
                                                                    <input
                                                                        type="text"
                                                                        value={ex.reps}
                                                                        onChange={(e) => updateExercise(dIdx, eIdx, "reps", e.target.value)}
                                                                        className="w-full text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded border border-gray-200 outline-none focus:border-blue-500"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <h4 className="text-sm font-bold text-gray-900 mb-0.5">{ex.exercise}</h4>
                                                            <p className="text-[10px] font-medium text-gray-500">
                                                                {ex.sets} sets • {ex.reps} reps
                                                            </p>
                                                            {ex.notes && <p className="text-[9px] text-gray-400 italic mt-1 leading-relaxed">Note: {ex.notes}</p>}
                                                        </>
                                                    )}
                                                </div>
                                                {isEditing && (
                                                    <button
                                                        onClick={() => removeExercise(dIdx, eIdx)}
                                                        className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all self-center"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-4 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                                        <p className="text-xs font-bold text-gray-300 italic">No exercises scheduled for this day.</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-white p-6 border-t border-gray-100">
                    <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        End of Current cycle • Created via Fitness AI Assistant
                    </p>
                </div>
            </div>
        </div>
    );
}
