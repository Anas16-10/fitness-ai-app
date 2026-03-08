// components/charts/WeeklyProteinChart.tsx
// Displays a bar chart showing daily protein intake for the last 7 days.

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { NutritionLog } from "@/types/database";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyCaloriesFromTDEE,
  calculateMacroTargets,
} from "@/lib/fitness";

export function WeeklyProteinChart() {
  const [data, setData] = useState<{ date: string; protein: number }[]>([]);
  const [targetProtein, setTargetProtein] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeeklyNutrition() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You must be logged in to see weekly protein.");
        setLoading(false);
        return;
      }

      // Get last 7 days.
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const startDate = sevenDaysAgo.toISOString().slice(0, 10);

      const { data: logs, error: logsError } = await supabase
        .from("nutrition_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("log_date", startDate)
        .order("log_date", { ascending: true });

      if (logsError) {
        console.error(logsError);
        setError(logsError.message);
        setLoading(false);
        return;
      }

      // Fetch Profile for Targets
      const { data: profileData } = await supabase
        .from("profiles")
        .select("age, height, weight, gender, goal, activity_level")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData && profileData.age && profileData.weight && profileData.height && profileData.gender && profileData.activity_level && profileData.goal) {
        const bmr = calculateBMR(profileData.age, profileData.weight, profileData.height, profileData.gender as any);
        if (bmr) {
          const tdee = calculateTDEE(bmr, profileData.activity_level as any);
          const targetCalories = calculateDailyCaloriesFromTDEE(tdee, profileData.goal as any);
          const macros = calculateMacroTargets(targetCalories);
          setTargetProtein(macros.protein);
        }
      }

      // Group by date and sum protein.
      const dailyTotals: Record<string, number> = {};
      (logs ?? []).forEach((log: NutritionLog) => {
        const date = log.log_date;
        dailyTotals[date] = (dailyTotals[date] || 0) + log.protein;
      });

      // Convert to array format for chart.
      const chartData = Object.entries(dailyTotals)
        .map(([date, protein]) => ({
          date: new Date(date).toLocaleDateString("en-US", {
            weekday: "short",
          }),
          protein: Math.round(protein),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setData(chartData);
      setLoading(false);
    }

    fetchWeeklyNutrition();
  }, []);

  if (loading) {
    return (
      <Card title="Weekly Protein">
        <p className="text-xs text-gray-500">Loading...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Weekly Protein">
        <p className="text-xs text-red-500">{error}</p>
      </Card>
    );
  }

  return (
    <Card title="Weekly Protein (Last 7 Days)">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-slate-800" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fontWeight: 700, fill: "currentColor" }}
              className="text-gray-400 dark:text-slate-500"
              angle={-45}
              textAnchor="end"
              height={60}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fontWeight: 700, fill: "currentColor" }}
              className="text-gray-400 dark:text-slate-500"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#10b981' }}
            />
            {targetProtein && (
              <ReferenceLine y={targetProtein} stroke="#334155" strokeDasharray="4 4" strokeWidth={2} label={{ position: 'top', value: `Goal: ${targetProtein}g`, fill: '#334155', fontSize: 11, fontWeight: '900' }} />
            )}
            <Bar dataKey="protein" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

