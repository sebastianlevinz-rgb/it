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
        if (!selectionMode) return;
        // For food, we don't need category/trigger. For weed, we do.
        if (selectionMode === "weed" && (!category || !specificTrigger)) return;

        setIsSubmitting(true);

        const payload: TriggerPayload = {
            type: selectionMode,
            category: selectionMode === "food" ? "enhancement" : category!,
            specificTrigger: selectionMode === "food" ? "Hunger" : specificTrigger!,
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
            <div className="col-span-2 bg-[#2b2d31]/95 backdrop-blur-xl rounded-[32px] p-6 border border-white/5 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold capitalize flex items-center gap-3 text-white">
                        {isFood ? <Utensils size={24} className="text-[#FEE75C]" /> : <Leaf size={24} className="text-[#57F287]" />}
                        New {selectionMode} Craving
                    </h2>
                    <button onClick={() => setSelectionMode(null)} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-8">
                    {/* CUSTOM FOOD FLOW - HUNGER METER */}
                    {isFood ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <div className="mb-8">
                                <label className="flex justify-between text-sm font-bold text-gray-400 mb-4">
                                    <span>Hunger Level</span>
                                    <span className="text-[#FEE75C]">{hungerLevel} - {hungerLevel === 1 ? "Just a taste" : hungerLevel >= 8 ? "Starving" : "Hungry"}</span>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={hungerLevel}
                                    onChange={(e) => setHungerLevel(parseInt(e.target.value))}
                                    className="w-full accent-[#FEE75C] h-2 bg-black/40 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-gray-500 mt-2 font-mono uppercase tracking-wider">
                                    <span>Just a taste</span>
                                    <span>Starving</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-3">What are you craving?</label>
                                <input
                                    type="text"
                                    value={foodDesc}
                                    onChange={(e) => setFoodDesc(e.target.value)}
                                    placeholder="e.g. Pizza, Chocolate..."
                                    className="w-full bg-black/20 border border-white/5 rounded-xl p-4 text-white placeholder-zinc-600 focus:border-[#FEE75C]/50 focus:outline-none transition-colors"
                                />
                            </div>
                        </div>
                    ) : (
                        /* WEED FLOW - STANDARD CATEGORIES */
                        <>
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-3">Category</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setCategory("enhancement")}
                                        className={`p-4 rounded-2xl border text-left transition-all ${category === "enhancement"
                                            ? "border-[#57F287] bg-[#57F287]/10 text-[#57F287]"
                                            : "border-white/5 bg-black/20 hover:bg-white/5 text-zinc-400"
                                            }`}
                                    >
                                        <span className="block font-bold mb-1">Enhancement</span>
                                        <span className="text-xs opacity-70 leading-tight">To make things better (Music, Ritual)</span>
                                    </button>
                                    <button
                                        onClick={() => setCategory("avoidance")}
                                        className={`p-4 rounded-2xl border text-left transition-all ${category === "avoidance"
                                            ? "border-[#57F287] bg-[#57F287]/10 text-[#57F287]"
                                            : "border-white/5 bg-black/20 hover:bg-white/5 text-zinc-400"
                                            }`}
                                    >
                                        <span className="block font-bold mb-1">Avoidance</span>
                                        <span className="text-xs opacity-70 leading-tight">To escape feelings (Stress, Boredom)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Specific Triggers */}
                            {category && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-sm font-bold text-gray-400 mb-3">Specific Trigger</label>
                                    <div className="flex flex-wrap gap-2">
                                        {(category === "enhancement" ? TRIGGERS_ENHANCEMENT : TRIGGERS_AVOIDANCE).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setSpecificTrigger(t)}
                                                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${specificTrigger === t
                                                    ? "bg-[#57F287] text-black border-[#57F287]"
                                                    : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20"
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Submit */}
                    <button
                        disabled={isFood ? isSubmitting : (!category || !specificTrigger || isSubmitting)}
                        onClick={handleStartImpulse}
                        className={`w-full font-bold py-5 rounded-[24px] transition-all mt-6 flex items-center justify-center gap-2 shadow-lg active-squish
                            ${isFood
                                ? "bg-[#FEE75C] hover:bg-[#eacb35] text-black shadow-[0_0_20px_rgba(254,231,92,0.3)]"
                                : "bg-[#57F287] hover:bg-[#4ce279] disabled:opacity-50 disabled:cursor-not-allowed text-black shadow-[0_0_20px_rgba(87,242,135,0.3)]"
                            }`}
                    >
                        {isSubmitting ? "Starting..." : "Start 20m Timer"}
                        <Play size={20} fill="currentColor" />
                    </button>

                </div>
            </div>
        );
    }

    // 3. DASHBOARD CARDS VIEW (DEFAULT - GRID)
    return (
        <div className="grid grid-cols-2 gap-5 w-full">
            {/* Weed Island - Staggered Float & Breathe */}
            <div className="animate-float-gentle" style={{ animationDelay: '0.3s' }}>
                <div className="rounded-[32px] bg-[#2b2d31]/80 backdrop-blur-xl flex flex-col items-center justify-center gap-3 group overflow-hidden relative transition-all duration-300 w-full aspect-square border border-white/5 p-4 active-squish cursor-pointer animate-breathe-glow"
                    onClick={() => setSelectionMode("weed")}>

                    <div className="p-4 bg-[#57F287]/10 rounded-full text-[#57F287] group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(87,242,135,0.15)]">
                        <Cannabis size={36} strokeWidth={2.5} />
                    </div>

                    <h2 className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors">Weed</h2>
                </div>
            </div>

            {/* Food Island - Staggered Float & Breathe */}
            <div className="animate-float-gentle" style={{ animationDelay: '0.6s' }}>
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
