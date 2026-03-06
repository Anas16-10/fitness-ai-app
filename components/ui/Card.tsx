// components/ui/Card.tsx
// A very simple reusable card component to keep the UI consistent.

import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function Card({ title, className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 transition-colors ${className}`}
      {...rest}
    >

      {title && (
        <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">{title}</h2>
      )}
      {children}
    </div>
  );
}


