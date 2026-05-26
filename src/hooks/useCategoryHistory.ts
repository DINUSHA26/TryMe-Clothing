"use client";

import { useState, useEffect, useCallback } from "react";

const HISTORY_KEY = "fashiondora_category_history";
const MAX_HISTORY = 6; // Limit to 6 for a clean grid

export function useCategoryHistory() {
    const [history, setHistory] = useState<string[]>([]);

    // Load history on mount
    useEffect(() => {
        const stored = localStorage.getItem(HISTORY_KEY);
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse category history", e);
            }
        }
    }, []);

    const trackCategory = useCallback((categoryId: string) => {
        if (!categoryId) return;

        setHistory((prev) => {
            // Move to front, remove duplicates, limit count
            const newHistory = [
                categoryId,
                ...prev.filter((id) => id !== categoryId)
            ].slice(0, MAX_HISTORY);

            localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
            return newHistory;
        });
    }, []);

    const clearHistory = useCallback(() => {
        localStorage.removeItem(HISTORY_KEY);
        setHistory([]);
    }, []);

    return { history, trackCategory, clearHistory };
}
