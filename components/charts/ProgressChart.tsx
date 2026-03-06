"use client";

// components/charts/ProgressChart.tsx
// This chart shows how the weight for a specific exercise changes over time.
// It queries the `workout_logs` table from Supabase and then uses Recharts
// to draw a simple line chart (date on the X-axis, weight on the Y-axis).

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";

interface ProgressChartProps {
  userId: string;
  exerciseName: string;
}

interface ChartPoint {
  // Short date string for the X-axis label (e.g. "2026-03-05").
  date: string;
  // Weight lifted on that day.
  weight: number;
}

export function ProgressChart({ userId, exerciseName }: ProgressChartProps) {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      // If we don't have a user or exercise selected yet, skip fetching.
      if (!userId || !exerciseName) {
        setData([]);
        return;
      }

      setLoading(true);
      setError(null);

      // We fetch all workout_logs rows for this user + exercise
      // and order them from oldest to newest using the created_at column.
      const { data, error } = await supabase
        .from("workout_logs")
        .select("created_at, weight, exercise")
        .eq("user_id", userId)
        .eq("exercise", exerciseName)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading progress data:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      const points: ChartPoint[] =
        data?.map((row) => {
          const date = new Date(row.created_at);
          const dateLabel = date.toISOString().slice(0, 10); // YYYY-MM-DD
          return {
            date: dateLabel,
            weight: row.weight,
          };
        }) ?? [];

      setData(points);
      setLoading(false);
    }

    fetchData();
  }, [userId, exerciseName]);

  return (
    <Card title="Exercise Progress">
      {!exerciseName ? (
        <p className="text-xs text-gray-500">
          Enter an exercise name to see your progress over time.
        </p>
      ) : loading ? (
        <p className="text-xs text-gray-500">Loading chart...</p>
      ) : error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : data.length === 0 ? (
        <p className="text-xs text-gray-500">
          No data yet for "{exerciseName}". Log a few workouts to see a chart.
        </p>
      ) : (
        <div className="h-64 w-full">
          {/* ResponsiveContainer makes the chart resize with its parent. */}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#4b5563", fontWeight: 600 }}
                stroke="#9ca3af"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#4b5563", fontWeight: 600 }}
                stroke="#9ca3af"
                label={{
                  value: "Weight (kg)",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 10,
                  fill: "#374151",
                  fontWeight: 700
                }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                itemStyle={{ color: '#1f2937', fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4, fill: '#2563eb', strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}


