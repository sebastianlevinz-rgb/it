"use client";

import { Dumbbell, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { logExercise, getDailyExerciseMinutes, type ExercisePayload } from "@/app/actions";

const EXERCISE_TYPES = ["Walk", "Run", "Gym/Weights", "Yoga", "Sport", "Cardio", "Other"];

export default function ExerciseCard() {
    const [isOpen, setIsOpen] = useState(false);
    const [dailyMinutes, setDailyMinutes] = useState(0);

    // Form State
    const [type, setType] = useState(EXERCISE_TYPES[0]);
    const [intensity, setIntensity] = useState(3);
    const [duration, setDuration] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        getDailyExerciseMinutes().then(setDailyMinutes);
    }, []);

    const handleSubmit = async () => {
        if (!duration) return;
        setSubmitting(true);

        await logExercise({
            type,
            intensity,
            duration: parseInt(duration),
        });

        const newTotal = await getDailyExerciseMinutes();
        setDailyMinutes(newTotal);

        setSubmitting(false);
        setIsOpen(false);
        setDuration("");
        setIntensity(3);
    };

    if (isOpen) {
        return (
            <div className="bg-card rounded-xl p-4 flex flex-col justify-between aspect-square border border-muted relative z-20">
                <h2 className="font-semibold text-lg flex items-center gap-2 mb-2">
                    <Dumbbell size={20} className="text-purple-400" />
                    Log Activity
                </h2>

                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                    <div>
                        <label className="text-xs text-gray-500">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full bg-zinc-900 border border-muted rounded px-2 py-1 text-sm mt-1"
                        >
                            {EXERCISE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500">Duration (mins)</label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full bg-zinc-900 border border-muted rounded px-2 py-1 text-sm mt-1"
                            placeholder="30"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500">Intensity (1-5)</label>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            value={intensity}
                            onChange={(e) => setIntensity(parseInt(e.target.value))}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-2"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-2">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="flex-1 bg-zinc-800 text-xs py-2 rounded-lg hover:bg-zinc-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !duration}
                        className="flex-1 bg-purple-600 text-white text-xs py-2 rounded-lg hover:bg-purple-500 disabled:opacity-50"
                    >
                        Save
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card flex flex-col items-center justify-between aspect-square group hover:border-t-purple-500/30 transition-all duration-300 relative overflow-hidden h-full">
            <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_15px_#A855F7] animate-pulse"></div>
                </div>

                <div className="p-5 bg-purple-500/10 rounded-full text-purple-400 group-hover:scale-110 transition-transform duration-500 backdrop-blur-md border border-purple-500/10 shadow-[0_0_30px_rgba(168,85,247,0.1)] group-hover:shadow-[0_0_60px_rgba(168,85,247,0.3)]">
                    <Dumbbell size={48} className="drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]" />
                </div>
            </div>

            <div className="w-full text-center">
                <h2 className="font-bold text-xl mb-1 text-white">Exercise</h2>
                <div className="text-sm text-gray-400 mb-3 font-medium flex flex-col items-center gap-1">
                    <span className="text-gray-500 text-xs uppercase tracking-wider">Today</span>
                    <span className="text-purple-400 font-bold text-base drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">{dailyMinutes} mins</span>
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 text-base font-bold h-14 rounded-2xl transition-all flex items-center justify-center gap-2 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                >
                    <Plus size={18} /> Log Activity
                </button>
            </div>
        </div>
    );
}
