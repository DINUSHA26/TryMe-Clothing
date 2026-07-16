"use client";

import { Feed } from "@/components/social/Feed";
import { StoriesTray } from "@/components/social/StoriesTray";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function SocialPage() {
    return (
        <div className="w-full">
            {/* Page title — padded */}
            <div className="container px-4 md:px-6 pt-6 md:pt-8 max-w-3xl mb-4">
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Social Media</h1>
                <p className="text-sm md:text-base text-muted-foreground font-medium">Discover the latest trends, outfits, and updates from the Try Me community.</p>
            </div>

            {/* Facebook-style Stories Tray — padded */}
            <div className="container px-4 md:px-6 max-w-3xl mb-4">
                <Suspense fallback={<div className="h-48 w-full bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />}>
                    <StoriesTray />
                </Suspense>
            </div>

            {/* Feed — full bleed edge-to-edge on mobile, contained on desktop */}
            <div className="w-full md:container md:px-6 md:max-w-3xl pb-8">
                <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
                    <Feed />
                </Suspense>
            </div>
        </div>
    );
}

