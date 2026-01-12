"use client";

import { X, Wind, Box, Zap, Heart } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { logMeditation } from "@/app/actions";

type Phase = "inhale" | "hold" | "exhale" | "hold_empty";
// Defaulting to a single "Calm" mode for simplicity with the new timers, 
// or we could allow config. For now, we use a balanced 4-4-4-4 Box or 5-5 Calm.
// Let's go with "Deep Calm" (5-5) as general purpose.
const BREATH_CYCLE = { inhale: 4000, hold: 4000, exhale: 4000, hold_empty: 4000 };


export default function BreatheModal({ onClose }: { onClose: () => void }) {
    const [isActive, setIsActive] = useState(false);
    const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);

    const [phase, setPhase] = useState<Phase>("inhale");
    const [text, setText] = useState("Ready");

    const audioCtxRef = useRef<AudioContext | null>(null);
    const breathTimerRef = useRef<NodeJS.Timeout | null>(null);
    const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        if (durationMinutes) {
            await logMeditation(durationMinutes);
        }
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
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 text-white animate-in zoom-in-90 duration-500 overflow-hidden">

            {/* Dynamic Background Glow */}
            <div
                className={`absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-black transition-all duration-[4000ms]`}
            >
                {/* Breathing Pulse Overlay */}
                {isActive && (
                    <div
                        className="absolute inset-0 bg-[#3B82F6]/10 mix-blend-screen transition-all ease-in-out"
                        style={{
                            opacity: phase === 'inhale' ? 0.4 : 0.1,
                            transform: `scale(${phase === 'inhale' ? 1.1 : 1})`,
                            transitionDuration: `${phase === 'inhale' ? BREATH_CYCLE.inhale : phase === 'exhale' ? BREATH_CYCLE.exhale : 1000}ms`
                        }}
                    />
                )}
            </div>

            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-4 rounded-full bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition-all z-50"
            >
                <X size={32} />
            </button>

            {!isActive ? (
                // SELECTION SCREEN
                <div className="w-full max-w-md p-8 flex flex-col gap-6 animate-in slide-in-from-bottom-10 fade-in duration-500 relative z-10 text-center">
                    <h2 className="text-4xl font-black mb-6 tracking-tight drop-shadow-lg">Take a Moment</h2>

                    <div className="grid grid-cols-1 gap-4">
                        {[5, 10, 15].map((mins) => (
                            <button
                                key={mins}
                                onClick={() => startSession(mins)}
                                className="group w-full bg-white/5 hover:bg-white/10 p-6 rounded-[24px] border border-white/5 transition-all hover-lift active-squish flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/20 rounded-full text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                                        <Wind size={24} />
                                    </div>
                                    <span className="font-bold text-2xl">{mins} Min</span>
                                </div>
                                <span className="text-sm font-medium text-white/40 group-hover:text-white/80 transition-colors">Start &rarr;</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                // ACTIVE BREATHING SCREEN (FLEXBOX CENTERED)
                <div className="flex flex-col items-center justify-between h-full w-full py-12 relative z-10">

                    {/* Top: Timer */}
                    <div className="text-center opacity-80 mt-12">
                        <span className="font-mono text-xl tracking-widest">{formatTime(timeLeft)}</span>
                    </div>

                    {/* Center: Breath Visual */}
                    <div className="flex-1 flex flex-col items-center justify-center relative w-full">
                        {/* Core Pulse */}
                        <div
                            className={`rounded-full blur-[80px] transition-all ease-in-out bg-blue-500/30 absolute
                            ${phase === "inhale" || phase === "hold" ? "w-[400px] h-[400px] opacity-60" : "w-[200px] h-[200px] opacity-20"}
                            `}
                            style={{ transitionDuration: `${phase === 'inhale' ? BREATH_CYCLE.inhale : phase === 'exhale' ? BREATH_CYCLE.exhale : 1000}ms` }}
                        />

                        {/* Geometric Circle */}
                        <div
                            className={`z-10 flex items-center justify-center transition-all ease-in-out border border-white/20
                            ${(phase === "inhale" || phase === "hold") ? "w-64 h-64 bg-white/5 scale-100 shadow-[0_0_50px_rgba(59,130,246,0.5)]" : "w-32 h-32 bg-transparent scale-75 shadow-none"}
                            rounded-full mb-8`}
                            style={{
                                transitionDuration: `${phase === 'inhale' ? BREATH_CYCLE.inhale : phase === 'exhale' ? BREATH_CYCLE.exhale : 1000}ms`
                            }}
                        >
                            <Wind
                                size={48}
                                className={`text-white transition-all
                                ${phase === "exhale" ? "opacity-50 scale-75" : "opacity-100 scale-110"}
                                `}
                                style={{ transitionDuration: `${phase === 'inhale' ? BREATH_CYCLE.inhale : phase === 'exhale' ? BREATH_CYCLE.exhale : 1000}ms` }}
                            />
                        </div>

                        {/* Text (Perfectly Centered via Flex parent) */}
                        <h2 className="text-5xl font-black tracking-widest uppercase transition-all duration-500 drop-shadow-xl text-blue-100 absolute" style={{ top: '65%' }}>
                            {text}
                        </h2>
                    </div>

                    {/* Bottom: Ghost Button */}
                    <div className="mb-12 pb-8">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-full border border-red-500/30 bg-red-500/10 text-red-300 font-bold text-sm tracking-wide hover:bg-red-500/20 active:scale-95 transition-all"
                        >
                            End Session Early
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
