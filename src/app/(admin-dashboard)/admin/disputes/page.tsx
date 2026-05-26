import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { tokenUtils } from "@/lib/auth";
import { getServerAppUrl } from "@/lib/server-env";
import { headers } from "next/headers";
import { AdminDisputesTable } from "@/components/admin/disputes/AdminDisputesTable";
import { DisputeFilters } from "@/components/admin/disputes/DisputeFilters";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";

interface AdminDisputesPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
}

async function getDisputes(filters: {
  status?: string;
  search?: string;
  page?: string;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  const headersList = await headers();
  const xUserId = headersList.get("X-User-Id");

  if (!token && !xUserId) {
    return null;
  }

  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", filters.page);
  params.set("limit", "20"); // Admin sees more per page

  const appUrl = await getServerAppUrl();
  
  // Build headers for internal API call
  const requestHeaders: Record<string, string> = {
    Cookie: `accessToken=${token}`,
  };

  // Forward authentication headers from middleware
  const xUserIdHeader = headersList.get("X-User-Id");
  const xUserRole = headersList.get("X-User-Role");
  const xUserEmail = headersList.get("X-User-Email");

  if (xUserIdHeader) requestHeaders["X-User-Id"] = xUserIdHeader;
  if (xUserRole) requestHeaders["X-User-Role"] = xUserRole;
  if (xUserEmail) requestHeaders["X-User-Email"] = xUserEmail;

  const response = await fetch(
    `${appUrl}/api/admin/disputes?${params.toString()}`,
    {
      headers: requestHeaders,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function AdminDisputesPage({
  searchParams,
}: AdminDisputesPageProps) {
  // Await searchParams (Next.js 15 requirement)
  const resolvedParams = await searchParams;

  // Verify authentication
  const headersList = await headers();
  const xUserId = headersList.get("X-User-Id");
  const xUserRole = headersList.get("X-User-Role");

  if (!xUserId) {
    redirect("/staff/login");
  }

  if (xUserRole !== "ADMIN") {
    redirect("/staff/login");
  }

  // Fetch disputes
  const result = await getDisputes(resolvedParams);

  if (!result || !result.success) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-red-500">Failed to load disputes</p>
        </div>
      </div>
    );
  }

  const { data: disputes, pagination, stats } = result;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Dispute Management</h1>
        <p className="text-muted-foreground">
          View and resolve customer disputes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Total Disputes</p>
              </div>
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-500">
                  {stats.open}
                </div>
                <p className="text-xs text-muted-foreground">Open</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-500">
                  {stats.inReview}
                </div>
                <p className="text-xs text-muted-foreground">In Review</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-500">
                  {stats.resolvedCustomerFavor}
                </div>
                <p className="text-xs text-muted-foreground">Customer Favor</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-500">
                  {stats.recentCount}
                </div>
                <p className="text-xs text-muted-foreground">Last 7 Days</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Client Component */}
      <Card>
        <CardContent className="pt-6">
          <DisputeFilters
            defaultSearch={resolvedParams.search}
            defaultStatus={resolvedParams.status}
          />
        </CardContent>
      </Card>

      {/* Disputes Table */}
      <AdminDisputesTable disputes={disputes} />

      {/* Pagination Info */}
      {pagination.total > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} disputes
        </div>
      )}
    </div>
  );
}
