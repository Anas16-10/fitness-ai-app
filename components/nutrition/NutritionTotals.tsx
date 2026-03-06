// components/nutrition/NutritionTotals.tsx
// Displays daily totals for calories and macros, plus optional
// "calories remaining" if we know the user's target.

"use client";

import { Card } from "@/components/ui/Card";

interface NutritionTotalsProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targetCalories?: number | null;
  targetMacros?: {
    protein: number;
    carbs: number;
    fat: number;
  } | null;
}

export function NutritionTotals({
  calories,
  protein,
  carbs,
  fat,
  targetCalories,
  targetMacros,
}: NutritionTotalsProps) {
  const remaining =
    typeof targetCalories === "number"
      ? Math.round(targetCalories - calories)
      : null;

  return (
    <Card title="Daily Summary">
      <dl className="space-y-4">
        <div className="flex items-center justify-between group">
          <dt className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Calories</dt>
          <dd className="text-sm font-black text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {Math.round(calories)}{targetCalories ? ` / ${Math.round(targetCalories)}` : ""} <span className="text-[10px] font-normal uppercase opacity-60">kcal</span>
          </dd>
        </div>
        <div className="flex items-center justify-between group">
          <dt className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Protein</dt>
          <dd className="text-sm font-black text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {Math.round(protein)}{targetMacros ? ` / ${targetMacros.protein}` : ""} <span className="text-[10px] font-normal uppercase opacity-60">g</span>
          </dd>
        </div>
        <div className="flex items-center justify-between group">
          <dt className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Carbs</dt>
          <dd className="text-sm font-black text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {Math.round(carbs)}{targetMacros ? ` / ${targetMacros.carbs}` : ""} <span className="text-[10px] font-normal uppercase opacity-60">g</span>
          </dd>
        </div>
        <div className="flex items-center justify-between group">
          <dt className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Fat</dt>
          <dd className="text-sm font-black text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
            {Math.round(fat)}{targetMacros ? ` / ${targetMacros.fat}` : ""} <span className="text-[10px] font-normal uppercase opacity-60">g</span>
          </dd>
        </div>

        {targetCalories != null && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-4">
            <dt className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">Remaining</dt>
            <dd
              className={`text-base font-black ${remaining != null && remaining < 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
                }`}
            >
              {remaining != null ? `${remaining} kcal` : "-"}
            </dd>
          </div>
        )}
      </dl>
    </Card>
  );
}


