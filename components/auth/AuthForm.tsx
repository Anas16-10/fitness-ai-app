"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface AuthFormProps {
    initialView?: "login" | "signup";
    onSuccess?: (view: "login" | "signup") => void;
}

export function AuthForm({ initialView = "login", onSuccess }: AuthFormProps) {
    const [view, setView] = useState<"login" | "signup">(initialView);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    async function handleAuth(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            if (view === "login") {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
                onSuccess?.("login");
            } else {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });
                if (signUpError) throw signUpError;

                setSuccessMsg("Account created! Please check your email for a verification link.");
                // Switch to login view after successful signup
                setTimeout(() => {
                    setView("login");
                    setSuccessMsg(null);
                }, 5000);
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during authentication.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full">
            <div className="mb-8 text-center">
                <h1 className="mb-2 text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {view === "login" ? "Welcome back" : "Create Account"}
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {view === "login"
                        ? "Log in to continue your fitness journey."
                        : "Join us and start tracking your progress today."}
                </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                <div>
                    <label className="mb-1.5 block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-sm"
                        placeholder="name@example.com"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-sm pr-10"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-3">
                        <p className="text-xs text-red-700 dark:text-red-400 font-bold">{error}</p>
                    </div>
                )}

                {successMsg && (
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 p-3">
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">{successMsg}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Loader2 className="animate-spin" size={18} />
                    ) : (
                        view === "login" ? "Log In" : "Sign Up"
                    )}
                </button>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setView(view === "login" ? "signup" : "login");
                            setError(null);
                            setSuccessMsg(null);
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 uppercase tracking-wider"
                    >
                        {view === "login"
                            ? "Don't have an account? Sign up"
                            : "Already have an account? Log in"}
                    </button>
                </div>

                {view === "login" && (
                    <div className="text-center mt-2">
                        <button
                            type="button"
                            onClick={() => window.location.href = "/forgot-password"}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 uppercase tracking-widest"
                        >
                            Forgot your password?
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
