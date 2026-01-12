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

            getUserXP().then(xp => {
                setLevelInfo(getLevelInfo(xp));
            });
        }
    };

    return (
        <main className="h-[100svh] min-h-[100svh] flex flex-col font-retro max-w-md mx-auto bg-black text-white overflow-hidden relative border-x-4 border-white pixel-border">
            <div className="scanline"></div>

            {/* Breathe Modal */}
            {showBreathe && (
                <BreatheModal
                    onClose={() => setShowBreathe(false)}
                    onSessionComplete={handleSessionComplete}
                />
            )}

            {/* HEADER GRID - HERO STATS */}
            <header className="p-4 flex flex-col gap-4 shrink-0 bg-black z-10 border-b-4 border-white pixel-border pb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-xl leading-relaxed text-yellow-400 drop-shadow-md">HERO: SEBASTIAN</h1>
                        <p className="text-xs mt-2 text-gray-400">QUEST: IMPULSE TRACKER</p>
                    </div>
                    <Link href="/settings" className="p-2 border-4 border-white hover:bg-white hover:text-black transition-colors pixel-btn">
                        <Settings size={20} strokeWidth={3} />
                    </Link>
                </div>

                {/* XP Bar - RPG Style */}
                {levelInfo && !showBreathe && !isCravingModalOpen && (
                    <div className="w-full mt-2">
                        <div className="flex justify-between items-end mb-2 text-[10px] uppercase tracking-widest text-green-400">
                            <span>LVL 1 - NOVICE</span>
                            <span>{levelInfo.currentXP}/{levelInfo.nextThreshold} EXP</span>
                        </div>
                        <div className="border-4 border-white h-6 w-full bg-gray-900 relative">
                            <div
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{ width: `${levelInfo.progressPercent}%`, boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.5)' }}
                            />
                        </div>
                    </div>
                )}
            </header>

            {/* MAIN GRID - BATTLE ARENA */}
            <div className={`flex-1 flex flex-col justify-between bg-black transform transition-all duration-300 ${isCravingModalOpen ? 'p-0' : 'p-6'}`}>

                {!isCravingModalOpen ? (
                    <div className="flex flex-col gap-8 h-full justify-center">

                        {/* MEDITATE - Blue Button */}
                        <button
                            onClick={() => setShowBreathe(true)}
                            className="pixel-btn pixel-btn-blue w-full py-8 text-sm hover:scale-[1.02]"
                        >
                            <span className="text-2xl mr-4">🧘</span>
                            <span>MEDITATE</span>
                        </button>

                        {/* The Choice - Split Grid */}
                        <div className="grid grid-cols-2 gap-4 w-full">
                            <div className="h-48">
                                <CravingsManager onModalChange={setIsCravingModalOpen} initialSelection="weed" />
                            </div>
                            <div className="h-48">
                                <CravingsManager onModalChange={setIsCravingModalOpen} initialSelection="food" />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ACTIVE MODAL CONTAINER - Full Grid Takeover */
                    <div className="h-full w-full">
                        <CravingsManager onModalChange={setIsCravingModalOpen} />
                    </div>
                )}
            </div>

            <BottomNav />
        </main>
    );
}
