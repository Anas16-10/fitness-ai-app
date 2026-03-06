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
      // For now we simply log the error. You could also show a toast or message.
      console.error("Logout failed", error);
    }
  }

  return (
    <header className="border-b border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-800 transition-colors">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-base font-bold text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
          Fitness Tracker
        </Link>
        <div className="flex items-center gap-4">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm tracking-wide transition-colors ${isActive ? "font-bold text-blue-600" : "font-medium text-gray-700 dark:text-slate-300"
                  } hover:text-blue-600`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-gray-300 dark:border-slate-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
}


