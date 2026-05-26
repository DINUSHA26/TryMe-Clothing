/**
 * Admin Orders Page
 * Lists all orders with advanced filtering and statistics
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { tokenUtils } from "@/lib/auth";
import { getAdminOrders as getAdminOrdersDirect } from "@/lib/services/admin-order-service";
import { headers } from "next/headers";
import { AdminOrdersTable } from "@/components/admin/orders/AdminOrdersTable";
import { Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrderStatus } from "@prisma/client";

interface SearchParams {
  page?: string;
  status?: OrderStatus;
}
async function getAdminOrders(searchParams: SearchParams) {
  const headersList = await headers();
  const xUserRole = headersList.get("X-User-Role");

  // Allow if we have an admin role from middleware
  if (xUserRole && xUserRole !== "ADMIN") {
    return { error: "Forbidden", status: 403 };
  }

  try {
    const data = await getAdminOrdersDirect({
      page: searchParams.page,
      status: searchParams.status,
      pageSize: "20",
    });
    return data;
  } catch (error: any) {
    console.error("[AdminOrdersPage] Error:", error);
    return { error: error.message || "Failed to fetch orders" };
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const result = await getAdminOrders(resolvedSearchParams);

  if (!result) {
    redirect("/staff/login");
  }

  if ("error" in result) {
    if (result.status === 401) {
      redirect("/staff/login");
    }

    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-muted-foreground mb-8">{result.error}</p>
        <Link href="/admin">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const { orders, pagination, stats } = result;
  const currentStatus = resolvedSearchParams.status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">All Orders</h1>
        <p className="text-muted-foreground">
          Manage and monitor all platform orders
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Processing</p>
          <p className="text-2xl font-bold">{stats.processing}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Shipped</p>
          <p className="text-2xl font-bold">{stats.shipped}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Completed</p>
          <p className="text-2xl font-bold">{stats.deliveryConfirmed}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-2xl font-bold">
            Rs.{" "}
            {stats.totalRevenue.toLocaleString("en-LK", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/orders">
          <Button variant={!currentStatus ? "default" : "outline"} size="sm">
            All Orders
          </Button>
        </Link>
        <Link href="/admin/orders?status=PENDING_PAYMENT">
          <Button
            variant={
              currentStatus === "PENDING_PAYMENT" ? "default" : "outline"
            }
            size="sm"
          >
            Pending Payment
          </Button>
        </Link>
        <Link href="/admin/orders?status=PENDING_VERIFICATION">
          <Button
            variant={
              currentStatus === "PENDING_VERIFICATION" ? "default" : "outline"
            }
            size="sm"
          >
            Pending Verification
          </Button>
        </Link>
        <Link href="/admin/orders?status=PAYMENT_CONFIRMED">
          <Button
            variant={
              currentStatus === "PAYMENT_CONFIRMED" ? "default" : "outline"
            }
            size="sm"
          >
            Payment Confirmed
          </Button>
        </Link>
        <Link href="/admin/orders?status=PROCESSING">
          <Button
            variant={currentStatus === "PROCESSING" ? "default" : "outline"}
            size="sm"
          >
            Processing
          </Button>
        </Link>
        <Link href="/admin/orders?status=SHIPPED">
          <Button
            variant={currentStatus === "SHIPPED" ? "default" : "outline"}
            size="sm"
          >
            Shipped
          </Button>
        </Link>
        <Link href="/admin/orders?status=DELIVERED">
          <Button
            variant={currentStatus === "DELIVERED" ? "default" : "outline"}
            size="sm"
          >
            Delivered
          </Button>
        </Link>
        <Link href="/admin/orders?status=COMPLETED">
          <Button
            variant={
              currentStatus === "COMPLETED" || currentStatus === "DELIVERY_CONFIRMED" ? "default" : "outline"
            }
            size="sm"
          >
            Completed
          </Button>
        </Link>
        <Link href="/admin/orders?status=CANCELLED">
          <Button
            variant={currentStatus === "CANCELLED" ? "default" : "outline"}
            size="sm"
          >
            Cancelled
          </Button>
        </Link>
        <Link href="/admin/orders?status=RETURN_REQUESTED">
          <Button
            variant={
              currentStatus === "RETURN_REQUESTED" ? "default" : "outline"
            }
            size="sm"
          >
            Return Requested
          </Button>
        </Link>
        <Link href="/admin/orders?status=DISPUTED">
          <Button
            variant={
              currentStatus === "DISPUTED" ? "default" : "outline"
            }
            size="sm"
          >
            Disputed
          </Button>
        </Link>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/10">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No orders found</h3>
          <p className="text-muted-foreground">
            {currentStatus
              ? `No ${currentStatus.toLowerCase().replace(/_/g, " ")} orders.`
              : "No orders in the system yet."}
          </p>
        </div>
      ) : (
        <>
          <AdminOrdersTable orders={orders} />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {pagination.page > 1 && (
                <Link
                  href={`/admin/orders?page=${pagination.page - 1}${currentStatus ? `&status=${currentStatus}` : ""}`}
                >
                  <Button variant="outline">Previous</Button>
                </Link>
              )}
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              {pagination.page < pagination.totalPages && (
                <Link
                  href={`/admin/orders?page=${pagination.page + 1}${currentStatus ? `&status=${currentStatus}` : ""}`}
                >
                  <Button variant="outline">Next</Button>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
