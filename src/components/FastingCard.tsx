"use client";

import { Clock, Play, Square, Timer } from "lucide-react";
import { useState, useEffect } from "react";
import { toggleFastingWindow, getFastingState, type FastingState } from "@/app/actions";

export default function FastingCard() {
    const [state, setState] = useState<FastingState>({ isFasting: false, lastEventTime: null, durationMinutes: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getFastingState().then(setState);

        // Refresh timer every minute
        const interval = setInterval(() => {
            getFastingState().then(setState);
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const handleToggle = async () => {
        setLoading(true);
        const newState = await toggleFastingWindow();
        setState(newState);
        setLoading(false);
    };

    const formatDuration = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    return (
        <div className="glass-card flex flex-col items-center justify-between aspect-square group hover:border-t-blue-400/30 transition-all duration-300 relative overflow-hidden h-full">
            <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_15px_#60A5FA] animate-pulse"></div>
                </div>

                <div className="p-5 bg-blue-500/10 rounded-full text-blue-400 group-hover:scale-110 transition-transform duration-500 backdrop-blur-sm">
                    <Clock size={48} className="text-blue-400 glow-icon" />
                </div>
            </div>

            <div className="w-full text-center">
                <h2 className="font-bold text-xl mb-1 text-white">Fasting</h2>

                <div className="text-sm text-gray-400 mb-3 font-medium flex flex-col items-center">
                    <span className={state.isFasting ? "text-blue-400 font-bold drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]" : "text-gray-500"}>
                        {state.isFasting ? "Fasting Active" : "Eating Window"}
                    </span>
                    <div className="text-xs text-gray-500 flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 mt-1">
                        <Timer size={10} />
                        {formatDuration(state.durationMinutes)}
                    </div>
                </div>

                <button
                    onClick={handleToggle}
                    disabled={loading}
                    className={`glass-btn-primary w-full text-base font-bold h-12 px-4 whitespace-nowrap justify-center ${state.isFasting
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        : "bg-white/5 text-gray-400 hover:text-white"
                        }`}
                >
                    {loading ? "..." : state.isFasting ? (
                        <>
                            <Square size={16} fill="currentColor" /> End Fast
                        </>
                    ) : (
                        <>
                            <Play size={16} fill="currentColor" /> Start Fast
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
