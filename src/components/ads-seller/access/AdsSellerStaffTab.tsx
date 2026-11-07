"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, KeyRound, Loader2, ShieldCheck, UserPlus, Trash2 } from "lucide-react";
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
import { useAdsSellerAccess } from "@/hooks/useAdsSellerAccess";
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

interface OwnerRow {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

export function AdsSellerStaffTab() {
  const { can, isOwner } = useAdsSellerAccess();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [storeOwner, setStoreOwner] = useState<OwnerRow | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", phone: "", roleId: "" });

  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; tempPassword: string } | null>(null);
  const [resetCredentials, setResetCredentials] = useState<{ email: string; tempPassword: string } | null>(null);

  const canCreate = isOwner || can("staff.create");
  const canEdit = isOwner || can("staff.edit");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ads-seller/staff", { credentials: "include" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load staff");
      setStaff(json.data.staff);
      setStoreOwner(json.data.storeOwner);
      setRoles(json.data.roles);
      if (!form.roleId && json.data.roles.length > 0) {
        setForm((prev) => ({ ...prev, roleId: json.data.roles[0].id }));
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [form.roleId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch("/api/ads-seller/staff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to invite staff member");

      setCreatedCredentials({
        email: form.email,
        tempPassword: json.data.tempPassword,
      });
      setInviteOpen(false);
      setForm({ email: "", firstName: "", lastName: "", phone: "", roleId: roles[0]?.id || "" });
      toast.success("Staff member invited successfully");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setInviting(false);
    }
  };

  const handleToggleActive = async (row: StaffRow, nextActive: boolean) => {
    try {
      const res = await fetch(`/api/ads-seller/staff/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: nextActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update staff status");
      toast.success(nextActive ? "Account enabled" : "Account disabled");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleChangeRole = async (row: StaffRow, newRoleId: string) => {
    try {
      const res = await fetch(`/api/ads-seller/staff/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ roleId: newRoleId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update role");
      toast.success("Role updated");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleResetPassword = async (row: StaffRow) => {
    try {
      const res = await fetch(`/api/ads-seller/staff/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resetPassword: true }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to reset password");
      setResetCredentials({
        email: row.user.email || "staff",
        tempPassword: json.data.temporaryPassword,
      });
      toast.success("Temporary password generated");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteStaff = async (row: StaffRow) => {
    if (!confirm(`Are you sure you want to remove ${row.user.firstName || "this staff member"}?`)) return;
    try {
      const res = await fetch(`/api/ads-seller/staff/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to remove staff member");
      toast.success("Staff member removed");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Staff Members</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Store staff log in with their own email and are restricted to their assigned role.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setInviteOpen(true)} className="gap-2 bg-[#FF6600] hover:bg-[#E65C00]">
            <UserPlus className="h-4 w-4" /> Invite Staff
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading staff...
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left font-semibold px-4 py-2.5">Name / Email</th>
                  <th className="text-left font-semibold px-4 py-2.5">Store Role</th>
                  <th className="text-center font-semibold px-4 py-2.5">Status</th>
                  <th className="text-right font-semibold px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {/* Store Owner row */}
                {storeOwner && (
                  <tr className="bg-orange-500/5">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {storeOwner.firstName} {storeOwner.lastName || ""}
                      </div>
                      <div className="text-xs text-muted-foreground">{storeOwner.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="default" className="gap-1 bg-[#FF6600]">
                        <ShieldCheck className="h-3 w-3" /> Store Owner (Full Access)
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className="text-green-600 border-green-600/30">Active</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground italic">
                      Primary Account
                    </td>
                  </tr>
                )}

                {/* Staff members */}
                {staff.map((s) => {
                  const isSelf = s.userId === currentUserId;
                  return (
                    <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {s.user.firstName} {s.user.lastName || ""}
                          {isSelf && <span className="ml-1 text-xs text-muted-foreground">(You)</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{s.user.email}</div>
                        {s.user.phone && <div className="text-[11px] text-muted-foreground">{s.user.phone}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {canEdit && !isSelf ? (
                          <Select defaultValue={s.roleId} onValueChange={(val) => handleChangeRole(s, val)}>
                            <SelectTrigger className="w-[180px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((r) => (
                                <SelectItem key={r.id} value={r.id} className="text-xs">
                                  {r.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary">{s.role.name}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={s.isActive && s.user.isActive}
                            disabled={!canEdit || isSelf}
                            onCheckedChange={(checked) => handleToggleActive(s, checked)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {s.isActive && s.user.isActive ? "Active" : "Disabled"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && !isSelf && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleResetPassword(s)}
                              >
                                <KeyRound className="h-3 w-3" /> Reset Password
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteStaff(s)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {staff.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground text-xs">
                      No staff members yet. Click &quot;Invite Staff&quot; above to add your team.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <form onSubmit={handleInvite} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#FF6600]" /> Invite Store Staff
              </DialogTitle>
              <DialogDescription className="text-xs">
                A temporary password will be generated for your staff member to sign in and set their permanent password.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="as_firstName" className="text-xs">First Name *</Label>
                  <Input
                    id="as_firstName"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="as_lastName" className="text-xs">Last Name</Label>
                  <Input
                    id="as_lastName"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="as_email" className="text-xs">Login Email *</Label>
                <Input
                  id="as_email"
                  type="email"
                  required
                  placeholder="staff@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="as_phone" className="text-xs">Phone (optional)</Label>
                <Input
                  id="as_phone"
                  placeholder="0771234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Store Role *</Label>
                <Select value={form.roleId} onValueChange={(val) => setForm({ ...form, roleId: val })}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-xs">
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviting} className="bg-[#FF6600] hover:bg-[#E65C00]">
                {inviting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Generate Login Credentials
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Temporary Password Popup */}
      <Dialog
        open={!!createdCredentials || !!resetCredentials}
        onOpenChange={(open) => {
          if (!open) {
            setCreatedCredentials(null);
            setResetCredentials(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <KeyRound className="h-5 w-5" />
              {createdCredentials ? "Staff Account Created" : "Password Reset Successfully"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Please share these credentials with your staff member.
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const creds = createdCredentials || resetCredentials;
            if (!creds) return null;
            return (
              <div className="space-y-3 bg-muted/60 p-4 rounded-lg text-xs font-mono">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Login Email:</span>
                  <span className="font-bold text-foreground text-sm">{creds.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Temporary Password:</span>
                  <span className="font-bold text-[#FF6600] text-base select-all">{creds.tempPassword}</span>
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <Button
              className="gap-2 w-full bg-[#FF6600] hover:bg-[#E65C00]"
              onClick={() => {
                const creds = createdCredentials || resetCredentials;
                if (creds) {
                  navigator.clipboard.writeText(`Email: ${creds.email}\nTemporary Password: ${creds.tempPassword}`);
                  toast.success("Credentials copied to clipboard");
                }
              }}
            >
              <Copy className="h-4 w-4" /> Copy Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

