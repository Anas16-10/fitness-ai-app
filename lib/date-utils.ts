/**
 * Reliable local date utilities to avoid timezone/UTC mismatches.
 */

export function getLocalDateString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getYesterdayDateString() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Validate a profile's streak based on the last workout date.
 * Returns the corrected streak count.
 */
export function validateProfileStreak(
    streak: number,
    lastWorkoutDate: string | null,
    hasWorkoutToday: boolean = false,
    totalUniqueDays: number = 0
): number {
    const todayStr = getLocalDateString();
    const yesterdayStr = getYesterdayDateString();

    let validatedStreak = streak;

    // If last workout was before yesterday, streak is broken.
    if (lastWorkoutDate && lastWorkoutDate !== todayStr && lastWorkoutDate !== yesterdayStr) {
        validatedStreak = 0;
    }

    // Safety check: If they only have one session day ever (today), the streak should be 1.
    if (totalUniqueDays <= 1 && hasWorkoutToday) {
        validatedStreak = 1;
    }

    // If they have no logs today, but had logs yesterday, keep the streak.
    // If they have no logs today AND no logs yesterday, streak breaks.
    if (!hasWorkoutToday && lastWorkoutDate !== yesterdayStr) {
        validatedStreak = 0;
    }

    // Final check: If streak is 0 but we have a workout today, it's day 1.
    if (validatedStreak === 0 && hasWorkoutToday) {
        validatedStreak = 1;
    }

    return validatedStreak;
}
