"use client";

import React, { useEffect, useState } from "react";

export function SplashScreen() {
    const [isVisible, setIsVisible] = useState(true);

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ${isVisible ? "opacity-100" : "opacity-0"
                }`}
        >
            {/* Animated Smoke/Gradient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] animate-blob"></div>
            </div>

            <div className="relative flex flex-col items-center text-center">
                {/* Main Title with Premium Typography */}
                <h1 className="mb-4 text-7xl font-black tracking-tighter text-white sm:text-8xl animate-title-reveal">
                    FITNESS <span className="text-blue-600">AI</span>
                </h1>

                {/* Sleek Tagline */}
                <div className="h-0.5 w-12 bg-blue-600 mb-6 animate-width-grow"></div>

                <p className="max-w-xs text-sm font-bold uppercase tracking-[0.3em] text-slate-400 animate-fade-in-up">
                    Elevate Your Performance
                </p>
            </div>

            <style jsx global>{`
        @keyframes title-reveal {
          0% {
            opacity: 0;
            filter: blur(10px);
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: scale(1);
          }
        }

        @keyframes width-grow {
          0% { width: 0; opacity: 0; }
          100% { width: 48px; opacity: 1; }
        }

        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        .animate-title-reveal {
          animation: title-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-width-grow {
          animation: width-grow 1s ease-out 0.8s forwards;
          opacity: 0;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out 1.2s forwards;
          opacity: 0;
        }

        .animate-blob {
          animation: blob 7s infinite alternate;
        }
      `}</style>
        </div>
    );
}
