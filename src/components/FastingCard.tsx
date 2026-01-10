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
        <div className="bg-card rounded-xl p-4 flex flex-col justify-between aspect-square border border-muted hover:border-gray-700 transition-colors">
            <div className="p-2 bg-blue-900/30 w-fit rounded-lg text-blue-400">
                <Clock size={24} />
            </div>

            <div>
                <h2 className="font-semibold text-lg mb-1">Fasting</h2>

                <div className="text-sm text-gray-400 mb-3">
                    Status: <span className={state.isFasting ? "text-blue-400 font-bold" : "text-white font-medium"}>
                        {state.isFasting ? "Fasting" : "Eating Window"}
                    </span>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Timer size={12} />
                        {formatDuration(state.durationMinutes)}
                    </div>
                </div>

                <button
                    onClick={handleToggle}
                    disabled={loading}
                    className={`w-full text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${state.isFasting
                            ? "bg-blue-600 hover:bg-blue-500"
                            : "bg-zinc-700 hover:bg-zinc-600"
                        }`}
                >
                    {loading ? "..." : state.isFasting ? (
                        <>
                            <Play size={14} /> Start Eating
                        </>
                    ) : (
                        <>
                            <Square size={14} fill="currentColor" /> End Eating
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
