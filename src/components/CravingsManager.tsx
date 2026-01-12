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

        // Animation Wrapper Classes - Analog Paper ID Card
        const wrapperClass = `col-span-2 organic-card flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 w-full min-h-[400px] p-6 pb-12
            ${isGhosting ? "ghost-out" : ""}
        `;

        return (
            <div className={wrapperClass}>
                {isGhosting && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"></div>
                )}
                {/* Organic Progress Bar (Vine) */}
                <div className="absolute bottom-6 left-6 right-6 h-3 bg-[#E6DDC6] rounded-full overflow-hidden border border-[#2C4C3B]/20">
                    <div
                        className="h-full bg-[#2C4C3B] rounded-full transition-all duration-1000 ease-in-out relative"
                        style={{ width: `${percent}%` }}
                    ></div>
                </div>

                <div className="text-center z-10 w-full max-w-md flex-1 flex flex-col justify-center">
                    {!isReady ? (
                        <>
                            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-[#2C4C3B] text-[#2C4C3B] animate-pulse mx-auto">
                                <Clock size={32} />
                            </div>
                            <h2 className="text-4xl font-bold font-serif mb-2 text-[#2C4C3B]">
                                {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                            </h2>
                            <p className="text-sm text-[#5D4037] font-medium mb-4 max-w-xs mx-auto leading-relaxed italic font-serif">
                                "Patience is a form of action."
                            </p>
                            <div className="space-y-4 text-xs text-[#5D4037] w-full">
                                <p>Status: <span className="text-[#2C4C3B] capitalize font-bold">{activeState.payload?.category}</span></p>

                                <button
                                    onClick={handleEndTimerEarly}
                                    className="w-full py-4 px-8 mt-5 rounded-full border-2 border-[#C68E73] bg-[#C68E73]/10 text-[#C68E73] font-bold tracking-widest uppercase text-xs hover:bg-[#C68E73]/20 active:scale-95 transition-all"
                                >
                                    End Session Early
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-[#A3C5A3] bg-[#A3C5A3]/20 text-[#2C4C3B]">
                                <CheckCircle size={32} />
                            </div>
                            <h2 className="text-2xl font-bold font-serif mb-4 text-[#2C4C3B]">Action Window Open</h2>
                            <p className="text-[#5D4037] mb-8 font-serif">You have waited. The choice is now yours.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleOutcome("resisted")}
                                    disabled={isSubmitting}
                                    className="btn-sage py-4 text-sm"
                                >
                                    <Leaf size={20} />
                                    Resist
                                </button>
                                <button
                                    onClick={() => handleOutcome("consumed")}
                                    disabled={isSubmitting}
                                    className="btn-terracotta py-4 text-sm"
                                >
                                    <Utensils size={20} />
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
            <div className="col-span-2 organic-card animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8 border-b-2 border-[#2C4C3B]/10 pb-4">
                    <h2 className="text-xl font-bold capitalize flex items-center gap-3 text-[#2C4C3B] font-serif">
                        {isFood ? <Utensils size={24} className="text-[#C68E73]" /> : <Leaf size={24} className="text-[#A3C5A3]" />}
                        New {selectionMode}
                    </h2>
                    <button onClick={() => setSelectionMode(null)} className="p-2 hover:bg-[#2C4C3B]/5 rounded-full text-[#5D4037] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-8">
                    {/* CUSTOM FOOD FLOW - HUNGER METER */}
                    {isFood ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <div className="mb-8">
                                <label className="flex justify-between text-sm font-bold text-[#5D4037] mb-4 font-serif">
                                    <span>Hunger Level</span>
                                    <span className="text-[#2C4C3B]">{hungerLevel} - {hungerLevel === 1 ? "Just a taste" : hungerLevel >= 8 ? "Starving" : "Hungry"}</span>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={hungerLevel}
                                    onChange={(e) => setHungerLevel(parseInt(e.target.value))}
                                    className="w-full accent-[#C68E73] h-2 bg-[#E6DDC6] rounded-lg appearance-none cursor-pointer border border-[#2C4C3B]/20"
                                />
                                <div className="flex justify-between text-[10px] text-[#5D4037] mt-2 font-mono uppercase tracking-wider">
                                    <span>Just a taste</span>
                                    <span>Starving</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#5D4037] mb-3 font-serif">What creates this desire?</label>
                                <input
                                    type="text"
                                    value={foodDesc}
                                    onChange={(e) => setFoodDesc(e.target.value)}
                                    placeholder="e.g. Pizza, Chocolate..."
                                    className="w-full bg-white border-2 border-[#2C4C3B]/20 rounded-xl p-4 text-[#2C4C3B] placeholder-[#A3C5A3] focus:border-[#C68E73] focus:outline-none transition-colors font-serif"
                                />
                            </div>
                        </div>
                    ) : (
                        /* WEED FLOW - STANDARD CATEGORIES */
                        <>
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-bold text-[#5D4037] mb-3 font-serif">Category</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setCategory("enhancement")}
                                        className={`p-4 rounded-2xl border-2 text-center transition-all ${category === "enhancement"
                                            ? "border-[#A3C5A3] bg-[#A3C5A3]/20 text-[#2C4C3B]"
                                            : "border-[#2C4C3B]/10 bg-white hover:bg-[#F8F4E3] text-[#5D4037]"
                                            }`}
                                    >
                                        <span className="block font-bold leading-tight font-serif" style={{ fontSize: 'clamp(0.8rem, 4vw, 1.125rem)' }}>Enhancement</span>
                                    </button>
                                    <button
                                        onClick={() => setCategory("avoidance")}
                                        className={`p-4 rounded-2xl border-2 text-center transition-all ${category === "avoidance"
                                            ? "border-[#C68E73] bg-[#C68E73]/20 text-[#3e2015]"
                                            : "border-[#2C4C3B]/10 bg-white hover:bg-[#F8F4E3] text-[#5D4037]"
                                            }`}
                                    >
                                        <span className="block font-bold leading-tight font-serif" style={{ fontSize: 'clamp(0.8rem, 4vw, 1.125rem)' }}>Avoidance</span>
                                    </button>
                                </div>
                            </div>

                            {/* Specific Triggers */}
                            {category && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-sm font-bold text-[#5D4037] mb-3 font-serif">Specific Trigger</label>
                                    <div className="flex flex-wrap gap-2">
                                        {(category === "enhancement" ? TRIGGERS_ENHANCEMENT : TRIGGERS_AVOIDANCE).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setSpecificTrigger(t)}
                                                className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all font-serif ${specificTrigger === t
                                                    ? "bg-[#2C4C3B] text-[#F8F4E3] border-[#2C4C3B]"
                                                    : "border-[#2C4C3B]/20 bg-white text-[#5D4037] hover:border-[#2C4C3B]"
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
                        className={`w-full font-bold py-5 transition-all mt-6 flex items-center justify-center gap-2 shadow-sm
                            ${isFood ? "btn-terracotta" : "btn-sage"}`}
                    >
                        {isSubmitting ? "Opening Journal..." : "Start 20m Timer"}
                        <Clock size={20} fill="currentColor" />
                    </button>

                </div>
            </div>
        );
    }

    // 3. DASHBOARD CARDS VIEW (DEFAULT - GRID)
    return (
        <div className="grid grid-cols-2 gap-5 w-full">
            {/* Weed Pebble - Organic Shape */}
            <div className="animate-float" style={{ animationDelay: '0.3s' }}>
                <div className="custom-pebble bg-[#A3C5A3] flex flex-col items-center justify-center gap-3 group relative transition-all duration-300 w-full aspect-square border-2 border-[#2C4C3B] p-4 cursor-pointer shadow-[4px_4px_0px_rgba(44,76,59,0.2)] hover:shadow-[6px_6px_0px_rgba(44,76,59,0.3)] hover:-translate-y-1"
                    style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
                    onClick={() => setSelectionMode("weed")}>

                    <div className="p-3 bg-[#F8F4E3]/30 rounded-full text-[#1a2f23] group-hover:scale-110 transition-transform duration-500">
                        <Cannabis size={32} strokeWidth={2} />
                    </div>

                    <h2 className="font-bold text-lg text-[#1a2f23] font-serif">Weed</h2>
                </div>
            </div>

            {/* Food Pebble - Organic Shape */}
            <div className="animate-float" style={{ animationDelay: '0.6s' }}>
                <div className="custom-pebble bg-[#C68E73] flex flex-col items-center justify-center gap-3 group relative transition-all duration-300 w-full aspect-square border-2 border-[#3e2015] p-4 cursor-pointer shadow-[4px_4px_0px_rgba(62,32,21,0.2)] hover:shadow-[6px_6px_0px_rgba(62,32,21,0.3)] hover:-translate-y-1"
                    style={{ borderRadius: '40% 60% 70% 30% / 50% 60% 30% 70%' }}
                    onClick={() => setSelectionMode("food")}>

                    <div className="p-3 bg-[#F8F4E3]/30 rounded-full text-[#3e2015] group-hover:scale-110 transition-transform duration-500">
                        <Utensils size={32} strokeWidth={2} />
                    </div>

                    <h2 className="font-bold text-lg text-[#3e2015] font-serif">Food</h2>
                </div>
            </div>
        </div>
    );
}
