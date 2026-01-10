"use client";

import { Leaf, Utensils, Dumbbell, Clock, Moon, Settings, ShieldCheck } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import CravingsManager from "@/components/CravingsManager";
import FastingCard from "@/components/FastingCard";
import ExerciseCard from "@/components/ExerciseCard";
import DigitalDetoxGuard from "@/components/DigitalDetoxGuard";
import { logSleepEvent, getInsightsData } from "@/app/actions";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [agencyScore, setAgencyScore] = useState<number | null>(null);

  useEffect(() => {
    getInsightsData().then(data => setAgencyScore(data.agencyScore));
  }, []);

  return (
    <DigitalDetoxGuard>
      <main className="min-h-screen pb-20 p-4 flex flex-col">
        <header className="mb-6 mt-2 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Impulse Tracker</h1>
            <p className="text-gray-400 text-sm">Neutral observation.</p>
          </div>
          <div className="flex items-center gap-3">
            {agencyScore !== null && (
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Weekly Agency</span>
                <div className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck size={16} />
                  <span className="font-bold text-xl">{agencyScore}%</span>
                </div>
              </div>
            )}
            <Link href="/settings" className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors">
              <Settings size={20} />
            </Link>
          </div>
        </header>

        {/* Grid Layout */}
        <div className="grid grid-cols-2 gap-4 mb-8">

          {/* Dynamic Cravings Module handles Weed & Food */}
          <CravingsManager />

          {/* Fasting Card */}
          <FastingCard />

          {/* Exercise Card */}
          <ExerciseCard />

        </div>

        {/* Digital Sunset Button */}
        <div className="mt-auto mb-4">
          <button
            onClick={() => logSleepEvent("sunset_start")}
            className="w-full bg-indigo-900/50 hover:bg-indigo-900/80 border border-indigo-500/30 text-indigo-300 py-4 rounded-xl flex items-center justify-center gap-2 transition-all group"
          >
            <Moon size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Digital Sunset Mode (Go to Sleep)</span>
          </button>
          <p className="text-center text-xs text-gray-600 mt-2">
            Locks functionality until sunrise
          </p>
        </div>

        <BottomNav />
      </main>
    </DigitalDetoxGuard>
  );
}
