import { getInsightsData } from "@/app/actions";
import { ShieldCheck, Zap, Brain, Activity } from "lucide-react";
import Link from "next/link";

export default async function InsightsPage() {
    const data = await getInsightsData();
    const { levelInfo, meditationStats, topTriggers, aiVibeCheck } = data;

    return (
        <main className="min-h-screen pb-24 p-5 flex flex-col font-sans max-w-md mx-auto relative bg-gradient-to-br from-[#0a0a12] via-[#161625] to-black overflow-hidden font-medium text-slate-200 animate-living-gradient">
            {/* Header */}
            <header className="mb-4 mt-6 flex justify-between items-center relative z-10">
                <Link href="/" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                    <span className="text-xs font-bold px-2 text-white/70 hover:text-white">← Dashboard</span>
                </Link>
                <div className="p-2 bg-white/5 rounded-full">
                    <ShieldCheck size={20} className="text-emerald-400" />
                </div>
            </header>

            {/* RPG Character Sheet */}
            <div className="mb-8 relative z-10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Lv. {levelInfo.level}</span>
                        <h1 className="text-3xl font-black text-white leading-none">{levelInfo.title}</h1>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-mono text-gray-400">{levelInfo.currentXP} / {levelInfo.nextThreshold} XP</span>
                    </div>
                </div>
                {/* XP Bar */}
                <div className="h-4 bg-black/40 rounded-full border border-white/5 overflow-hidden relative">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)] transition-all duration-1000 ease-out"
                        style={{ width: `${levelInfo.progressPercent}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">
                    {Math.round(levelInfo.nextThreshold - levelInfo.currentXP)} XP to next level
                </p>
            </div>

            <div className="space-y-4 relative z-10">

                {/* Meditation Stats (Mindful Minutes) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#2b2d31]/80 backdrop-blur-xl rounded-[24px] p-5 border border-white/5 shadow-lg">
                        <div className="flex items-center gap-2 mb-3 text-blue-400">
                            <Brain size={20} />
                            <span className="text-xs font-bold uppercase tracking-wide">Mindful Mins</span>
                        </div>
                        <div className="text-3xl font-black text-white">{meditationStats.totalMinutes}</div>
                        <div className="text-xs text-gray-400">Lifetime total</div>
                    </div>

                    <div className="bg-[#2b2d31]/80 backdrop-blur-xl rounded-[24px] p-5 border border-white/5 shadow-lg">
                        <div className="flex items-center gap-2 mb-3 text-purple-400">
                            <Zap size={20} />
                            <span className="text-xs font-bold uppercase tracking-wide">Streak</span>
                        </div>
                        <div className="text-3xl font-black text-white">{meditationStats.streakDays} <span className="text-sm font-medium text-gray-500">Days</span></div>
                        <div className="text-xs text-gray-400">Keep it flowing</div>
                    </div>
                </div>

                {/* AI Vibe Check Transmission */}
                <div className="bg-black/40 rounded-[24px] p-6 border border-emerald-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-mono text-emerald-500/80 uppercase tracking-widest">Incoming Transmission</span>
                    </div>
                    <p className="text-emerald-50 font-mono text-sm leading-relaxed opacity-90">
                        {aiVibeCheck}
                    </p>
                </div>

                {/* Trigger Heatmap */}
                <div className="bg-[#2b2d31]/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/5 shadow-xl">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity size={20} className="text-[#FEE75C]" />
                        <h2 className="font-bold text-white">Top Triggers</h2>
                    </div>

                    <div className="space-y-4">
                        {topTriggers.length > 0 ? topTriggers.map((t, i) => (
                            <div key={t.trigger} className="relative">
                                <div className="flex justify-between text-sm mb-1 z-10 relative">
                                    <span className="font-medium text-gray-200 capitalize">{t.trigger}</span>
                                    <span className="font-mono text-gray-500">{t.count}</span>
                                </div>
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#FEE75C] opacity-80 rounded-full"
                                        style={{ width: `${(t.count / topTriggers[0].count) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-sm text-center py-4">No data yet. Keep tracking!</p>
                        )}
                    </div>
                </div>

            </div>
        </main>
    );
}
