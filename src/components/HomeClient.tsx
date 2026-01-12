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
    const [isCravingModalOpen, setIsCravingModalOpen] = useState(false);
    const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);

    useEffect(() => {
        getUserXP().then(xp => {
            setLevelInfo(getLevelInfo(xp));
        });
    }, []);

    return (
        <main className="h-[100svh] max-h-[100svh] px-4 pt-4 pb-24 flex flex-col font-sans max-w-md mx-auto relative bg-gradient-to-br from-[#0a0a12] via-[#161625] to-black overflow-hidden font-medium text-slate-200 animate-living-gradient">
            {/* Background: Pure Black with Mesh Gradient Blobs - Keep for depth, but adjusted opacity */}
            <div className="fixed top-[-20%] left-[-20%] w-[500px] h-[500px] bg-[#5865F2]/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow"></div>
            <div className="fixed bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-[#57F287]/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow delay-1000"></div>

            {/* Noise Texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            {/* Breathe Modal */}
            {showBreathe && <BreatheModal onClose={() => setShowBreathe(false)} />}

            {/* Header - Compact & Centered */}
            <header className="mb-2 mt-4 flex flex-col gap-3 relative z-10 shrink-0">
                <div className="flex justify-center items-center relative h-10">
                    <div className="text-center z-10">
                        <h1 className="text-3xl font-black tracking-tighter text-white drop-shadow-sm uppercase leading-none">Impulse</h1>
                        <p className="text-[#B5BAC1] text-xs font-semibold tracking-wide">The power of the gap</p>
                    </div>
                    <Link href="/settings" className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full text-[#B5BAC1] hover:text-white transition-colors active-squish">
                        <Settings size={20} strokeWidth={2.5} />
                    </Link>
                </div>

                {/* XP Bar - Compact (Only show if NO modal is open) */}
                {levelInfo && !showBreathe && !isCravingModalOpen && (
                    <div className="bg-[#111214] rounded-xl p-3 border border-white/5 shadow-inner animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-end mb-1.5">
                            <div>
                                <span className="text-[10px] font-bold text-[#5865F2] uppercase tracking-wider">Level {levelInfo.level}</span>
                                <h3 className="text-white font-bold text-sm leading-none">{levelInfo.title}</h3>
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono">{levelInfo.currentXP}/{levelInfo.nextThreshold}</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#2b2d31] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#5865F2] shadow-[0_0_10px_#5865F2]"
                                style={{ width: `${levelInfo.progressPercent}%`, transition: 'width 1s ease-out' }}
                            />
                        </div>
                    </div>
                )}
            </header>

            {/* The Vibe Space - Centered Action Cluster */}
            <div className={`flex-1 flex flex-col justify-center gap-6 w-full max-w-[320px] mx-auto z-10 relative transition-all duration-500 ${!levelInfo || showBreathe || isCravingModalOpen ? '-mt-12' : ''}`}>

                {/* Breathe Pill - Floating & Rounded (Hide if Cravings Open to reduce clutter?) No, keep it reachable but maybe smaller? actually sticking to plan: just hide XP bar */}
                {!isCravingModalOpen && (
                    <button
                        onClick={() => setShowBreathe(true)}
                        className="w-full relative flex items-center justify-between px-8 py-5 transition-all group rounded-[50px] bg-[#2b2d31]/80 backdrop-blur-xl hover:bg-[#313338] active-squish border border-white/5 animate-float-gentle shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5),0_0_20px_rgba(255,255,255,0.05)_inset]"
                    >
                        <span className="font-bold text-lg text-white group-hover:text-[#5865F2] transition-colors">Take a Moment</span>
                        <div className="bg-[#5865F2]/20 p-2 rounded-full text-[#5865F2] group-hover:rotate-180 transition-transform duration-700">
                            <Wind size={20} strokeWidth={3} />
                        </div>
                    </button>
                )}

                {/* Grid Container */}
                <div className="w-full">
                    <CravingsManager onModalChange={setIsCravingModalOpen} />
                </div>
            </div>



            <BottomNav />
        </main>
    );
}
