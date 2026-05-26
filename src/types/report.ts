/**
 * Report Types
 * TypeScript interfaces and types for reports
 */

export interface DashboardStats {
  totalRevenue: number;
  thisMonthRevenue: number;
  totalCommission: number;
  activeVendors: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface VendorDashboardStats {
  totalSales: number;
  thisMonthSales: number;
  pendingBalance: number;
  availableBalance: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface RevenueTrendData {
  labels: string[];
  revenue: number[];
  commission: number[];
}

export interface VendorSalesTrendData {
  labels: string[];
  grossSales: number[];
  netEarnings: number[];
}

export interface OrderDistribution {
  [status: string]: number;
}

export interface PaymentMethodDistribution {
  [method: string]: number;
}

export interface TopVendor {
  vendorId: string;
  businessName: string;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue?: number;
}

export interface TopCategory {
  categoryId: string;
  name: string;
  totalRevenue: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  unitsSold: number;
  revenue: number;
  averagePrice: number;
}

export interface SalesReportItem {
  orderNumber: string;
  createdAt: Date | string;
  customerEmail: string;
  totalAmount: number;
  commissionAmount: number;
  status: string;
  vendors: string;
}

export interface VendorPerformance {
  vendorId: string;
  businessName: string;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  commissionPaid: number;
  isActive: boolean;
}

export interface CommissionReportItem {
  createdAt: Date | string;
  orderNumber: string;
  vendorName: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
}

export interface EarningsBreakdown {
  labels: string[];
  grossSales: number[];
  commission: number[];
  netEarnings: number[];
}

export interface ProductPerformance {
  productId: string;
  name: string;
  unitsSold: number;
  revenue: number;
  averagePrice: number;
  stock: number;
  isActive: boolean;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: any;
}

export interface PieChartData {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

export interface LineChartData {
  date: string;
  [key: string]: string | number;
}

export interface BarChartData {
  name: string;
  value: number;
  color?: string;
}

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  period?: "daily" | "weekly" | "monthly";
  vendorId?: string;
  categoryId?: string;
  productId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
}

export interface DateRangePreset {
  label: string;
  value: string;
  dateFrom: Date;
  dateTo: Date;
}

export interface ExportOptions {
  filename: string;
  format: "csv" | "pdf";
  data: any[];
  reportType: string;
}

export interface ReportMetadata {
  generatedAt: Date;
  dateRange: {
    from: string;
    to: string;
  };
  filters: ReportFilters;
  totalRecords: number;
}

export interface StatCardData {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: any;
  color: "purple" | "blue" | "green" | "orange" | "red" | "yellow";
  isLoading?: boolean;
}

export type ReportType = "sales" | "vendors" | "commission" | "products" | "orders" | "overview" | "trends";

export type DateRangPresetKey = "7d" | "30d" | "90d" | "month" | "year" | "all" | "custom";

export type ChartType = "line" | "bar" | "pie" | "area" | "stacked-bar";

export interface ChartConfig {
  type: ChartType;
  title: string;
  description?: string;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  responsive?: boolean;
}

export interface ReportResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: ReportMetadata;
}

export interface PaginatedReportResponse<T = any> {
  success: boolean;
  data?: {
    items: T[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  };
  error?: string;
}
