"use client";

import { ShieldCheck, Settings, Wind } from "lucide-react";
import Link from "next/link";
import CravingsManager from "@/components/CravingsManager";

import BottomNav from "@/components/BottomNav";

import { useState, useEffect } from "react";
import BreatheModal from "@/components/BreatheModal";
import { getUserXP } from "@/app/actions";
import { getLevelInfo, type LevelInfo } from "@/utils/xp";

export default function HomeClient({ agencyScore }: { agencyScore: number | null }) {
    const [showBreathe, setShowBreathe] = useState(false);
    const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);

    useEffect(() => {
        getUserXP().then(xp => {
            setLevelInfo(getLevelInfo(xp));
        });
    }, []);

    return (
        <main className="min-h-screen pb-24 p-5 flex flex-col font-sans max-w-md mx-auto relative bg-gradient-to-br from-[#1e1f22] via-[#2b2d31] to-black overflow-hidden font-medium text-gray-100 animate-living-gradient">
            {/* Background: Pure Black with Mesh Gradient Blobs - Keep for depth, but adjusted opacity */}
            <div className="fixed top-[-20%] left-[-20%] w-[500px] h-[500px] bg-[#5865F2]/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow"></div>
            <div className="fixed bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-[#57F287]/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow delay-1000"></div>

            {/* Noise Texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            {/* Breathe Modal */}
            {showBreathe && <BreatheModal onClose={() => setShowBreathe(false)} />}

            <header className="mb-8 mt-6 flex flex-col gap-4 relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-sm uppercase">Impulse</h1>
                        <p className="text-[#B5BAC1] text-sm font-semibold tracking-wide">The power of the gap</p>
                    </div>
                    <Link href="/settings" className="p-3 hover:bg-white/10 rounded-full text-[#B5BAC1] hover:text-white transition-colors active-squish">
                        <Settings size={24} strokeWidth={2.5} />
                    </Link>
                </div>

                {/* XP Bar */}
                {levelInfo && (
                    <div className="bg-[#111214] rounded-2xl p-4 border border-white/5 shadow-inner">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <span className="text-xs font-bold text-[#5865F2] uppercase tracking-wider">Level {levelInfo.level}</span>
                                <h3 className="text-white font-bold text-lg leading-none">{levelInfo.title}</h3>
                            </div>
                            <span className="text-xs text-gray-500 font-mono">{levelInfo.currentXP} / {levelInfo.nextThreshold} XP</span>
                        </div>
                        <div className="h-2 w-full bg-[#2b2d31] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#5865F2] shadow-[0_0_10px_#5865F2]"
                                style={{ width: `${levelInfo.progressPercent}%`, transition: 'width 1s ease-out' }}
                            />
                        </div>
                    </div>
                )}
            </header>

            {/* Breathe Button (Action Entry) */}
            <button
                onClick={() => setShowBreathe(true)}
                className="w-full relative z-10 mb-8 flex items-center justify-center gap-4 transition-all group py-6 rounded-[24px] bg-[#2b2d31] hover:bg-[#313338] hover-lift active-squish shadow-lg border border-white/5"
            >
                <div className="p-3 rounded-full bg-[#5865F2]/20 text-[#5865F2] group-hover:scale-110 transition-transform duration-300">
                    <Wind size={28} strokeWidth={3} className="group-hover:rotate-180 transition-transform duration-700" />
                </div>
                <span className="font-bold text-xl text-white group-hover:text-[#5865F2] transition-colors">Take a Breath</span>
            </button>

            {/* Stack Layout - Vertical Stacking */}
            <div className="flex flex-col gap-5 mb-10 relative z-10 flex-1">

                {/* Dynamic Cravings Module handles Weed & Food */}
                <CravingsManager />



            </div>



            <BottomNav />
        </main>
    );
}
