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
        <div className="ghibli-card flex flex-col justify-between aspect-square group bg-white/60">
            <div className="p-3 bg-purple-100/50 w-fit rounded-xl text-purple-600 group-hover:scale-110 transition-transform duration-300">
                <Dumbbell size={28} />
            </div>
            <div>
                <h2 className="font-bold text-lg mb-2 text-foreground">Exercise</h2>
                <div className="text-sm text-muted-foreground mb-4 font-medium">
                    Today: <span className="text-purple-700 font-bold">{dailyMinutes} mins</span>
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> Log Activity
                </button>
            </div>
        </div>
    );
}
