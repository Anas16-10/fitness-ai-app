import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Load the default Next.js Geist fonts.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Basic metadata for the whole app.
export const metadata: Metadata = {
  title: "Fitness Tracker",
  description: "A simple fitness tracking app built with Next.js and Supabase.",
};

// Root layout wraps every page in the app.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300`}
      >
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}

