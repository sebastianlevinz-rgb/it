"use client";

export default function CrumbEffect() {
    const particles = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: `${10 + Math.random() * 80}%`,
        delay: `${Math.random() * 0.2}s`,
        size: `${4 + Math.random() * 8}px`,
        rotation: `${Math.random() * 360}deg`,
        color: Math.random() > 0.5 ? '#D2B48C' : '#8B4513' // Tan or SaddleBrown
    }));

    return (
        <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden rounded-[32px]">
            {/* Physics simulated via CSS animation */}
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute top-1/2 animate-crumble"
                    style={{
                        left: p.left,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        borderRadius: '2px', // slight rounding but mostly square/jagged
                        animationDelay: p.delay,
                        transform: `rotate(${p.rotation})`
                    }}
                />
            ))}
        </div>
    );
}
