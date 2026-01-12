"use client";

import { Leaf, Utensils, X, Clock, CheckCircle, AlertCircle, Play, Cannabis } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { logImpulse, getActiveImpulseState, logOutcome, addXP, type TriggerPayload, type ActiveState } from "@/app/actions";
import confetti from "canvas-confetti";

const TRIGGERS_ENHANCEMENT = ["Music", "Movies", "Gaming", "Socializing", "Creativity"];
const TRIGGERS_AVOIDANCE = ["Stress", "Boredom", "Anxiety", "Fatigue", "Loneliness"];

export default function CravingsManager({ onModalChange, initialSelection }: { onModalChange?: (isOpen: boolean) => void; initialSelection?: "weed" | "food" | null }) {
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
        const loadState = async () => {
            const state = await getActiveImpulseState();
            setActiveState(state);
            if (state.isActive && state.startTime) {
                const start = new Date(state.startTime).getTime();
                const now = new Date().getTime();
                const elapsed = now - start;
                const duration = 20 * 60 * 1000;
                setTimeLeft(Math.max(0, duration - elapsed));
            }
        };
        loadState();
    }, []);

    // Active Timer Check
    useEffect(() => {
        const checkTimer = async () => {
            const active = await getActiveImpulseState();
            if (active.isActive) {
                setActiveState(active);
                if (active.startTime) {
                    const start = new Date(active.startTime).getTime();
                    const now = Date.now();
                    const elapsed = now - start;
                    const duration = 20 * 60 * 1000;
                    setTimeLeft(Math.max(0, duration - elapsed));
                }
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

        const payload: TriggerPayload = selectionMode === "food"
            ? { type: "food", category: "enhancement", specificTrigger: "Hunger", foodDetails: { description: foodDesc, hungerLevel } }
            : { type: "weed", category: category!, specificTrigger: specificTrigger! };

        const event = await logImpulse(payload);

        setActiveState({ isActive: true, startTime: event.timestamp, eventId: event.id, payload });
        setTimeLeft(20 * 60 * 1000);
        setSelectionMode(null);
        setIsSubmitting(false);
    };

    const handleOutcome = async (outcome: "resisted" | "consumed") => {
        if (!activeState.eventId) return;
        setIsSubmitting(true);
        await logOutcome(activeState.eventId, outcome);
        setActiveState({ isActive: false });
        setIsSubmitting(false);
    };

    const handleEndTimerEarly = async () => {
        setIsGhosting(true);
        setTimeout(async () => {
            if (activeState.eventId) {
                await logOutcome(activeState.eventId, "resisted");
            }
            setActiveState({ isActive: false });
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

    // 1. ACTIVE TIMER VIEW - SNES BATTLE
    if (activeState.isActive && activeState.payload) {
        const isReady = timeLeft !== null && timeLeft <= 0;
        const percent = timeLeft !== null ? ((20 * 60 * 1000 - timeLeft) / (20 * 60 * 1000)) * 100 : 0;

        return (
            <div className="w-full h-full flex flex-col bg-black border-4 border-white pixel-border !p-0">
                {/* Header Info */}
                <div className="border-b-4 border-white p-4 bg-gray-900 text-white scanline">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-sm font-retro text-red-500 animate-pulse">BATTLE ACTIVE</h2>
                        {/* HP Bar Style */}
                        <div className="w-24 h-4 bg-gray-700 border-2 border-white relative">
                            <div className="h-full bg-green-500" style={{ width: `${percent}%` }} />
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black text-white">
                    {!isReady ? (
                        <>
                            <h2 className="text-5xl font-retro mb-4 text-white drop-shadow-[4px_4px_0_rgba(100,100,100,1)]">
                                {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                            </h2>
                            <p className="text-xs font-retro text-gray-400 mb-12 text-center leading-relaxed">
                                ENEMY IS CHARGING...<br />HOLD THE LINE!
                            </p>

                            <button
                                onClick={handleEndTimerEarly}
                                className="mt-auto w-full pixel-btn pixel-btn-red py-4 text-xs"
                            >
                                <X size={16} strokeWidth={3} className="mr-2" />
                                FLEE BATTLE
                            </button>
                        </>
                    ) : (
                        <>
                            <h2 className="text-xl font-retro text-yellow-400 mb-8 border-b-4 border-yellow-400 pb-2">CRITICAL HIT!</h2>
                            <p className="font-retro text-[10px] mb-12 text-center leading-loose">
                                ENEMY DEFENSES ARE DOWN.<br />CHOOSE YOUR FATE.
                            </p>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button
                                    onClick={() => handleOutcome("resisted")}
                                    disabled={isSubmitting}
                                    className="pixel-btn pixel-btn-green py-6 text-[10px]"
                                >
                                    VICTORY (RESIST)
                                </button>
                                <button
                                    onClick={() => handleOutcome("consumed")}
                                    disabled={isSubmitting}
                                    className="pixel-btn pixel-btn-red py-6 text-[10px]"
                                >
                                    DEFEAT (CONSUME)
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // 2. TRIGGER SELECTION VIEW - SNES MENU
    if (selectionMode) {
        const isFood = selectionMode === "food";

        return (
            <div className="w-full h-full bg-black flex flex-col border-4 border-white pixel-border">
                <div className="border-b-4 border-white p-4 flex justify-between items-center bg-blue-900 text-white">
                    <h2 className="text-xs font-retro flex items-center gap-2">
                        {isFood ? "🍕" : "🌿"} {selectionMode === "food" ? "FOOD" : "WEED"} MENU
                    </h2>
                    <button onClick={() => setSelectionMode(null)} className="text-white hover:text-red-500 transition-colors">
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto bg-blue-900/20">
                    {/* CUSTOM FOOD FLOW - HUNGER METER */}
                    {isFood ? (
                        <div className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-retro text-white mb-4">HUNGER HP (1-10)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={hungerLevel}
                                        onChange={(e) => setHungerLevel(parseInt(e.target.value))}
                                        className="w-16 h-16 text-2xl font-retro text-center border-4 border-white bg-black text-white focus:ring-0 rounded-none pixel-border"
                                    />
                                    <div className="flex-1 h-8 bg-gray-900 border-4 border-white relative pixel-border">
                                        <div className="h-full bg-red-500" style={{ width: `${hungerLevel * 10}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-retro text-white mb-4">TARGET ITEM</label>
                                <input
                                    type="text"
                                    value={foodDesc}
                                    onChange={(e) => setFoodDesc(e.target.value)}
                                    placeholder="ITEM NAME..."
                                    className="w-full border-4 border-white p-4 font-retro text-xs bg-black text-white outline-none rounded-none pixel-border placeholder:text-gray-600"
                                />
                            </div>
                        </div>
                    ) : (
                        /* WEED FLOW - STANDARD CATEGORIES */
                        <div className="space-y-8">
                            {/* Category */}
                            <div>
                                <label className="block text-[10px] font-retro text-white mb-4">SELECT CLASS</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setCategory("enhancement")}
                                        className={`p-4 border-4 border-white font-retro text-[8px] uppercase transition-all pixel-border ${category === "enhancement"
                                            ? "bg-green-600 text-white"
                                            : "bg-black text-gray-400 hover:bg-gray-800"
                                            }`}
                                    >
                                        Enhancement
                                    </button>
                                    <button
                                        onClick={() => setCategory("avoidance")}
                                        className={`p-4 border-4 border-white font-retro text-[8px] uppercase transition-all pixel-border ${category === "avoidance"
                                            ? "bg-red-600 text-white"
                                            : "bg-black text-gray-400 hover:bg-gray-800"
                                            }`}
                                    >
                                        Avoidance
                                    </button>
                                </div>
                            </div>

                            {/* Specific Triggers */}
                            {category && (
                                <div>
                                    <label className="block text-[10px] font-retro text-white mb-4">SELECT ENEMY</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(category === "enhancement" ? TRIGGERS_ENHANCEMENT : TRIGGERS_AVOIDANCE).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setSpecificTrigger(t)}
                                                className={`p-2 text-[8px] font-retro border-2 border-white uppercase text-left transition-all pixel-border ${specificTrigger === t
                                                    ? "bg-yellow-500 text-black border-white"
                                                    : "bg-black text-white hover:bg-gray-800"
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
                <div className="p-6 border-t-4 border-white bg-black">
                    <button
                        disabled={isFood ? isSubmitting : (!category || !specificTrigger || isSubmitting)}
                        onClick={handleStartImpulse}
                        className="w-full pixel-btn pixel-btn-blue py-6 text-sm"
                    >
                        {isSubmitting ? "LOADING..." : "BATTLE CRAVING"}
                    </button>
                </div>
            </div>
        );
    }

    // 3. LAUNCHER BUTTONS
    if (initialSelection) {
        return (
            <button
                onClick={() => setSelectionMode(initialSelection)}
                className={`w-full h-full flex flex-col items-center justify-center gap-2 hover:scale-[1.05] transition-transform group border-4 border-white pixel-border pixel-btn ${initialSelection === "weed" ? "pixel-btn-green" : "pixel-btn-yellow"}`}
            >
                <span className="text-4xl filter drop-shadow-md">{initialSelection === "weed" ? "🌿" : "🍕"}</span>
                <span className="font-retro text-xs uppercase text-shadow-sm">{initialSelection}</span>
                <span className="opacity-0 group-hover:opacity-100 text-[8px] font-retro transition-opacity">PRESS START</span>
            </button>
        );
    }

    return null;
}
