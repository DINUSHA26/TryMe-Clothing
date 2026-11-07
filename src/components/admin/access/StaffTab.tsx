"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, KeyRound, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useAuthStore } from "@/stores/authStore";

interface RoleOption {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
}

interface StaffRow {
  id: string;
  userId: string;
  roleId: string;
  isActive: boolean;
  role: { id: string; name: string; permissions: string[] };
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
    mustChangePassword: boolean;
  };
}

interface SuperAdminRow {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
}

export function StaffTab() {
  const { can } = useAdminAccess();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [superAdmins, setSuperAdmins] = useState<SuperAdminRow[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", roleId: "" });
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff", { credentials: "include" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load staff");
      setStaff(json.data.staff);
      setSuperAdmins(json.data.superAdmins);
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

  const invite = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to add staff member");
      setInviteOpen(false);
      setCredentials({ email: form.email.trim().toLowerCase(), password: json.data.temporaryPassword });
      setForm({ firstName: "", lastName: "", email: "", phone: "", roleId: "" });
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>, successMessage: string) => {
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Update failed");
      toast.success(successMessage);
      load();
      return json.data as { temporaryPassword?: string };
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  };

  const resetPassword = async (row: StaffRow) => {
    const data = await patch(row.id, { resetPassword: true }, "Password reset");
    if (data?.temporaryPassword && row.user.email) {
      setCredentials({ email: row.user.email, password: data.temporaryPassword });
    }
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast.success("Copied");
  };

  const fullName = (u: { firstName: string | null; lastName: string | null }) =>
    `${u.firstName || ""} ${u.lastName || ""}`.trim() || "—";

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Staff sign in at the staff login page with their own email and the temporary password you share with them.
        </p>
        {can("staff.create") && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Add Staff
          </Button>
        )}
      </div>

      <div className="border rounded-xl bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Staff member</th>
              <th className="text-left px-4 py-2.5 font-semibold min-w-[200px]">Role</th>
              <th className="text-center px-4 py-2.5 font-semibold">Active</th>
              <th className="text-right px-4 py-2.5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((row) => {
              const isSelf = row.userId === currentUserId;
              const editable = can("staff.edit") && !isSelf;
              return (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{fullName(row.user)} {isSelf && <Badge variant="outline" className="ml-1 text-[10px]">You</Badge>}</div>
                    <div className="text-xs text-muted-foreground">{row.user.email}</div>
                    {row.user.mustChangePassword && (
                      <div className="text-[11px] text-amber-600 mt-0.5">Hasn’t changed temporary password yet</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editable ? (
                      <Select value={row.roleId} onValueChange={(roleId) => patch(row.id, { roleId }, "Role updated")}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                          {!roles.some((r) => r.id === row.roleId) && (
                            <SelectItem value={row.roleId} disabled>{row.role.name}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">{row.role.name}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch
                      checked={row.isActive}
                      disabled={!editable}
                      onCheckedChange={(isActive) =>
                        patch(row.id, { isActive }, isActive ? "Staff member enabled" : "Staff member disabled")
                      }
                      aria-label="Toggle active"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editable && (
                      <Button variant="outline" size="sm" onClick={() => resetPassword(row)}>
                        <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Reset password
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {staff.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted-foreground py-10">
                  No staff members yet. Add one and assign a role.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {superAdmins.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary" /> Super Admins (full access)
          </h3>
          <div className="flex flex-wrap gap-2">
            {superAdmins.map((sa) => (
              <Badge key={sa.id} variant="outline" className="py-1">
                {fullName(sa) !== "—" ? `${fullName(sa)} · ` : ""}{sa.email}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add staff member</DialogTitle>
            <DialogDescription>
              A login is created with a temporary password. They must change it on first sign-in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone (optional)</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.roleId} onValueChange={(roleId) => setForm({ ...form, roleId })}>
                <SelectTrigger><SelectValue placeholder="Choose a role" /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {roles.length === 0 && (
                <p className="text-xs text-amber-600">No assignable roles — create a role first in the Roles tab.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={invite} disabled={saving || !form.email || !form.firstName || !form.roleId}>
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} Create login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials (shown once) */}
      <Dialog open={!!credentials} onOpenChange={(o) => !o && setCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share these login details</DialogTitle>
            <DialogDescription>
              The temporary password is shown only once. Send it to the staff member securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-mono">{credentials?.email}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Temporary password</span>
              <span className="font-mono font-semibold">{credentials?.password}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => credentials && copy(`Email: ${credentials.email}\nPassword: ${credentials.password}`)}>
              <Copy className="h-4 w-4 mr-1.5" /> Copy
            </Button>
            <Button onClick={() => setCredentials(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
