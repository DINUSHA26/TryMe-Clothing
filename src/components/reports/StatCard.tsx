"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number; // Percentage change (e.g., 15.5 for +15.5%)
  changeLabel?: string; // Optional label for change (e.g., "vs last month")
  icon: LucideIcon;
  color?: "purple" | "blue" | "green" | "orange" | "red" | "yellow";
  isLoading?: boolean;
  description?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = "blue",
  isLoading = false,
  description,
}: StatCardProps) {

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  const isPositiveChange = change !== undefined && change > 0;
  const isNegativeChange = change !== undefined && change < 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-foreground" />
          </div>

          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                isPositiveChange && "text-green-600 dark:text-green-400",
                isNegativeChange && "text-red-600 dark:text-red-400",
                change === 0 && "text-gray-600 dark:text-gray-400"
              )}
            >
              {change !== 0 && (
                <>
                  {isPositiveChange ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </>
              )}
              <span>
                {change > 0 ? "+" : ""}
                {change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <p className="text-2xl font-bold mb-1">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>

        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}

        {changeLabel && change !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">{changeLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
