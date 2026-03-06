"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login immediately. The login page will handle the splash screen.
    router.push("/login");
  }, [router]);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      {/* Black screen while redirecting */}
    </main>
  );
}
