"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useEffect, useState } from "react";

export function WishlistButton() {
    const { items } = useWishlistStore();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch for persistent storage
    useEffect(() => {
        setMounted(true);
    }, []);

    const itemCount = mounted ? items.length : 0;

    return (
        <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-accent transition-colors"
            asChild
        >
            <Link href="/wishlist" aria-label={`Wishlist with ${itemCount} items`}>
                <Heart className="h-5 w-5" />
                {itemCount > 0 && (
                    <Badge
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold bg-primary text-primary-foreground border-2 border-background animate-in zoom-in duration-300"
                    >
                        {itemCount}
                    </Badge>
                )}
            </Link>
        </Button>
    );
}
