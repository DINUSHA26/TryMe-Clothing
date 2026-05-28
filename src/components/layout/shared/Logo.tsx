"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "icon" | "text";
  size?: "sm" | "mobile" | "md" | "lg" | "xl";
  className?: string;
  href?: string;
}

export function Logo({
  variant = "full",
  size = "md",
  className,
  href = "/",
}: LogoProps) {
  const sizeClasses = {
    sm: {
      container: "gap-2",
      width: 48,   // small size for collapsed sidebars
      height: 24,
      text: "text-base",
    },
    mobile: {
      container: "gap-1.5",
      width: 130,  // dedicated responsive mobile header size (optimized to prevent icon clipping)
      height: 40,
      text: "text-lg",
    },
    md: {
      container: "gap-3",
      width: 140,  // default size for footer, standard sidebar, etc.
      height: 44,
      text: "text-2xl",
    },
    lg: {
      container: "gap-4",
      width: 180,  // large size for storefront header (little big logo)
      height: 56,
      text: "text-3xl",
    },
    xl: {
      container: "gap-4",
      width: 220,  // extra large for login pages
      height: 70,
      text: "text-4xl",
    },
  };

  const classes = sizeClasses[size] || sizeClasses.md;

  return (
    <Link
      href={href}
      className={cn("flex items-center", classes.container, className)}
    >
      {variant !== "text" && (
        <div className="relative flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Try Me"
            width={classes.width}
            height={classes.height}
            className="object-contain"
            priority
          />
        </div>
      )}
      {variant !== "icon" && (
        <span className={cn("font-bold text-foreground tracking-tight hidden min-[400px]:inline-block", classes.text)}>
          Try Me
        </span>
      )}
    </Link>
  );
}



