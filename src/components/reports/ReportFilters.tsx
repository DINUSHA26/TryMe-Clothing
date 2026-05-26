"use client";

import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Filter } from "lucide-react";
import { DateRangeSelector } from "./DateRangeSelector";

export interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "select" | "dateRange";
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
}

interface ReportFiltersProps {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  config: FilterConfig[];
  children?: ReactNode;
  showDateRange?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  onDateRangeChange?: (dateFrom: Date, dateTo: Date) => void;
}

export function ReportFilters({
  filters,
  onFiltersChange,
  config,
  children,
  showDateRange = true,
  dateFrom,
  dateTo,
  onDateRangeChange,
}: ReportFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleReset = () => {
    const resetFilters: Record<string, any> = {};
    config.forEach((filter) => {
      resetFilters[filter.key] = "";
    });
    onFiltersChange(resetFilters);
  };

  const hasActiveFilters = Object.values(filters).some((value) => value);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Date Range Selector - Always Visible */}
          {showDateRange && dateFrom && dateTo && onDateRangeChange && (
            <div>
              <Label className="mb-2 block">Date Range</Label>
              <DateRangeSelector
                dateFrom={dateFrom}
                dateTo={dateTo}
                onChange={onDateRangeChange}
              />
            </div>
          )}

          {/* Toggle Advanced Filters Button */}
          {config.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full sm:w-auto"
            >
              <Filter className="mr-2 h-4 w-4" />
              {isExpanded ? "Hide" : "Show"} Advanced Filters
            </Button>
          )}

          {/* Advanced Filters - Collapsible */}
          {isExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
              {config.map((filter) => (
                <div key={filter.key}>
                  <Label htmlFor={filter.key} className="mb-2 block">
                    {filter.label}
                  </Label>

                  {filter.type === "text" && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={filter.key}
                        placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}`}
                        value={filters[filter.key] || ""}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  )}

                  {filter.type === "select" && filter.options && (
                    <Select
                      value={filters[filter.key] || ""}
                      onValueChange={(value) => handleFilterChange(filter.key, value)}
                    >
                      <SelectTrigger id={filter.key}>
                        <SelectValue placeholder={filter.placeholder || `Select ${filter.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All</SelectItem>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}

              {/* Reset Button */}
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={!hasActiveFilters}
                  className="w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              </div>
            </div>
          )}

          {/* Custom Children (e.g., Export Button) */}
          {children && (
            <div className="flex items-center gap-2 pt-4 border-t">
              {children}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
