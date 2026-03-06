"use client";

// app/profile/page.tsx
// Profile page where users can set age, height, weight, goal, and experience level.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TopNav } from "@/components/ui/TopNav";
import { Card } from "@/components/ui/Card";
import { getLocalDateString, validateProfileStreak } from "@/lib/date-utils";

type Goal = "muscle_gain" | "fat_loss" | "maintenance" | "";
type Experience = "beginner" | "intermediate" | "advanced" | "";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "";

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [goal, setGoal] = useState<Goal>("");
  const [experience, setExperience] = useState<Experience>("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [workoutStreak, setWorkoutStreak] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  // Redirect unauthenticated users to /login and load existing profile.
  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(profileError);
      } else if (data) {
        setName(data.name ?? "");
        setAge(data.age ?? "");
        setHeight(data.height ?? "");
        setWeight(data.weight ?? "");
        setGoal((data.goal ?? "") as Goal);
        setExperience((data.experience_level ?? "") as Experience);
        setActivityLevel((data.activity_level ?? "") as ActivityLevel);
        setGender((data.gender ?? "") as "male" | "female" | "other" | "");

        // Fetch workout logs to validate streak
        const todayStr = getLocalDateString();
        const { data: logs } = await supabase
          .from("workout_logs")
          .select("workout_date")
          .eq("user_id", user.id);

        const uniqueDays = new Set(logs?.map(l => l.workout_date).filter(Boolean)).size;
        const workedToday = logs?.some(l => l.workout_date === todayStr) ?? false;

        const validatedStreak = validateProfileStreak(
          data.workout_streak ?? 0,
          data.last_workout_date,
          workedToday,
          uniqueDays
        );

        setWorkoutStreak(validatedStreak);
        setHasProfile(true);
      } else {
        setIsEditing(true); // Default to edit mode if no profile exists
      }

      setInitialLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("You must be logged in to update your profile.");
      setLoading(false);
      return;
    }

    // Upsert means "insert or update if it already exists".
    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        name: name.trim() || null,
        age: age === "" ? null : Number(age),
        height: height === "" ? null : Number(height),
        weight: weight === "" ? null : Number(weight),
        goal: goal || null,
        experience_level: experience || null,
        activity_level: activityLevel || null,
        gender: gender || null,
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      console.error(upsertError);
      setError(upsertError.message);
    } else {
      setMessage("Profile saved!");
      setHasProfile(true);
      setIsEditing(false);
    }

    setLoading(false);
  }

  const goalLabels: Record<string, string> = {
    muscle_gain: "Muscle Gain",
    fat_loss: "Fat Loss",
    maintenance: "Maintenance",
  };

  const experienceLabels: Record<string, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };

  const activityLabels: Record<string, string> = {
    sedentary: "Sedentary",
    light: "Lightly Active",
    moderate: "Moderately Active",
    active: "Very Active",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
            Profile
          </h1>

          {hasProfile && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-full bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
            >
              Edit Profile
            </button>
          )}
        </div>

        <Card>
          {initialLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-sm font-medium text-gray-500">Loading your profile...</p>
            </div>
          ) : !isEditing && hasProfile ? (
            <div className="p-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {name ? name[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white">{name || "Unnamed User"}</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter text-xs">
                      {experienceLabels[experience] || "Level Not Set"} • {goalLabels[goal] || "Goal Not Set"}
                    </p>
                  </div>
                </div>


                <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-950/20 px-5 py-3 rounded-2xl border border-orange-100 dark:border-orange-900/40 shadow-sm self-start md:self-center">
                  <span className="text-3xl animate-pulse">🔥</span>
                  <div>
                    <p className="text-3xl font-black text-orange-600 dark:text-orange-500">{workoutStreak}</p>
                    <p className="text-[10px] font-black text-orange-800 dark:text-orange-400 uppercase tracking-widest mt-0.5">Day Workout Streak</p>
                  </div>
                </div>

              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-gray-50 dark:bg-slate-950 p-4 border border-gray-100 dark:border-slate-800/60 shadow-inner">
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Age</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{age || "--"} <span className="text-sm font-normal text-slate-500">years</span></p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-slate-950 p-4 border border-gray-100 dark:border-slate-800/60 shadow-inner">
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Height</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{height || "--"} <span className="text-sm font-normal text-slate-500">cm</span></p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-slate-950 p-4 border border-gray-100 dark:border-slate-800/60 shadow-inner">
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Weight</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{weight || "--"} <span className="text-sm font-normal text-slate-500">kg</span></p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-slate-950 p-4 border border-gray-100 dark:border-slate-800/60 shadow-inner">
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Gender</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white capitalize">{gender || "--"}</p>
                </div>
              </div>


              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">Current Goal</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 font-bold">
                      {goalLabels[goal] || "Set your fitness goal to get personalized plans."}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">Activity Level</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 font-bold">
                      {activityLabels[activityLevel] || "Set your activity level to calculate calorie needs."}
                    </p>
                  </div>
                </div>


                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-5 border border-amber-100 dark:border-amber-900/40">
                  <h3 className="text-sm font-black text-amber-900 dark:text-amber-400 mb-2 flex items-center gap-2">
                    <span>✨ Streak Tracker Info</span>
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-500/80 leading-relaxed font-bold">
                    Your workout streak is automatically maintained as you log exercises.
                    Make sure to log your workouts daily to keep the flame alive!
                  </p>
                </div>

              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 theme-form">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Edit Details</h2>
                {hasProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs font-black text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                )}
              </div>


              <div>
                <label className="mb-2 block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 shadow-sm"
                  placeholder="How should we call you?"
                />
              </div>


              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                    Age
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={age}
                    onChange={(e) =>
                      setAge(e.target.value ? Number(e.target.value) : "")
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 shadow-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={height}
                    onChange={(e) =>
                      setHeight(e.target.value ? Number(e.target.value) : "")
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 shadow-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={weight}
                    onChange={(e) =>
                      setWeight(e.target.value ? Number(e.target.value) : "")
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 shadow-sm"
                  />
                </div>
              </div>


              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                    Goal
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as Goal)}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 shadow-sm cursor-pointer"
                  >
                    <option value="">Select goal</option>
                    <option value="muscle_gain">Muscle gain</option>
                    <option value="fat_loss">Fat loss</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                    Experience level
                  </label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value as Experience)}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 shadow-sm cursor-pointer"
                  >
                    <option value="">Select level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>


              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                    Activity Level
                  </label>
                  <select
                    value={activityLevel}
                    onChange={(e) =>
                      setActivityLevel(e.target.value as ActivityLevel)
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 shadow-sm cursor-pointer"
                  >
                    <option value="">Select activity level</option>
                    <option value="sedentary">Sedentary (little/no exercise)</option>
                    <option value="light">Light (1-3 days/week)</option>
                    <option value="moderate">Moderate (3-5 days/week)</option>
                    <option value="active">Active (6-7 days/week)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) =>
                      setGender(e.target.value as "male" | "female" | "other" | "")
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 shadow-sm cursor-pointer"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>


              {error && (
                <div className="rounded-lg bg-red-50 p-3 border border-red-100">
                  <p className="text-xs font-bold text-red-600">{error}</p>
                </div>
              )}
              {message && (
                <div className="rounded-lg bg-green-50 p-3 border border-green-100">
                  <p className="text-xs font-bold text-green-700">{message}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-60"
                >
                  {loading ? "Saving Changes..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
}


