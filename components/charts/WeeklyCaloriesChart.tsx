// components/charts/WeeklyCaloriesChart.tsx
// Displays a bar chart showing daily calorie intake for the last 7 days.

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
} from "recharts";

export function WeeklyCaloriesChart() {
  const [data, setData] = useState<{ date: string; calories: number }[]>([]);
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
        setError("You must be logged in to see weekly calories.");
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

      // Group by date and sum calories.
      const dailyTotals: Record<string, number> = {};
      (logs ?? []).forEach((log: NutritionLog) => {
        const date = log.log_date;
        dailyTotals[date] = (dailyTotals[date] || 0) + log.calories;
      });

      // Convert to array format for chart.
      const chartData = Object.entries(dailyTotals)
        .map(([date, calories]) => ({
          date: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          calories: Math.round(calories),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setData(chartData);
      setLoading(false);
    }

    fetchWeeklyNutrition();
  }, []);

  if (loading) {
    return (
      <Card title="Weekly Calories">
        <p className="text-xs text-gray-500">Loading...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Weekly Calories">
        <p className="text-xs text-red-500">{error}</p>
      </Card>
    );
  }

  return (
    <Card title="Weekly Calories (Last 7 Days)">
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
              itemStyle={{ color: '#f97316' }}
            />
            <Bar dataKey="calories" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

