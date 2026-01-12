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
        <main className="h-[100svh] min-h-[100svh] flex flex-col font-sans max-w-md mx-auto bg-white text-black overflow-hidden relative border-x-2 border-black">

            {/* Breathe Modal */}
            {showBreathe && (
                <BreatheModal
                    onClose={() => setShowBreathe(false)}
                    onSessionComplete={handleSessionComplete}
                />
            )}

            {/* HEADER GRID - SECTOR A */}
            <header className="border-b-2 border-black p-6 flex flex-col gap-6 shrink-0 bg-white z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-5xl font-extrabold tracking-tighter leading-none">IMPULSE</h1>
                        <p className="text-sm font-bold tracking-widest mt-1">MODERNIST PROTOCOL V3.3</p>
                    </div>
                    <Link href="/settings" className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors">
                        <Settings size={28} strokeWidth={2.5} />
                    </Link>
                </div>

                {/* XP Bar - Swiss Frame */}
                {levelInfo && !showBreathe && !isCravingModalOpen && (
                    <div className="w-full">
                        <div className="flex justify-between items-end mb-2 font-mono text-xs font-bold uppercase">
                            <span>Sector: {levelInfo.title}</span>
                            <span>{levelInfo.currentXP} / {levelInfo.nextThreshold} XP</span>
                        </div>
                        <div className="swiss-bar-frame">
                            <div
                                className="swiss-bar-fill"
                                style={{ width: `${levelInfo.progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}
            </header>

            {/* MAIN GRID - SECTOR B */}
            <div className={`flex-1 flex flex-col justify-between bg-white transform transition-all duration-300 ${isCravingModalOpen ? 'p-0' : 'p-6'}`}>

                {!isCravingModalOpen ? (
                    <div className="flex flex-col gap-8 h-full justify-center">
                        {/* Take a Moment - Massive Block */}
                        <button
                            onClick={() => setShowBreathe(true)}
                            className="btn-swiss-black w-full text-xl py-8 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:drop-shadow-none transition-all"
                        >
                            <Wind size={24} strokeWidth={3} />
                            <span>Take a Moment</span>
                        </button>

                        {/* The Choice - Split Grid */}
                        <div className="grid grid-cols-2 gap-0 border-2 border-black h-48 w-full drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                            <div className="border-r-2 border-black h-full">
                                <CravingsManager onModalChange={setIsCravingModalOpen} initialSelection="weed" />
                            </div>
                            <div className="h-full">
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
