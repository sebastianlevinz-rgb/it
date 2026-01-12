"use client";

import { X, Wind, Moon } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { logMeditation } from "@/app/actions";

type Phase = "inhale" | "hold" | "exhale" | "hold_empty";

type BreathPattern = {
    id: string;
    name: string;
    color: string;
    cycle: {
        inhale: number;
        hold: number;
        exhale: number;
        hold_empty: number;
    };
};

const PATTERNS: Record<string, BreathPattern> = {
    box: {
        id: 'box',
        name: 'Box Breathing',
        color: '#38BDF8',
        cycle: { inhale: 4000, hold: 4000, exhale: 4000, hold_empty: 4000 }
    },
    '478': {
        id: '478',
        name: '4-7-8 Relax',
        color: '#818CF8',
        cycle: { inhale: 4000, hold: 7000, exhale: 8000, hold_empty: 0 }
    }
};

export default function BreatheModal({ onClose, onSessionComplete }: { onClose: () => void, onSessionComplete?: (success: boolean) => void }) {
    const [activePattern, setActivePattern] = useState<BreathPattern | null>(null);
    const isActive = !!activePattern;

    // Default to 5 mins for now, or could let user pick time. 
    // For this UI, we start immediately on selection, so let's say 5 min default or open-ended.
    // We'll set 5 mins.
    const [durationMinutes, setDurationMinutes] = useState<number>(5);
    const [timeLeft, setTimeLeft] = useState<number>(5 * 60);

    const [phase, setPhase] = useState<Phase>("inhale");
    const [instruction, setInstruction] = useState("Ready");

    const audioCtxRef = useRef<AudioContext | null>(null);
    const rainGainRef = useRef<GainNode | null>(null);
    const breathTimerRef = useRef<NodeJS.Timeout | null>(null);
    const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

    // RAIN GENERATOR (Pink Noise)
    const startRain = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);

        // Pink Noise Algorithm
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11; // Check master volume
            b6 = white * 0.115926;
        }

        const rainSource = ctx.createBufferSource();
        rainSource.buffer = buffer;
        rainSource.loop = true;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2); // Soft Rain Volume (0.15)

        // Low Pass Filter for "Cozy/Muffled" effect
        const filterNode = ctx.createBiquadFilter();
        filterNode.type = "lowpass";
        filterNode.frequency.setValueAtTime(800, ctx.currentTime);

        rainSource.connect(gainNode);
        gainNode.connect(filterNode);
        filterNode.connect(ctx.destination);
        rainSource.start();

        rainGainRef.current = gainNode;
    }, []);

    const stopRain = useCallback(() => {
        if (audioCtxRef.current && rainGainRef.current) {
            rainGainRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 1);
        }
    }, []);

    // TONE GENERATOR
    const playTone = useCallback((freq: number, type: "sine" | "triangle" = "sine", duration: number = 3) => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.type = type;

        // Soft Attack and Release (Bowl sound)
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 1); // Attack
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration); // Release

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }, []);

    const startSession = (patternId: string) => {
        const pattern = PATTERNS[patternId];
        if (!pattern) return;

        setActivePattern(pattern);
        setTimeLeft(5 * 60); // Reset to 5 mins
        startRain();
    };

    // Trigger cycle when activePattern changes
    useEffect(() => {
        if (activePattern) {
            startCycle(activePattern);
        }
    }, [activePattern, startCycle]);

    // Session Timer Logic
    useEffect(() => {
        if (!isActive || timeLeft <= 0) return;

        sessionTimerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(sessionTimerRef.current!);
                    completeSession();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
        };
    }, [isActive, timeLeft]);

    const completeSession = async () => {
        stopRain();
        if (durationMinutes) {
            await logMeditation(durationMinutes);
            if (onSessionComplete && durationMinutes >= 5) {
                onSessionComplete(true);
            }
        }
        onClose();
    };

    const handleClose = () => {
        stopRain();
        onClose();
    };

    const startCycle = useCallback((pattern: BreathPattern) => {
        const config = pattern.cycle;

        const runPhase = (currentPhase: Phase) => {
            setPhase(currentPhase);

            let duration = 0;
            let next: Phase = "inhale";
            let label = "";
            let tone = 0;

            switch (currentPhase) {
                case "inhale":
                    duration = config.inhale;
                    next = config.hold > 0 ? "hold" : (config.exhale > 0 ? "exhale" : "inhale");
                    label = "Inhale";
                    tone = 164; // E3
                    break;
                case "hold":
                    duration = config.hold;
                    next = config.exhale > 0 ? "exhale" : "inhale";
                    label = "Hold";
                    tone = 0;
                    break;
                case "exhale":
                    duration = config.exhale;
                    next = config.hold_empty > 0 ? "hold_empty" : "inhale";
                    label = "Exhale";
                    tone = 110; // A2
                    break;
                case "hold_empty":
                    duration = config.hold_empty;
                    next = "inhale";
                    label = "Hold";
                    tone = 0;
                    break;
            }

            setInstruction(label);
            if (tone > 0) playTone(tone, "sine", duration / 1000);

            breathTimerRef.current = setTimeout(() => {
                runPhase(next);
            }, duration);
        };

        playTone(164, "sine", 2);
        runPhase("inhale");

    }, [playTone]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (audioCtxRef.current?.state !== 'closed') {
                audioCtxRef.current?.close();
            }
            if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
            if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
        }
    }, []);

    const cycleDuration = activePattern ? (phase === 'inhale' ? activePattern.cycle.inhale : phase === 'exhale' ? activePattern.cycle.exhale : activePattern.cycle.hold) : 1000;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
            {/* Backdrop - Glass Frost */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-xl transition-all duration-1000" />

            {/* Modal Content - Floating Glass Panel */}
            <div className="relative w-full max-w-md aspect-square max-h-[80vh] glass-panel flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500 shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/40">

                {!isActive ? (
                    <div className="space-y-8 w-full animate-in slide-in-from-bottom-4 fade-in duration-500">
                        <div>
                            <h2 className="text-2xl font-light text-[#1A202C] mb-2">Breathe</h2>
                            <p className="text-[#4A5568] font-light">Choose your rhythm.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => startSession("box")}
                                className="group btn-glass py-6 px-6 text-left flex items-center justify-between transition-all hover:scale-[1.02]"
                            >
                                <div>
                                    <span className="block font-medium text-[#1A202C]">Box Breathing</span>
                                    <span className="text-xs text-[#4A5568] font-light">4-4-4-4 • Focus & Calm</span>
                                </div>
                                <Wind className="text-[#38BDF8] opacity-60 group-hover:opacity-100 transition-opacity" size={24} strokeWidth={1} />
                            </button>

                            <button
                                onClick={() => startSession("478")}
                                className="group btn-glass py-6 px-6 text-left flex items-center justify-between transition-all hover:scale-[1.02]"
                            >
                                <div>
                                    <span className="block font-medium text-[#1A202C]">4-7-8 Relax</span>
                                    <span className="text-xs text-[#4A5568] font-light">4-7-8 • Sleep & Anxiety</span>
                                </div>
                                <Moon className="text-[#818CF8] opacity-60 group-hover:opacity-100 transition-opacity" size={24} strokeWidth={1} />
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="text-[#4A5568] hover:text-[#1A202C] text-sm font-light tracking-wide hover:underline decoration-1 underline-offset-4 transition-colors p-2"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                        {/* Glowing Halo Pulse */}
                        <div
                            className={`rounded-full transition-all ease-in-out absolute blur-2xl
                            ${phase === "inhale" || phase === "hold" ? "w-[300px] h-[300px] opacity-40" : "w-[200px] h-[200px] opacity-20"}
                            `}
                            style={{
                                backgroundColor: activePattern?.color || '#38BDF8',
                                transitionDuration: `${cycleDuration}ms`,
                                boxShadow: `0 0 60px ${activePattern?.color || '#38BDF8'}`
                            }}
                        />

                        {/* Core Light Circle */}
                        <div
                            className={`rounded-full transition-all ease-in-out absolute border border-white/80 bg-white/20 backdrop-blur-sm
                            ${phase === "inhale" || phase === "hold" ? "w-[250px] h-[250px]" : "w-[150px] h-[150px]"}
                            `}
                            style={{
                                transitionDuration: `${cycleDuration}ms`,
                                boxShadow: `inset 0 0 20px rgba(255,255,255,0.5), 0 0 20px ${activePattern?.color || '#38BDF8'}40`
                            }}
                        />

                        {/* Geometric Icon */}
                        <div
                            className={`relative z-10 transition-all duration-1000 ease-in-out
                            ${phase === "inhale" ? "scale-110" : "scale-100"}
                            `}
                        >
                            {activePattern?.id === 'box' ?
                                <Wind size={40} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" strokeWidth={1.5} /> :
                                <Moon size={40} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" strokeWidth={1.5} />
                            }
                        </div>

                        <div className="absolute bottom-10 flex flex-col items-center space-y-4 z-20">
                            <p className="text-2xl font-light text-[#1A202C] tracking-widest uppercase" style={{ textShadow: '0 0 20px rgba(255,255,255,0.8)' }}>
                                {instruction}
                            </p>
                            <button
                                onClick={handleClose}
                                className="text-xs text-[#4A5568] bg-white/20 hover:bg-white/40 px-4 py-2 rounded-full backdrop-blur-md transition-colors border border-white/30"
                            >
                                End Session
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
