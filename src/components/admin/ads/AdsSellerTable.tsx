"use client";

import { useState } from "react";
import { formatDistance } from "date-fns";
import { Eye, CheckCircle2, XCircle, Ban, RefreshCw } from "lucide-react";
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
import Link from "next/link";

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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpdateStatus = async (sellerId: string, newStatus: "ACTIVE" | "INACTIVE" | "PENDING") => {
    setUpdatingId(sellerId);
    try {
      const response = await fetch(`/api/admin/ads-sellers/${sellerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Status Update Failed",
          description: result.error || "Failed to update seller status",
        });
        return;
      }
      toast({
        title: "Success",
        description: `Seller status updated to ${newStatus}`,
      });
      onSellerUpdated();
    } catch (error) {
      console.error("Error updating seller status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
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
                    <div className="flex items-center justify-end gap-1">
                      {/* View Details button */}
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/ads-sellers/${seller.id}`}>
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Link>
                      </Button>

                      {/* Approval Actions */}
                      {seller.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUpdateStatus(seller.id, "ACTIVE")}
                          disabled={updatingId === seller.id}
                          title="Approve Seller"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      )}

                      {seller.status === "ACTIVE" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUpdateStatus(seller.id, "INACTIVE")}
                          disabled={updatingId === seller.id}
                          title="Deactivate Seller"
                        >
                          <Ban className="h-4 w-4 text-red-600" />
                        </Button>
                      )}

                      {seller.status === "INACTIVE" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUpdateStatus(seller.id, "ACTIVE")}
                          disabled={updatingId === seller.id}
                          title="Reactivate Seller"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
