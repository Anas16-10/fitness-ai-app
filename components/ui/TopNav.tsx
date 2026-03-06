// components/ui/TopNav.tsx
// Simple top navigation bar shown on the main app pages.

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/workout", label: "Workout" },
  { href: "/nutrition", label: "Nutrition" },
  { href: "/profile", label: "Profile" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md dark:border-slate-800 transition-colors">
      <nav className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-lg font-black text-slate-900 dark:text-white hover:text-blue-600 transition-colors tracking-tighter">
              FITNESS TRACKER
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="sm:hidden rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest shadow-sm active:scale-95 transition-all"
            >
              Logout
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto sm:overflow-visible no-scrollbar pb-1 sm:pb-0">
            {links.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:block rounded-full border border-gray-300 dark:border-slate-700 px-4 py-1.5 text-xs font-black text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}



