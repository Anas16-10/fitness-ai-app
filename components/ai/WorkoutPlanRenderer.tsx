import React from 'react';

// Using consistent standard AIResponse JSON shape from our helpers
type WorkoutExercise = {
    exercise: string;
    sets: number;
    reps: number | string;
    rest: string;
    notes?: string;
};

type WorkoutDay = {
    day: string;
    focus: string;
    exercises: WorkoutExercise[];
};

type WorkoutPlanJSON = {
    week_plan: WorkoutDay[];
    summary: string;
};

interface Props {
    data: WorkoutPlanJSON;
}

export function WorkoutPlanRenderer({ data }: Props) {
    if (!data?.week_plan || data.week_plan.length === 0) {
        return <p className="text-gray-500">No workout plan found.</p>;
    }

    return (
        <div className="space-y-6">
            {data.summary && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                    <p className="text-blue-800 text-sm font-medium">{data.summary}</p>
                </div>
            )}

            <div className="flex flex-row overflow-x-auto gap-6 pb-8 snap-x snap-mandatory custom-scrollbar">
                {data.week_plan.map((dayPlan, index) => (
                    <div
                        key={index}
                        className="flex-shrink-0 w-[300px] sm:w-[350px] snap-center border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm"
                    >
                        <div className="bg-slate-50 dark:bg-slate-900 px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-black text-slate-900 dark:text-white tracking-tight">{dayPlan.day}</h3>
                            <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                {dayPlan.focus || "Rest Day"}
                            </span>
                        </div>

                        {dayPlan.exercises && dayPlan.exercises.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {dayPlan.exercises.map((exercise, idx) => (
                                    <div key={idx} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex flex-col gap-4">
                                        <div>
                                            <h4 className="font-black text-slate-900 dark:text-slate-100 text-base leading-tight">
                                                {exercise.exercise}
                                            </h4>
                                            {exercise.notes && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed italic">
                                                    {exercise.notes}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                            <div className="text-center border-r border-slate-200 dark:border-slate-800 last:border-0">
                                                <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Sets</span>
                                                <span className="text-sm font-black text-slate-800 dark:text-blue-400">{exercise.sets}</span>
                                            </div>
                                            <div className="text-center border-r border-slate-200 dark:border-slate-800 last:border-0">
                                                <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Reps</span>
                                                <span className="text-sm font-black text-slate-800 dark:text-blue-400">{exercise.reps}</span>
                                            </div>
                                            <div className="text-center last:border-0">
                                                <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Rest</span>
                                                <span className="text-sm font-black text-slate-800 dark:text-emerald-400">{exercise.rest || "--"}</span>
                                            </div>
                                        </div>
                                    </div>

                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <span className="text-4xl mb-4 block opacity-20">🧘</span>
                                <p className="text-sm font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Active Recovery</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
