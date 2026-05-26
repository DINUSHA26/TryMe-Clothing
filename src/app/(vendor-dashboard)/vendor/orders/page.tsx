/**
 * Vendor Orders Page
 * Lists all orders containing vendor's items
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { tokenUtils } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVendorOrders as getVendorOrdersDirect } from "@/lib/services/vendor-order-service";
import { VendorOrdersTable } from "@/components/vendor/orders/VendorOrdersTable";
import { Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { headers } from "next/headers";
import { OrderStatus } from "@prisma/client";

interface SearchParams {
  page?: string;
  status?: OrderStatus;
}

async function getVendorOrders(searchParams: SearchParams) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

  // Verify token
  const payload = tokenUtils.verifyAccessToken(accessToken);
  if (!payload) {
    return null;
  }

  try {
    // Look up vendor record
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: payload.userId },
    });
    
    if (!vendorRecord) {
      return { error: "Vendor profile not found" };
    }

    const data = await getVendorOrdersDirect(vendorRecord.id, {
      page: searchParams.page,
      status: searchParams.status,
      pageSize: "20",
    });
    return data;
  } catch (error: any) {
    console.error("[VendorOrdersPage] Error:", error);
    return { error: error.message || "Failed to fetch orders" };
  }
}

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const result = (await getVendorOrders(resolvedParams)) as any;

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
        <Link href="/vendor">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const { orders, pagination, stats } = result;
  const currentStatus = resolvedParams.status;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Orders</h1>
        <p className="text-muted-foreground">
          Manage orders containing your products
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">
            Payment Confirmed
          </p>
          <p className="text-2xl font-bold">{stats.paymentConfirmed}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Processing</p>
          <p className="text-2xl font-bold">{stats.processing}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Shipped</p>
          <p className="text-2xl font-bold">{stats.shipped}</p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/vendor/orders">
          <Button variant={!currentStatus ? "default" : "outline"} size="sm">
            All Orders
          </Button>
        </Link>
        <Link href="/vendor/orders?status=PAYMENT_CONFIRMED">
          <Button
            variant={
              currentStatus === "PAYMENT_CONFIRMED" ? "default" : "outline"
            }
            size="sm"
          >
            Payment Confirmed
          </Button>
        </Link>
        <Link href="/vendor/orders?status=PROCESSING">
          <Button
            variant={currentStatus === "PROCESSING" ? "default" : "outline"}
            size="sm"
          >
            Processing
          </Button>
        </Link>
        <Link href="/vendor/orders?status=SHIPPED">
          <Button
            variant={currentStatus === "SHIPPED" ? "default" : "outline"}
            size="sm"
          >
            Shipped
          </Button>
        </Link>
        <Link href="/vendor/orders?status=DELIVERED">
          <Button
            variant={currentStatus === "DELIVERED" ? "default" : "outline"}
            size="sm"
          >
            Delivered
          </Button>
        </Link>
        <Link href="/vendor/orders?status=COMPLETED">
          <Button
            variant={
              currentStatus === "COMPLETED" ? "default" : "outline"
            }
            size="sm"
          >
            Completed
          </Button>
        </Link>
        <Link href="/vendor/orders?status=CANCELLED">
          <Button
            variant={currentStatus === "CANCELLED" ? "default" : "outline"}
            size="sm"
          >
            Cancelled
          </Button>
        </Link>
        <Link href="/vendor/orders?status=RETURN_REQUESTED">
          <Button
            variant={
              currentStatus === "RETURN_REQUESTED" ? "default" : "outline"
            }
            size="sm"
          >
            Return Requested
          </Button>
        </Link>
        <Link href="/vendor/orders?status=DISPUTED">
          <Button
            variant={currentStatus === "DISPUTED" ? "default" : "outline"}
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
              ? `No ${currentStatus.toLowerCase().replace("_", " ")} orders.`
              : "No orders containing your products yet."}
          </p>
        </div>
      ) : (
        <>
          <VendorOrdersTable orders={orders} />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {pagination.page > 1 && (
                <Link
                  href={`/vendor/orders?page=${pagination.page - 1}${currentStatus ? `&status=${currentStatus}` : ""}`}
                >
                  <Button variant="outline">Previous</Button>
                </Link>
              )}
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              {pagination.page < pagination.totalPages && (
                <Link
                  href={`/vendor/orders?page=${pagination.page + 1}${currentStatus ? `&status=${currentStatus}` : ""}`}
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
