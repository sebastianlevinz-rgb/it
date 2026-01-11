"use client";

import { X, Wind, Box, Zap, Heart, CloudRain } from "lucide-react";
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
    const rainGainRef = useRef<GainNode | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const rainCleanupRef = useRef<(() => void) | null>(null);

    // RAIN SYNTHESIZER
    const toggleRain = useCallback((enable: boolean) => {
        if (!enable) {
            rainCleanupRef.current?.();
            rainCleanupRef.current = null;
            return;
        }

        if (rainCleanupRef.current) return; // Already running

        // Initialize Audio Context if needed
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;

        // White Noise Buffer
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        whiteNoise.start(0);

        // Low Pass Filter (Muffles the harsh hiss into rain)
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 800; // Rain frequency

        // Gain (Volume)
        const gain = ctx.createGain();
        gain.gain.value = 0.05; // Gentle backgrund
        rainGainRef.current = gain;

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        rainCleanupRef.current = () => {
            whiteNoise.stop();
            whiteNoise.disconnect();
            filter.disconnect();
            gain.disconnect();
        };
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

        // Start with Inhale and Rain
        toggleRain(true);
        playTone(220, "sine", 2);
        runPhase("inhale");

    }, [playTone, toggleRain]);

    useEffect(() => {
        if (mode) {
            startCycle(mode);
        } else {
            // Stop rain if selecting
            toggleRain(false);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            // Don't close AudioContext globally, just stop tracks, but for this component unmount we can close or suspend
            // Ideally we keep it alive but for simplicity we'll ensure rain stops.
            toggleRain(false);
        };
    }, [mode, startCycle, toggleRain]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            toggleRain(false);
            if (audioCtxRef.current?.state !== 'closed') {
                audioCtxRef.current?.close();
            }
        }
    }, [toggleRain]);


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3E4A3D]/95 backdrop-blur-md animate-in zoom-in-90 duration-700 overflow-hidden">

            {/* RAIN VISUALS */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            {/* Simple CSS Rian Animation */}
            {mode && (
                <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute bg-blue-200/40 w-[1px] h-20 animate-rain-fall"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-${Math.random() * 20}%`,
                                animationDuration: `${0.5 + Math.random() * 0.5}s`,
                                animationDelay: `${Math.random()}s`
                            }}
                        />
                    ))}
                </div>
            )}


            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-4 rounded-full bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition-all z-50"
            >
                <X size={32} />
            </button>

            {!mode ? (
                // SELECTION SCREEN
                <div className="w-full max-w-md p-6 flex flex-col gap-6 animate-in slide-in-from-bottom-10 fade-in duration-500 relative z-10">
                    <h2 className="text-3xl font-serif text-[#E0E5DF] text-center mb-4 italic tracking-wide">Choose your moment...</h2>

                    <button onClick={() => setMode("box")} className="group bg-[#4A5D49] hover:bg-[#607C5E] p-6 rounded-3xl border border-[#8FA88D]/20 transition-all hover-lift active-squish flex items-center gap-5">
                        <div className="p-4 bg-white/10 rounded-full text-[#A8C6A6] group-hover:text-white">
                            <Box size={28} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-serif text-xl text-[#F0F2EF]">Box Breathing</h3>
                            <p className="text-[#A8C6A6] text-sm font-sans">Stability & Focus</p>
                        </div>
                    </button>

                    <button onClick={() => setMode("478")} className="group bg-[#4A5D49] hover:bg-[#607C5E] p-6 rounded-3xl border border-[#8FA88D]/20 transition-all hover-lift active-squish flex items-center gap-5">
                        <div className="p-4 bg-white/10 rounded-full text-[#A8C6A6] group-hover:text-white">
                            <Zap size={28} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-serif text-xl text-[#F0F2EF]">4-7-8 Relax</h3>
                            <p className="text-[#A8C6A6] text-sm font-sans">Deep Rest</p>
                        </div>
                    </button>

                    <button onClick={() => setMode("calm")} className="group bg-[#4A5D49] hover:bg-[#607C5E] p-6 rounded-3xl border border-[#8FA88D]/20 transition-all hover-lift active-squish flex items-center gap-5">
                        <div className="p-4 bg-white/10 rounded-full text-[#A8C6A6] group-hover:text-white">
                            <Heart size={28} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-serif text-xl text-[#F0F2EF]">Deep Calm</h3>
                            <p className="text-[#A8C6A6] text-sm font-sans">Balance</p>
                        </div>
                    </button>
                </div>
            ) : (
                // ACTIVE BREATHING SCREEN (GHIBLI STYLE)
                <div className="flex flex-col items-center gap-12 relative z-10 scale-125">

                    {/* Hand Drawn Circle Visualizer */}
                    <div className="relative flex items-center justify-center">
                        {/* Outer Glow */}
                        <div
                            className={`absolute rounded-full blur-[60px] transition-all ease-in-out bg-[#A8C6A6]/20
                            ${phase === "inhale" || phase === "hold" ? "w-[400px] h-[400px] opacity-40" : "w-[200px] h-[200px] opacity-10"}
                            `}
                            style={{ transitionDuration: `${phase === 'inhale' ? MODES[mode].inhale : phase === 'exhale' ? MODES[mode].exhale : 1000}ms` }}
                        />

                        {/* Core Circle - Use rough border radius for "hand drawn" look */}
                        <div
                            className={`relative z-10 flex items-center justify-center transition-all ease-in-out backdrop-blur-sm border-2 border-[#E0E5DF]/50
                            ${(phase === "inhale" || phase === "hold") ? "w-64 h-64 bg-[#E0E5DF]/10 scale-100" : "w-24 h-24 bg-[#E0E5DF]/5 scale-75"}
                            `}
                            style={{
                                borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', // Wobbly shape
                                transitionDuration: `${phase === 'inhale' ? MODES[mode].inhale : phase === 'exhale' ? MODES[mode].exhale : 1000}ms`
                            }}
                        >
                            <Wind
                                size={48}
                                className={`text-[#E0E5DF] transition-all drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]
                                ${phase === "exhale" ? "opacity-50 scale-75" : "opacity-100 scale-110"}
                                `}
                                style={{ transitionDuration: `${phase === 'inhale' ? MODES[mode].inhale : phase === 'exhale' ? MODES[mode].exhale : 1000}ms` }}
                            />
                        </div>
                    </div>

                    <div className="text-center">
                        <h2 className="text-4xl font-serif text-[#E0E5DF] tracking-widest uppercase transition-all duration-500 drop-shadow-sm">
                            {text}
                        </h2>
                        <button onClick={() => setMode(null)} className="text-[#A8C6A6] mt-8 text-sm font-sans hover:text-white transition-colors underline decoration-dotted">
                            Switch Technique
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
