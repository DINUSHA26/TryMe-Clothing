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
import { PermissionMatrix } from "./PermissionMatrix";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { ALL_PERMISSIONS } from "@/lib/permissions";

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  _count: { members: number };
}

export function RolesTab() {
  const { can, isSuper, access } = useAdminAccess();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<RoleRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<RoleRow | null>(null);

  const grantable = isSuper ? ALL_PERMISSIONS : access?.permissions || [];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/roles", { credentials: "include" });
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

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const isNew = !editing.id;
      const res = await fetch(isNew ? "/api/admin/roles" : `/api/admin/roles/${editing.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editing.name,
          description: editing.description || "",
          permissions: editing.permissions || [],
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save role");
      toast.success(isNew ? "Role created" : "Role updated");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/admin/roles/${deleting.id}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete role");
      toast.success("Role deleted");
      setDeleting(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Roles decide which dashboard features a staff member can see and what they can do there.
        </p>
        {can("roles.create") && (
          <Button onClick={() => setEditing({ name: "", description: "", permissions: [] })}>
            <Plus className="h-4 w-4 mr-1.5" /> New Role
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {roles.map((role) => (
          <div key={role.id} className="border rounded-xl bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <h3 className="font-semibold truncate">{role.name}</h3>
                  {role.isSystem && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
                </div>
                {role.description && (
                  <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                {can("roles.edit") && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(role)} aria-label="Edit role">
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {can("roles.delete") && !role.isSystem && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleting(role)} aria-label="Delete role">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {role._count.members} member(s)</span>
              <span>{role.permissions.length} permission(s)</span>
            </div>
          </div>
        ))}
        {roles.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-10">No roles yet.</p>
        )}
      </div>

      {/* Create / edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit role" : "Create role"}</DialogTitle>
            <DialogDescription>
              Tick what this role may do. Anything you tick also gives “View” for that feature.
              You can only grant permissions you hold yourself.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="role-name">Role name</Label>
                <Input id="role-name" value={editing?.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Support Agent" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role-desc">Description</Label>
                <Input id="role-desc" value={editing?.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="What is this role for?" />
              </div>
            </div>
            <PermissionMatrix
              value={editing?.permissions || []}
              onChange={(permissions) => setEditing({ ...editing, permissions })}
              grantable={grantable}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !(editing?.name || "").trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} Save role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{deleting?.name}”?</DialogTitle>
            <DialogDescription>This cannot be undone. Roles that still have staff assigned cannot be deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={remove}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
