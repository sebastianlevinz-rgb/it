"use client";

import { X, Wind } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Phase = "inhale" | "hold" | "exhale";

export default function BreatheModal({ onClose }: { onClose: () => void }) {
    const [phase, setPhase] = useState<Phase>("inhale");
    const [text, setText] = useState("Breathe In");
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Audio Generator
    const playTone = (freq: number, type: "sine" | "triangle" = "sine", duration: number = 3) => {
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
    };

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const cycle = () => {
            // INHALE (4s)
            setPhase("inhale");
            setText("Inhale");
            playTone(180, "sine", 4); // Low calming tone

            timeout = setTimeout(() => {
                // HOLD (4s) - Optionally 7s for 4-7-8, but staying simple 4-4-4 for UI flow first
                setPhase("hold");
                setText("Hold");

                timeout = setTimeout(() => {
                    // EXHALE (4s)
                    setPhase("exhale");
                    setText("Exhale");
                    playTone(120, "sine", 4); // Lower tone

                    timeout = setTimeout(cycle, 4000);
                }, 4000); // Hold Duration
            }, 4000); // Inhale Duration
        };

        // Start cycle
        playTone(180, "sine", 4); // Initial sound
        cycle();

        return () => {
            clearTimeout(timeout);
            audioCtxRef.current?.close();
            audioCtxRef.current = null;
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-4 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/5 hover:border-white/10"
            >
                <X size={32} />
            </button>

            <div className="flex flex-col items-center gap-12 relative z-10 scale-125">
                {/* Visualizer */}
                <div className="relative flex items-center justify-center">
                    {/* Outer Glow */}
                    <div
                        className={`absolute rounded-full blur-[100px] transition-all duration-[4000ms] ease-in-out bg-primary/30
                        ${phase === "inhale" ? "w-[500px] h-[500px] opacity-60" : phase === "hold" ? "w-[400px] h-[400px] opacity-40" : "w-[200px] h-[200px] opacity-20"}
                        `}
                    />

                    {/* Core Circle */}
                    <div
                        className={`relative z-10 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)] border border-primary/40 transition-all duration-[4000ms] ease-in-out backdrop-blur-sm
                        ${phase === "inhale" ? "w-64 h-64 bg-primary/10 scale-100" : phase === "hold" ? "w-64 h-64 bg-primary/5 scale-100" : "w-24 h-24 bg-primary/5 scale-100"}
                        `}
                    >
                        <Wind
                            size={48}
                            className={`text-primary transition-all duration-[4000ms] drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]
                            ${phase === "exhale" ? "opacity-50 scale-75" : "opacity-100 scale-110"}
                            `}
                        />
                    </div>

                    {/* Ripple/Ring (only during inhale) */}
                    <div
                        className={`absolute rounded-full border border-primary/30 transition-all duration-[4000ms] ease-out
                         ${phase === "inhale" ? "w-96 h-96 opacity-0" : "w-24 h-24 opacity-0"}
                        `}
                    />
                </div>

                <div className="text-center">
                    <h2 className="text-5xl font-bold text-white tracking-[0.2em] uppercase transition-all duration-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                        {text}
                    </h2>
                    <p className="text-gray-500 mt-4 text-xl font-light">Focus on your breath.</p>
                </div>
            </div>
        </div>
    );
}
