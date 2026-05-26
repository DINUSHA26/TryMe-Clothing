"use client";

import Link from "next/link";
import { Facebook, Instagram, Mail } from "lucide-react";
import { Logo } from "../shared/Logo";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function StorefrontFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40 mt-auto">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <Logo variant="icon" href="/" />
            <p className="text-sm text-muted-foreground">
              Sri Lanka&apos;s premier multi-vendor e-commerce platform. Shop from
              trusted vendors with secure escrow payments.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-11 w-11 md:h-10 md:w-10" asChild>
                <a href="https://web.facebook.com/profile.php?id=100075711233681" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <Facebook className="h-5 w-5 md:h-4 md:w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="h-11 w-11 md:h-10 md:w-10" asChild>
                <a href="https://www.instagram.com/fashion__dora" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <Instagram className="h-5 w-5 md:h-4 md:w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="h-11 w-11 md:h-10 md:w-10" asChild>
                <a href="https://www.tiktok.com/@fashion_dora" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                  <svg className="h-5 w-5 md:h-4 md:w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
                  </svg>
                </a>
              </Button>
            </div>
          </div>

          {/* Shop Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/categories"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  All Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/vendors"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Browse Vendors
                </Link>
              </li>
              <li>
                <Link
                  href="/deals"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Special Deals
                </Link>
              </li>
              <li>
                <Link
                  href="/new-arrivals"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/vendor/register"
                  className="text-orange-600 font-semibold hover:text-orange-700 transition-colors"
                >
                  Become a Vendor
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="font-semibold">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/help"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold">Newsletter</h3>
            <p className="text-sm text-muted-foreground">
              Subscribe to get special offers and updates.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                disabled
                className="h-11 md:h-10"
                title="Newsletter functionality coming soon"
              />
              <Button disabled className="h-11 w-11 md:h-10 md:w-10" title="Newsletter functionality coming soon">
                <Mail className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} Try Me. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="hover:text-foreground transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

