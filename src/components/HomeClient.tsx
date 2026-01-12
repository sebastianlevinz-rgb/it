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
    const [triggerXPGlow, setTriggerXPGlow] = useState(false);

    useEffect(() => {
        const fetchXP = async () => {
            const xp = await getUserXP();
            setLevelInfo(getLevelInfo(xp));
        };
        fetchXP();
    }, []);

    // Handle Session Complete
    const handleSessionComplete = (isSuccess: boolean) => {
        if (isSuccess) {
            setTriggerXPGlow(true);
            setTimeout(() => setTriggerXPGlow(false), 3000);

            // Refresh level info
            getUserXP().then(xp => {
                setLevelInfo(getLevelInfo(xp));
            });
        }
    };

    return (
        <main className="h-[100svh] max-h-[100svh] px-4 pt-4 pb-24 flex flex-col font-sans max-w-md mx-auto relative overflow-hidden font-light text-[#1A202C] bg-[#F8F9FA]">
            {/* AURORA BOREALIS BACKGROUND */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Blob 1: Soft Pink */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#F472B6]/30 rounded-full blur-[100px] mix-blend-multiply animate-[aurora-float_20s_infinite_ease-in-out]"></div>
                {/* Blob 2: Sky Blue */}
                <div className="absolute top-[20%] right-[-20%] w-[400px] h-[400px] bg-[#67E8F9]/30 rounded-full blur-[100px] mix-blend-multiply animate-[aurora-float_25s_infinite_ease-in-out_reverse]"></div>
                {/* Blob 3: Lavender */}
                <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-[#818CF8]/20 rounded-full blur-[120px] mix-blend-multiply animate-[aurora-float_30s_infinite_ease-in-out]"></div>
            </div>

            {/* Texture Overlay (Very Subtle Noise) */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.4] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-soft-light z-0"></div>

            {/* Breathe Modal */}
            {showBreathe && (
                <BreatheModal
                    onClose={() => setShowBreathe(false)}
                    onSessionComplete={handleSessionComplete}
                />
            )}

            {/* Header - Glass & Light */}
            <header className="mb-2 mt-4 flex flex-col gap-3 relative z-10 shrink-0">
                <div className="flex justify-center items-center relative h-10">
                    <div className="text-center z-10">
                        <h1 className="text-3xl font-light tracking-tight text-[#1A202C] drop-shadow-sm uppercase leading-none">Impulse</h1>
                        <p className="text-[#4A5568] text-xs font-light tracking-widest uppercase opacity-80">Ethereal Clarity</p>
                    </div>
                    <Link href="/settings" className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:bg-white/40 rounded-full text-[#4A5568] transition-colors active-squish backdrop-blur-sm">
                        <Settings size={20} strokeWidth={1.5} />
                    </Link>
                </div>

                {/* XP Bar - Crystal Tube */}
                {levelInfo && !showBreathe && !isCravingModalOpen && (
                    <div className={`glass-panel py-2 px-3 !rounded-full !border-white/40 !bg-white/20 animate-in fade-in slide-in-from-top-2 transition-all duration-1000
                        ${triggerXPGlow ? "shadow-[0_0_30px_rgba(103,232,249,0.4)]" : ""}`}>
                        <div className="flex justify-between items-end mb-1.5 px-1">
                            <div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-500 text-[#38BDF8]`}>Level {levelInfo.level}</span>
                                <h3 className="text-[#1A202C] font-semibold text-sm leading-none">{levelInfo.title}</h3>
                            </div>
                            <span className="text-[10px] text-[#4A5568] font-mono opacity-80">{levelInfo.currentXP}/{levelInfo.nextThreshold}</span>
                        </div>
                        {/* The Crystal Tube */}
                        <div className="h-2 w-full crystal-tube">
                            {/* Liquid Fill */}
                            <div
                                className={`h-full liquid-fill transition-all duration-1000 rounded-full`}
                                style={{ width: `${levelInfo.progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}
            </header>

            {/* The Vibe Space - Centered Action Cluster */}
            <div className={`flex-1 flex flex-col justify-center gap-6 w-full max-w-[320px] mx-auto z-10 relative transition-all duration-500 ${!levelInfo || showBreathe || isCravingModalOpen ? '-mt-12' : ''}`}>

                {/* 'Take a Moment' - Glass Pill */}
                {!isCravingModalOpen && (
                    <button
                        onClick={() => setShowBreathe(true)}
                        className="btn-glass w-full py-5 group"
                    >
                        <span className="font-light text-lg tracking-wide text-[#1A202C]">Take a Moment</span>
                        <div className="text-[#38BDF8] group-hover:rotate-180 transition-transform duration-700">
                            <Wind size={20} strokeWidth={1.5} />
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
