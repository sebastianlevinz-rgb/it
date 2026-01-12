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

    // Handle Session Complete (Show Glow - now Ink Pulse)
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
        <main className="h-[100svh] max-h-[100svh] px-4 pt-4 pb-24 flex flex-col font-sans max-w-md mx-auto relative overflow-hidden font-medium text-foreground bg-[#F8F4E3]">
            {/* Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-multiply"></div>

            {/* Breathe Modal */}
            {showBreathe && (
                <BreatheModal
                    onClose={() => setShowBreathe(false)}
                    onSessionComplete={handleSessionComplete}
                />
            )}

            {/* Header - Compact & Centered */}
            <header className="mb-2 mt-4 flex flex-col gap-3 relative z-10 shrink-0">
                <div className="flex justify-center items-center relative h-10">
                    <div className="text-center z-10">
                        <h1 className="text-3xl font-black tracking-tighter text-foreground drop-shadow-sm uppercase leading-none font-serif">Impulse</h1>
                        <p className="text-[#5D4037] text-xs font-serif italic tracking-wide">Volume I: The Power of the Gap</p>
                    </div>
                    <Link href="/settings" className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:bg-[#2C4C3B]/5 rounded-full text-[#5D4037] transition-colors active-squish">
                        <Settings size={20} strokeWidth={2} />
                    </Link>
                </div>

                {/* XP Bar - Botanical Vine Style */}
                {levelInfo && !showBreathe && !isCravingModalOpen && (
                    <div className={`organic-card py-2 px-3 border-2 border-[#2C4C3B] rounded-[12px] bg-white/50 animate-in fade-in slide-in-from-top-2 transition-all duration-1000
                        ${triggerXPGlow ? "organic-ripple" : ""}`}>
                        <div className="flex justify-between items-end mb-1.5">
                            <div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-500 text-[#5D4037] font-serif`}>Level {levelInfo.level}</span>
                                <h3 className="text-[#2C4C3B] font-bold text-sm leading-none font-serif">{levelInfo.title}</h3>
                            </div>
                            <span className="text-[10px] text-[#5D4037] font-mono">{levelInfo.currentXP}/{levelInfo.nextThreshold}</span>
                        </div>
                        {/* The Vine Container */}
                        <div className="h-2 w-full bg-[#E6DDC6] rounded-full overflow-hidden border border-[#2C4C3B]/20 relative">
                            {/* The Vine Growth */}
                            <div
                                className={`h-full vine-growth transition-all duration-1000 ${triggerXPGlow ? "bg-[#2C4C3B]" : "bg-[#2C4C3B]"}`}
                                style={{ width: `${levelInfo.progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}
            </header>

            {/* The Vibe Space - Centered Action Cluster */}
            <div className={`flex-1 flex flex-col justify-center gap-6 w-full max-w-[320px] mx-auto z-10 relative transition-all duration-500 ${!levelInfo || showBreathe || isCravingModalOpen ? '-mt-12' : ''}`}>

                {/* 'Take a Moment' - Sage Green Pebble */}
                {!isCravingModalOpen && (
                    <button
                        onClick={() => setShowBreathe(true)}
                        className="btn-sage w-full group animate-float"
                    >
                        <span className="font-bold text-lg text-[#1a2f23]">Take a Moment</span>
                        <div className="text-[#1a2f23] group-hover:rotate-12 transition-transform duration-700">
                            <Wind size={20} strokeWidth={2.5} />
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
