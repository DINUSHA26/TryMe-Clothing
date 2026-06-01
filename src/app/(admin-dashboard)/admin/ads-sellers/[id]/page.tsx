"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Phone, Tag, Clock, CheckCircle2, Ban, Eye, Globe, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { formatDistance, format } from "date-fns";

export default function AdminAdsSellerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [seller, setSeller] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchSellerDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/ads-sellers/${params.id}`);
      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to fetch ads seller details",
        });
        return;
      }
      setSeller(result.data);
    } catch (error) {
      console.error("Error fetching seller details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchSellerDetails();
    }
  }, [params.id]);

  const handleUpdateStatus = async (newStatus: "ACTIVE" | "INACTIVE") => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/ads-sellers/${params.id}`, {
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
      fetchSellerDetails();
    } catch (error) {
      console.error("Error updating seller status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6600] border-t-transparent" />
          <p className="text-sm">Loading seller details...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/admin/ads-sellers")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Sellers</span>
        </Button>
        <div className="text-center py-20 text-muted-foreground">
          Seller not found.
        </div>
      </div>
    );
  }

  const activeSubscription = seller.subscriptions?.find((sub: any) => sub.status === "ACTIVE") || seller.subscriptions?.[0];
  const ownerName = seller.user.firstName ? `${seller.user.firstName} ${seller.user.lastName || ""}`.trim() : "N/A";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={() => router.push("/admin/ads-sellers")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-black font-semibold mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Ads Sellers</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {seller.businessName || "No Business Name"}
            </h1>
            {seller.status === "PENDING" && (
              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                Pending Verification
              </Badge>
            )}
            {seller.status === "ACTIVE" && (
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                Active
              </Badge>
            )}
            {seller.status === "INACTIVE" && (
              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                Suspended
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Seller Profile ID: <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{seller.id}</span>
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-2">
          {seller.status === "PENDING" && (
            <>
              <Button
                variant="default"
                onClick={() => handleUpdateStatus("ACTIVE")}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-2 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve & Verify</span>
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleUpdateStatus("INACTIVE")}
                disabled={isUpdating}
                className="rounded-xl flex items-center gap-2"
              >
                <Ban className="h-4 w-4" />
                <span>Reject Account</span>
              </Button>
            </>
          )}
          {seller.status === "ACTIVE" && (
            <Button
              variant="destructive"
              onClick={() => handleUpdateStatus("INACTIVE")}
              disabled={isUpdating}
              className="rounded-xl flex items-center gap-2 shadow-sm"
            >
              <Ban className="h-4 w-4" />
              <span>Suspend Seller</span>
            </Button>
          )}
          {seller.status === "INACTIVE" && (
            <Button
              variant="default"
              onClick={() => handleUpdateStatus("ACTIVE")}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-2 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Reactivate Account</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Business Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900">
                <User className="h-4 w-4 text-[#FF6600]" />
                <span>Business & Contact Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Business Name</label>
                  <span className="text-base font-semibold text-gray-900">{seller.businessName || "Not Specified"}</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Primary Category</label>
                  <Badge variant="outline" className="bg-orange-50/50 text-[#FF6600] border-orange-100 font-semibold mt-1">
                    {seller.primaryCategory}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">slug</label>
                  <span className="text-sm font-mono text-gray-700 block mt-1">{seller.slug}</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Storefront URL</label>
                  <a
                    href={`/marketplace/sellers/${seller.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-[#FF6600] hover:underline flex items-center gap-1.5 mt-1 font-medium"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>View Public Storefront</span>
                  </a>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Owner/Representative</label>
                  <span className="text-base font-semibold text-gray-900">{ownerName}</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Email Address</label>
                  <span className="text-sm text-gray-700 font-medium">{seller.user.email}</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Phone Number</label>
                  <span className="text-sm text-gray-700 font-medium flex items-center gap-1.5 mt-1">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {seller.phone}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Registration Date</label>
                  <span className="text-sm text-gray-700 font-medium flex items-center gap-1.5 mt-1">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    {format(new Date(seller.createdAt), "PPP")} ({formatDistance(new Date(seller.createdAt), new Date(), { addSuffix: true })})
                  </span>
                </div>
              </div>
              {seller.aboutContent && (
                <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">About Company / Store Description</label>
                  <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{seller.aboutContent}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ad history of the seller */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-100 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900">
                <Tag className="h-4 w-4 text-[#FF6600]" />
                <span>Classified Ads ({seller.ads?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead>Ad Title</TableHead>
                    <TableHead>Sub-Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!seller.ads || seller.ads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No ads posted by this seller yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    seller.ads.map((ad: any) => (
                      <TableRow key={ad.id} className="hover:bg-gray-50/30">
                        <TableCell className="font-semibold text-gray-900 max-w-[200px] truncate">
                          {ad.title}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {ad.subCategory?.name}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span>{ad.district}</span>
                            {ad.localArea && <span className="text-xs text-gray-400">({ad.localArea})</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-gray-800">
                          {ad.price ? `Rs. ${Number(ad.price).toLocaleString("en-LK")}` : "Contact"}
                        </TableCell>
                        <TableCell>
                          {ad.status === "PENDING" && <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">Pending</Badge>}
                          {ad.status === "ACTIVE" && <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Active</Badge>}
                          {ad.status === "REJECTED" && <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Rejected</Badge>}
                          {ad.status === "EXPIRED" && <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Expired</Badge>}
                          {ad.status === "PAUSED" && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Paused</Badge>}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-gray-700">{ad.views}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/marketplace`}>
                              <Eye className="h-4 w-4 text-gray-600" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Current Subscription details */}
        <div className="space-y-6">
          <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900">
                <Tag className="h-4 w-4 text-[#FF6600]" />
                <span>Subscription Plan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {activeSubscription ? (
                <>
                  <div className="text-center py-4 border-b border-gray-100">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400 block mb-1">Active Tier</span>
                    <span className="text-2xl font-black text-gray-900">{activeSubscription.plan.name}</span>
                    <Badge className="bg-[#FF6600] text-white hover:bg-[#e65c00] border-none font-bold mt-2 px-3 py-1 text-xs">
                      {activeSubscription.plan.type}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Ads Limit Usage</span>
                      <span className="font-bold text-gray-900">{activeSubscription.adsUsed} / {activeSubscription.plan.maxAds} Ads</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#FF6600] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((activeSubscription.adsUsed / activeSubscription.plan.maxAds) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-2 border-t border-gray-100 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Subscription Status</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold uppercase text-[10px]">
                        {activeSubscription.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Start Date</span>
                      <span className="font-semibold text-gray-900">{format(new Date(activeSubscription.startsAt), "PP")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Expiry Date</span>
                      <span className="font-semibold text-gray-900">
                        {activeSubscription.expiresAt ? format(new Date(activeSubscription.expiresAt), "PP") : "Lifetime / Never"}
                      </span>
                    </div>
                  </div>

                  {activeSubscription.payment && (
                    <div className="pt-4 border-t border-gray-100 space-y-3 text-sm">
                      <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400 block">Recent Payment Details</span>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Amount Paid</span>
                        <span className="font-bold text-[#FF6600]">Rs. {Number(activeSubscription.payment.amount).toLocaleString("en-LK")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Payment Status</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold uppercase text-[10px]">
                          {activeSubscription.payment.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Payment Method</span>
                        <span className="font-semibold text-gray-700 capitalize">{activeSubscription.payment.paymentMethod || "N/A"}</span>
                      </div>
                      {activeSubscription.payment.paidAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">Paid On</span>
                          <span className="font-semibold text-gray-700">{format(new Date(activeSubscription.payment.paidAt), "PP")}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No active subscription plan found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
