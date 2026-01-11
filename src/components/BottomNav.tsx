"use client";

import { Home, BarChart2 } from "lucide-react";
import Link from "next/link";

export default function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#0a0a12]/80 backdrop-blur-xl border-t border-white/5 flex items-start pt-4 justify-around z-50 shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.5)]">
            <Link href="/" className="flex flex-col items-center justify-center space-y-1 text-primary hover:text-primary/70 transition-colors">
                <Home size={26} strokeWidth={2.5} />
                <span className="text-[10px] font-bold">Home</span>
            </Link>
            <Link href="/insights" className="flex flex-col items-center justify-center space-y-1 text-muted-foreground hover:text-primary transition-colors">
                <BarChart2 size={26} strokeWidth={2.5} />
                <span className="text-[10px] font-bold">Insights</span>
            </Link>

        </nav>
    );
}
