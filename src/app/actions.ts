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

// ---------------- FASTING MODULE ----------------

export type FastingState = {
    isFasting: boolean;
    lastEventTime: Date | null;
    durationMinutes: number;
};

export async function toggleFastingWindow(): Promise<FastingState> {
    await ensureUser();

    // Get current state
    const currentState = await getFastingState();
    const nextEventType = currentState.isFasting ? "window_start" : "window_end"; // If fasting, we start eating window.

    // Log the new event
    await prisma.event.create({
        data: {
            userId: DEMO_USER_ID,
            module: "fasting",
            eventType: nextEventType,
            payload: {},
        },
    });

    revalidatePath("/");
    return getFastingState();
}

export async function getFastingState(): Promise<FastingState> {
    await ensureUser();

    const lastEvent = await prisma.event.findFirst({
        where: {
            userId: DEMO_USER_ID,
            module: "fasting",
        },
        orderBy: {
            timestamp: "desc",
        },
    });

    if (!lastEvent) {
        return { isFasting: false, lastEventTime: null, durationMinutes: 0 };
    }

    // If last event was 'window_end', we are currently FASTING.
    // If last event was 'window_start', we are currently EATING (not fasting).
    const isFasting = lastEvent.eventType === "window_end";

    const now = new Date().getTime();
    const eventTime = new Date(lastEvent.timestamp).getTime();
    const durationMinutes = Math.floor((now - eventTime) / 1000 / 60);

    return {
        isFasting,
        lastEventTime: lastEvent.timestamp,
        durationMinutes,
    };
}

// ---------------- EXERCISE MODULE ----------------

export type ExercisePayload = {
    type: string;
    intensity: number;
    duration?: number;
};

export async function logExercise(payload: ExercisePayload) {
    await ensureUser();

    await prisma.event.create({
        data: {
            userId: DEMO_USER_ID,
            module: "exercise",
            eventType: "log",
            payload: payload as any,
        },
    });

    revalidatePath("/");
}

export async function getDailyExerciseMinutes(): Promise<number> {
    await ensureUser();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = await prisma.event.findMany({
        where: {
            userId: DEMO_USER_ID,
            module: "exercise",
            timestamp: {
                gte: today,
            },
        },
    });

    // Calculate total minutes from payload
    // Note: We cast payload to check for duration
    const totalMinutes = logs.reduce((acc: number, log: any) => {
        const p = log.payload as unknown as ExercisePayload;
        return acc + (p.duration || 0);
    }, 0);

    return totalMinutes;
}

// ---------------- DIGITAL DETOX (SLEEP) MODULE ----------------

export type SleepMode = "active" | "sleep" | "morning_lock";

export type SleepState = {
    mode: SleepMode;
    remainingMs?: number; // Only for morning_lock
};

export async function logSleepEvent(eventType: "sunset_start" | "wake_up" | "morning_lock_end") {
    await ensureUser();

    await prisma.event.create({
        data: {
            userId: DEMO_USER_ID,
            module: "sleep",
            eventType: eventType,
            payload: {},
        },
    });

    revalidatePath("/");
}

export async function getSleepState(): Promise<SleepState> {
    await ensureUser();

    const lastEvent = await prisma.event.findFirst({
        where: {
            userId: DEMO_USER_ID,
            module: "sleep",
        },
        orderBy: {
            timestamp: "desc",
        },
    });

    if (!lastEvent) {
        return { mode: "active" };
    }

    if (lastEvent.eventType === "sunset_start") {
        return { mode: "sleep" };
    }

    if (lastEvent.eventType === "wake_up") {
        const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes
        const now = new Date().getTime();
        const eventTime = new Date(lastEvent.timestamp).getTime();
        const elapsed = now - eventTime;

        if (elapsed < LOCK_DURATION_MS) {
            return {
                mode: "morning_lock",
                remainingMs: LOCK_DURATION_MS - elapsed
            };
        }

        // If > 30 mins have passed, we implicitly consider it active, 
        // even if 'morning_lock_end' wasn't explicitly logged yet.
        return { mode: "active" };
    }

    // 'morning_lock_end' or anything else
    return { mode: "active" };
}

// ---------------- INSIGHTS MODULE ----------------

export type InsightsData = {
    topTriggers: { trigger: string; count: number; category: string }[];
    peakHours: { hour: number; count: number }[]; // 0-23
    agencyScore: number; // % of impulses where delay_start happened vs total impulses
    triggerDistribution: { category: string; count: number }[]; // Enhancement vs Avoidance
    fastingAverage: number; // hours
};

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

    // 4. Fasting Average
    // Find pairs of window_end (start fasting) -> window_start (break fast)
    // This is a rough calculation for MVP iterating chronologically
    let totalFastingHours = 0;
    let fastingSessions = 0;

    // Sort ascending for this calc
    const fastingEvents = events
        .filter((e: any) => e.module === "fasting")
        .sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime());

    let lastFastStart: Date | null = null;

    fastingEvents.forEach((e: any) => {
        if (e.eventType === "window_end") { // Started fasting
            lastFastStart = e.timestamp;
        } else if (e.eventType === "window_start" && lastFastStart) { // Broke fast
            const hours = (e.timestamp.getTime() - lastFastStart.getTime()) / 1000 / 60 / 60;
            if (hours > 0 && hours < 48) { // basic sanity check
                totalFastingHours += hours;
                fastingSessions++;
            }
            lastFastStart = null;
        }
    });

    const fastingAverage = fastingSessions > 0 ? parseFloat((totalFastingHours / fastingSessions).toFixed(1)) : 0;

    return {
        topTriggers,
        peakHours,
        agencyScore,
        triggerDistribution,
        fastingAverage,
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
