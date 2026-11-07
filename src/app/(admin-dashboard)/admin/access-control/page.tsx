"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Users, KeyRound, History } from "lucide-react";
import { StaffTab } from "@/components/admin/access/StaffTab";
import { RolesTab } from "@/components/admin/access/RolesTab";
import { AuditLogsTab } from "@/components/admin/access/AuditLogsTab";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export default function AccessControlPage() {
  const { can, isSuper } = useAdminAccess();

  const canSeeStaff = isSuper || can("staff.view");
  const canSeeRoles = isSuper || can("roles.view");
  const canSeeAudit = isSuper || can("audit.view");

  const defaultTab = canSeeStaff ? "staff" : canSeeRoles ? "roles" : "audit";

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Staff & Access Control</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Manage admin staff accounts, custom roles, feature permissions, and review the activity audit log.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          {canSeeStaff && (
            <TabsTrigger value="staff" className="flex items-center gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" /> Staff Members
            </TabsTrigger>
          )}
          {canSeeRoles && (
            <TabsTrigger value="roles" className="flex items-center gap-1.5 text-xs">
              <KeyRound className="h-3.5 w-3.5" /> Roles & Permissions
            </TabsTrigger>
          )}
          {canSeeAudit && (
            <TabsTrigger value="audit" className="flex items-center gap-1.5 text-xs">
              <History className="h-3.5 w-3.5" /> Audit Log
            </TabsTrigger>
          )}
        </TabsList>

        {canSeeStaff && (
          <TabsContent value="staff">
            <StaffTab />
          </TabsContent>
        )}

        {canSeeRoles && (
          <TabsContent value="roles">
            <RolesTab />
          </TabsContent>
        )}

        {canSeeAudit && (
          <TabsContent value="audit">
            <AuditLogsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

