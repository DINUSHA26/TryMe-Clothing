"use client";

import { Feed } from "@/components/social/Feed";
import { StoriesTray } from "@/components/social/StoriesTray";

export default function SocialPage() {
    return (
        <div className="container px-4 md:px-6 py-6 md:py-8 max-w-3xl">
            <div className="mb-6 md:mb-8 px-4 sm:px-0">
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Social Feed</h1>
                <p className="text-sm md:text-base text-muted-foreground font-medium">Discover the latest trends, outfits, and updates from the Try Me community.</p>
            </div>

            {/* Facebook-style Stories Tray */}
            <div className="mb-6">
                <StoriesTray />
            </div>

            <Feed />
        </div>
    );
}

