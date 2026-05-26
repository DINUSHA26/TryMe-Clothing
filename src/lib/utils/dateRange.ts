/**
 * Date Range Utilities
 * Functions for handling date ranges and preset selections
 */

import { format, subDays, subMonths, startOfYear, startOfMonth, startOfWeek, endOfDay } from "date-fns";

export interface DateRange {
  label: string;
  dateFrom: Date;
  dateTo: Date;
}

export type DateRangePreset = "7d" | "30d" | "90d" | "year" | "month" | "week" | "all";

/**
 * Get preset date ranges
 * Returns common date range presets for reports
 */
export function getPresetDateRanges(): DateRange[] {
  const now = new Date();
  const today = endOfDay(now);

  return [
    {
      label: "Last 7 Days",
      dateFrom: subDays(today, 6), // Include today
      dateTo: today,
    },
    {
      label: "Last 30 Days",
      dateFrom: subDays(today, 29),
      dateTo: today,
    },
    {
      label: "Last 90 Days",
      dateFrom: subDays(today, 89),
      dateTo: today,
    },
    {
      label: "This Month",
      dateFrom: startOfMonth(now),
      dateTo: today,
    },
    {
      label: "This Year",
      dateFrom: startOfYear(now),
      dateTo: today,
    },
    {
      label: "All Time",
      dateFrom: new Date("2024-01-01"), // Platform launch date
      dateTo: today,
    },
  ];
}

/**
 * Get date range by preset key
 * @param preset - Preset key (7d, 30d, 90d, year, month, week, all)
 */
export function getDateRangeByPreset(preset: DateRangePreset): DateRange {
  const ranges = getPresetDateRanges();

  switch (preset) {
    case "7d":
      return ranges[0];
    case "30d":
      return ranges[1];
    case "90d":
      return ranges[2];
    case "month":
      return ranges[3];
    case "year":
      return ranges[4];
    case "all":
      return ranges[5];
    case "week":
      const now = new Date();
      return {
        label: "This Week",
        dateFrom: startOfWeek(now, { weekStartsOn: 1 }), // Monday
        dateTo: endOfDay(now),
      };
    default:
      return ranges[1]; // Default to last 30 days
  }
}

/**
 * Format date for API requests (YYYY-MM-DD)
 * @param date - Date object or string
 */
export function formatDateForAPI(date: Date | string): string {
  if (typeof date === "string") {
    return format(new Date(date), "yyyy-MM-dd");
  }
  return format(date, "yyyy-MM-dd");
}

/**
 * Format date for display (Jan 15, 2024)
 * @param date - Date object or string
 */
export function formatDateForDisplay(date: Date | string): string {
  if (typeof date === "string") {
    return format(new Date(date), "MMM dd, yyyy");
  }
  return format(date, "MMM dd, yyyy");
}

/**
 * Group data by time period
 * @param data - Array of data with date field
 * @param period - Grouping period (daily, weekly, monthly)
 * @param dateField - Name of the date field (default: "createdAt")
 */
export function groupByPeriod(data: any[], period: "daily" | "weekly" | "monthly", dateField: string = "createdAt"): Map<string, any[]> {
  const grouped = new Map<string, any[]>();

  data.forEach((item) => {
    const date = new Date(item[dateField]);
    let key: string;

    switch (period) {
      case "daily":
        key = format(date, "yyyy-MM-dd");
        break;
      case "weekly":
        key = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
        break;
      case "monthly":
        key = format(startOfMonth(date), "yyyy-MM");
        break;
      default:
        key = format(date, "yyyy-MM-dd");
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });

  return grouped;
}

/**
 * Generate date labels for charts
 * @param dateFrom - Start date
 * @param dateTo - End date
 * @param period - Period (daily, weekly, monthly)
 */
export function generateDateLabels(dateFrom: Date, dateTo: Date, period: "daily" | "weekly" | "monthly"): string[] {
  const labels: string[] = [];
  let current = new Date(dateFrom);

  while (current <= dateTo) {
    switch (period) {
      case "daily":
        labels.push(format(current, "MMM dd"));
        current = subDays(current, -1); // Add 1 day
        break;
      case "weekly":
        labels.push(format(current, "MMM dd"));
        current = subDays(current, -7); // Add 7 days
        break;
      case "monthly":
        labels.push(format(current, "MMM yyyy"));
        current = subMonths(current, -1); // Add 1 month
        break;
    }

    // Safety: prevent infinite loops
    if (labels.length > 1000) {
      break;
    }
  }

  return labels;
}

/**
 * Validate date range
 * @param dateFrom - Start date
 * @param dateTo - End date
 * @throws Error if date range is invalid
 */
export function validateDateRange(dateFrom: Date | string, dateTo: Date | string): void {
  const from = typeof dateFrom === "string" ? new Date(dateFrom) : dateFrom;
  const to = typeof dateTo === "string" ? new Date(dateTo) : dateTo;

  if (isNaN(from.getTime())) {
    throw new Error("Invalid start date");
  }

  if (isNaN(to.getTime())) {
    throw new Error("Invalid end date");
  }

  if (from > to) {
    throw new Error("Start date must be before end date");
  }

  // Maximum 2 years range
  const maxRange = 365 * 2;
  const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > maxRange) {
    throw new Error("Date range cannot exceed 2 years");
  }
}

/**
 * Get recommended period based on date range
 * @param dateFrom - Start date
 * @param dateTo - End date
 * @returns Recommended period (daily, weekly, monthly)
 */
export function getRecommendedPeriod(dateFrom: Date, dateTo: Date): "daily" | "weekly" | "monthly" {
  const diffDays = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 31) {
    return "daily";
  } else if (diffDays <= 90) {
    return "weekly";
  } else {
    return "monthly";
  }
}

/**
 * Check if date range is today
 * @param dateFrom - Start date
 * @param dateTo - End date
 */
export function isToday(dateFrom: Date, dateTo: Date): boolean {
  const today = format(new Date(), "yyyy-MM-dd");
  return formatDateForAPI(dateFrom) === today && formatDateForAPI(dateTo) === today;
}

/**
 * Get relative time description
 * @param dateFrom - Start date
 * @param dateTo - End date
 */
export function getRelativeTimeDescription(dateFrom: Date, dateTo: Date): string {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const fromStr = formatDateForAPI(dateFrom);
  const toStr = formatDateForAPI(dateTo);

  if (fromStr === toStr && fromStr === today) {
    return "Today";
  }

  if (fromStr === format(subDays(now, 1), "yyyy-MM-dd") && fromStr === toStr) {
    return "Yesterday";
  }

  const presets = getPresetDateRanges();
  for (const preset of presets) {
    if (formatDateForAPI(preset.dateFrom) === fromStr && formatDateForAPI(preset.dateTo) === toStr) {
      return preset.label;
    }
  }

  return `${formatDateForDisplay(dateFrom)} - ${formatDateForDisplay(dateTo)}`;
}
