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
  vendorId?: string | null;
  vendor?: { id: string; businessName: string; slug: string } | null;
  adsSellerId?: string | null;
  adsSeller?: { id: string; businessName: string; slug: string } | null;
  role: { id: string; name: string; permissions: string[]; scope?: string };
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

interface StoreItem {
  id: string;
  businessName: string;
  slug?: string;
}

export function StaffTab() {
  const { can } = useAdminAccess();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [superAdmins, setSuperAdmins] = useState<SuperAdminRow[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [vendorsList, setVendorsList] = useState<StoreItem[]>([]);
  const [adsSellersList, setAdsSellersList] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedScope, setSelectedScope] = useState<"ADMIN" | "VENDOR" | "ADS_SELLER" | "ALL">("ADMIN");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [selectedAdsSellerId, setSelectedAdsSellerId] = useState<string>("all");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", roleId: "" });
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("scope", selectedScope);
      if (selectedScope === "VENDOR" && selectedVendorId !== "all") {
        params.set("vendorId", selectedVendorId);
      }
      if (selectedScope === "ADS_SELLER" && selectedAdsSellerId !== "all") {
        params.set("adsSellerId", selectedAdsSellerId);
      }

      const res = await fetch(`/api/admin/staff?${params.toString()}`, { credentials: "include" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load staff");
      setStaff(json.data.staff || []);
      setSuperAdmins(json.data.superAdmins || []);
      setRoles(json.data.roles || []);
      if (json.data.vendorsList) setVendorsList(json.data.vendorsList);
      if (json.data.adsSellersList) setAdsSellersList(json.data.adsSellersList);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedScope, selectedVendorId, selectedAdsSellerId]);

  useEffect(() => {
    load();
  }, [load]);

  const invite = async () => {
    if (!form.firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!form.roleId) {
      toast.error("Please choose a role");
      return;
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Staff sign in at the staff login page with their own email and temporary password.
        </p>
        {can("staff.create") && selectedScope === "ADMIN" && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Add Admin Staff
          </Button>
        )}
      </div>

      {/* Scope and Store Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground mr-1">Scope:</span>
          {(
            [
              { label: "Admin Staff", value: "ADMIN" },
              { label: "Vendor Store Staff", value: "VENDOR" },
              { label: "Ads Seller Staff", value: "ADS_SELLER" },
              { label: "All Accounts", value: "ALL" },
            ] as const
          ).map((item) => (
            <Button
              key={item.value}
              variant={selectedScope === item.value ? "default" : "outline"}
              size="sm"
              className="text-xs h-7 px-2.5"
              onClick={() => {
                setSelectedScope(item.value);
                setSelectedVendorId("all");
                setSelectedAdsSellerId("all");
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {/* Store Specific Filters */}
        {selectedScope === "VENDOR" && vendorsList.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Store:</span>
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger className="h-8 text-xs w-[180px]">
                <SelectValue placeholder="All Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendor Stores ({vendorsList.length})</SelectItem>
                {vendorsList.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedScope === "ADS_SELLER" && adsSellersList.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Seller:</span>
            <Select value={selectedAdsSellerId} onValueChange={setSelectedAdsSellerId}>
              <SelectTrigger className="h-8 text-xs w-[180px]">
                <SelectValue placeholder="All Sellers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ads Sellers ({adsSellersList.length})</SelectItem>
                {adsSellersList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {selectedScope !== "ADMIN" && (
        <div className="p-3 text-xs bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/20 rounded-lg">
          💡 Store staff and custom roles are created and controlled by store owners in their own store settings. Admin can view and inspect access across all stores here.
        </div>
      )}

      <div className="border rounded-xl bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Staff member</th>
              <th className="text-left px-4 py-2.5 font-semibold">Scope / Store</th>
              <th className="text-left px-4 py-2.5 font-semibold min-w-[180px]">Role</th>
              <th className="text-center px-4 py-2.5 font-semibold">Active</th>
              <th className="text-right px-4 py-2.5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((row) => {
              const isSelf = row.userId === currentUserId;
              const editable = can("staff.edit") && !isSelf && !row.vendorId && !row.adsSellerId;
              return (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {fullName(row.user)} {isSelf && <Badge variant="outline" className="ml-1 text-[10px]">You</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{row.user.email}</div>
                    {row.user.mustChangePassword && (
                      <div className="text-[11px] text-amber-600 mt-0.5">Hasn’t changed temporary password yet</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.vendor ? (
                      <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200">
                        Vendor: {row.vendor.businessName}
                      </Badge>
                    ) : row.adsSeller ? (
                      <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200">
                        Ads Seller: {row.adsSeller.businessName}
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs">
                        Admin Portal
                      </Badge>
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
                      disabled={!can("staff.edit") || isSelf}
                      onCheckedChange={(isActive) =>
                        patch(row.id, { isActive }, isActive ? "Staff member enabled" : "Staff member disabled")
                      }
                      aria-label="Toggle active"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {can("staff.edit") && !isSelf && (
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
                <td colSpan={5} className="text-center text-muted-foreground py-10">
                  {selectedScope === "ADMIN"
                    ? "No admin staff accounts yet. Click 'Add Admin Staff' to invite staff."
                    : `No staff accounts found for ${selectedScope === "VENDOR" ? "vendors" : selectedScope === "ADS_SELLER" ? "ads sellers" : "this filter"}.`}
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

