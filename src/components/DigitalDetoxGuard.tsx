"use client";

import { Moon, Sun, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { getSleepState, logSleepEvent, type SleepState } from "@/app/actions";

export default function DigitalDetoxGuard({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<SleepState | null>(null);
    const [timer, setTimer] = useState<number>(0);

    useEffect(() => {
        // Initial check
        getSleepState().then((s) => {
            setState(s);
            if (s.mode === "morning_lock" && s.remainingMs) {
                setTimer(s.remainingMs);
            }
        });

        // Polling only if in a non-active state or close to transitions
        const interval = setInterval(() => {
            getSleepState().then((s) => {
                setState(s);
                if (s.mode === "morning_lock" && s.remainingMs) {
                    setTimer(s.remainingMs);
                }
            });
        }, 5000); // Check every 5s

        return () => clearInterval(interval);
    }, []);

    // Countdown effect for Morning Lock
    useEffect(() => {
        if (state?.mode === "morning_lock" && timer > 0) {
            const countdown = setInterval(() => {
                setTimer((prev) => Math.max(0, prev - 1000));
            }, 1000);
            return () => clearInterval(countdown);
        }
    }, [state?.mode, timer]);

    const handleWakeUp = async () => {
        await logSleepEvent("wake_up");
        const newState = await getSleepState();
        setState(newState);
        if (newState.remainingMs) setTimer(newState.remainingMs);
    };

    const handleUnlock = async () => {
        await logSleepEvent("morning_lock_end");
        setState({ mode: "active" });
    };

    // Loading state
    if (!state) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground animate-pulse">Loading...</div>;

    // 1. SLEEP MODE OVERLAY (Ghibli Style)
    if (state.mode === "sleep") {
        return (
            <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#064e3b] flex flex-col items-center justify-center p-6 animate-in fade-in duration-1000 bg-noise overflow-hidden">
                <div className="z-content flex flex-col items-center">
                    <div className="relative mb-8">
                        <Moon size={56} className="text-[#a5b4fc] drop-shadow-[0_0_20px_rgba(165,180,252,0.4)]" />
                        <div className="absolute -top-2 -right-4 animate-pulse duration-[3000ms]">
                            {/* Tiny pulsing star */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" className="opacity-80">
                                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-3xl font-serif font-medium text-[#e2e8f0] mb-6 tracking-widest uppercase opacity-90 drop-shadow-lg">
                        Sleep Mode
                    </h1>

                    <p className="text-[#cbd5e1] mb-16 text-center max-w-xs leading-loose font-serif italic text-lg opacity-80 backdrop-blur-sm">
                        The world is quiet. <br />
                        Drift into the calm.
                    </p>

                    {/* EMERGENCY BYPASS - FORCE UNLOCK */}
                    <button
                        onClick={handleUnlock}
                        className="w-full max-w-sm mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 text-lg z-50 relative"
                    >
                        <Lock size={24} />
                        Bypass for Testing
                    </button>

                    <button
                        onClick={handleWakeUp}
                        className="group flex flex-col items-center gap-3 text-[#94a3b8] hover:text-[#e2e8f0] transition-all duration-500 mt-12"
                    >
                        <Sun size={28} className="group-hover:rotate-45 transition-transform duration-700" />
                        <span className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-60 group-hover:opacity-100">I'm Awake</span>
                    </button>
                </div>
            </div>
        );
    }

    // 2. MORNING LOCK OVERLAY
    if (state.mode === "morning_lock") {
        const totalSeconds = Math.floor(timer / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

        return (
            <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#0f172a] to-[#064e3b] flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-700 bg-noise">
                <div className="z-content flex flex-col items-center">
                    <Lock size={32} className="text-[#64748b] mb-8 opacity-50" />

                    <h2 className="text-7xl font-serif font-bold text-[#f1f5f9] tracking-tighter mb-8 drop-shadow-2xl font-numeric">
                        {formatted}
                    </h2>

                    <div className="text-center max-w-sm mb-16 space-y-4">
                        <p className="text-[#e2e8f0] text-xl font-serif leading-relaxed">
                            Your day starts in 30 minutes.
                        </p>
                        <p className="text-[#94a3b8] text-sm italic font-serif tracking-wide opacity-70">
                            "Use this time for yourself,<br />not for your screen."
                        </p>
                    </div>

                    {timer <= 0 && (
                        <button
                            onClick={handleUnlock}
                            className="bg-[#e2e8f0]/10 hover:bg-[#e2e8f0]/20 border border-[#e2e8f0]/20 backdrop-blur-md text-[#f8fafc] px-8 py-3 rounded-full font-serif tracking-wider hover:scale-105 transition-all duration-300 shadow-lg"
                        >
                            Begin Day
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // 3. ACTIVE DASHBOARD
    return <>{children}</>;
}
