/**
 * Content Moderation Utility
 * - Bad words filter (English + Sinhala)
 * - Nude / explicit image detection via Sightengine API
 */

// ─── Bad Words List ───────────────────────────────────────────────────────────
// Add more words as needed. Words are matched case-insensitively as whole words
// or substrings (configurable per word with regex).
const BAD_WORDS: string[] = [
    // English explicit
    "fuck", "f**k", "fck", "fuk",
    "shit", "sh1t", "shyt",
    "bitch", "b1tch",
    "bastard",
    "asshole", "ass hole", "a**hole",
    "cunt", "c**t",
    "cock", "dick",
    "pussy",
    "whore", "slut",
    "nigger", "nigga",
    "faggot", "fag",
    "motherfucker", "mofo",
    "porn", "porno",
    "nude", "nudes",
    "sex", "sexy",
    "boobs", "boob", "tits", "tit",
    "penis", "vagina",
    "rape", "rapist",
    "kill yourself", "kys",

    // Sinhala transliterated (Latin script)
    "hutto", "hutta", "huththo", "huththi",
    "pakaya", "pakayo",
    "balla", "ballage",
    "kari", "kariya",
    "kotiya", "kotiyo",
    "goni", "goniya",
    "boru", "kunu",
    "wesi", "wesige",
    "modaya", "moda",
    "pissu",
    "kudu",
    "kela",
    "amu",
];

// Normalise text for matching
function normalise(text: string): string {
    return text
        .toLowerCase()
        .replace(/[*@#$!0]/g, (c) =>
            ({ "*": "", "@": "a", "#": "", "$": "s", "!": "i", "0": "o" }[c] ?? c)
        )
        .replace(/\s+/g, " ");
}

/**
 * Returns the first bad word found in the text, or null if clean.
 */
export function detectBadWord(text: string): string | null {
    const norm = normalise(text);
    for (const word of BAD_WORDS) {
        // Use word-boundary-like check: surrounded by non-alphanumeric or start/end
        const pattern = new RegExp(`(^|[^a-z0-9])${word.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}([^a-z0-9]|$)`, "i");
        if (pattern.test(norm) || norm.includes(word)) {
            return word;
        }
    }
    return null;
}

/**
 * Returns true if text passes moderation (no bad words).
 */
export function isTextClean(text: string): boolean {
    return detectBadWord(text) === null;
}


// ─── Image Moderation via Sightengine ────────────────────────────────────────
// Sign up free at https://sightengine.com — free tier: 100 API calls/day
// Set SIGHTENGINE_API_USER and SIGHTENGINE_API_SECRET in your .env

export interface ImageModerationResult {
    safe: boolean;
    reason?: string;        // Why it was flagged
    nudity?: number;        // 0–1 score
    offensive?: number;     // 0–1 score
}

/**
 * Checks a single image URL for nudity / explicit content.
 * Returns { safe: true } if the API keys are not set (fail open so dev works).
 */
export async function checkImageModeration(imageUrl: string): Promise<ImageModerationResult> {
    const apiUser = process.env.SIGHTENGINE_API_USER;
    const apiSecret = process.env.SIGHTENGINE_API_SECRET;

    // If keys not configured, skip (log a warning)
    if (!apiUser || !apiSecret) {
        console.warn("[ContentModeration] Sightengine API keys not set. Skipping image check.");
        return { safe: true };
    }

    try {
        const params = new URLSearchParams({
            url: imageUrl,
            models: "nudity-2.1,offensive",
            api_user: apiUser,
            api_secret: apiSecret,
        });

        const res = await fetch(`https://api.sightengine.com/1.0/check.json?${params.toString()}`);
        const data = await res.json();

        if (data.status !== "success") {
            console.error("[ContentModeration] Sightengine error:", data);
            // Fail open — let post through if API errors
            return { safe: true };
        }

        // nudity-2.1 returns data.nudity.sexual_activity, .sexual_display, .erotica
        const nudityScore = Math.max(
            data.nudity?.sexual_activity ?? 0,
            data.nudity?.sexual_display ?? 0,
            data.nudity?.erotica ?? 0,
        );
        const offensiveScore = data.offensive?.prob ?? 0;

        const NUDITY_THRESHOLD = 0.55;
        const OFFENSIVE_THRESHOLD = 0.75;

        if (nudityScore >= NUDITY_THRESHOLD) {
            return {
                safe: false,
                reason: "This image contains explicit/nudity content and cannot be posted.",
                nudity: nudityScore,
            };
        }

        if (offensiveScore >= OFFENSIVE_THRESHOLD) {
            return {
                safe: false,
                reason: "This image contains offensive content and cannot be posted.",
                offensive: offensiveScore,
            };
        }

        return { safe: true, nudity: nudityScore, offensive: offensiveScore };

    } catch (error) {
        console.error("[ContentModeration] Image check failed:", error);
        // Fail open
        return { safe: true };
    }
}

/**
 * Check multiple image URLs in parallel. Returns first failed result or safe.
 */
export async function checkAllImages(imageUrls: string[]): Promise<ImageModerationResult> {
    const results = await Promise.all(imageUrls.map(url => checkImageModeration(url)));
    const failed = results.find(r => !r.safe);
    return failed ?? { safe: true };
}
