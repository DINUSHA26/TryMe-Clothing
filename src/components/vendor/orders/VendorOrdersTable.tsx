/**
 * Vendor Orders Table Component
 * Displays orders containing vendor's items in a table format
 */

"use client";

import Link from "next/link";
import { format } from "date-fns";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { OrderStatus } from "@prisma/client";

interface VendorOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  customer: { email: string };
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
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Order #</th>
              <th className="text-left px-4 py-3 font-medium">Customer</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Items</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/vendor/orders/${order.id}`}
                    className="font-medium hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm">{order.customer.email}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {format(new Date(order.createdAt), "PPP")}
                </td>
                <td className="px-4 py-3 text-sm">{order.vendorItems.length}</td>
                <td className="px-4 py-3 text-sm font-medium">
                  Rs.{" "}
                  {order.vendorTotal.toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge 
                    status={order.status} 
                    items={order.vendorItems}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/vendor/orders/${order.id}`}>
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
