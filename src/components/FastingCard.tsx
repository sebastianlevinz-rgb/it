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
        <div className="ghibli-card flex flex-col justify-between aspect-square group bg-white/60">
            <div className="p-3 bg-blue-100/50 w-fit rounded-xl text-blue-600 group-hover:scale-110 transition-transform duration-300">
                <Clock size={28} />
            </div>

            <div>
                <h2 className="font-bold text-lg mb-2 text-foreground">Fasting</h2>

                <div className="text-sm text-muted-foreground mb-4 font-medium">
                    Status: <span className={state.isFasting ? "text-blue-600 font-bold" : "text-primary font-bold"}>
                        {state.isFasting ? "Fasting" : "Eating Window"}
                    </span>
                    <div className="text-xs text-muted-foreground/80 mt-1 flex items-center gap-1">
                        <Timer size={12} />
                        {formatDuration(state.durationMinutes)}
                    </div>
                </div>

                <button
                    onClick={handleToggle}
                    disabled={loading}
                    className={`w-full text-sm font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${state.isFasting
                        ? "bg-blue-100 hover:bg-blue-200 text-blue-700"
                        : "bg-primary/10 hover:bg-primary/20 text-primary"
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
