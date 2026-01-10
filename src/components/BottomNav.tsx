"use client";

import { Leaf, Utensils, Zap, Moon, Home, BarChart2 } from "lucide-react";
import Link from "next/link";

export default function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-muted flex items-center justify-around z-50">
            <Link href="/" className="flex flex-col items-center justify-center space-y-1 text-gray-500 hover:text-white transition-colors">
                <Home size={24} />
                <span className="text-[10px] font-medium">Home</span>
            </Link>
            <Link href="/insights" className="flex flex-col items-center justify-center space-y-1 text-gray-500 hover:text-white transition-colors">
                <BarChart2 size={24} />
                <span className="text-[10px] font-medium">Insights</span>
            </Link>
            <button className="flex flex-col items-center justify-center space-y-1 text-gray-500 hover:text-gray-300">
                <Moon size={24} />
                <span className="text-[10px] font-medium">Sleep</span>
            </button>
        </nav>
    );
}
