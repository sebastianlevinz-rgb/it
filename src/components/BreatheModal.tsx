"use client";

import { X, Wind, Box, Zap, Heart } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

type Phase = "inhale" | "hold" | "exhale" | "hold_empty";
type Mode = "box" | "478" | "calm";

const MODES = {
    box: { name: "Box Breathing", inhale: 4000, hold: 4000, exhale: 4000, hold_empty: 4000, label: "Stability" },
    "478": { name: "4-7-8 Relax", inhale: 4000, hold: 7000, exhale: 8000, hold_empty: 0, label: "Sleep & Calm" },
    calm: { name: "Deep Calm", inhale: 5000, hold: 0, exhale: 5000, hold_empty: 0, label: "Balance" },
};

export default function BreatheModal({ onClose }: { onClose: () => void }) {
    const [mode, setMode] = useState<Mode | null>(null);
    const [phase, setPhase] = useState<Phase>("inhale");
    const [text, setText] = useState("Ready");
    const audioCtxRef = useRef<AudioContext | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1); // Attack
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration); // Release

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }, []);

    const startCycle = useCallback((selectedMode: Mode) => {
        const config = MODES[selectedMode];

        const runPhase = (currentPhase: Phase) => {
            setPhase(currentPhase);

            let duration = 0;
            let next: Phase = "inhale";
            let label = "";
            let tone = 0;

            switch (currentPhase) {
                case "inhale":
                    duration = config.inhale;
                    next = config.hold > 0 ? "hold" : "exhale";
                    label = "Inhale";
                    tone = 164; // E3 (Deep)
                    break;
                case "hold":
                    duration = config.hold;
                    next = "exhale";
                    label = "Hold";
                    tone = 0; // Silent hold
                    break;
                case "exhale":
                    duration = config.exhale;
                    next = config.hold_empty > 0 ? "hold_empty" : "inhale";
                    label = "Exhale";
                    tone = 110; // A2 (Release)
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

            timerRef.current = setTimeout(() => {
                runPhase(next);
            }, duration);
        };

        playTone(164, "sine", 2);
        runPhase("inhale");

    }, [playTone]);

    useEffect(() => {
        if (mode) {
            startCycle(mode);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [mode, startCycle]);


    // CLEANUP
    useEffect(() => {
        return () => {
            if (audioCtxRef.current?.state !== 'closed') {
                audioCtxRef.current?.close();
            }
        }
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950 text-white animate-in zoom-in-90 duration-500 overflow-hidden">

            {/* Dynamic Background Glow */}
            <div
                className={`absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-black transition-all duration-[4000ms]`}
            >
                {/* Breathing Pulse Overlay */}
                {mode && (
                    <div
                        className="absolute inset-0 bg-[#3B82F6]/10 mix-blend-screen transition-all ease-in-out"
                        style={{
                            opacity: phase === 'inhale' ? 0.4 : 0.1,
                            transform: `scale(${phase === 'inhale' ? 1.1 : 1})`,
                            transitionDuration: `${phase === 'inhale' ? MODES[mode].inhale : phase === 'exhale' ? MODES[mode].exhale : 1000}ms`
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

            {!mode ? (
                // SELECTION SCREEN
                <div className="w-full max-w-md p-6 flex flex-col gap-6 animate-in slide-in-from-bottom-10 fade-in duration-500 relative z-10">
                    <h2 className="text-3xl font-bold text-center mb-4 tracking-tight">Choose Focus</h2>

                    <button onClick={() => setMode("box")} className="group bg-white/5 hover:bg-white/10 p-6 rounded-3xl border border-white/10 transition-all hover-lift active-squish flex items-center gap-5">
                        <div className="p-4 bg-blue-500/20 rounded-full text-blue-400 group-hover:text-white">
                            <Box size={28} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-xl">Box Breathing</h3>
                            <p className="text-gray-400 text-sm">Stability & Focus</p>
                        </div>
                    </button>

                    <button onClick={() => setMode("478")} className="group bg-white/5 hover:bg-white/10 p-6 rounded-3xl border border-white/10 transition-all hover-lift active-squish flex items-center gap-5">
                        <div className="p-4 bg-purple-500/20 rounded-full text-purple-400 group-hover:text-white">
                            <Zap size={28} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-xl">4-7-8 Relax</h3>
                            <p className="text-gray-400 text-sm">Deep Rest</p>
                        </div>
                    </button>

                    <button onClick={() => setMode("calm")} className="group bg-white/5 hover:bg-white/10 p-6 rounded-3xl border border-white/10 transition-all hover-lift active-squish flex items-center gap-5">
                        <div className="p-4 bg-emerald-500/20 rounded-full text-emerald-400 group-hover:text-white">
                            <Heart size={28} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-xl">Deep Calm</h3>
                            <p className="text-gray-400 text-sm">Balance</p>
                        </div>
                    </button>
                </div>
            ) : (
                // ACTIVE BREATHING SCREEN (PULSING GLOW)
                <div className="flex flex-col items-center gap-12 relative z-10 scale-125">

                    <div className="relative flex items-center justify-center">
                        {/* Core Pulse */}
                        <div
                            className={`rounded-full blur-[80px] transition-all ease-in-out bg-blue-500/30
                            ${phase === "inhale" || phase === "hold" ? "w-[500px] h-[500px] opacity-60" : "w-[250px] h-[250px] opacity-20"}
                            `}
                            style={{ transitionDuration: `${phase === 'inhale' ? MODES[mode].inhale : phase === 'exhale' ? MODES[mode].exhale : 1000}ms` }}
                        />

                        {/* Geometric Circle */}
                        <div
                            className={`absolute z-10 flex items-center justify-center transition-all ease-in-out border border-white/20
                            ${(phase === "inhale" || phase === "hold") ? "w-64 h-64 bg-white/5 scale-100 shadow-[0_0_50px_rgba(59,130,246,0.5)]" : "w-32 h-32 bg-transparent scale-75 shadow-none"}
                            rounded-full`}
                            style={{
                                transitionDuration: `${phase === 'inhale' ? MODES[mode].inhale : phase === 'exhale' ? MODES[mode].exhale : 1000}ms`
                            }}
                        >
                            <Wind
                                size={48}
                                className={`text-white transition-all
                                ${phase === "exhale" ? "opacity-50 scale-75" : "opacity-100 scale-110"}
                                `}
                                style={{ transitionDuration: `${phase === 'inhale' ? MODES[mode].inhale : phase === 'exhale' ? MODES[mode].exhale : 1000}ms` }}
                            />
                        </div>
                    </div>

                    <div className="text-center">
                        <h2 className="text-4xl font-black tracking-widest uppercase transition-all duration-500 drop-shadow-xl text-blue-100">
                            {text}
                        </h2>
                        <button onClick={() => setMode(null)} className="text-gray-500 mt-8 text-sm font-medium hover:text-white transition-colors">
                            Change Focus
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
