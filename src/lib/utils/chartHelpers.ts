/**
 * Chart Helper Utilities
 * Functions for formatting chart data and generating colors
 */

/**
 * Predefined color palettes for charts
 */
export const CHART_COLORS = {
  primary: ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1", "#d084d8", "#a4de6c"],
  revenue: ["#10b981", "#3b82f6"],
  status: {
    PENDING_PAYMENT: "#f59e0b",
    PAYMENT_CONFIRMED: "#3b82f6",
    PROCESSING: "#8b5cf6",
    SHIPPED: "#06b6d4",
    DELIVERY_CONFIRMED: "#10b981",
    DELIVERED: "#059669",
    CANCELLED: "#ef4444",
    DISPUTED: "#f97316",
    REFUNDED: "#dc2626",
    CLOSED: "#6b7280",
  },
  payment: {
    VISA: "#1a1f71",
    MASTER: "#eb001b",
    AMEX: "#006fcf",
    DISCOVER: "#f68121",
  },
};

/**
 * Generate array of colors for charts
 * @param count - Number of colors needed
 * @param palette - Optional custom palette
 */
export function getChartColors(count: number, palette?: string[]): string[] {
  const colors = palette || CHART_COLORS.primary;
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }

  return result;
}

/**
 * Format currency for chart display
 * Shows abbreviated format for large numbers
 * @param value - Numeric value
 * @param showSymbol - Whether to show Rs. symbol
 */
export function formatChartCurrency(value: number, showSymbol: boolean = true): string {
  const symbol = showSymbol ? "Rs. " : "";

  if (value === 0) {
    return `${symbol}0`;
  }

  // For values >= 10M, show as "10.5M"
  if (Math.abs(value) >= 10000000) {
    return `${symbol}${(value / 1000000).toFixed(1)}M`;
  }

  // For values >= 1M, show as "1.23M"
  if (Math.abs(value) >= 1000000) {
    return `${symbol}${(value / 1000000).toFixed(2)}M`;
  }

  // For values >= 100K, show as "125K"
  if (Math.abs(value) >= 100000) {
    return `${symbol}${(value / 1000).toFixed(0)}K`;
  }

  // For values >= 10K, show as "12.5K"
  if (Math.abs(value) >= 10000) {
    return `${symbol}${(value / 1000).toFixed(1)}K`;
  }

  // For values >= 1K, show as "1.23K"
  if (Math.abs(value) >= 1000) {
    return `${symbol}${(value / 1000).toFixed(2)}K`;
  }

  // For smaller values, show with 2 decimals
  return `${symbol}${value.toFixed(2)}`;
}

/**
 * Format large numbers with abbreviations (K, M, B)
 * @param value - Numeric value
 */
export function formatChartNumber(value: number): string {
  if (value === 0) {
    return "0";
  }

  if (Math.abs(value) >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)}B`;
  }

  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }

  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }

  return value.toString();
}

/**
 * Format percentage for chart display
 * @param value - Decimal value (0.15 = 15%)
 * @param decimals - Number of decimal places
 */
export function formatChartPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Generate gradient colors for bar charts
 * @param baseColor - Base color in hex format
 * @param count - Number of gradients
 */
export function generateGradientColors(baseColor: string, count: number): string[] {
  // Simple opacity-based gradient
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const opacity = 1 - (i / count) * 0.4; // 100% to 60% opacity
    colors.push(`${baseColor}${Math.floor(opacity * 255).toString(16).padStart(2, "0")}`);
  }
  return colors;
}

/**
 * Transform data for pie charts
 * @param data - Object with status/type keys and count values
 */
export function transformToPieChartData(data: Record<string, number>): Array<{ name: string; value: number; percentage: number }> {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  return Object.entries(data)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
    }));
}

/**
 * Transform data for line/bar charts
 * @param data - Array of data points
 * @param xKey - Key for x-axis value
 * @param yKey - Key for y-axis value
 */
export function transformToChartData(data: any[], xKey: string, yKey: string | string[]): any[] {
  if (Array.isArray(yKey)) {
    // Multiple y-values (e.g., revenue and commission)
    return data.map((item) => {
      const point: any = { [xKey]: item[xKey] };
      yKey.forEach((key) => {
        point[key] = item[key];
      });
      return point;
    });
  } else {
    // Single y-value
    return data.map((item) => ({
      [xKey]: item[xKey],
      [yKey]: item[yKey],
    }));
  }
}

/**
 * Sort chart data by value (for top N charts)
 * @param data - Array of data points
 * @param valueKey - Key to sort by
 * @param order - Sort order (asc or desc)
 * @param limit - Maximum number of items
 */
export function sortChartData(data: any[], valueKey: string, order: "asc" | "desc" = "desc", limit?: number): any[] {
  const sorted = [...data].sort((a, b) => {
    const aVal = a[valueKey];
    const bVal = b[valueKey];
    return order === "desc" ? bVal - aVal : aVal - bVal;
  });

  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * Calculate percentage change between two values
 * @param current - Current value
 * @param previous - Previous value
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Format percentage change for display
 * @param change - Percentage change value
 * @param includeSign - Whether to include + or - sign
 */
export function formatPercentageChange(change: number, includeSign: boolean = true): string {
  const sign = includeSign ? (change > 0 ? "+" : change < 0 ? "" : "") : "";
  return `${sign}${change.toFixed(1)}%`;
}

/**
 * Get color based on value (positive = green, negative = red)
 * @param value - Numeric value
 */
export function getValueColor(value: number): string {
  if (value > 0) return "#10b981"; // green-500
  if (value < 0) return "#ef4444"; // red-500
  return "#6b7280"; // gray-500
}

/**
 * Truncate long labels for charts
 * @param label - Original label
 * @param maxLength - Maximum length
 */
export function truncateLabel(label: string, maxLength: number = 15): string {
  if (label.length <= maxLength) {
    return label;
  }
  return `${label.substring(0, maxLength - 3)}...`;
}

/**
 * Format tooltip value for charts
 * @param value - Value to format
 * @param type - Type of value (currency, number, percentage)
 */
export function formatTooltipValue(value: number, type: "currency" | "number" | "percentage" = "number"): string {
  switch (type) {
    case "currency":
      return `Rs. ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case "percentage":
      return `${value.toFixed(1)}%`;
    case "number":
    default:
      return value.toLocaleString("en-US");
  }
}

/**
 * Get responsive chart height based on screen size
 * @param baseHeight - Base height in pixels
 * @param isMobile - Whether the screen is mobile size
 */
export function getResponsiveChartHeight(baseHeight: number = 300, isMobile?: boolean): number {
  if (isMobile) {
    return Math.min(baseHeight, 250);
  }
  return baseHeight;
}

/**
 * Aggregate data by time period
 * @param data - Array of data points with date and value
 * @param dateKey - Key for date field
 * @param valueKey - Key for value field
 * @param period - Time period (daily, weekly, monthly)
 */
export function aggregateByPeriod(
  data: any[],
  dateKey: string,
  valueKey: string,
  period: "daily" | "weekly" | "monthly"
): Array<{ date: string; value: number }> {
  const grouped = new Map<string, number>();

  data.forEach((item) => {
    const date = new Date(item[dateKey]);
    let key: string;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    switch (period) {
      case "daily":
        key = `${year}-${month}-${day}`;
        break;
      case "weekly":
        // Get Monday of the week
        const monday = new Date(date);
        monday.setDate(date.getDate() - date.getDay() + 1);
        key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
        break;
      case "monthly":
        key = `${year}-${month}`;
        break;
      default:
        key = `${year}-${month}-${day}`;
    }

    const value = item[valueKey] || 0;
    grouped.set(key, (grouped.get(key) || 0) + value);
  });

  return Array.from(grouped.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
