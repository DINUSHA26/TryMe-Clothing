import { Suspense } from "react";
import { AdminPosClient } from "@/components/admin/pos/AdminPosClient";
import { getAdminPosData } from "@/lib/services/admin-pos-service";

export const dynamic = "force-dynamic";

export default async function AdminPosPage() {
  let initialData = null;
  try {
    initialData = await getAdminPosData({ page: 1, pageSize: 20 });
  } catch (error) {
    console.error("[AdminPosPage] Failed to prefetch POS data:", error);
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <Suspense
        fallback={
          <div className="py-24 text-center text-sm text-muted-foreground animate-pulse">
            Loading POS Panel...
          </div>
        }
      >
        <AdminPosClient initialData={initialData} />
      </Suspense>
    </div>
  );
}
