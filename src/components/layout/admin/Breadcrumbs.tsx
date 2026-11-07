"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbs =
    items ||
    pathname
      .split("/")
      .filter(Boolean)
      .map((segment, index, array) => {
        const href = `/${array.slice(0, index + 1).join("/")}`;
        let label = segment;
        if (/^(PW|WEB|POS)-/i.test(segment)) {
          label = `#${segment.toUpperCase()}`;
        } else if (/^c[a-z0-9]{20,}$/i.test(segment)) {
          const prev = array[index - 1]?.toLowerCase();
          if (prev === "products") {
            label = "Product Details";
          } else if (prev === "orders") {
            label = "Order Details";
          } else if (prev === "coupons") {
            label = "Coupon Details";
          } else if (prev === "staff") {
            label = "Staff Details";
          } else {
            label = "Details";
          }
        } else {
          label = segment
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }
        return { label, href };
      });

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm">
      <Link
        href={breadcrumbs[0].href || "/"}
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <Fragment key={crumb.href || index}>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href || "#"}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
