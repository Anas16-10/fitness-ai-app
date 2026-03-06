"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { WorkoutLog } from "@/types/database";
import { getLocalDateString } from "@/lib/date-utils";
import { formatDate, formatTime } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";


interface WorkoutHistoryProps {
  limit?: number;
  title?: string;
  onDeleted?: () => void;
  todayOnly?: boolean;
}

export function WorkoutHistory({
  limit = 20,
  title = "Workout History",
  onDeleted,
  todayOnly = false,
}: WorkoutHistoryProps) {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);


  async function fetchLogs() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("You must be logged in to see your workouts.");
      setLoading(false);
      return;
    }

    const { data, error: logsError } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (logsError) {
      console.error(logsError);
      setError(logsError.message);
    } else {
      let fetchedLogs = (data ?? []) as WorkoutLog[];
      if (todayOnly) {
        const todayStr = getLocalDateString();
        fetchedLogs = fetchedLogs.filter(log => (log.workout_date || log.created_at?.slice(0, 10)) === todayStr);
      }
      setLogs(fetchedLogs);
    }


    setLoading(false);
  }

  async function handleDelete(id: string) {
    setLogToDelete(id);
    setIsModalOpen(true);
  }

  async function confirmDelete() {
    if (!logToDelete) return;

    const { error: deleteError } = await supabase
      .from("workout_logs")
      .delete()
      .eq("id", logToDelete);

    if (deleteError) {
      alert("Failed to delete log: " + deleteError.message);
    } else {
      setLogs((prev) => prev.filter((log) => log.id !== logToDelete));
      if (onDeleted) onDeleted();
    }

    setIsModalOpen(false);
    setLogToDelete(null);
  }


  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <Card title={title}>
      {loading ? (
        <p className="text-xs text-gray-500 italic">Loading logs...</p>
      ) : error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : logs.length === 0 ? (
        <p className="text-xs text-gray-500">No records found. Start your journey!</p>
      ) : (
        <ul className="space-y-3">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 shadow-sm transition-all hover:border-blue-100 dark:hover:border-blue-900 hover:shadow-md"
            >
              <div className="flex-1">
                <p className="text-sm font-black text-gray-900 dark:text-white leading-tight underline decoration-blue-500/30 decoration-2 underline-offset-2">{log.exercise}</p>
                <p className="mt-1 text-[11px] font-bold text-gray-700 dark:text-slate-300">
                  {log.sets} sets × {log.reps} reps @ {log.weight} kg
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-tighter">
                  <span>{formatDate(log.created_at)}</span>
                  <span className="text-gray-300 dark:text-slate-700">•</span>
                  <span>{formatTime(log.created_at)}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(log.id)}
                className="ml-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                title="Delete log"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        title="Delete Workout Log?"
        message="Are you sure you want to remove this entry? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsModalOpen(false);
          setLogToDelete(null);
        }}
      />
    </Card>

  );
}


