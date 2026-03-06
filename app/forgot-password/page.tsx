"use client";

// app/forgot-password/page.tsx
// Forgot password page that allows users to reset their password via email
// Uses Supabase Auth's resetPasswordForEmail function

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TopNav } from "@/components/ui/TopNav";
import { Card } from "@/components/ui/Card";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      // Use Supabase's password reset function
      // This sends a password reset email to the user
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        }
      );


      if (resetError) {
        console.error("Password reset error:", resetError);
        setError(
          resetError.message ||
          "Failed to send password reset email. Please try again."
        );
      } else {
        // Success - show message even if email doesn't exist (for security)
        setMessage(
          "If an account exists with this email, you will receive a password reset link shortly. Please check your inbox."
        );
        setEmail(""); // Clear the email field

        // Redirect to login after a delay
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto flex max-w-md items-center justify-center px-4 py-12">
        <Card className="w-full">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-black text-slate-900 dark:text-white tracking-tight">Forgot Password?</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Don't worry, we'll help you get back in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-sm"
                placeholder="your.email@example.com"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-3">
                <p className="text-xs text-red-700 dark:text-red-400 font-bold">{error}</p>
              </div>
            )}

            {message && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 p-3">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">{message}</p>
                <p className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-500 animate-pulse">
                  Redirecting to login...
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 uppercase tracking-wider"
              >
                Back to Login
              </button>
            </div>
          </form>
        </Card>
      </main>

    </div>
  );
}

