/**
 * Admin Chat Oversight Page
 * Read-only view of all customer-vendor chat rooms
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { tokenUtils } from "@/lib/auth";
import { getAppUrl } from "@/lib/env";
import { AdminChatViewer } from "@/components/admin/chat/AdminChatViewer";

async function getAdminChatRooms(flagged: boolean) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) return null;

  const payload = tokenUtils.verifyAccessToken(accessToken);
  if (!payload || payload.role !== "ADMIN") return null;

  const appUrl = getAppUrl();
  const url = `${appUrl}/api/admin/chat/rooms${flagged ? "?flagged=true" : ""}`;

  const res = await fetch(url, {
    headers: { Cookie: `accessToken=${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.success ? data : null;
}

interface AdminChatPageProps {
  searchParams: Promise<{ flagged?: string }>;
}

export default async function AdminChatPage({ searchParams }: AdminChatPageProps) {
  const { flagged } = await searchParams;
  const showFlagged = flagged === "true";

  const result = await getAdminChatRooms(showFlagged);

  if (!result) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chat Oversight</h1>
        <p className="text-muted-foreground mt-1">
          Oversight and support for all customer-vendor conversations
        </p>
      </div>

      <AdminChatViewer
        rooms={result.rooms}
        stats={result.stats}
        showFlagged={showFlagged}
      />
    </div>
  );
}
