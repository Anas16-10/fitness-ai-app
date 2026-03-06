"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDanger?: boolean;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = "Delete",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    isDanger = true,
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left shadow-2xl transition-all border border-gray-100 dark:border-slate-800">
                <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isDanger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                        <AlertTriangle className={`h-5 w-5 ${isDanger ? 'text-red-500' : 'text-blue-500'}`} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                            {title}
                        </h3>
                        <p className="mt-2 text-sm font-bold text-gray-500 dark:text-slate-400 leading-relaxed">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
                    <button
                        onClick={onConfirm}
                        className={`w-full rounded-xl px-5 py-3 text-sm font-black text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${isDanger
                                ? 'bg-red-600 shadow-red-200 dark:shadow-none hover:bg-red-700'
                                : 'bg-blue-600 shadow-blue-200 dark:shadow-none hover:bg-blue-700'
                            }`}
                    >
                        {confirmLabel}
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3 text-sm font-black text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold"
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
