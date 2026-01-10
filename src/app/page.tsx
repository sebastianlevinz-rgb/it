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
      <main className="min-h-screen pb-24 p-6 flex flex-col font-sans max-w-md mx-auto">
        <header className="mb-8 mt-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Impulse Tracker</h1>
            <p className="text-muted-foreground text-sm font-medium">Neutral observation.</p>
          </div>
          <div className="flex items-center gap-3">
            {agencyScore !== null && (
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Weekly Agency</span>
                <div className="flex items-center gap-1 text-primary">
                  <ShieldCheck size={18} />
                  <span className="font-bold text-xl">{agencyScore}%</span>
                </div>
              </div>
            )}
            <Link href="/settings" className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
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
            className="w-full bg-[#2C3327] hover:bg-[#1a1f18] text-[#FDFBF7] py-5 rounded-2xl flex items-center justify-center gap-3 transition-all group shadow-lg shadow-black/5"
          >
            <Moon size={22} className="group-hover:rotate-12 transition-transform text-secondary" />
            <span className="font-bold text-lg">Digital Sunset Mode</span>
          </button>
          <p className="text-center text-xs text-muted-foreground mt-3 font-medium opacity-80">
            Locks functionality until sunrise
          </p>
        </div>

        <BottomNav />
      </main>
    </DigitalDetoxGuard>
  );
}
