"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  AlertCircle,
  ExternalLink,
  Eye,
  Search,
  Filter,
  User,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { SocialPostType } from "@/components/social/Feed";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AdminSocialModerationPage() {
  const [posts, setPosts] = useState<SocialPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedPost, setSelectedPost] = useState<SocialPostType | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [roleFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ limit: "100" });
      if (search.trim()) q.set("search", search.trim());
      if (roleFilter !== "ALL") q.set("userRole", roleFilter);

      const res = await fetch(`/api/social?${q.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.data.posts);
      }
    } catch {
      toast.error("Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/social/${postId}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        if (selectedPost?.id === postId) setSelectedPost(null);
        toast.success("Post deleted successfully");
      } else {
        toast.error("Failed to delete post");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const getUserBadge = (user: any) => {
    const role = user?.role;
    if (role === "VENDOR" || user?.vendor) {
      return (
        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300">
          Vendor
        </Badge>
      );
    }
    if (role === "ADS_SELLER" || user?.adsSeller) {
      return (
        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
          Ads Seller
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
        Customer
      </Badge>
    );
  };

  const getUserDisplayName = (user: any) => {
    if (user?.vendor?.businessName) return user.vendor.businessName;
    if (user?.adsSeller?.businessName) return user.adsSeller.businessName;
    const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
    return name || user?.email?.split("@")[0] || "User";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Social Moderation</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review, filter, inspect and moderate community social posts and discussions.
          </p>
        </div>
        <Button
          onClick={fetchPosts}
          disabled={loading}
          variant="outline"
          className="rounded-xl flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-2xl border">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer name, email, or post content..."
                className="pl-9 rounded-xl font-medium"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Filter className="w-3.5 h-3.5" />
                <span>Audience:</span>
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 px-3 rounded-xl border bg-background text-sm font-semibold focus:outline-none"
              >
                <option value="ALL">All Posts</option>
                <option value="CUSTOMER">Customers Only</option>
                <option value="VENDOR">Vendors Only</option>
                <option value="ADS_SELLER">Ads Sellers Only</option>
              </select>
              <Button type="submit" className="rounded-xl px-5 bg-orange-600 hover:bg-orange-700 text-white font-bold">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <div className="rounded-2xl border bg-white dark:bg-slate-950 overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-bold">User / Customer</TableHead>
              <TableHead className="font-bold">Content</TableHead>
              <TableHead className="font-bold">Images</TableHead>
              <TableHead className="font-bold">Stats</TableHead>
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-600" />
                  Loading posts...
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  No posts found matching the filter.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-foreground">
                        {getUserDisplayName(post.user)}
                      </div>
                      {getUserBadge(post.user)}
                    </div>
                    <span className="text-xs text-muted-foreground">{post.user.email}</span>
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <p className="line-clamp-2 text-xs text-slate-700 dark:text-slate-300">
                      {post.content || <span className="text-muted-foreground italic">No text content</span>}
                    </p>
                  </TableCell>
                  <TableCell>
                    {post.images.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-xs font-bold gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {post.images.length}
                        </Badge>
                        {post.images[0] && (
                          <img
                            src={post.images[0]}
                            alt="preview"
                            className="w-7 h-7 rounded-md object-cover border"
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        {post.likes?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                        {post._count?.comments || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(post.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Direct Link to live Post on Feed */}
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl border-blue-500/30 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        title="View post on live social feed"
                      >
                        <Link href={`/social?post=${post.id}`} target="_blank">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">View Post</span>
                        </Link>
                      </Button>

                      {/* Quick Inspect Modal */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => setSelectedPost(post)}
                        title="Quick Inspect"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        onClick={() => handleDelete(post.id)}
                        title="Delete Post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Quick Post Inspection Dialog */}
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl">
            <DialogHeader className="p-4 sm:p-5 bg-gradient-to-r from-orange-600 to-amber-600 text-white shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                    <User className="w-5 h-5" />
                    <span>Post by {getUserDisplayName(selectedPost.user)}</span>
                  </DialogTitle>
                  <DialogDescription className="text-orange-100 text-xs mt-0.5">
                    {selectedPost.user?.email} • {format(new Date(selectedPost.createdAt), "MMMM d, yyyy h:mm a")}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 dark:bg-slate-950">
              {/* Content Text */}
              {selectedPost.content && (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border text-sm text-foreground whitespace-pre-wrap leading-relaxed shadow-xs">
                  {selectedPost.content}
                </div>
              )}

              {/* Images Grid */}
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Attached Images ({selectedPost.images.length})
                  </div>
                  <div className={`grid gap-3 ${selectedPost.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                    {selectedPost.images.map((imgUrl, i) => (
                      <a
                        key={i}
                        href={imgUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative rounded-2xl overflow-hidden border bg-black/5 aspect-square block"
                      >
                        <img
                          src={imgUrl}
                          alt={`Post attachment ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Engagement Stats */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border text-xs">
                <div className="flex items-center gap-4 font-bold text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-rose-500">
                    <Heart className="w-4 h-4" />
                    {selectedPost.likes?.length || 0} Likes
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-500">
                    <MessageCircle className="w-4 h-4" />
                    {selectedPost._count?.comments || 0} Comments
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="rounded-xl text-xs font-bold gap-1 text-blue-600 border-blue-200"
                  >
                    <Link href={`/social?post=${selectedPost.id}`} target="_blank">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Live Feed
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-xl text-xs font-bold gap-1"
                    onClick={() => handleDelete(selectedPost.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
