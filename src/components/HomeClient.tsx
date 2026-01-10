"use client";

import { ShieldCheck, Settings, Moon, Wind } from "lucide-react";
import Link from "next/link";
import CravingsManager from "@/components/CravingsManager";
import FastingCard from "@/components/FastingCard";
import ExerciseCard from "@/components/ExerciseCard";
import BottomNav from "@/components/BottomNav";
import { logSleepEvent } from "@/app/actions";
import DigitalDetoxGuard from "@/components/DigitalDetoxGuard";
import { useState } from "react";
import BreatheModal from "@/components/BreatheModal";

export default function HomeClient({ agencyScore }: { agencyScore: number | null }) {
    const [showBreathe, setShowBreathe] = useState(false);

    return (
        <DigitalDetoxGuard>
            <main className="min-h-screen pb-24 p-6 flex flex-col font-sans max-w-md mx-auto relative bg-[#000000]">
                <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,_rgba(16,185,129,0.1)_0%,_rgba(0,0,0,0)_50%)]" />
                {showBreathe && <BreatheModal onClose={() => setShowBreathe(false)} />}

                <header className="mb-8 mt-4 flex justify-between items-end relative z-10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Impulse Tracker</h1>
                        <p className="text-gray-400 text-sm font-medium">Neutral observation.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {agencyScore !== null && (
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Weekly Agency</span>
                                <div className="flex items-center gap-1 text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                                    <ShieldCheck size={18} fill="currentColor" />
                                    <span className="font-bold text-xl">{agencyScore}%</span>
                                </div>
                            </div>
                        )}
                        <Link href="/settings" className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                            <Settings size={20} />
                        </Link>
                    </div>
                </header>

                {/* Breathe Button (Action Entry) */}
                <button
                    onClick={() => setShowBreathe(true)}
                    className="w-full relative z-10 glass-card mb-6 flex items-center justify-center gap-3 transition-all hover:border-primary/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] group py-5"
                >
                    <Wind size={22} className="text-primary group-hover:rotate-180 transition-transform duration-1000" />
                    <span className="font-bold text-lg text-white group-hover:text-primary transition-colors">Take a Breath</span>
                </button>

                {/* Grid Layout */}
                <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">

                    {/* Dynamic Cravings Module handles Weed & Food */}
                    <CravingsManager />

                    {/* Fasting Card */}
                    <FastingCard />

                    {/* Exercise Card */}
                    <ExerciseCard />

                </div>

                {/* Digital Sunset Button */}
                <div className="mt-auto mb-4 relative z-10">
                    <button
                        onClick={() => logSleepEvent("sunset_start")}
                        className="w-full glass-card py-5 flex items-center justify-center gap-3 transition-all group hover:bg-primary/5 hover:border-primary/20"
                    >
                        <Moon size={22} className="group-hover:rotate-12 transition-transform text-gray-400 group-hover:text-primary" fill="currentColor" />
                        <span className="font-bold text-lg text-gray-300 group-hover:text-white">Digital Sunset Mode</span>
                    </button>
                    <p className="text-center text-xs text-gray-600 mt-3 font-medium opacity-60">
                        Locks functionality until sunrise
                    </p>
                </div>

                <BottomNav />
            </main>
        </DigitalDetoxGuard>
    );
}
