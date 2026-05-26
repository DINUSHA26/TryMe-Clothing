"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "icon" | "text";
  size?: "sm" | "md" | "lg";
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
      image: 36,
      text: "text-base",
    },
    md: {
      container: "gap-3",
      image: 48,
      text: "text-2xl",
    },
    lg: {
      container: "gap-4",
      image: 72,
      text: "text-3xl",
    },
  };

  const classes = sizeClasses[size];

  return (
    <Link
      href={href}
      className={cn("flex items-center", classes.container, className)}
    >
      {variant !== "text" && (
        <div className="relative flex items-center justify-center">
          {/* Light Mode Logo (Black Monogram) */}
          <div className="block dark:hidden">
            <Image
              src="/logo-black.png"
              alt="Fashion Dora"
              width={classes.image}
              height={classes.image}
              className="object-contain"
              priority
            />
          </div>
          {/* Dark Mode Logo (White Monogram) */}
          <div className="hidden dark:block">
            <Image
              src="/logo-white.png"
              alt="Fashion Dora"
              width={classes.image}
              height={classes.image}
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}
      {variant !== "icon" && (
        <span className={cn("font-bold text-foreground tracking-tight hidden min-[400px]:inline-block", classes.text)}>
          Fashion Dora
        </span>
      )}
    </Link>
  );
}

