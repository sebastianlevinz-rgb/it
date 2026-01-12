"use client";

import { Leaf, Utensils, X, Clock, CheckCircle, AlertCircle, Play, Cannabis } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { logImpulse, getActiveImpulseState, logOutcome, addXP, type TriggerPayload, type ActiveState } from "@/app/actions";
import confetti from "canvas-confetti";

const TRIGGERS_ENHANCEMENT = ["Music", "Movies", "Gaming", "Socializing", "Creativity"];
const TRIGGERS_AVOIDANCE = ["Stress", "Boredom", "Anxiety", "Fatigue", "Loneliness"];

export default function CravingsManager({ onModalChange }: { onModalChange?: (isOpen: boolean) => void }) {
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

    // Sync Modal State with Parent
    useEffect(() => {
        if (onModalChange) {
            onModalChange(!!selectionMode);
        }
    }, [selectionMode, onModalChange]);

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

        // Animation Wrapper Classes - Glass Panel
        const wrapperClass = `col-span-2 glass-panel flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 w-full min-h-[400px] p-6 pb-12
            ${isGhosting ? "ghost-out" : ""}
        `;

        return (
            <div className={wrapperClass}>
                {isGhosting && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"></div>
                )}
                {/* Crystal Progress Bar */}
                <div className="absolute bottom-6 left-6 right-6 h-2 crystal-tube">
                    <div
                        className="h-full liquid-fill transition-all duration-1000 ease-in-out relative rounded-full"
                        style={{ width: `${percent}%` }}
                    ></div>
                </div>

                <div className="text-center z-10 w-full max-w-md flex-1 flex flex-col justify-center">
                    {!isReady ? (
                        <>
                            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full border border-white/50 bg-white/20 text-[#1A202C] animate-pulse mx-auto shadow-inner">
                                <Clock size={32} strokeWidth={1} />
                            </div>
                            <h2 className="text-4xl font-light tracking-tighter mb-2 text-[#1A202C]">
                                {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                            </h2>
                            <p className="text-sm text-[#4A5568] font-light mb-4 max-w-xs mx-auto leading-relaxed uppercase tracking-widest opacity-80">
                                Awareness is the key
                            </p>
                            <div className="space-y-4 text-xs text-[#4A5568] w-full">
                                <p>Status: <span className="text-[#1A202C] capitalize font-semibold">{activeState.payload?.category}</span></p>

                                <button
                                    onClick={handleEndTimerEarly}
                                    className="w-full py-4 px-8 mt-5 rounded-full border border-red-400/30 bg-red-400/5 text-red-500 font-medium tracking-widest uppercase text-xs hover:bg-red-400/10 active:scale-95 transition-all"
                                >
                                    End Session Early
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full border border-white/60 bg-white/30 text-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                                <CheckCircle size={32} strokeWidth={1} />
                            </div>
                            <h2 className="text-2xl font-light mb-4 text-[#1A202C]">Window of Clarity</h2>
                            <p className="text-[#4A5568] mb-8 font-light">The urge has passed. You are free to choose.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleOutcome("resisted")}
                                    disabled={isSubmitting}
                                    className="btn-glass py-4 text-sm"
                                >
                                    <Leaf size={20} className="text-[#38BDF8]" />
                                    Resist
                                </button>
                                <button
                                    onClick={() => handleOutcome("consumed")}
                                    disabled={isSubmitting}
                                    className="btn-glass py-4 text-sm opacity-70 hover:opacity-100"
                                >
                                    <Utensils size={20} className="text-[#F472B6]" />
                                    Consume
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
            <div className="col-span-2 glass-panel animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8 border-b border-white/20 pb-4">
                    <h2 className="text-xl font-light capitalize flex items-center gap-3 text-[#1A202C]">
                        {isFood ? <Utensils size={24} className="text-[#F472B6]" strokeWidth={1.5} /> : <Leaf size={24} className="text-[#38BDF8]" strokeWidth={1.5} />}
                        New {selectionMode}
                    </h2>
                    <button onClick={() => setSelectionMode(null)} className="p-2 hover:bg-white/20 rounded-full text-[#4A5568] transition-colors">
                        <X size={20} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="space-y-8">
                    {/* CUSTOM FOOD FLOW - HUNGER METER */}
                    {isFood ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <div className="mb-8">
                                <label className="flex justify-between text-sm font-semibold text-[#4A5568] mb-4">
                                    <span>Hunger Level</span>
                                    <span className="text-[#1A202C]">{hungerLevel} - {hungerLevel === 1 ? "Just a taste" : hungerLevel >= 8 ? "Starving" : "Hungry"}</span>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={hungerLevel}
                                    onChange={(e) => setHungerLevel(parseInt(e.target.value))}
                                    className="w-full accent-[#F472B6] h-1 bg-white/40 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-[#A0AEC0] mt-2 font-mono uppercase tracking-wider">
                                    <span>Just a taste</span>
                                    <span>Starving</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#4A5568] mb-3">What creates this desire?</label>
                                <input
                                    type="text"
                                    value={foodDesc}
                                    onChange={(e) => setFoodDesc(e.target.value)}
                                    placeholder="e.g. Pizza, Chocolate..."
                                    className="w-full bg-white/30 border border-white/50 rounded-xl p-4 text-[#1A202C] placeholder-[#A0AEC0] focus:border-[#F472B6]/50 focus:outline-none transition-colors backdrop-blur-sm"
                                />
                            </div>
                        </div>
                    ) : (
                        /* WEED FLOW - STANDARD CATEGORIES */
                        <>
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-[#4A5568] mb-3">Category</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setCategory("enhancement")}
                                        className={`p-4 rounded-2xl border text-center transition-all ${category === "enhancement"
                                            ? "border-[#38BDF8] bg-[#38BDF8]/10 text-[#0c4a6e]"
                                            : "border-white/30 bg-white/10 hover:bg-white/20 text-[#4A5568]"
                                            }`}
                                    >
                                        <span className="block font-medium leading-tight" style={{ fontSize: 'clamp(0.8rem, 4vw, 1.125rem)' }}>Enhancement</span>
                                    </button>
                                    <button
                                        onClick={() => setCategory("avoidance")}
                                        className={`p-4 rounded-2xl border text-center transition-all ${category === "avoidance"
                                            ? "border-[#F472B6] bg-[#F472B6]/10 text-[#831843]"
                                            : "border-white/30 bg-white/10 hover:bg-white/20 text-[#4A5568]"
                                            }`}
                                    >
                                        <span className="block font-medium leading-tight" style={{ fontSize: 'clamp(0.8rem, 4vw, 1.125rem)' }}>Avoidance</span>
                                    </button>
                                </div>
                            </div>

                            {/* Specific Triggers */}
                            {category && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-sm font-semibold text-[#4A5568] mb-3">Specific Trigger</label>
                                    <div className="flex flex-wrap gap-2">
                                        {(category === "enhancement" ? TRIGGERS_ENHANCEMENT : TRIGGERS_AVOIDANCE).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setSpecificTrigger(t)}
                                                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${specificTrigger === t
                                                    ? "bg-[#38BDF8]/20 text-[#0c4a6e] border-[#38BDF8]"
                                                    : "border-white/30 bg-white/10 text-[#4A5568] hover:bg-white/20"
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
                        className={`w-full font-light py-5 transition-all mt-6 flex items-center justify-center gap-2 shadow-lg backdrop-blur-md rounded-2xl
                            ${isFood ? "bg-[#F472B6]/80 text-white hover:bg-[#F472B6]" : "bg-[#38BDF8]/80 text-white hover:bg-[#38BDF8]"}`}
                    >
                        {isSubmitting ? "Beginning..." : "Start 20m Timer"}
                        <Clock size={20} fill="none" strokeWidth={2} />
                    </button>

                </div>
            </div>
        );
    }

    // 3. DASHBOARD CARDS VIEW (DEFAULT - GRID)
    return (
        <div className="grid grid-cols-2 gap-5 w-full">
            {/* Weed Bubble - Glass */}
            <div className="animate-float" style={{ animationDelay: '0.3s' }}>
                <div className="btn-glass flex flex-col items-center justify-center gap-3 group relative transition-all duration-300 w-full aspect-square p-4 cursor-pointer !rounded-[32px] hover:bg-white/60"
                    onClick={() => setSelectionMode("weed")}>

                    <div className="p-3 bg-[#38BDF8]/10 rounded-full text-[#38BDF8] group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                        <Cannabis size={32} strokeWidth={1.5} />
                    </div>

                    <h2 className="font-light text-lg text-[#1A202C]">Weed</h2>
                </div>
            </div>

            {/* Food Bubble - Glass */}
            <div className="animate-float" style={{ animationDelay: '0.6s' }}>
                <div className="btn-glass flex flex-col items-center justify-center gap-3 group relative transition-all duration-300 w-full aspect-square p-4 cursor-pointer !rounded-[32px] hover:bg-white/60"
                    onClick={() => setSelectionMode("food")}>

                    <div className="p-3 bg-[#F472B6]/10 rounded-full text-[#F472B6] group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(244,114,182,0.2)]">
                        <Utensils size={32} strokeWidth={1.5} />
                    </div>

                    <h2 className="font-light text-lg text-[#1A202C]">Food</h2>
                </div>
            </div>
        </div>
    );
}
