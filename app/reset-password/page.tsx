"use client";

// app/reset-password/page.tsx
// Page to allow users to update their password after clicking a recovery link
// Uses Supabase Auth's updateUser function

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TopNav } from "@/components/ui/TopNav";
import { Card } from "@/components/ui/Card";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleReset(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            // update the current user's password
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
            });

            if (updateError) {
                console.error("Password update error:", updateError);
                setError(updateError.message || "Failed to update password. Please try again.");
            } else {
                setSuccess(true);
                // Automatically redirect to dashboard after a short delay
                setTimeout(() => {
                    router.push("/dashboard");
                }, 2000);
            }
        } catch (err: any) {
            console.error("Unexpected error during password reset:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
            <TopNav />
            <main className="mx-auto flex max-w-md items-center justify-center px-4 py-12">
                <Card className="w-full">
                    <div className="mb-8 text-center">
                        <h1 className="mb-2 text-3xl font-black text-slate-900 dark:text-white tracking-tight">Set New Password</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Choose a secure password to protect your account.
                        </p>
                    </div>

                    {success ? (
                        <div className="text-center py-4">
                            <div className="mb-4 text-4xl text-green-500">✅</div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2">Password Updated!</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Your password has been changed successfully. Redirecting you to your dashboard...
                            </p>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleReset} className="space-y-4 text-sm">
                                <div>
                                    <label className="mb-1.5 block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-sm pr-10"
                                            placeholder="Min. 6 characters"
                                            disabled={loading}
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

                                <div>
                                    <label className="mb-1.5 block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-sm pr-10"
                                            placeholder="Repeat password"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                                        <p className="text-xs text-red-700 dark:text-red-400 font-bold">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-full bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                                >
                                    {loading ? "Updating..." : "Set New Password"}
                                </button>
                            </form>
                        </>
                    )}
                </Card>
            </main>
        </div>
    );
}

