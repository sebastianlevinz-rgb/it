"use client";

import { Leaf, Award, Timer, TrendingUp, BarChart as BarIcon, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { getInsightsData, type InsightsData } from "@/app/actions";
import BottomNav from "@/components/BottomNav";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

const COLORS = {
    moonlight: "#e2e8f0",
    star: "#fde047",
    moss: "#4ade80",
    midnight: "#1e293b",
    transparent: "rgba(255,255,255,0.1)"
};

export default function InsightsPage() {
    const [data, setData] = useState<InsightsData | null>(null);

    useEffect(() => {
        getInsightsData().then(setData);
    }, []);

    if (!data) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-[#94a3b8] animate-pulse">Aligning stars...</div>;

    const isEmpty = data.agencyScore === 0 && data.topTriggers.length === 0;

    return (
        <main className="min-h-screen pb-24 p-6 bg-gradient-to-b from-[#0f172a] to-[#064e3b] bg-noise text-[#e2e8f0]">
            <header className="mb-10 mt-4 z-content">
                <h1 className="text-3xl font-serif font-bold tracking-tight text-[#f1f5f9] drop-shadow-md">Insights</h1>
                <p className="text-[#94a3b8] text-sm font-serif italic opacity-80 mt-1">Patterns from the night sky.</p>
            </header>

            {isEmpty ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center z-content">
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full animate-pulse" />
                        <ShieldCheck size={48} className="text-[#fde047]/80 relative z-10" />
                    </div>
                    <p className="text-[#e2e8f0] font-serif text-lg max-w-xs leading-relaxed opacity-90">
                        The stars are still aligning. <br />
                        Keep logging your impulses to see your patterns emerge.
                    </p>
                </div>
            ) : (
                <div className="space-y-8 z-content">

                    {/* Agency Score (Pie) */}
                    <div className="bg-[#0f172a]/40 backdrop-blur-md rounded-2xl p-6 border border-[#e2e8f0]/10 shadow-xl">
                        <h2 className="text-[#a5b4fc] font-serif font-medium mb-6 flex items-center gap-2">
                            <Award size={18} /> Agency Score
                        </h2>
                        <div className="h-48 relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[{ name: 'Agency', value: data.agencyScore }, { name: 'Impulse', value: 100 - data.agencyScore }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        startAngle={90}
                                        endAngle={-270}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell fill={COLORS.moss} />
                                        <Cell fill={COLORS.transparent} />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold font-numeric text-[#f0fdf4] drop-shadow-lg">{data.agencyScore}%</span>
                            </div>
                        </div>
                        <p className="text-center text-xs text-[#94a3b8] mt-2 font-serif italic">Resisted impulses vs. consumed.</p>
                    </div>

                    {/* Trigger Distribution (Bar) */}
                    <div className="bg-[#0f172a]/40 backdrop-blur-md rounded-2xl p-6 border border-[#e2e8f0]/10 shadow-xl">
                        <h2 className="text-[#fde047] font-serif font-medium mb-6 flex items-center gap-2">
                            <TrendingUp size={18} /> Trigger Nature
                        </h2>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.triggerDistribution} layout="vertical" margin={{ left: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="category" type="category" width={100} tick={{ fill: '#e2e8f0', fontSize: 12, fontFamily: 'serif' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#e2e8f0' }} />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                                        <Cell fill="#60a5fa" /> {/* Enhancement */}
                                        <Cell fill="#f87171" /> {/* Avoidance */}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Peak Hours (Bar) */}
                    <div className="bg-[#0f172a]/40 backdrop-blur-md rounded-2xl p-6 border border-[#e2e8f0]/10 shadow-xl">
                        <h2 className="text-[#fb923c] font-serif font-medium mb-6 flex items-center gap-2">
                            <BarIcon size={18} /> Peak Hours
                        </h2>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.peakHours}>
                                    <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#e2e8f0' }} />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#fb923c" opacity={0.8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Fasting (Simple Card) */}
                    <div className="bg-[#0f172a]/40 backdrop-blur-md rounded-2xl p-6 border border-[#e2e8f0]/10 shadow-xl flex items-center justify-between">
                        <div>
                            <h2 className="text-[#38bdf8] font-serif font-medium mb-1 flex items-center gap-2">
                                <Timer size={18} /> Fasting Avg
                            </h2>
                            <p className="text-xs text-[#94a3b8]">Average duration per session</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold font-numeric text-[#e0f2fe]">{data.fastingAverage}</span>
                            <span className="text-sm text-[#bae6fd] ml-1">hrs</span>
                        </div>
                    </div>

                </div>
            )}

            <BottomNav />
        </main>
    );
}
