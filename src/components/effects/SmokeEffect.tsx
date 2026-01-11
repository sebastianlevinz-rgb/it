"use client";

import { useEffect, useState } from "react";

export default function SmokeEffect() {
    // Generate random particles
    const particles = Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        left: `${20 + Math.random() * 60}%`, // Center concentrated
        delay: `${Math.random() * 0.5}s`,
        size: `${20 + Math.random() * 40}px`,
        duration: `${1 + Math.random()}s`
    }));

    return (
        <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden rounded-[32px]">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute bottom-10 bg-gray-500/30 rounded-full blur-xl animate-smoke"
                    style={{
                        left: p.left,
                        width: p.size,
                        height: p.size,
                        animationDelay: p.delay,
                        animationDuration: p.duration
                    }}
                />
            ))}
        </div>
    );
}
