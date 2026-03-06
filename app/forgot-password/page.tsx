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
        <Card title="Reset Password" className="w-full">
          <p className="mb-4 text-xs text-gray-600">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-xs font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500"
                placeholder="your.email@example.com"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-2">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {message && (
              <div className="rounded-md bg-green-50 border border-green-200 p-2">
                <p className="text-xs text-green-700">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
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

