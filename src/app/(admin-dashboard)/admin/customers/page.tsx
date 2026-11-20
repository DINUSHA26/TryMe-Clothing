import { Suspense } from "react";
import { AdminCustomersClient } from "@/components/admin/customers/AdminCustomersClient";
import { serverApiFetch } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  let initialData = null;
  try {
    const res = await serverApiFetch("/api/v1/admin/customers?page=1&limit=20");
    initialData = res?.data || res || null;
  } catch (error) {
    console.error("[AdminCustomersPage] Failed to prefetch customer data:", error);
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <Suspense
        fallback={
          <div className="py-24 text-center text-sm text-muted-foreground animate-pulse">
            Loading Customer Panel...
          </div>
        }
      >
        <AdminCustomersClient initialData={initialData} />
      </Suspense>
    </div>
  );
}
