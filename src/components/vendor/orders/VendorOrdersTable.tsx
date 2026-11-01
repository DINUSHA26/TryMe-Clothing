/**
 * Vendor Orders Table Component
 * Displays orders containing vendor's items in a table format with Channel & Payment badges
 */

"use client";

import Link from "next/link";
import { format } from "date-fns";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Globe, Store, CreditCard, Banknote, FileCheck } from "lucide-react";
import { OrderStatus } from "@prisma/client";

interface VendorOrder {
  id: string;
  orderNumber: string;
  orderSource?: "TRYME_MARKETPLACE" | "VENDOR_WEBSITE";
  paymentMethod?: string;
  paymentSlipUrl?: string | null;
  status: OrderStatus;
  createdAt: string;
  customer: { email: string; fullName?: string; phone?: string };
  vendorTotal: number;
  vendorItems: { id: string; status: string }[];
}

interface VendorOrdersTableProps {
  orders: VendorOrder[];
}

export function VendorOrdersTable({ orders }: VendorOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">No orders found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-card shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/70 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3.5 font-bold">Order #</th>
              <th className="text-left px-4 py-3.5 font-bold">Channel</th>
              <th className="text-left px-4 py-3.5 font-bold">Customer</th>
              <th className="text-left px-4 py-3.5 font-bold">Payment</th>
              <th className="text-left px-4 py-3.5 font-bold">Date</th>
              <th className="text-left px-4 py-3.5 font-bold">Items</th>
              <th className="text-left px-4 py-3.5 font-bold">Amount</th>
              <th className="text-left px-4 py-3.5 font-bold">Status</th>
              <th className="text-right px-4 py-3.5 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => {
              const isWebsite =
                order.orderSource === "VENDOR_WEBSITE" ||
                order.orderNumber.startsWith("WEB-");

              return (
                <tr key={order.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/vendor/orders/${order.id}`}
                      className="font-bold text-sm hover:underline text-primary"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    {isWebsite ? (
                      <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20 text-[10px] font-bold inline-flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>My Website</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold inline-flex items-center gap-1"
                      >
                        <Store className="w-3 h-3" />
                        <span>TryMe.lk</span>
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-sm">
                    <div className="font-semibold text-foreground">
                      {order.customer.fullName || order.customer.email}
                    </div>
                    {order.customer.phone && (
                      <div className="text-xs text-muted-foreground">
                        {order.customer.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold inline-flex items-center gap-1">
                        {order.paymentMethod === "COD" ? (
                          <>
                            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                            <span>COD</span>
                          </>
                        ) : order.paymentMethod === "BANK_DEPOSIT" ? (
                          <>
                            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                            <span>Bank Deposit</span>
                          </>
                        ) : (
                          <span>{order.paymentMethod || "Online"}</span>
                        )}
                      </span>
                      {order.paymentSlipUrl && (
                        <a
                          href={order.paymentSlipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5"
                        >
                          <FileCheck className="w-3 h-3" />
                          <span>View Bank Slip</span>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    {format(new Date(order.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium">
                    {order.vendorItems.length}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-bold">
                    Rs.{" "}
                    {order.vendorTotal.toLocaleString("en-LK", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3.5">
                    <OrderStatusBadge status={order.status} items={order.vendorItems} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/vendor/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs font-bold">
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Manage
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
