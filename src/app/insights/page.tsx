import { getInsightsData } from "@/app/actions";
import { ShieldCheck, Zap, Brain, Activity } from "lucide-react";
import Link from "next/link";

export default async function InsightsPage() {
    const data = await getInsightsData();

    return (
        <main className="min-h-screen pb-24 p-5 flex flex-col font-sans max-w-md mx-auto relative bg-gradient-to-br from-[#1e1f22] via-[#2b2d31] to-black overflow-hidden font-medium text-gray-100 animate-living-gradient">
            {/* Header */}
            <header className="mb-8 mt-6 flex justify-between items-center relative z-10">
                <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-sm">Insights</h1>
                <Link href="/" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                    <span className="text-sm font-bold px-2">Back</span>
                </Link>
            </header>

            <div className="space-y-6 relative z-10">
                {/* AI Vibe Check Card */}
                <div className="bg-[#5865F2] rounded-[32px] p-6 shadow-[0_0_40px_rgba(88,101,242,0.3)] animate-float">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-full">
                            <Brain size={24} className="text-white" />
                        </div>
                        <h2 className="font-bold text-white text-lg">AI Vibe Check</h2>
                    </div>
                    <p className="text-white/90 text-lg font-medium leading-relaxed">
                        "{data.aiVibeCheck}"
                    </p>
                </div>

                {/* Agency Score Card */}
                <div className="bg-[#2b2d31] rounded-[32px] p-6 border border-white/5 shadow-xl">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-400 font-bold uppercase text-xs tracking-wider">Weekly Agency</span>
                        <ShieldCheck className="text-[#57F287]" />
                    </div>
                    <div className="text-5xl font-black text-white mb-2">
                        {data.agencyScore}%
                    </div>
                    <p className="text-gray-500 text-sm">of impulses resisted</p>
                </div>

                {/* Top Trigger */}
                <div className="bg-[#2b2d31] rounded-[32px] p-6 border border-white/5 shadow-xl">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-gray-400 font-bold uppercase text-xs tracking-wider">Top Trigger</span>
                        <Activity className="text-[#FEE75C]" />
                    </div>
                    <div className="text-3xl font-black text-white mb-1">
                        {data.topTriggers[0]?.trigger || "None"}
                    </div>
                    <p className="text-gray-500 text-sm">is pushing your buttons</p>
                </div>

                {/* Fasting Stat (Legacy/Hidden or repurposed) */}
                {/* Keeping it simple for now as requested */}
            </div>
        </main>
    );
}
