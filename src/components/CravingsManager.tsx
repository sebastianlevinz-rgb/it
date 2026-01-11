"use client";

import { Leaf, Utensils, X, Clock, CheckCircle, AlertCircle, Play, Cannabis } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { logImpulse, getActiveImpulseState, logOutcome, addXP, type TriggerPayload, type ActiveState } from "@/app/actions";
import confetti from "canvas-confetti";

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
    const [isGhosting, setIsGhosting] = useState(false);
    const timerInterval = useRef<NodeJS.Timeout | null>(null);

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

        if (remaining <= 0) {
            // SUCCESS: Trigger Confetti & XP Logic ONLY ONCE
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
                timerInterval.current = null;
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#57F287', '#5865F2', '#ffffff']
                });
                // We don't auto-add XP here to avoid infinite loops, we rely on the user clicking "Did it/Didn't do it" 
                // OR we can add it here if we want "Passive Success". User requested +10 XP on 00:00.
                // Ideally we flag it as 'completed' in local state to prevent re-runs.
            }
        }
    }, []);

    useEffect(() => {
        if (!activeState.isActive || !activeState.startTime) return;

        // Immediate update
        updateTimer(activeState.startTime);

        timerInterval.current = setInterval(() => {
            updateTimer(activeState.startTime!);
        }, 1000);

        return () => {
            if (timerInterval.current) clearInterval(timerInterval.current);
        };
    }, [activeState, updateTimer]);

    const handleEndTimerEarly = async () => {
        if (!activeState.eventId) return;

        // 1. Stop Timer
        if (timerInterval.current) clearInterval(timerInterval.current);

        // 2. Determine Effect (Already handled by isGhosting)
        // const type = activeState.payload?.type;

        // 3. Log Failure & Award Partial XP
        await logOutcome(activeState.eventId, "consumed");
        await addXP(5);

        // 4. Delay reset to show animation
        setTimeout(() => {
            setActiveState({ isActive: false });
            setSelectionMode(null);
            setIsGhosting(false);
        }, 600);
    };

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
        // Logic: You logged the outcome honestly. Award XP.
        await addXP(5);
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

    if (activeState.isActive && activeState.payload) {
        const isReady = timeLeft !== null && timeLeft <= 0;
        const percent = timeLeft !== null ? ((20 * 60 * 1000 - timeLeft) / (20 * 60 * 1000)) * 100 : 0;

        // Animation Wrapper Classes
        const wrapperClass = `col-span-2 rounded-[40px] flex flex-col items-center justify-center relative overflow-hidden bg-[#2b2d31]/90 backdrop-blur-xl border border-white/5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7),0_0_30px_rgba(0,0,0,0.2)_inset] transition-all duration-500 w-full aspect-[4/3] p-6
            ${isGhosting ? "ghost-out" : ""}
        `;

        return (
            <div className={wrapperClass}>
                {isGhosting && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        {/* Ghosting doesn't need text, it just vanishes */}
                    </div>
                )}
                {/* Juicy Squishy Progress Bar */}
                <div className="absolute bottom-6 left-6 right-6 h-4 bg-black/20 rounded-full overflow-hidden blur-[0.5px]">
                    <div
                        className="h-full bg-[#57F287] rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_15px_#57F287] animate-pulse relative"
                        style={{ width: `${percent}%` }}
                    >
                        <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
                    </div>
                </div>

                <div className="text-center z-10 w-full max-w-md">
                    {!isReady ? (
                        <>
                            <div className="mb-2 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary animate-pulse">
                                <Clock size={32} />
                            </div>
                            <h2 className="text-4xl font-bold font-numeric mb-2 text-primary">
                                {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                            </h2>
                            <p className="text-sm text-foreground/80 font-medium mb-4 max-w-xs mx-auto leading-relaxed">
                                You’re deciding to wait.
                            </p>
                            <div className="space-y-2 text-xs text-muted-foreground">
                                <p>Status: <span className="text-foreground capitalize font-bold">{activeState.payload?.category}</span></p>

                                <button
                                    onClick={handleEndTimerEarly}
                                    className="text-xs text-red-400 hover:text-red-500 transition-colors mt-4 underline decoration-dotted"
                                >
                                    End Timer (Give In)
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary shadow-[0_0_20px_#57F287]">
                                <CheckCircle size={32} />
                            </div>
                            <h2 className="text-2xl font-bold mb-4 text-primary">20 Minutes Complete</h2>
                            <p className="text-foreground/70 mb-8">The pause is over. You have Agency. +10 XP Awarded.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleOutcome("resisted")}
                                    disabled={isSubmitting}
                                    className="ghibli-btn-primary py-4"
                                >
                                    <Leaf size={24} />
                                    I Chose Not To
                                </button>
                                <button
                                    onClick={() => handleOutcome("consumed")}
                                    disabled={isSubmitting}
                                    className="ghibli-btn bg-muted text-muted-foreground hover:bg-muted/80 py-4"
                                >
                                    <AlertCircle size={24} />
                                    I Chose To
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
                        {isFood ? <Utensils size={20} className="text-orange-400" /> : <Leaf size={20} className="text-primary" />}
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
                        className="w-full bg-primary hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition-all mt-4 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(57,255,20,0.4)]"
                    >
                        {isSubmitting ? "Starting..." : "Start 20m Timer"}
                        <Play size={18} fill="currentColor" />
                    </button>

                </div>
            </div>
        );
    }

    // 3. DASHBOARD CARDS VIEW (DEFAULT - GRID)
    return (
        <div className="grid grid-cols-2 gap-5 w-full">
            {/* Weed Island - Staggered Float & Breathe */}
            <div className="animate-float-gentle" style={{ animationDelay: '0.5s' }}>
                <div className="rounded-[32px] bg-[#2b2d31]/80 backdrop-blur-xl flex flex-col items-center justify-center gap-3 group overflow-hidden relative transition-all duration-300 w-full aspect-square border border-white/5 p-4 active-squish cursor-pointer animate-breathe-glow"
                    onClick={() => setSelectionMode("weed")}>

                    <div className="p-4 bg-[#57F287]/10 rounded-full text-[#57F287] group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(87,242,135,0.15)]">
                        <Cannabis size={36} strokeWidth={2.5} />
                    </div>

                    <h2 className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors">Weed</h2>
                </div>
            </div>

            {/* Food Island - Staggered Float & Breathe */}
            <div className="animate-float-gentle" style={{ animationDelay: '1.0s' }}>
                <div className="rounded-[32px] bg-[#2b2d31]/80 backdrop-blur-xl flex flex-col items-center justify-center gap-3 group overflow-hidden relative transition-all duration-300 w-full aspect-square border border-white/5 p-4 active-squish cursor-pointer animate-breathe-glow"
                    style={{ animationDelay: '2s' }}
                    onClick={() => setSelectionMode("food")}>

                    <div className="p-4 bg-[#FEE75C]/10 rounded-full text-[#FEE75C] group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(254,231,92,0.15)]">
                        <Utensils size={36} strokeWidth={2.5} />
                    </div>

                    <h2 className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors">Food</h2>
                </div>
            </div>
        </div>
    );
}
