/**
 * Admin Orders Table Component
 * Displays all orders with vendor and commission information
 */

"use client";

import Link from "next/link";
import { format } from "date-fns";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { OrderStatus } from "@prisma/client";

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  commissionEarned: number;
  createdAt: string;
  customer: {
    email: string;
  };
  vendors: string[];
  itemCount: number;
  items: { status: string }[];
  payment: {
    status: string;
    method: string;
    paidAt: string | null;
  } | null;
}

interface AdminOrdersTableProps {
  orders: AdminOrder[];
}

export function AdminOrdersTable({ orders }: AdminOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">No orders found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Order #</th>
              <th className="text-left px-4 py-3 font-medium">Customer</th>
              <th className="text-left px-4 py-3 font-medium">Vendor(s)</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Commission</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm">{order.customer.email}</td>
                <td className="px-4 py-3 text-sm">
                  {order.vendors.length > 0 ? (
                    <span title={order.vendors.join(", ")}>
                      {order.vendors.length === 1
                        ? order.vendors[0]
                        : `${order.vendors.length} vendors`}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {format(new Date(order.createdAt), "PP")}
                </td>
                <td className="px-4 py-3 text-sm font-medium">
                  Rs.{" "}
                  {order.totalAmount.toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-green-600">
                  Rs.{" "}
                  {order.commissionEarned.toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge 
                    status={order.status} 
                    items={order.items}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/orders/${order.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
