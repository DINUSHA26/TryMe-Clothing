"use client";

import { useState, useEffect } from "react";
import { AdminPayoutsResponse, PayoutWithVendor } from "@/types/wallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PayoutsTable } from "@/components/admin/wallet/PayoutsTable";
import { ProcessPayoutDialog } from "@/components/admin/wallet/ProcessPayoutDialog";
import { CompletePayoutDialog } from "@/components/admin/wallet/CompletePayoutDialog";
import { FailPayoutDialog } from "@/components/admin/wallet/FailPayoutDialog";
import { PayoutDetailsModal } from "@/components/admin/wallet/PayoutDetailsModal";
import {
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  RefreshCw,
  Search,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { useToast } from "@/hooks/use-toast";

export default function AdminPayoutsPage() {
  const [data, setData] = useState<AdminPayoutsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [vendorSearch, setVendorSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Dialog states
  const [selectedPayout, setSelectedPayout] = useState<PayoutWithVendor | null>(
    null
  );
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [failDialogOpen, setFailDialogOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const { toast } = useToast();

  const fetchPayouts = async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }

      if (vendorSearch) {
        params.append("vendor", vendorSearch);
      }

      const response = await fetch(`/api/admin/payouts?${params}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch payouts");
      }

      setData(result.data);
    } catch (error: any) {
      console.error("Error fetching payouts:", error);
      toast({
        title: "Failed to Load Payouts",
        description: error.message || "Could not fetch payouts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, vendorSearch]);

  const handleSearch = () => {
    setVendorSearch(searchInput.trim());
    setPage(1); // Reset to first page
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setVendorSearch("");
    setPage(1);
  };

  const handleViewDetails = (payout: PayoutWithVendor) => {
    setSelectedPayout(payout);
    setDetailsModalOpen(true);
  };

  const handleProcess = (payout: PayoutWithVendor) => {
    setSelectedPayout(payout);
    setProcessDialogOpen(true);
  };

  const handleComplete = (payout: PayoutWithVendor) => {
    setSelectedPayout(payout);
    setCompleteDialogOpen(true);
  };

  const handleFail = (payout: PayoutWithVendor) => {
    setSelectedPayout(payout);
    setFailDialogOpen(true);
  };

  const handleActionSuccess = () => {
    fetchPayouts();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Payout Management</h1>
        <p className="text-muted-foreground mt-1">
          Approve, complete, or fail vendor payout requests
        </p>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(data.stats.totalPendingAmount)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <RefreshCw className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.processing}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.completed}</div>
              <p className="text-xs text-muted-foreground">Successfully paid</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.failed}</div>
              <p className="text-xs text-muted-foreground">Refunded</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vendor Search */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Vendor Search
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by vendor name or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
                <Button onClick={handleSearch} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
                {vendorSearch && (
                  <Button
                    onClick={handleClearSearch}
                    variant="outline"
                    size="icon"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <Button
                onClick={() => fetchPayouts()}
                variant="outline"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {data ? (
            <PayoutsTable
              payouts={data.payouts}
              pagination={data.pagination}
              onPageChange={setPage}
              onViewDetails={handleViewDetails}
              onProcess={handleProcess}
              onComplete={handleComplete}
              onFail={handleFail}
              isLoading={isLoading}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Loading payouts...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ProcessPayoutDialog
        payout={selectedPayout}
        open={processDialogOpen}
        onOpenChange={setProcessDialogOpen}
        onSuccess={handleActionSuccess}
      />

      <CompletePayoutDialog
        payout={selectedPayout}
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        onSuccess={handleActionSuccess}
      />

      <FailPayoutDialog
        payout={selectedPayout}
        open={failDialogOpen}
        onOpenChange={setFailDialogOpen}
        onSuccess={handleActionSuccess}
      />

      <PayoutDetailsModal
        payout={selectedPayout}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />
    </div>
  );
}
