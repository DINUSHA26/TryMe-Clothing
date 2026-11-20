/**
 * Customer Orders Page
 * Lists all customer orders with filtering and pagination
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { tokenUtils } from "@/lib/auth";
import { serverApiFetch } from "@/lib/api-client";
import { OrderCard } from "@/components/orders/OrderCard";
import { OrderStatus } from "@prisma/client";
import { Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { headers } from "next/headers";

interface SearchParams {
  page?: string;
  status?: OrderStatus;
}
async function getOrders(searchParams: SearchParams) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const headersList = await headers();
  const xUserId = headersList.get("X-User-Id");

  if (!accessToken && !xUserId) {
    return null;
  }

  try {
    const q = new URLSearchParams();
    if (searchParams.page) q.set("page", searchParams.page);
    if (searchParams.status) q.set("status", searchParams.status);

    const res = await serverApiFetch(`/api/v1/storefront/orders?${q.toString()}`);
    return res?.data || res;
  } catch (error: any) {
    console.error("[OrdersPage] Error:", error);
    return { error: error.message || "Failed to fetch orders" };
  }
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const result = (await getOrders(resolvedParams)) as any;

  if (!result) {
    redirect("/login");
  }

  if ("error" in result) {
    // If it's an auth error from the API, redirect to login
    if (result.status === 401) {
      redirect("/login");
    }
    
    // For other errors (403, 500), show an error state or redirect to 403
    if (result.status === 403) {
      redirect("/403");
    }

    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-muted-foreground mb-8">{result.error}</p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  const rawOrders = Array.isArray(result) ? result : result?.orders || [];
  const orders = Array.isArray(rawOrders) ? rawOrders : [];
  const pagination = result?.pagination || {
    page: 1,
    limit: 10,
    total: orders.length,
    totalPages: 1,
  };
  const stats = result?.stats || {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === "PENDING_PAYMENT").length,
    processing: orders.filter((o: any) =>
      ["PAYMENT_CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(o.status)
    ).length,
    completed: orders.filter((o: any) => o.status === "DELIVERY_CONFIRMED").length,
  };
  const currentStatus = resolvedParams.status;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground">
          View and manage your order history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Active</p>
          <p className="text-2xl font-bold">{stats.processing}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Completed</p>
          <p className="text-2xl font-bold">{stats.completed}</p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/orders">
          <Button variant={!currentStatus ? "default" : "outline"} size="sm">
            All Orders
          </Button>
        </Link>
        <Link href="/orders?status=PAYMENT_CONFIRMED">
          <Button
            variant={
              currentStatus === "PAYMENT_CONFIRMED" ? "default" : "outline"
            }
            size="sm"
          >
            Payment Confirmed
          </Button>
        </Link>
        <Link href="/orders?status=PROCESSING">
          <Button
            variant={currentStatus === "PROCESSING" ? "default" : "outline"}
            size="sm"
          >
            Processing
          </Button>
        </Link>
        <Link href="/orders?status=SHIPPED">
          <Button
            variant={currentStatus === "SHIPPED" ? "default" : "outline"}
            size="sm"
          >
            Shipped
          </Button>
        </Link>
        <Link href="/orders?status=DELIVERED">
          <Button
            variant={currentStatus === "DELIVERED" ? "default" : "outline"}
            size="sm"
          >
            Delivered
          </Button>
        </Link>
        <Link href="/orders?status=DELIVERY_CONFIRMED">
          <Button
            variant={
              currentStatus === "DELIVERY_CONFIRMED" ? "default" : "outline"
            }
            size="sm"
          >
            Completed
          </Button>
        </Link>
        <Link href="/orders?status=CANCELLED">
          <Button
            variant={currentStatus === "CANCELLED" ? "default" : "outline"}
            size="sm"
          >
            Cancelled
          </Button>
        </Link>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/10">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No orders found</h3>
          <p className="text-muted-foreground mb-4">
            {currentStatus
              ? `You don't have any ${currentStatus.toLowerCase().replace("_", " ")} orders.`
              : "You haven't placed any orders yet."}
          </p>
          <Link href="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order: any) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {pagination.page > 1 && (
                <Link
                  href={`/orders?page=${pagination.page - 1}${currentStatus ? `&status=${currentStatus}` : ""}`}
                >
                  <Button variant="outline">Previous</Button>
                </Link>
              )}
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              {pagination.page < pagination.totalPages && (
                <Link
                  href={`/orders?page=${pagination.page + 1}${currentStatus ? `&status=${currentStatus}` : ""}`}
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
