/**
 * CSV Export Utilities
 * Functions for exporting data to CSV format using papaparse
 */

import Papa from "papaparse";
import { format } from "date-fns";

/**
 * Export data to CSV and trigger browser download
 * @param data - Array of objects to export
 * @param filename - Base filename (without extension or date)
 */
export function exportToCSV(data: any[], filename: string): void {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  // Format data for Excel compatibility
  const formattedData = prepareDataForExport(data);

  // Generate CSV using papaparse
  const csv = Papa.unparse(formattedData, {
    header: true,
    quotes: true,
    skipEmptyLines: true,
  });

  // Trigger browser download
  downloadFile(csv, `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`, "text/csv;charset=utf-8;");
}

/**
 * Prepare data for CSV export
 * - Converts Decimal/Prisma types to plain numbers
 * - Formats dates as YYYY-MM-DD
 * - Removes "Rs." prefix from currency
 * - Flattens nested objects
 *
 * @param data - Raw data from API
 * @param reportType - Optional report type for custom formatting
 */
export function prepareDataForExport(data: any[], reportType?: string): any[] {
  return data.map((row) => {
    const formattedRow: any = {};

    Object.entries(row).forEach(([key, value]) => {
      // Skip internal fields
      if (key.startsWith("_") || key === "id") {
        return;
      }

      // Handle Decimal/Prisma types (convert to number)
      if (value && typeof value === "object" && "toNumber" in (value as any)) {
        formattedRow[key] = (value as any).toNumber();
      }
      // Handle Date objects
      else if (value instanceof Date) {
        formattedRow[key] = format(value, "yyyy-MM-dd HH:mm:ss");
      }
      // Handle ISO date strings
      else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        formattedRow[key] = format(new Date(value), "yyyy-MM-dd HH:mm:ss");
      }
      // Handle currency strings (remove "Rs." prefix)
      else if (typeof value === "string" && value.startsWith("Rs. ")) {
        formattedRow[key] = parseFloat(value.replace("Rs. ", "").replace(/,/g, ""));
      }
      // Handle nested objects (flatten to JSON string)
      else if (value && typeof value === "object" && !Array.isArray(value)) {
        formattedRow[key] = JSON.stringify(value);
      }
      // Handle arrays (convert to comma-separated string)
      else if (Array.isArray(value)) {
        formattedRow[key] = value.map((v) => (typeof v === "object" ? JSON.stringify(v) : v)).join(", ");
      }
      // Handle null/undefined
      else if (value === null || value === undefined) {
        formattedRow[key] = "";
      }
      // Handle all other types as-is
      else {
        formattedRow[key] = value;
      }
    });

    return formattedRow;
  });
}

/**
 * Trigger browser download of file
 * @param content - File content as string
 * @param filename - Full filename with extension
 * @param mimeType - MIME type of file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  // Create Blob
  const blob = new Blob([content], { type: mimeType });

  // Create temporary download link
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Format report data based on report type
 * Applies specific transformations for different report types
 *
 * @param data - Raw data
 * @param reportType - Type of report (sales, vendors, commission, products)
 */
export function formatReportData(data: any[], reportType: string): any[] {
  switch (reportType) {
    case "sales":
      return data.map((order) => ({
        "Order Number": order.orderNumber,
        Date: order.createdAt,
        Customer: order.customer?.user?.email || "N/A",
        Amount: order.totalAmount,
        Commission: order.commissionAmount || 0,
        Status: order.status,
        "Vendor(s)": order.vendors || "N/A",
      }));

    case "vendors":
      return data.map((vendor) => ({
        "Vendor Name": vendor.businessName,
        "Total Sales": vendor.totalRevenue,
        Orders: vendor.orderCount,
        "Avg Order Value": vendor.averageOrderValue,
        "Commission Paid": vendor.commissionPaid,
        Status: vendor.isActive ? "Active" : "Inactive",
      }));

    case "commission":
      return data.map((transaction) => ({
        Date: transaction.createdAt,
        "Order Number": transaction.orderNumber,
        Vendor: transaction.vendorName,
        "Order Amount": transaction.orderAmount,
        "Commission Rate": `${transaction.commissionRate}%`,
        "Commission Earned": transaction.commissionAmount,
      }));

    case "products":
      return data.map((product) => ({
        Product: product.name,
        "Units Sold": product.unitsSold,
        Revenue: product.revenue,
        "Avg Price": product.averagePrice,
        Stock: product.stock,
        Status: product.isActive ? "Active" : "Inactive",
      }));

    default:
      return data;
  }
}

/**
 * Validate data before export
 * @param data - Data to validate
 * @throws Error if data is invalid
 */
export function validateExportData(data: any[]): void {
  if (!Array.isArray(data)) {
    throw new Error("Export data must be an array");
  }

  if (data.length === 0) {
    throw new Error("No data available to export");
  }

  if (data.length > 100000) {
    throw new Error("Export size exceeds maximum limit (100,000 rows)");
  }
}
