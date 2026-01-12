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

    const checkTimer = async () => {
        const active = await getActiveTimer();
        if (active) {
            setActiveState({ isActive: true, payload: active.payload });
            const end = new Date(active.endTime).getTime();
            const now = Date.now();
            setTimeLeft(Math.max(0, end - now));
        }
    };
    checkTimer();
}, []);

// Timer Interval
useEffect(() => {
    if (!activeState.isActive || timeLeft === null) return;
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
        setTimeLeft(prev => {
            if (prev !== null && prev <= 1000) return 0;
            return prev !== null ? prev - 1000 : null;
        });
    }, 1000);
    return () => clearInterval(interval);
}, [activeState.isActive, timeLeft]);

// Handlers
const handleStartImpulse = async () => {
    setIsSubmitting(true);
    const payload = selectionMode === "food"
        ? { category: "enhancement", trigger: "Hunger", food_desc: foodDesc, hunger_level: hungerLevel }
        : { category, trigger: specificTrigger };

    await startTimer(selectionMode!, payload);

    setActiveState({ isActive: true, payload: { ...payload, category: selectionMode === "food" ? "enhancement" : category } });
    setTimeLeft(20 * 60 * 1000);
    setSelectionMode(null);
    setIsSubmitting(false);
};

const handleOutcome = async (outcome: "resisted" | "consumed") => {
    setIsSubmitting(true);
    await logOutcome(outcome);
    setActiveState({ isActive: false, payload: null });
    setIsSubmitting(false);
};

const handleEndTimerEarly = async () => {
    setIsGhosting(true); // Maybe just a hard cut for Swiss
    setTimeout(async () => {
        await cancelTimer();
        setActiveState({ isActive: false, payload: null });
        setSelectionMode(null);
        setIsGhosting(false);
    }, 200);
};

const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};


// 1. ACTIVE TIMER VIEW - SWISS
if (activeState.isActive && activeState.payload) {
    const isReady = timeLeft !== null && timeLeft <= 0;
    const percent = timeLeft !== null ? ((20 * 60 * 1000 - timeLeft) / (20 * 60 * 1000)) * 100 : 0;

    return (
        <div className="w-full h-full flex flex-col swiss-box border-0 !p-0">
            {/* Header Info */}
            <div className="border-b-2 border-black p-6 bg-black text-white">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold uppercase">Timer Active</h2>
                    {/* Swiss Progress Line */}
                    <div className="w-24 h-2 bg-white/20">
                        <div className="h-full bg-white" style={{ width: `${percent}%` }} />
                    </div>
                </div>
                <p className="font-mono text-xs uppercase opacity-80"> Protocol: {activeState.payload?.category}</p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-black">
                {!isReady ? (
                    <>
                        <h2 className="text-8xl font-black tracking-tighter mb-4">
                            {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                        </h2>
                        <p className="text-lg font-bold uppercase tracking-widest mb-12">
                            Observe The Gap
                        </p>

                        <button
                            onClick={handleEndTimerEarly}
                            className="mt-auto w-full btn-swiss-red"
                        >
                            <X size={20} strokeWidth={3} />
                            Abort Session
                        </button>
                    </>
                ) : (
                    <>
                        <h2 className="text-4xl font-black mb-8 border-b-4 border-black pb-2">ACTION REQUIRED</h2>
                        <p className="font-medium mb-12 text-center text-lg">The window is open. Execute choice.</p>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <button
                                onClick={() => handleOutcome("resisted")}
                                disabled={isSubmitting}
                                className="btn-swiss-black py-6 text-lg"
                            >
                                <Leaf size={24} />
                                Resist
                            </button>
                            <button
                                onClick={() => handleOutcome("consumed")}
                                disabled={isSubmitting}
                                className="btn-swiss-outline py-6 text-lg"
                            >
                                <Utensils size={24} />
                                Consume
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// 2. TRIGGER SELECTION VIEW - SWISS
if (selectionMode) {
    const isFood = selectionMode === "food";

    return (
        <div className="w-full h-full bg-white flex flex-col">
            <div className="border-b-2 border-black p-6 flex justify-between items-center bg-black text-white">
                <h2 className="text-2xl font-black uppercase flex items-center gap-3">
                    {isFood ? <Utensils size={28} /> : <Cannabis size={28} />}
                    {selectionMode} Protocol
                </h2>
                <button onClick={() => setSelectionMode(null)} className="hover:text-[#E63946] transition-colors">
                    <X size={32} strokeWidth={3} />
                </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                {/* CUSTOM FOOD FLOW - HUNGER METER */}
                {isFood ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div>
                            <label className="block text-sm font-black uppercase mb-4">Hunger Level (1-10)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={hungerLevel}
                                    onChange={(e) => setHungerLevel(parseInt(e.target.value))}
                                    className="w-24 h-24 text-4xl font-black text-center border-2 border-black bg-white focus:ring-0 rounded-none"
                                />
                                <div className="flex-1 h-4 bg-gray-200 border border-black relative">
                                    <div className="h-full bg-black" style={{ width: `${hungerLevel * 10}%` }} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-black uppercase mb-4">Target Description</label>
                            <input
                                type="text"
                                value={foodDesc}
                                onChange={(e) => setFoodDesc(e.target.value)}
                                placeholder="INPUT DATA..."
                                className="w-full border-2 border-black p-4 font-mono text-lg uppercase focus:ring-0 focus:border-[#E63946] outline-none rounded-none"
                            />
                        </div>
                    </div>
                ) : (
                    /* WEED FLOW - STANDARD CATEGORIES */
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        {/* Category */}
                        <div>
                            <label className="block text-sm font-black uppercase mb-4">Select Category</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setCategory("enhancement")}
                                    className={`p-6 border-2 border-black font-bold uppercase transition-all rounded-none ${category === "enhancement"
                                        ? "bg-black text-white"
                                        : "bg-white text-black hover:bg-gray-100"
                                        }`}
                                >
                                    Enhancement
                                </button>
                                <button
                                    onClick={() => setCategory("avoidance")}
                                    className={`p-6 border-2 border-black font-bold uppercase transition-all rounded-none ${category === "avoidance"
                                        ? "bg-black text-white"
                                        : "bg-white text-black hover:bg-gray-100"
                                        }`}
                                >
                                    Avoidance
                                </button>
                            </div>
                        </div>

                        {/* Specific Triggers */}
                        {category && (
                            <div>
                                <label className="block text-sm font-black uppercase mb-4">Specific Trigger</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(category === "enhancement" ? TRIGGERS_ENHANCEMENT : TRIGGERS_AVOIDANCE).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setSpecificTrigger(t)}
                                            className={`p-3 text-sm font-bold border-2 border-black uppercase text-left transition-all rounded-none ${specificTrigger === t
                                                ? "bg-[#E63946] text-white border-[#E63946]"
                                                : "bg-white text-black hover:bg-black hover:text-white"
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Submit */}
            <div className="p-6 border-t-2 border-black">
                <button
                    disabled={isFood ? isSubmitting : (!category || !specificTrigger || isSubmitting)}
                    onClick={handleStartImpulse}
                    className="w-full btn-swiss-black py-6 text-xl"
                >
                    {isSubmitting ? "PROCESSING..." : "INITIATE TIMER"}
                    <Clock size={24} />
                </button>
            </div>
        </div>
    );
}

// 3. LAUNCHER BUTTONS (If initialSelection is provided via HomeClient)
if (initialSelection) {
    // This is a "Dummy" view just to trigger the modal.
    // The real CravingsManager wrapper above handles the modal state.
    // Wait, if we use two CravingsManagers, they have separate state.
    // We'll assume HomeClient mounts ONE manager for the modal, but these buttons triggered it?
    // Actually, the previous architecture had CravingsManager handle EVERYTHING.
    // Let's stick to that. If initialSelection props are used, we just render the BUTTON.
    return (
        <button
            onClick={() => setSelectionMode(initialSelection)}
            className="w-full h-full flex flex-col items-center justify-center gap-4 hover:bg-black hover:text-white transition-all group"
        >
            {initialSelection === "weed" ? <Cannabis size={48} strokeWidth={1.5} /> : <Utensils size={48} strokeWidth={1.5} />}
            <span className="font-extrabold text-2xl uppercase tracking-tighter">{initialSelection}</span>
            <span className="opacity-0 group-hover:opacity-100 text-xs font-mono transition-opacity">CLICK TO INITIATE</span>
        </button>
    );
}

// Fallback? If no props, render nothing or old view? 
// In strict Swiss mode, we want the HomeClient to control layout.
return null;
}
