"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { SplashScreen } from "@/components/ui/SplashScreen";

export default function LoginPage() {
  const router = useRouter();
  const [isSplashing, setIsSplashing] = useState(true);

  // Handle splash screen timeout
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setIsSplashing(false);
    }, 3000);

    return () => clearTimeout(splashTimer);
  }, []);

  // When the auth state changes and we have a session, redirect to dashboard.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.push("/dashboard");
      }
    });

    // Also check once on mount in case the user is already logged in.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push("/dashboard");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 bg-gray-50 dark:bg-slate-950 transition-colors duration-500">
      {isSplashing && <SplashScreen />}

      <div className={`w-full max-w-md rounded-xl bg-white dark:bg-slate-900 p-8 shadow-2xl border border-gray-100 dark:border-slate-800 transition-all duration-1000 ${isSplashing ? "opacity-0 scale-95 blur-sm" : "opacity-100 scale-100 blur-0"
        }`}>
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome back</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Log in to continue your fitness journey.
          </p>
        </div>

        {/* Supabase Auth component handles sign up, login, and password flows. */}
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb', // blue-600
                  brandAccent: '#1d4ed8', // blue-700
                  inputText: 'currentColor',
                }
              }
            }
          }}
          providers={[]}
          redirectTo={typeof window !== "undefined" ? window.location.origin : undefined}
          view="sign_in"
        />
      </div>
    </main>
  );
}



