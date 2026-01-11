"use client";

import { ShieldCheck, Settings, Wind } from "lucide-react";
import Link from "next/link";
import CravingsManager from "@/components/CravingsManager";

import BottomNav from "@/components/BottomNav";

import { useState } from "react";
import BreatheModal from "@/components/BreatheModal";

export default function HomeClient({ agencyScore }: { agencyScore: number | null }) {
    const [showBreathe, setShowBreathe] = useState(false);

    return (
        <main className="min-h-screen pb-24 p-5 flex flex-col font-sans max-w-md mx-auto relative bg-[linear-gradient(to_bottom,#1e1f22,#2b2d31)] overflow-hidden font-medium text-gray-100">
            {/* Background: Pure Black with Mesh Gradient Blobs - Keep for depth, but adjusted opacity */}
            <div className="fixed top-[-20%] left-[-20%] w-[500px] h-[500px] bg-[#5865F2]/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow"></div>
            <div className="fixed bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-[#57F287]/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow delay-1000"></div>

            {/* Noise Texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            {/* Breathe Modal */}
            {showBreathe && <BreatheModal onClose={() => setShowBreathe(false)} />}

            <header className="mb-8 mt-6 flex justify-between items-center relative z-10">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-sm">Craving App</h1>
                    <p className="text-[#B5BAC1] text-sm font-semibold mt-1">What's the vibe today?</p>
                </div>
                <div className="flex items-center gap-4">
                    {agencyScore !== null && (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-[#B5BAC1] uppercase tracking-widest font-bold mb-1">Agency</span>
                            <div className="flex items-center gap-1.5 text-[#5865F2] drop-shadow-md">
                                <ShieldCheck size={20} fill="currentColor" strokeWidth={2.5} />
                                <span className="font-extrabold text-2xl">{agencyScore}%</span>
                            </div>
                        </div>
                    )}
                    <Link href="/settings" className="p-3 hover:bg-white/10 rounded-full text-[#B5BAC1] hover:text-white transition-colors active-squish">
                        <Settings size={24} strokeWidth={2.5} />
                    </Link>
                </div>
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
