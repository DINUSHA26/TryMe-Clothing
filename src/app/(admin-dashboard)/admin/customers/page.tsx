import { Suspense } from "react";
import { AdminCustomersClient } from "@/components/admin/customers/AdminCustomersClient";
import { getAdminCustomersData } from "@/lib/services/admin-customer-service";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  let initialData = null;
  try {
    initialData = await getAdminCustomersData({ page: 1, pageSize: 20 });
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

