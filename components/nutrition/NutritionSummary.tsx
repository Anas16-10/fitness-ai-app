// components/nutrition/NutritionSummary.tsx
// Shows a summary of today's protein, carbs, fat, and calories.

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getLocalDateString } from "@/lib/date-utils";
import { Card } from "@/components/ui/Card";
import { NutritionLog } from "@/types/database";

interface Totals {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

export function NutritionSummary() {
  const [totals, setTotals] = useState<Totals>({
    protein: 0,
    carbs: 0,
    fat: 0,
    calories: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchToday() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("You must be logged in to see nutrition.");
      setLoading(false);
      return;
    }

    const { data, error: logsError } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", getLocalDateString());

    if (logsError) {
      console.error(logsError);
      setError(logsError.message);
      setLoading(false);
      return;
    }

    const list = (data ?? []) as NutritionLog[];
    const summed = list.reduce(
      (acc, item) => {
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
        acc.calories += item.calories;
        return acc;
      },
      { protein: 0, carbs: 0, fat: 0, calories: 0 }
    );

    setTotals(summed);
    setLoading(false);
  }

  useEffect(() => {
    fetchToday();
  }, []);

  return (
    <Card title="Today's Nutrition">
      {loading ? (
        <p className="text-xs text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : (
        <dl className="grid grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg bg-gray-50 dark:bg-slate-800/50 p-3 border border-gray-100 dark:border-slate-700">
            <dt className="font-bold text-gray-600 dark:text-slate-400 uppercase tracking-widest text-[10px]">Calories</dt>
            <dd className="mt-1 text-lg font-black text-gray-900 dark:text-white">{Math.round(totals.calories)} <span className="text-[10px] font-normal uppercase text-gray-500">kcal</span></dd>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-slate-800/50 p-3 border border-gray-100 dark:border-slate-700">
            <dt className="font-bold text-gray-600 dark:text-slate-400 uppercase tracking-widest text-[10px]">Protein</dt>
            <dd className="mt-1 text-lg font-black text-gray-900 dark:text-white">{Math.round(totals.protein)} <span className="text-[10px] font-normal uppercase text-gray-500">g</span></dd>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-slate-800/50 p-3 border border-gray-100 dark:border-slate-700">
            <dt className="font-bold text-gray-600 dark:text-slate-400 uppercase tracking-widest text-[10px]">Carbs</dt>
            <dd className="mt-1 text-lg font-black text-gray-900 dark:text-white">{Math.round(totals.carbs)} <span className="text-[10px] font-normal uppercase text-gray-500">g</span></dd>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-slate-800/50 p-3 border border-gray-100 dark:border-slate-700">
            <dt className="font-bold text-gray-600 dark:text-slate-400 uppercase tracking-widest text-[10px]">Fat</dt>
            <dd className="mt-1 text-lg font-black text-gray-900 dark:text-white">{Math.round(totals.fat)} <span className="text-[10px] font-normal uppercase text-gray-500">g</span></dd>
          </div>
        </dl>
      )}
    </Card>
  );
}


