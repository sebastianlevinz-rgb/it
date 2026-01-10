"use client";

import { ShieldCheck, Settings, Moon, Wind } from "lucide-react";
import Link from "next/link";
import CravingsManager from "@/components/CravingsManager";

import BottomNav from "@/components/BottomNav";
import { logSleepEvent } from "@/app/actions";
import { useState } from "react";
import BreatheModal from "@/components/BreatheModal";

export default function HomeClient({ agencyScore }: { agencyScore: number | null }) {
    const [showBreathe, setShowBreathe] = useState(false);

    return (
        <main className="min-h-screen pb-24 p-5 flex flex-col font-sans max-w-md mx-auto relative bg-[linear-gradient(to_bottom,#000033,#000000)] overflow-hidden">
            {/* Background: Pure Black with Mesh Gradient Blobs */}
            <div className="fixed top-[-20%] left-[-20%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow"></div>
            <div className="fixed bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow delay-1000"></div>

            {/* Noise Texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            {/* Breathe Modal */}
            {showBreathe && <BreatheModal onClose={() => setShowBreathe(false)} />}

            <header className="mb-10 mt-6 flex justify-between items-end relative z-10">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-2xl">Craving App</h1>
                    <p className="text-gray-400 text-sm font-medium mt-1">Neutral observation.</p>
                </div>
                <div className="flex items-center gap-4">
                    {agencyScore !== null && (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Weekly Agency</span>
                            <div className="flex items-center gap-1.5 text-primary drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                                <ShieldCheck size={20} fill="currentColor" />
                                <span className="font-bold text-2xl">{agencyScore}%</span>
                            </div>
                        </div>
                    )}
                    <Link href="/settings" className="p-3 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
                        <Settings size={22} />
                    </Link>
                </div>
            </header>

            {/* Breathe Button (Action Entry) */}
            <button
                onClick={() => setShowBreathe(true)}
                className="w-full relative z-10 glass-card mb-8 flex items-center justify-center gap-4 transition-all hover:border-t-primary/50 hover:shadow-[0_10px_40px_rgba(16,185,129,0.15)] group py-6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] hover:bg-[linear-gradient(180deg,rgba(16,185,129,0.1)_0%,rgba(16,185,129,0.02)_100%)] animate-float"
            >
                <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500 border border-primary/20">
                    <Wind size={24} className="group-hover:rotate-180 transition-transform duration-1000" />
                </div>
                <span className="font-bold text-xl text-white group-hover:text-primary transition-colors tracking-tight">Take a Breath</span>
            </button>

            {/* Stack Layout - Vertical Stacking */}
            <div className="flex flex-col gap-5 mb-10 relative z-10 flex-1">

                {/* Dynamic Cravings Module handles Weed & Food */}
                <CravingsManager />



            </div>

            {/* Digital Sunset Button */}
            <div className="mt-auto mb-6 relative z-10">
                <button
                    onClick={() => logSleepEvent("sunset_start")}
                    className="w-full glass-card py-6 flex items-center justify-center gap-4 transition-all group hover:bg-white/5 hover:border-t-white/20"
                >
                    <Moon size={24} className="group-hover:rotate-12 transition-transform text-gray-400 group-hover:text-white" fill="currentColor" />
                    <span className="font-bold text-lg text-gray-400 group-hover:text-white">Digital Sunset Mode</span>
                </button>
                <p className="text-center text-xs text-gray-600 mt-4 font-medium tracking-wide opacity-50 uppercase">
                    Locks functionality until sunrise
                </p>
            </div>

            <BottomNav />
        </main>
    );
}
