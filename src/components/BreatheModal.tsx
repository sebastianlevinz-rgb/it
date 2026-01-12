"use client";

import { X, Wind, Box, Zap, Heart } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { logMeditation } from "@/app/actions";

type Phase = "inhale" | "hold" | "exhale" | "hold_empty";
// Defaulting to a single "Calm" mode for simplicity with the new timers, 
// or we could allow config. For now, we use a balanced 4-4-4-4 Box or 5-5 Calm.
// Let's go with "Deep Calm" (5-5) as general purpose.
const BREATH_CYCLE = { inhale: 4000, hold: 4000, exhale: 4000, hold_empty: 4000 };


export default function BreatheModal({ onClose, onSessionComplete }: { onClose: () => void, onSessionComplete?: (success: boolean) => void }) {
    const [isActive, setIsActive] = useState(false);
    const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);

    const [phase, setPhase] = useState<Phase>("inhale");
    const [text, setText] = useState("Ready");

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
        filterNode.frequency.setValueAtTime(800, ctx.currentTime); // 800Hz cutoff removes harsh high-end hiss

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

    const startSession = (minutes: number) => {
        setDurationMinutes(minutes);
        setTimeLeft(minutes * 60);
        setIsActive(true);
        startRain();
        startCycle();
    };

    // Session Timer Logic
    useEffect(() => {
        if (!isActive || timeLeft <= 0) return;

        sessionTimerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Session Complete
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
    }, [isActive]);

    const completeSession = async () => {
        stopRain();
        if (durationMinutes) {
            await logMeditation(durationMinutes);
            if (onSessionComplete && durationMinutes >= 15) {
                onSessionComplete(true);
            }
        }
        onClose();
    };

    const handleClose = () => {
        stopRain();
        onClose();
    };

    const startCycle = useCallback(() => {
        const config = BREATH_CYCLE;

        const runPhase = (currentPhase: Phase) => {
            setPhase(currentPhase);

            let duration = 0;
            let next: Phase = "inhale";
            let label = "";
            let tone = 0;

            switch (currentPhase) {
                case "inhale":
                    duration = config.inhale;
                    next = "hold";
                    label = "Inhale";
                    tone = 164; // E3
                    break;
                case "hold":
                    duration = config.hold;
                    next = "exhale";
                    label = "Hold";
                    tone = 0;
                    break;
                case "exhale":
                    duration = config.exhale;
                    next = "hold_empty";
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

            setText(label);
            if (tone > 0) playTone(tone, "sine", duration / 1000);

            breathTimerRef.current = setTimeout(() => {
                runPhase(next);
            }, duration);
        };

        playTone(164, "sine", 2);
        runPhase("inhale");

    }, [playTone]);

    // Format Time MM:SS
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // CLEANUP
    useEffect(() => {
        return () => {
            if (audioCtxRef.current?.state !== 'closed') {
                audioCtxRef.current?.close();
            }
            if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
            if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
        }
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8F4E3] text-[#2C4C3B] animate-in zoom-in-90 duration-500 overflow-hidden font-serif">

            {/* Dynamic Background Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-multiply pointer-events-none"></div>

            <button
                onClick={handleClose}
                className="absolute top-6 right-6 p-4 rounded-full hover:bg-[#2C4C3B]/10 text-[#2C4C3B] transition-all z-50"
            >
                <X size={32} />
            </button>

            {!isActive ? (
                // SELECTION SCREEN
                <div className="w-full max-w-md p-8 flex flex-col gap-6 animate-in slide-in-from-bottom-10 fade-in duration-500 relative z-10 text-center">
                    <h2 className="text-4xl font-black mb-6 tracking-tight drop-shadow-sm text-[#2C4C3B]">Take a Moment</h2>

                    <div className="grid grid-cols-1 gap-4">
                        {[5, 10, 15].map((mins) => (
                            <button
                                key={mins}
                                onClick={() => startSession(mins)}
                                className="group w-full bg-white border-2 border-[#2C4C3B]/20 hover:border-[#A3C5A3] p-6 rounded-[24px] transition-all hover-lift active-squish flex items-center justify-between shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-[#A3C5A3]/20 rounded-full text-[#2C4C3B] group-hover:bg-[#A3C5A3] group-hover:text-[#1a2f23] transition-colors">
                                        <Wind size={24} />
                                    </div>
                                    <span className="font-bold text-2xl text-[#2C4C3B]">{mins} Min</span>
                                </div>
                                <span className="text-sm font-medium text-[#5D4037] group-hover:text-[#2C4C3B] transition-colors">Start &rarr;</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                // ACTIVE BREATHING SCREEN (FLEXBOX CENTERED)
                <div className="flex flex-col items-center justify-between h-full w-full py-12 relative z-10 min-h-[100dvh]">

                    {/* Top: Timer */}
                    <div className="text-center mt-12 px-6 py-2 rounded-full border-2 border-[#2C4C3B] bg-[#F8F4E3] z-20">
                        <span className="font-mono text-xl tracking-widest text-[#2C4C3B] font-bold">{formatTime(timeLeft)}</span>
                    </div>

                    {/* Center: Breath Visual */}
                    <div className="flex-1 flex flex-col items-center justify-center relative w-full">
                        {/* Organic Watercolor Pulse */}
                        <div
                            className={`rounded-full transition-all ease-in-out absolute
                            ${phase === "inhale" || phase === "hold" ? "w-[350px] h-[350px] opacity-40" : "w-[200px] h-[200px] opacity-10"}
                            `}
                            style={{
                                backgroundColor: '#A3C5A3',
                                borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                                transitionDuration: `${phase === 'inhale' ? BREATH_CYCLE.inhale : phase === 'exhale' ? BREATH_CYCLE.exhale : 1000}ms`,
                                transform: phase === 'inhale' ? 'rotate(10deg) scale(1.1)' : 'rotate(0deg) scale(1)'
                            }}
                        />

                        {/* Core Circle */}
                        <div
                            className={`rounded-full transition-all ease-in-out absolute border-2 border-[#2C4C3B]
                            ${phase === "inhale" || phase === "hold" ? "w-[280px] h-[280px] opacity-20" : "w-[150px] h-[150px] opacity-5"}
                            `}
                            style={{
                                transitionDuration: `${phase === 'inhale' ? BREATH_CYCLE.inhale : phase === 'exhale' ? BREATH_CYCLE.exhale : 1000}ms`,
                                borderRadius: '50% 50% 50% 50% / 50% 50% 50% 50%'
                            }}
                        />

                        {/* Geometric Circle Icon */}
                        <div
                            className={`z-10 flex items-center justify-center transition-all ease-in-out
                            ${(phase === "inhale" || phase === "hold") ? "scale-110" : "scale-100"}
                            mb-8`}
                            style={{
                                transitionDuration: `${phase === 'inhale' ? BREATH_CYCLE.inhale : phase === 'exhale' ? BREATH_CYCLE.exhale : 1000}ms`
                            }}
                        >
                            <Wind
                                size={48}
                                className={`text-[#2C4C3B] transition-all`}
                            />
                        </div>

                        {/* Text */}
                        <h2 className="text-5xl font-black tracking-widest uppercase transition-all duration-500 text-[#2C4C3B] absolute font-serif" style={{ top: '65%' }}>
                            {text}
                        </h2>
                    </div>

                    {/* Bottom: Minimal Ink Button */}
                    <div className="mb-8 w-full max-w-xs px-4">
                        <button
                            onClick={handleClose}
                            className="w-full py-4 px-8 mt-5 rounded-full border-2 border-[#2C4C3B] text-[#2C4C3B] font-bold tracking-widest uppercase text-xs hover:bg-[#2C4C3B] hover:text-[#F8F4E3] transition-all"
                        >
                            End Session Early
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
