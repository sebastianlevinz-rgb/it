"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
};

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
        aiVibeCheck
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
