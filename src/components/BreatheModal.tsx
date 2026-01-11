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

    // Audio Generator
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
                    tone = 220;
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
                    tone = 165;
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

        // Start with Inhale
        playTone(220, "sine", 2);
        runPhase("inhale");

    }, [playTone]);

    useEffect(() => {
        if (mode) {
            startCycle(mode);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            audioCtxRef.current?.close();
            audioCtxRef.current = null;
        };
    }, [mode, startCycle]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-4 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/5 hover:border-white/10"
            >
                <X size={32} />
            </button>

            {!mode ? (
                // SELECTION SCREEN
                <div className="w-full max-w-md p-6 flex flex-col gap-6 animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <h2 className="text-3xl font-bold text-white text-center mb-4">Choose a Technique</h2>

                    <button onClick={() => setMode("box")} className="group bg-[#2b2d31] hover:bg-[#5865F2] hover:text-white p-6 rounded-3xl border border-white/5 transition-all hover-lift active-squish flex items-center gap-5">
                        <div className="p-4 bg-white/10 rounded-full text-[#5865F2] group-hover:bg-white group-hover:text-[#5865F2]">
                            <Box size={28} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-xl text-white">Box Breathing</h3>
                            <p className="text-gray-400 text-sm group-hover:text-white/80">4s In - 4s Hold - 4s Out - 4s Hold</p>
                        </div>
                    </button>

                    <button onClick={() => setMode("478")} className="group bg-[#2b2d31] hover:bg-[#57F287] hover:text-black p-6 rounded-3xl border border-white/5 transition-all hover-lift active-squish flex items-center gap-5">
                        <div className="p-4 bg-white/10 rounded-full text-[#57F287] group-hover:bg-black/20 group-hover:text-black">
                            <Zap size={28} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-xl text-white group-hover:text-black">4-7-8 Relax</h3>
                            <p className="text-gray-400 text-sm group-hover:text-black/70">4s In - 7s Hold - 8s Out</p>
                        </div>
                    </button>

                    <button onClick={() => setMode("calm")} className="group bg-[#2b2d31] hover:bg-[#FEE75C] hover:text-black p-6 rounded-3xl border border-white/5 transition-all hover-lift active-squish flex items-center gap-5">
                        <div className="p-4 bg-white/10 rounded-full text-[#FEE75C] group-hover:bg-black/20 group-hover:text-black">
                            <Heart size={28} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-xl text-white group-hover:text-black">Deep Calm</h3>
                            <p className="text-gray-400 text-sm group-hover:text-black/70">5s In - 5s Out (Balanced)</p>
                        </div>
                    </button>
                </div>
            ) : (
                // ACTIVE BREATHING SCREEN
                <div className="flex flex-col items-center gap-12 relative z-10 scale-125">
                    {/* Visualizer */}
                    <div className="relative flex items-center justify-center">
                        {/* Outer Glow */}
                        <div
                            className={`absolute rounded-full blur-[100px] transition-all ease-in-out bg-[#5865F2]/40
                            ${phase === "inhale" || phase === "hold" ? "w-[500px] h-[500px] opacity-60" : "w-[200px] h-[200px] opacity-20"}
                            `}
                            style={{ transitionDuration: `${phase === 'inhale' ? MODES[mode].inhale : phase === 'exhale' ? MODES[mode].exhale : 1000}ms` }}
                        />

                        {/* Core Circle */}
                        <div
                            className={`relative z-10 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(88,101,242,0.5)] border border-[#5865F2]/40 transition-all ease-in-out backdrop-blur-sm
                            ${(phase === "inhale" || phase === "hold") ? "w-64 h-64 bg-[#5865F2]/20 scale-100" : "w-24 h-24 bg-[#5865F2]/5 scale-75"}
                            `}
                            style={{ transitionDuration: `${phase === 'inhale' ? MODES[mode].inhale : phase === 'exhale' ? MODES[mode].exhale : 1000}ms` }}
                        >
                            <Wind
                                size={48}
                                className={`text-[#5865F2] transition-all drop-shadow-[0_0_10px_rgba(88,101,242,0.8)]
                                ${phase === "exhale" ? "opacity-50 scale-75" : "opacity-100 scale-110"}
                                `}
                                style={{ transitionDuration: `${phase === 'inhale' ? MODES[mode].inhale : phase === 'exhale' ? MODES[mode].exhale : 1000}ms` }}
                            />
                        </div>
                    </div>

                    <div className="text-center">
                        <h2 className="text-5xl font-bold text-white tracking-[0.2em] uppercase transition-all duration-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                            {text}
                        </h2>
                        <button onClick={() => setMode(null)} className="text-gray-500 mt-8 text-sm font-medium hover:text-white transition-colors underline decoration-dotted">
                            Switch Technique
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
