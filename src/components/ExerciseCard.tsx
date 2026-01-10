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
        <div className="bg-card rounded-xl p-4 flex flex-col justify-between aspect-square border border-muted hover:border-gray-700 transition-colors">
            <div className="p-2 bg-purple-900/30 w-fit rounded-lg text-purple-400">
                <Dumbbell size={24} />
            </div>
            <div>
                <h2 className="font-semibold text-lg mb-1">Exercise</h2>
                <div className="text-sm text-gray-400 mb-3">
                    Today: <span className="text-white font-medium">{dailyMinutes} mins</span>
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                    <Plus size={16} /> Log Activity
                </button>
            </div>
        </div>
    );
}
