// components/charts/WeightProgressChart.tsx
// Displays a line chart showing body weight progression over time.

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { BodyWeightLog } from "@/types/database";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export function WeightProgressChart() {
  const [data, setData] = useState<{ date: string; weight: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeightLogs() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You must be logged in to see weight progress.");
        setLoading(false);
        return;
      }

      // Fetch last 30 days of weight logs.
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().slice(0, 10);

      const { data: logs, error: logsError } = await supabase
        .from("body_weight_logs")
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

      // Transform data for chart: convert log_date to readable format.
      const chartData = (logs ?? []).map((log: BodyWeightLog) => ({
        date: new Date(log.log_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        weight: log.weight,
      }));

      setData(chartData);
      setLoading(false);
    }

    fetchWeightLogs();
  }, []);

  if (loading) {
    return (
      <Card title="Weight Progress">
        <p className="text-xs text-gray-500">Loading...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Weight Progress">
        <p className="text-xs text-red-500">{error}</p>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card title="Weight Progress">
        <p className="text-xs text-gray-500">
          No weight logs yet. Log your weight to see progress.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Weight Progress (Last 30 Days)">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#2563eb' }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

