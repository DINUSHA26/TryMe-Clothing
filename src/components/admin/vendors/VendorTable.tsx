"use client";

import { useState } from "react";
import { formatDistance } from "date-fns";
import { CheckCircle2, Clock, Edit, Eye, KeyRound, MoreVertical, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VendorWithUser } from "@/types/vendor";
import { VendorStatusToggle } from "./VendorStatusToggle";
import { EditVendorDialog } from "./EditVendorDialog";
import { VendorCredentialsDialog } from "./VendorCredentialsDialog";
import { VendorApprovalAction } from "./VendorApprovalAction";
import { Decimal } from "@prisma/client/runtime/library";

interface VendorTableProps {
  vendors: VendorWithUser[];
  onVendorUpdated: () => void;
}

export function VendorTable({ vendors, onVendorUpdated }: VendorTableProps) {
  const [editingVendor, setEditingVendor] = useState<VendorWithUser | null>(null);
  const [resetCredentials, setResetCredentials] = useState<{
    businessName: string;
    email: string;
    tempPassword: string;
  } | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleResetPassword = async (vendor: VendorWithUser) => {
    setResettingId(vendor.id);
    try {
      const response = await fetch("/api/admin/vendors/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: vendor.id }),
      });
      const result = await response.json();
      if (!result.success) {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to reset password" });
        return;
      }
      setResetCredentials({
        businessName: result.data.businessName,
        email: result.data.email,
        tempPassword: result.data.tempPassword,
      });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred" });
    } finally {
      setResettingId(null);
    }
  };

  const formatCurrency = (amount: Decimal) => {
    return `Rs. ${Number(amount).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Vendor Status</TableHead>
              <TableHead>Login Access</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  No vendors found
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.businessName}</TableCell>
                  <TableCell className="text-sm">{vendor.businessEmail}</TableCell>
                  <TableCell className="text-sm">{vendor.businessPhone || "-"}</TableCell>
                  <TableCell className="text-sm">{Number(vendor.commissionRate)}%</TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      {vendor.status === "PENDING" && (
                        <>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 inline-flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            Pending Approval
                          </Badge>
                          <VendorApprovalAction
                            vendorId={vendor.id}
                            status={vendor.status}
                            businessName={vendor.businessName}
                            onActionComplete={onVendorUpdated}
                          />
                        </>
                      )}
                      {vendor.status === "ACTIVE" && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </Badge>
                      )}
                      {vendor.status === "INACTIVE" && (
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 inline-flex items-center gap-1 font-medium">
                          <XCircle className="w-3 h-3" />
                          Rejected / Inactive
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <VendorStatusToggle
                      vendorId={vendor.id}
                      isActive={vendor.user.isActive}
                      businessName={vendor.businessName}
                      onStatusChanged={onVendorUpdated}
                    />
                  </TableCell>
                  <TableCell>
                    {vendor.status === "ACTIVE" && vendor.isShopOpen ? (
                      <Badge variant="default" className="bg-slate-900 text-white font-medium">
                        Open
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground font-normal">
                        Closed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {vendor.wallet ? (
                      <div className="text-sm">
                        <div className="text-green-600">
                          {formatCurrency(vendor.wallet.availableBalance)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Pending: {formatCurrency(vendor.wallet.pendingBalance)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistance(new Date(vendor.createdAt), new Date(), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingVendor(vendor)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(vendor)} disabled={resettingId === vendor.id}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          {resettingId === vendor.id ? "Resetting..." : "Reset Password"}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Vendor Dialog */}
      {editingVendor && (
        <EditVendorDialog
          vendor={editingVendor}
          open={!!editingVendor}
          onOpenChange={(open) => !open && setEditingVendor(null)}
          onSuccess={() => {
            setEditingVendor(null);
            onVendorUpdated();
          }}
        />
      )}

      {/* Reset Password Credentials Dialog */}
      {resetCredentials && (
        <VendorCredentialsDialog
          open={!!resetCredentials}
          onOpenChange={(open) => !open && setResetCredentials(null)}
          businessName={resetCredentials.businessName}
          email={resetCredentials.email}
          tempPassword={resetCredentials.tempPassword}
          isReset
        />
      )}
    </>
  );
}
