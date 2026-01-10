"use client";

import { Leaf, Utensils, X, Clock, CheckCircle, AlertCircle, Play } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { logImpulse, getActiveImpulseState, logOutcome, type TriggerPayload, type ActiveState } from "@/app/actions";

const TRIGGERS_ENHANCEMENT = ["Music", "Movies", "Gaming", "Age of Empires", "Socializing", "Sex", "Creativity", "Nature", "Chocolate"];
const TRIGGERS_AVOIDANCE = ["Boredom", "Stress", "Anxiety", "Sadness", "Loneliness", "Tiredness", "Procrastination", "Late-night Snacking"];

export default function CravingsManager() {
    const [activeState, setActiveState] = useState<ActiveState>({ isActive: false });
    const [selectionMode, setSelectionMode] = useState<"weed" | "food" | null>(null);

    // Selection Form State
    const [category, setCategory] = useState<"enhancement" | "avoidance" | null>(null);
    const [specificTrigger, setSpecificTrigger] = useState<string | null>(null);
    const [hungerLevel, setHungerLevel] = useState<number>(3); // 1-5
    const [foodDesc, setFoodDesc] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Timer State
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // Load initial state
    useEffect(() => {
        getActiveImpulseState().then((state) => {
            setActiveState(state);
            if (state.isActive && state.startTime) {
                updateTimer(state.startTime);
            }
        });
    }, []);

    // Timer Logic
    const updateTimer = useCallback((startTime: Date) => {
        const start = new Date(startTime).getTime();
        const now = new Date().getTime();
        const elapsed = now - start;
        const duration = 20 * 60 * 1000; // 20 minutes
        const remaining = Math.max(0, duration - elapsed);

        setTimeLeft(remaining);
    }, []);

    useEffect(() => {
        if (!activeState.isActive || !activeState.startTime) return;

        // Immediate update
        updateTimer(activeState.startTime);

        const interval = setInterval(() => {
            updateTimer(activeState.startTime!);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeState, updateTimer]);

    const handleStartImpulse = async () => {
        if (!selectionMode || !category || !specificTrigger) return;
        setIsSubmitting(true);

        const payload: TriggerPayload = {
            type: selectionMode,
            category,
            specificTrigger,
            foodDetails: selectionMode === "food" ? { hungerLevel, description: foodDesc } : undefined,
        };

        const event = await logImpulse(payload);
        setActiveState({
            isActive: true,
            startTime: new Date(),
            eventId: event.id,
            payload,
        });
        setSelectionMode(null);
        setCategory(null);
        setSpecificTrigger(null);
        setIsSubmitting(false);
    };

    const handleOutcome = async (outcome: "consumed" | "resisted") => {
        if (!activeState.eventId) return;
        setIsSubmitting(true);
        await logOutcome(activeState.eventId, outcome);
        setActiveState({ isActive: false });
        setIsSubmitting(false);
    };

    // ---------------- RENDER HELPERS ----------------

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    // 1. ACTIVE TIMER / OUTCOME VIEW
    if (activeState.isActive && activeState.payload) {
        const isReady = timeLeft !== null && timeLeft <= 0;
        const percent = timeLeft !== null ? ((20 * 60 * 1000 - timeLeft) / (20 * 60 * 1000)) * 100 : 0;

        return (
            <div className="col-span-2 bg-card rounded-xl p-6 border border-primary/20 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
                {/* Progress Background */}
                <div
                    className="absolute bottom-0 left-0 h-1 bg-primary/30 transition-all duration-1000"
                    style={{ width: `${percent}%` }}
                />

                <div className="text-center z-10 w-full max-w-md">
                    {!isReady ? (
                        <>
                            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary animate-pulse">
                                <Clock size={32} />
                            </div>
                            <h2 className="text-4xl font-mono font-bold font-numeric mb-2">
                                {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                            </h2>
                            <p className="text-lg text-gray-300 font-medium mb-6">
                                You’re not deciding not to {activeState.payload.type === "weed" ? "smoke" : "eat"}.<br />
                                <span className="text-primary">You’re deciding to wait.</span>
                            </p>
                            <div className="space-y-4 text-sm text-gray-500">
                                <p>Status: <span className="text-white capitalize">{activeState.payload.category} ({activeState.payload.specificTrigger})</span></p>
                                <p>Observe the craving. Does it change?</p>

                                <button
                                    onClick={() => setTimeLeft(0)}
                                    className="text-xs text-red-900/40 hover:text-red-500 transition-colors mt-8 underline decoration-dotted"
                                >
                                    I need to act now (End Timer)
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400">
                                <CheckCircle size={32} />
                            </div>
                            <h2 className="text-2xl font-bold mb-4">20 Minutes Complete</h2>
                            <p className="text-gray-400 mb-8">The pause is over. You have Agency. What do you choose?</p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleOutcome("resisted")}
                                    disabled={isSubmitting}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-semibold transition-colors flex flex-col items-center justify-center gap-2"
                                >
                                    <Leaf size={24} />
                                    Didn't Do It
                                </button>
                                <button
                                    onClick={() => handleOutcome("consumed")}
                                    disabled={isSubmitting}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white py-4 rounded-xl font-semibold transition-colors flex flex-col items-center justify-center gap-2"
                                >
                                    <AlertCircle size={24} />
                                    Did It
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // 2. TRIGGER SELECTION VIEW
    if (selectionMode) {
        const isFood = selectionMode === "food";

        return (
            <div className="col-span-2 bg-card rounded-xl p-4 border border-muted">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold capitalize flex items-center gap-2">
                        {isFood ? <Utensils size={20} className="text-orange-400" /> : <Leaf size={20} className="text-emerald-400" />}
                        New {selectionMode} Craving
                    </h2>
                    <button onClick={() => setSelectionMode(null)} className="p-2 hover:bg-zinc-800 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Category */}
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">Category</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setCategory("enhancement")}
                                className={`p-3 rounded-lg border text-left transition-all ${category === "enhancement"
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-muted hover:border-gray-600"
                                    }`}
                            >
                                <span className="block font-medium mb-1">Enhancement</span>
                                <span className="text-xs opacity-70">To make things better (Music, Ritual)</span>
                            </button>
                            <button
                                onClick={() => setCategory("avoidance")}
                                className={`p-3 rounded-lg border text-left transition-all ${category === "avoidance"
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-muted hover:border-gray-600"
                                    }`}
                            >
                                <span className="block font-medium mb-1">Avoidance</span>
                                <span className="text-xs opacity-70">To escape feelings (Stress, Boredom)</span>
                            </button>
                        </div>
                    </div>

                    {/* Specific Triggers */}
                    {category && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm text-gray-500 mb-2">Specific Trigger</label>
                            <div className="flex flex-wrap gap-2">
                                {(category === "enhancement" ? TRIGGERS_ENHANCEMENT : TRIGGERS_AVOIDANCE).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setSpecificTrigger(t)}
                                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${specificTrigger === t
                                            ? "bg-white text-black border-white"
                                            : "border-gray-700 text-gray-300 hover:border-gray-500"
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Food Extras */}
                    {isFood && (
                        <div className="space-y-4 pt-4 border-t border-muted animate-in fade-in">
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Hunger Level (1-5)</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={hungerLevel}
                                    onChange={(e) => setHungerLevel(parseInt(e.target.value))}
                                    className="w-full accent-primary h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Not Hungry</span>
                                    <span>Starving</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">What are you craving?</label>
                                <input
                                    type="text"
                                    value={foodDesc}
                                    onChange={(e) => setFoodDesc(e.target.value)}
                                    placeholder="e.g. Pizza, Chocolate..."
                                    className="w-full bg-zinc-900 border border-muted rounded-lg p-3 text-sm focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        disabled={!category || !specificTrigger || isSubmitting}
                        onClick={handleStartImpulse}
                        className="w-full bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all mt-4 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? "Starting..." : "Start 20m Timer"}
                        <Play size={18} fill="currentColor" />
                    </button>

                </div>
            </div>
        );
    }

    // 3. DASHBOARD CARDS VIEW (DEFAULT)
    return (
        <>
            {/* Weed Card */}
            <div className="bg-card rounded-xl p-4 flex flex-col justify-between aspect-square border border-muted hover:border-gray-700 transition-colors">
                <div className="p-2 bg-emerald-900/30 w-fit rounded-lg text-emerald-400">
                    <Leaf size={24} />
                </div>
                <div>
                    <h2 className="font-semibold text-lg mb-1">Weed</h2>
                    <button
                        onClick={() => setSelectionMode("weed")}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                    >
                        I feel an impulse
                    </button>
                </div>
            </div>

            {/* Food Card */}
            <div className="bg-card rounded-xl p-4 flex flex-col justify-between aspect-square border border-muted hover:border-gray-700 transition-colors">
                <div className="p-2 bg-orange-900/30 w-fit rounded-lg text-orange-400">
                    <Utensils size={24} />
                </div>
                <div>
                    <h2 className="font-semibold text-lg mb-1">Food</h2>
                    <button
                        onClick={() => setSelectionMode("food")}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                    >
                        New Craving
                    </button>
                </div>
            </div>
        </>
    );
}
