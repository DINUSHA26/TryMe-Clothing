"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, ShieldCheck, Trash2, Pencil, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PermissionMatrix } from "@/components/admin/access/PermissionMatrix";
import { useVendorAccess } from "@/hooks/useVendorAccess";
import { ALL_VENDOR_PERMISSIONS, VENDOR_FEATURES, VENDOR_FEATURE_GROUPS } from "@/lib/permissions";

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  vendorId: string | null;
  _count: { members: number };
}

export function VendorRolesTab() {
  const { can, isOwner, access } = useVendorAccess();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<RoleRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<RoleRow | null>(null);

  const grantable = isOwner ? ALL_VENDOR_PERMISSIONS : access?.permissions || [];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/roles", { credentials: "include" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load roles");
      setRoles(json.data.roles);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const isCreate = !editing.id;
      const url = isCreate ? "/api/vendor/roles" : `/api/vendor/roles/${editing.id}`;
      const method = isCreate ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editing.name,
          description: editing.description,
          permissions: editing.permissions ?? [],
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save role");

      toast.success(isCreate ? "Custom role created" : "Role updated");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/vendor/roles/${deleting.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete role");

      toast.success("Role deleted");
      setDeleting(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const canCreate = isOwner || can("roles.create");
  const canEdit = isOwner || can("roles.edit");
  const canDelete = isOwner || can("roles.delete");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Store Roles & Permissions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure default and custom staff roles with granular feature actions.
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setEditing({ name: "", description: "", permissions: [] })}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Create Custom Role
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading roles...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r) => {
            const isSystem = r.isSystem || !r.vendorId;
            return (
              <div
                key={r.id}
                className="border rounded-lg p-4 bg-card flex flex-col justify-between hover:border-primary/40 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-base">
                      <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                      <span>{r.name}</span>
                    </div>
                    {isSystem ? (
                      <Badge variant="secondary" className="text-[10px] shrink-0">System Default</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] shrink-0">Custom Store Role</Badge>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {r._count?.members ?? 0} staff
                    </span>
                    <span>•</span>
                    <span>{r.permissions.length} actions granted</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setEditing(r)}
                  >
                    {canEdit && !isSystem ? <Pencil className="h-3 w-3" /> : null}
                    {canEdit && !isSystem ? "Edit Matrix" : "View Permissions"}
                  </Button>
                  {!isSystem && canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                      disabled={r._count.members > 0}
                      onClick={() => setDeleting(r)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / View Role Modal */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {editing?.id ? (editing.isSystem || !editing.vendorId ? `Role: ${editing.name}` : `Edit Role: ${editing.name}`) : "New Custom Store Role"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select which store operations and features staff assigned to this role can view, create, edit, or delete.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="v_role_name" className="text-xs">Role Name *</Label>
                <Input
                  id="v_role_name"
                  required
                  disabled={editing?.isSystem || (editing?.id ? !editing?.vendorId : false)}
                  value={editing?.name || ""}
                  onChange={(e) => setEditing((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="v_role_desc" className="text-xs">Description</Label>
                <Input
                  id="v_role_desc"
                  disabled={editing?.isSystem || (editing?.id ? !editing?.vendorId : false)}
                  value={editing?.description || ""}
                  onChange={(e) => setEditing((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <PermissionMatrix
                value={editing?.permissions || []}
                grantable={grantable}
                readOnly={editing?.isSystem || (editing?.id ? !editing?.vendorId : false)}
                features={VENDOR_FEATURES}
                featureGroups={VENDOR_FEATURE_GROUPS}
                onChange={(next) => setEditing((prev) => ({ ...prev, permissions: next }))}
              />
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Close
              </Button>
              {canEdit && (!editing?.isSystem && (!editing?.id || editing?.vendorId)) && (
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Role
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Role?</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{deleting?.name}&quot;</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

