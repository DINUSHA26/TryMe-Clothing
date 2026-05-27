"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, ChevronRight, Loader2, ArrowRight, Bookmark } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PostCard } from "@/components/social/PostCard";
import { SocialPostType } from "@/components/social/Feed";

interface FollowedVendor {
  id: string;
  businessName: string;
  slug: string;
  logo: string | null;
  isShopOpen: boolean;
}

interface StoreUpdate {
  id: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  price: number;
  createdAt: string;
  vendor: {
    businessName: string;
    logo: string | null;
    slug: string;
  };
}

function FollowedStoresContent() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const authLoading = !_hasHydrated;
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as "stores" | "saved") || "stores";

  const [followedVendors, setFollowedVendors] = useState<FollowedVendor[]>([]);
  const [storeUpdates, setStoreUpdates] = useState<StoreUpdate[]>([]);
  const [savedPosts, setSavedPosts] = useState<SocialPostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("Please login to view followed stores.");
      router.push("/login?returnUrl=/followed-stores");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchFollowedData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/vendors/followed");
        const data = await res.json();
        if (data.success) {
          setFollowedVendors(data.data.followedVendors || []);
          setStoreUpdates(data.data.storeUpdates || []);
        } else {
          toast.error(data.error || "Failed to load followed stores");
        }

        // Fetch saved posts
        const savedRes = await fetch("/api/social/saved");
        const savedData = await savedRes.json();
        if (savedData.success) {
          setSavedPosts(savedData.data.posts || []);
        }
      } catch (error) {
        console.error("Error loading followed stores data:", error);
        toast.error("An error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFollowedData();
  }, [isAuthenticated]);

  const handleTabChange = (tab: "stores" | "saved") => {
    router.push(`/followed-stores?tab=${tab}`);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
    return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
  };

  if (authLoading || (loading && followedVendors.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-10 w-96 rounded" />
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-20 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-48 rounded mt-12" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-semibold">
          {activeTab === "saved" ? "Saved posts" : "Followed stores"}
        </span>
      </nav>

      {/* Page Title */}
      <div className="mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
          {activeTab === "saved" ? (
            <>
              <Bookmark className="h-8 w-8 text-primary" />
              Saved Posts
            </>
          ) : (
            <>
              <Store className="h-8 w-8 text-primary" />
              Followed Stores
            </>
          )}
        </h1>
        <p className="text-muted-foreground mt-1">
          {activeTab === "saved"
            ? "Your bookmarked outfits, updates, and boutique social stories."
            : "Keep track of your favorite brands, products, and shop updates."}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b gap-4 mb-8">
        <button
          onClick={() => handleTabChange("stores")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === "stores"
              ? "border-primary text-primary font-black"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Store className="h-4 w-4" />
          Followed Stores
        </button>
        <button
          onClick={() => handleTabChange("saved")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === "saved"
              ? "border-primary text-primary font-black"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bookmark className="h-4 w-4" />
          Saved Posts
        </button>
      </div>

      {activeTab === "stores" ? (
        <>
          {/* Following Section */}
          <div className="mb-12">
            <h2 className="text-xl font-bold uppercase tracking-tight border-b pb-3 mb-6">
              Following
            </h2>
            {followedVendors.length === 0 ? (
              <div className="bg-muted/30 border border-dashed rounded-2xl p-8 text-center">
                <Store className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  You are not following any stores yet.
                </p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Explore custom boutiques and follow their shops to get instant updates!
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 bg-[#FF6600] hover:bg-[#E65C00] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-all"
                >
                  Browse Products <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-6 sm:gap-8">
                {followedVendors.map((vendor) => (
                  <Link
                    key={vendor.id}
                    href={`/vendors/${vendor.slug}`}
                    className="group flex flex-col items-center text-center space-y-2 max-w-[100px]"
                  >
                    {/* Logo Ring */}
                    <div className="h-20 w-20 rounded-full border-2 border-slate-100 group-hover:border-primary transition-all duration-300 overflow-hidden shadow-sm relative flex items-center justify-center bg-white dark:bg-slate-900 group-hover:scale-105">
                      {vendor.logo ? (
                        <img
                          src={vendor.logo}
                          alt={vendor.businessName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="h-8 w-8 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors truncate w-full px-1">
                      {vendor.businessName}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Store Updates Section */}
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight border-b pb-3 mb-6">
              Store updates
            </h2>
            {storeUpdates.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm font-medium italic">
                No updates from your followed stores yet.
              </div>
            ) : (
              <div className="space-y-8">
                {storeUpdates.map((update) => (
                  <div key={update.id} className="space-y-4">
                    {/* Header: Logo + Text */}
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden border bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                        {update.vendor.logo ? (
                          <img
                            src={update.vendor.logo}
                            alt={update.vendor.businessName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="h-5 w-5 text-muted-foreground/30" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          <Link
                            href={`/vendors/${update.vendor.slug}`}
                            className="font-bold hover:underline"
                          >
                            {update.vendor.businessName}
                          </Link>{" "}
                          has provided a <span className="font-bold text-primary">new item</span>.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(update.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Product Card Component */}
                    <Card className="overflow-hidden hover:border-primary transition-all duration-300 max-w-md shadow-sm">
                      <Link href={`/products/${update.productSlug}`} className="flex flex-col">
                        <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                          {update.productImage ? (
                            <img
                              src={update.productImage}
                              alt={update.productName}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Store className="h-12 w-12 text-muted-foreground/20" />
                            </div>
                          )}
                        </div>
                        <div className="p-4 space-y-1">
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-primary">
                            {update.productName}
                          </h3>
                          <p className="text-sm font-black text-primary">
                            Rs. {update.price.toLocaleString("en-LK")}
                          </p>
                        </div>
                      </Link>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Saved Posts Tab Content */
        <div className="space-y-6">
          {savedPosts.length === 0 ? (
            <div className="bg-muted/30 border border-dashed rounded-2xl p-12 text-center">
              <Bookmark className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                No saved posts yet.
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-6">
                Explore boutique updates, style grids, and follow social feeds to bookmark outfits!
              </p>
              <Link
                href="/social"
                className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-primary/95 transition-all"
              >
                Go to Social Feed <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FollowedStoresPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-xs text-muted-foreground mt-2 font-medium">Loading your followed space...</p>
      </div>
    }>
      <FollowedStoresContent />
    </Suspense>
  );
}
