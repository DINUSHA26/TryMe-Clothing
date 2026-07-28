"use client";

import { useState } from "react";
import { formatDistance } from "date-fns";
import { Eye, Edit, KeyRound, MoreVertical, CheckCircle2, Ban } from "lucide-react";
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
import Link from "next/link";
import { EditAdsSellerDialog } from "./EditAdsSellerDialog";
import { VendorCredentialsDialog } from "../vendors/VendorCredentialsDialog";

interface AdsSellerWithDetails {
  id: string;
  businessName: string | null;
  phone: string;
  primaryCategory: string;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  createdAt: string | Date;
  slug: string;
  user: {
    id: string;
    email: string;
    isActive: boolean;
    firstName: string | null;
    lastName: string | null;
  };
  subscriptions: Array<{
    id: string;
    status: string;
    plan: {
      name: string;
      type: string;
    };
  }>;
}

interface AdsSellerTableProps {
  sellers: AdsSellerWithDetails[];
  onSellerUpdated: () => void;
}

export function AdsSellerTable({ sellers, onSellerUpdated }: AdsSellerTableProps) {
  const [editingSeller, setEditingSeller] = useState<AdsSellerWithDetails | null>(null);
  const [resetCredentials, setResetCredentials] = useState<{
    businessName: string;
    email: string;
    tempPassword: string;
  } | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleResetPassword = async (seller: AdsSellerWithDetails) => {
    setResettingId(seller.id);
    try {
      const response = await fetch("/api/admin/ads-sellers/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: seller.id }),
      });
      const result = await response.json();
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to reset password",
        });
        return;
      }
      setResetCredentials({
        businessName: result.data.businessName,
        email: result.data.email,
        tempPassword: result.data.tempPassword,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setResettingId(null);
    }
  };

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business/Owner</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Primary Category</TableHead>
              <TableHead>Current Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sellers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No ads sellers found
                </TableCell>
              </TableRow>
            ) : (
              sellers.map((seller) => {
                const plan = seller.subscriptions?.[0]?.plan?.name || "Free Plan";
                const ownerName = seller.user.firstName
                  ? `${seller.user.firstName} ${seller.user.lastName || ""}`
                  : "N/A";
                const displayName = seller.businessName || ownerName;

                return (
                  <TableRow key={seller.id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {seller.businessName || "No Business Name"}
                        </div>
                        <div className="text-xs text-muted-foreground">Owner: {ownerName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{seller.user.email}</TableCell>
                    <TableCell className="text-sm">{seller.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-50 border-gray-200">
                        {seller.primaryCategory}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-700">{plan}</TableCell>
                    <TableCell>
                      {seller.status === "PENDING" && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 animate-pulse">
                          Pending
                        </Badge>
                      )}
                      {seller.status === "ACTIVE" && (
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                          Active
                        </Badge>
                      )}
                      {seller.status === "INACTIVE" && (
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistance(new Date(seller.createdAt), new Date(), {
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
                          <DropdownMenuItem onClick={() => setEditingSeller(seller)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleResetPassword(seller)}
                            disabled={resettingId === seller.id}
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            {resettingId === seller.id ? "Resetting..." : "Reset Password"}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/ads-sellers/${seller.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Ads Seller Dialog */}
      {editingSeller && (
        <EditAdsSellerDialog
          seller={editingSeller}
          open={!!editingSeller}
          onOpenChange={(open) => !open && setEditingSeller(null)}
          onSuccess={() => {
            setEditingSeller(null);
            onSellerUpdated();
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
