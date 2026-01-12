"use client";

import { ShieldCheck, Settings, Wind } from "lucide-react";
import Link from "next/link";
import CravingsManager from "@/components/CravingsManager";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import BreatheModal from "@/components/BreatheModal";
import { getUserXP, checkSystemHealth } from "@/app/actions";
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

    const handleSessionComplete = (isSuccess: boolean) => {
        if (isSuccess) {
            setTriggerXPGlow(true);
            setTimeout(() => setTriggerXPGlow(false), 3000);
            getUserXP().then(xp => {
                setLevelInfo(getLevelInfo(xp));
            });
        }
    };

    const runSystemAudit = async () => {
        console.group("⚙️ SYSTEM AUDIT DETECTED");
        console.log("----------------------------------------");

        // 1. UI Check
        const header = document.getElementById("header-sector");
        const grid = document.getElementById("main-grid");
        const footer = document.querySelector("footer");
        console.log(header ? "✅ Header [MOUNTED]" : "❌ Header [MISSING]");
        console.log(grid ? "✅ Main Grid [MOUNTED]" : "❌ Main Grid [MISSING]");
        console.log(footer ? "✅ Footer/Nav [MOUNTED]" : "❌ Footer/Nav [MISSING]");

        // 2. Event Handlers (Heuristic)
        const breatheBtn = document.getElementById("btn-breathe");
        console.log(breatheBtn ? "✅ 'Take a Moment' Button [DETECTED]" : "❌ 'Take a Moment' Button [MISSING]");

        // 3. Timer Logic (Simulated check of State)
        console.log("ℹ️ Checking Impulse State...");
        const health = await checkSystemHealth();

        // 4. Env
        console.log(health.dbConfigured ? "✅ DB Environment [DETECTED]" : "❌ DB Environment [MISSING]");

        console.log("----------------------------------------");
        console.log("AUDIT COMPLETE");
        console.groupEnd();
        alert("AUDIT LOGGED TO CONSOLE");
    };

    return (
        <main className="h-[100svh] min-h-[100svh] flex flex-col font-retro max-w-md mx-auto bg-black text-white overflow-hidden relative border-x-4 border-black mario-sky">
            {/* Cloud Sprites */}
            <div className="mario-cloud top-8 left-0"></div>
            <div className="mario-cloud top-24 left-32 scale-75"></div>

            {/* Breathe Modal */}
            {showBreathe && (
                <BreatheModal
                    onClose={() => setShowBreathe(false)}
                    onSessionComplete={handleSessionComplete}
                />
            )}

            {/* HEADER GRID - SECTOR A */}
            <header id="header-sector" className="p-6 flex flex-col gap-6 shrink-0 z-10 mario-brick">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl leading-none text-white drop-shadow-[4px_4px_0_black]">IMPULSE</h1>
                        <p className="text-[10px] mt-2 text-white drop-shadow-[2px_2px_0_black] tracking-widest">MODERNIST PROTOCOL V3.3</p>
                    </div>
                    <Link href="/settings" className="p-2 border-4 border-black bg-yellow-400 hover:bg-yellow-300 transition-colors pixel-btn mario-question">
                        <Settings size={20} strokeWidth={3} className="text-black" />
                    </Link>
                </div>

                {/* XP Bar - Coins */}
                {levelInfo && !showBreathe && !isCravingModalOpen && (
                    <div className="w-full mt-2">
                        <div className="flex justify-between items-end mb-2 text-[10px] uppercase tracking-widest text-white drop-shadow-[2px_2px_0_black]">
                            <span>SECTOR: THE WITNESS</span>
                            <span>{levelInfo.currentXP}/{levelInfo.nextThreshold} XP</span>
                        </div>
                        <div className="border-4 border-black h-8 w-full bg-black/50 relative">
                            <div
                                className="h-full bg-yellow-400 transition-all duration-500 flex items-center overflow-hidden"
                                style={{ width: `${levelInfo.progressPercent}%` }}
                            >
                                {/* Pixel Coin Pattern */}
                                <div className="w-full text-black text-[10px] whitespace-nowrap px-1">🪙 🪙 🪙</div>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* MAIN GRID - SECTOR B */}
            <div id="main-grid" className={`flex-1 flex flex-col justify-between transform transition-all duration-300 ${isCravingModalOpen ? 'p-0' : 'p-6'}`}>
                {!isCravingModalOpen ? (
                    <div className="flex flex-col gap-8 h-full justify-center">
                        {/* Take a Moment - POW Block */}
                        <button
                            id="btn-breathe"
                            onClick={() => setShowBreathe(true)}
                            className="btn-pow w-full py-8 text-sm hover:scale-[1.02]"
                        >
                            <span className="text-2xl mr-4 block mb-2">🍄</span>
                            <span className="text-xl">TAKE A MOMENT</span>
                        </button>

                        {/* The Choice - Bricks */}
                        <div className="grid grid-cols-2 gap-4 w-full">
                            <div className="h-48 mario-brick">
                                <CravingsManager onModalChange={setIsCravingModalOpen} initialSelection="weed" />
                            </div>
                            <div className="h-48 mario-brick">
                                <CravingsManager onModalChange={setIsCravingModalOpen} initialSelection="food" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full w-full">
                        <CravingsManager onModalChange={setIsCravingModalOpen} />
                    </div>
                )}
            </div>

            <div className="flex justify-center pb-2 z-20">
                <button onClick={runSystemAudit} className="pixel-btn bg-gray-800 text-[10px] px-2 py-1 opacity-50 hover:opacity-100">
                    ⚙️ AUDIT
                </button>
            </div>
            <BottomNav />
        </main>
    );
}
