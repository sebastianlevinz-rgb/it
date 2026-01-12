"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getLevelInfo, type LevelInfo } from "@/utils/xp";

// Using the centralized access from lib/prisma

// Temporary MVP User ID - in a real app this comes from Auth
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

// Ensure the demo user exists
async function ensureUser() {
    const user = await prisma.user.findUnique({
        where: { id: DEMO_USER_ID },
    });
    if (!user) {
        await prisma.user.create({
            data: {
                id: DEMO_USER_ID,
                email: "demo@impulse-tracker.app",
            },
        });
    }
}

export type ImpulseType = "weed" | "food";
export type TriggerCategory = "enhancement" | "avoidance";
export type TriggerPayload = {
    type: ImpulseType;
    category: TriggerCategory;
    specificTrigger: string; // e.g., "boredom", "music"
    foodDetails?: {
        hungerLevel?: number;
        description?: string;
    };
};

export async function logImpulse(payload: TriggerPayload) {
    await ensureUser();

    const event = await prisma.event.create({
        data: {
            userId: DEMO_USER_ID,
            module: "cravings",
            eventType: "impulse",
            payload: payload as any, // casting for JSONB compatibility
        },
    });

    revalidatePath("/");
    return event;
}

export async function logOutcome(originalEventId: string, outcome: "consumed" | "resisted", note?: string) {
    await ensureUser();

    await prisma.event.create({
        data: {
            userId: DEMO_USER_ID,
            module: "cravings",
            eventType: "outcome",
            payload: {
                originalEventId,
                outcome,
                note,
            },
        },
    });

    revalidatePath("/");
}

export type ActiveState = {
    isActive: boolean;
    startTime?: Date;
    eventId?: string;
    payload?: TriggerPayload;
};

export async function getActiveImpulseState(): Promise<ActiveState> {
    await ensureUser();

    // Find the last "impulse" event
    const lastImpulse = await prisma.event.findFirst({
        where: {
            userId: DEMO_USER_ID,
            module: "cravings",
            eventType: "impulse",
        },
        orderBy: {
            timestamp: "desc",
        },
    });

    if (!lastImpulse) {
        return { isActive: false };
    }

    // Check if this impulse has been resolved
    const outcome = await prisma.event.findFirst({
        where: {
            userId: DEMO_USER_ID,
            module: "cravings",
            eventType: "outcome",
            // We look for an outcome that references this impulse ID in its payload
            // Since SQLite/Prisma JSON filtering can be tricky, we'll do a basic check
            // or rely on date. For MVP, finding the *latest* outcome is safer if flows are sequential.
        },
        orderBy: {
            timestamp: "desc",
        },
    });

    // Parse payload to check reference (if we had deeper JSON filtering we'd use that)
    // For MVP, if the latest outcome is NEWER than the latest impulse, the impulse is resolved.
    if (outcome && outcome.timestamp > lastImpulse.timestamp) {
        return { isActive: false };
    }

    // If strict 20 mins has passed AND user hasn't resolved it, technically it's still "pending outcome"
    // but the timer should show 00:00. The UI handles "ready to resolve".
    return {
        isActive: true,
        startTime: lastImpulse.timestamp,
        eventId: lastImpulse.id,
        payload: lastImpulse.payload as unknown as TriggerPayload,
    };
}

// ---------------- INSIGHTS MODULE ----------------

export type InsightsData = {
    topTriggers: { trigger: string; count: number; category: string }[];
    peakHours: { hour: number; count: number }[]; // 0-23
    agencyScore: number; // % of impulses where delay_start happened vs total impulses
    triggerDistribution: { category: string; count: number }[]; // Enhancement vs Avoidance
    aiVibeCheck: string; // The "Friendly AI Insight"
    levelInfo: LevelInfo;
    meditationStats: {
        totalMinutes: number;
        streakDays: number;
    };
};

export async function logMeditation(durationMinutes: number) {
    await ensureUser();

    // Log the session
    await prisma.event.create({
        data: {
            userId: DEMO_USER_ID,
            module: "meditation",
            eventType: "session",
            payload: { duration: durationMinutes },
        },
    });

    // Award XP (e.g., 5 XP per minute)
    await addXP(durationMinutes * 5);

    revalidatePath("/");
    revalidatePath("/insights");
}

export async function addXP(amount: number) {
    await ensureUser();

    await prisma.user.update({
        where: { id: DEMO_USER_ID },
        data: {
            agency_points: { increment: amount }
        }
    });

    revalidatePath("/");
}

export async function getUserXP() {
    await ensureUser();
    const user = await prisma.user.findUnique({
        where: { id: DEMO_USER_ID },
        select: { agency_points: true }
    });
    return user?.agency_points || 0;
}

export async function getInsightsData(): Promise<InsightsData> {
    await ensureUser();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const events = await prisma.event.findMany({
        where: {
            userId: DEMO_USER_ID,
            timestamp: { gte: thirtyDaysAgo },
        },
        orderBy: { timestamp: "desc" },
    });

    const userXP = await getUserXP();

    // --- MEDITATION STATS ---
    const meditationEvents = events.filter((e: any) => e.module === "meditation" && e.eventType === "session");
    // Calculate total minutes
    const totalMeditationMinutes = meditationEvents.reduce((acc: number, e: any) => {
        return acc + ((e.payload as any).duration || 0);
    }, 0);

    // Calculate Streak (Consecutive days with at least one session)
    // 1. Get unique days
    const daysWithMeditation = new Set(
        meditationEvents.map((e: any) => new Date(e.timestamp).toDateString())
    );
    // 2. Backward check from today
    let currentStreak = 0;
    const checkDate = new Date();
    while (true) {
        if (daysWithMeditation.has(checkDate.toDateString())) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            // Check if today is missing but yesterday exists? 
            // Standard streak logic: if today is missing but I haven't meditated YET today, existing streak might persist.
            // Simplified: If today OR yesterday has an entry, streak is alive.
            // But for calculation, we just count backward. 
            // If I missed today (so far), we check yesterday.
            if (currentStreak === 0) {
                // Check yesterday
                checkDate.setDate(checkDate.getDate() - 1); // Move to yesterday
                if (daysWithMeditation.has(checkDate.toDateString())) {
                    // Reset checkDate to yesterday for the loop
                    // currentStreak stays 0 for this iteration, but will increment next.
                    // Actually, simpler logic:
                    // Just count consecutive days in the Set sorted descending?
                    break;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }
    // Re-calc simple streak: Sort unique dates descending.
    const sortedDates = Array.from(daysWithMeditation)
        .map(d => new Date(d))
        .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    if (sortedDates.length > 0) {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const lastDate = sortedDates[0];

        // Is the streak alive? (Last date is Today or Yesterday)
        const isAlive = lastDate.toDateString() === today.toDateString() ||
            lastDate.toDateString() === yesterday.toDateString();

        if (isAlive) {
            streak = 1;
            // Count backwards
            for (let i = 0; i < sortedDates.length - 1; i++) {
                const curr = sortedDates[i];
                const next = sortedDates[i + 1];
                const diffTime = Math.abs(curr.getTime() - next.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    streak++;
                } else {
                    break;
                }
            }
        }
    }
    currentStreak = streak;


    // 1. Top Triggers

    // 1. Top Triggers
    const impulseEvents = events.filter((e: any) => e.module === "cravings" && e.eventType === "impulse");
    const triggerCounts: Record<string, { count: number; category: string }> = {};

    impulseEvents.forEach((e: any) => {
        const p = e.payload as any;
        const trigger = p.specificTrigger || "Unknown";
        const category = p.category || "Unknown";
        if (!triggerCounts[trigger]) {
            triggerCounts[trigger] = { count: 0, category };
        }
        triggerCounts[trigger].count++;
    });

    const topTriggers = Object.entries(triggerCounts)
        .map(([trigger, data]) => ({ trigger, ...data }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5);

    // 2. Peak Hours
    const hourCounts = new Array(24).fill(0);
    impulseEvents.forEach((e: any) => {
        const hour = new Date(e.timestamp).getHours();
        hourCounts[hour]++;
    });
    const peakHours = hourCounts.map((count, hour) => ({ hour, count }));

    // 2.5 Trigger Distribution (Category)
    const categoryCounts: Record<string, number> = { enhancement: 0, avoidance: 0 };
    impulseEvents.forEach((e: any) => {
        const cat = (e.payload as any).category as string;
        if (categoryCounts[cat] !== undefined) {
            categoryCounts[cat]++;
        }
    });
    const triggerDistribution = [
        { category: "Enhancement", count: categoryCounts.enhancement },
        { category: "Avoidance", count: categoryCounts.avoidance },
    ];

    // 3. Agency Score (Outcomes resisted / Total Outcomes)
    // Logic: "Agency" is defined as choosing "Didn't do it" (resisted).
    const outcomes = events.filter((e: any) => e.module === "cravings" && e.eventType === "outcome");
    const resistedCount = outcomes.filter((e: any) => (e.payload as any).outcome === "resisted").length;
    const agencyScore = outcomes.length > 0 ? Math.round((resistedCount / outcomes.length) * 100) : 0;

    // 4. AI Vibe Check (Heuristic)
    let aiVibeCheck = "Gathering more data to read your vibe...";

    if (impulseEvents.length > 5) {
        // Simple heuristic: correlation between trigger and agency
        // For each trigger, what % ended in 'resisted'?
        // (This is computationally heavy for a real app but fine for MVP)

        // Find best ritual (trigger that leads to highest resistance)
        // ... (Simplified for speed) 
        if (agencyScore > 70) {
            aiVibeCheck = `You're crushing it! Your Agency Score is ${agencyScore}%. You seem to thrive when you acknowledge the impulse but choose not to act.`;
        } else if (topTriggers.length > 0) {
            const topTrigger = topTriggers[0].trigger;
            aiVibeCheck = `Vibe Check: "${topTrigger}" is your most frequent visitor. Try the 4-7-8 breathing technique next time it knocks.`;
        }

        // Time based insight
        const topHour = peakHours.reduce((a, b) => a.count > b.count ? a : b);
        if (topHour.count > 2) {
            aiVibeCheck += ` Watch out around ${topHour.hour}:00 - that's when the cravings tend to spike!`;
        }
    }

    return {
        topTriggers,
        peakHours,
        agencyScore,
        triggerDistribution,
        aiVibeCheck,
        levelInfo: getLevelInfo(userXP),
        meditationStats: {
            totalMinutes: totalMeditationMinutes,
            streakDays: currentStreak,
        }
    };
}

// ---------------- SETTINGS MODULE ----------------

export async function exportUserData() {
    await ensureUser();
    const data = await prisma.user.findUnique({
        where: { id: DEMO_USER_ID },
        include: { events: true },
    });
    return data;
}

export async function clearAllUserData() {
    await ensureUser();
    await prisma.event.deleteMany({
        where: { userId: DEMO_USER_ID },
    });
    revalidatePath("/");
}
