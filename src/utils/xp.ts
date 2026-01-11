export type LevelInfo = {
    level: number;
    title: string;
    nextThreshold: number;
    currentXP: number;
    progressPercent: number;
};

export function getLevelInfo(xp: number): LevelInfo {
    let level = 1;
    let title = "Observer";
    let nextThreshold = 100;

    if (xp >= 601) {
        level = 4;
        title = "Master of Agency";
        nextThreshold = 2000; // Cap
    } else if (xp >= 301) {
        level = 3;
        title = "Gap Architect";
        nextThreshold = 600;
    } else if (xp >= 101) {
        level = 2;
        title = "The Witness";
        nextThreshold = 300;
    } else {
        level = 1;
        title = "Observer";
        nextThreshold = 100;
    }

    // Calculate progress to next level
    // For visual bar: (Current XP - Previous Threshold) / (Next Threshold - Previous Threshold)
    let prevThreshold = 0;
    if (level === 2) prevThreshold = 100;
    if (level === 3) prevThreshold = 300;
    if (level === 4) prevThreshold = 600;

    const progressPercent = Math.min(100, Math.max(0, ((xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100));

    return {
        level,
        title,
        nextThreshold,
        currentXP: xp,
        progressPercent
    };
}
