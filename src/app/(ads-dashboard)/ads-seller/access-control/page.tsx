"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Users, KeyRound, History } from "lucide-react";
import { AdsSellerStaffTab } from "@/components/ads-seller/access/AdsSellerStaffTab";
import { AdsSellerRolesTab } from "@/components/ads-seller/access/AdsSellerRolesTab";
import { AdsSellerAuditLogsTab } from "@/components/ads-seller/access/AdsSellerAuditLogsTab";
import { useAdsSellerAccess } from "@/hooks/useAdsSellerAccess";

export default function AdsSellerAccessControlPage() {
  const { can, isOwner, storeName } = useAdsSellerAccess();

  const canSeeStaff = isOwner || can("staff.view");
  const canSeeRoles = isOwner || can("roles.view");
  const canSeeAudit = isOwner || can("audit.view");

  const defaultTab = canSeeStaff ? "staff" : canSeeRoles ? "roles" : "audit";

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-[#FF6600]" />
          <h1 className="text-2xl font-bold tracking-tight">Staff & Access Control</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Manage staff accounts for <span className="font-semibold text-foreground">{storeName}</span>, configure custom roles with permission matrix, and track activity logs.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          {canSeeStaff && (
            <TabsTrigger value="staff" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-[#FF6600] data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5" /> Staff Members
            </TabsTrigger>
          )}
          {canSeeRoles && (
            <TabsTrigger value="roles" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-[#FF6600] data-[state=active]:text-white">
              <KeyRound className="h-3.5 w-3.5" /> Roles & Permissions
            </TabsTrigger>
          )}
          {canSeeAudit && (
            <TabsTrigger value="audit" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-[#FF6600] data-[state=active]:text-white">
              <History className="h-3.5 w-3.5" /> Store Audit Log
            </TabsTrigger>
          )}
        </TabsList>

        {canSeeStaff && (
          <TabsContent value="staff">
            <AdsSellerStaffTab />
          </TabsContent>
        )}

        {canSeeRoles && (
          <TabsContent value="roles">
            <AdsSellerRolesTab />
          </TabsContent>
        )}

        {canSeeAudit && (
          <TabsContent value="audit">
            <AdsSellerAuditLogsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

