"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, X, ChevronLeft, ChevronRight, Store, Loader2, Camera, Sparkles, ImagePlus, WifiOff, Play, Pause, Square } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Constants ────────────────────────────────────────────────────────────────
const CACHE_KEY = "primewear_stories_cache";
const SELF_STORY_CACHE_KEY = "primewear_self_story_cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Types ────────────────────────────────────────────────────────────────────
interface StoryItem {
  id: string;
  imageUrl: string;
  createdAt: string;
}

interface GroupedStories {
  userId: string;
  displayName: string;
  logoUrl: string | null;
  slug: string | null;
  isSelf: boolean;
  stories: StoryItem[];
}

interface StoriesCache {
  data: GroupedStories[];
  cachedAt: number;
}

interface SelfStoryCache {
  displayName: string;
  logoUrl: string | null;
  latestImageUrl: string;
  cachedAt: number;
}

// ─── Cache helpers ─────────────────────────────────────────────────────────────
function readCache(): GroupedStories[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: StoriesCache = JSON.parse(raw);
    // Discard stale entries older than TTL
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data: GroupedStories[]) {
  try {
    const payload: StoriesCache = { data, cachedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Storage quota exceeded – silently ignore
  }
}

function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}

// ─── Self-story cache helpers ──────────────────────────────────────────────────
function readSelfCache(): SelfStoryCache | null {
  try {
    const raw = localStorage.getItem(SELF_STORY_CACHE_KEY);
    if (!raw) return null;
    const parsed: SelfStoryCache = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(SELF_STORY_CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSelfCache(group: GroupedStories) {
  try {
    const payload: SelfStoryCache = {
      displayName: group.displayName,
      logoUrl: group.logoUrl,
      latestImageUrl: group.stories[0]?.imageUrl ?? "",
      cachedAt: Date.now(),
    };
    localStorage.setItem(SELF_STORY_CACHE_KEY, JSON.stringify(payload));
  } catch {}
}

// ─── Fashion templates ────────────────────────────────────────────────────────
const FASHION_TEMPLATES = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=500&auto=format&fit=crop&q=60",
];

// ─── Component ────────────────────────────────────────────────────────────────
export function StoriesTray() {
  const { isAuthenticated, user } = useAuthStore();

  const [groupedStories, setGroupedStories] = useState<GroupedStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  // Cached personal story for session-expired / logged-out fallback
  const [cachedSelfStory, setCachedSelfStory] = useState<SelfStoryCache | null>(null);

  // Create-story modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  // Story viewer
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveStoryRef = useRef<string>("");

  // ── File handlers ────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));
      setSelectedTemplate("");
    }
  };

  const handleRemoveFile = () => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setUploadedFile(null);
    setFilePreviewUrl(null);
  };

  // ── Fetch + cache logic ──────────────────────────────────────────────────
  const fetchStories = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const res = await fetch("/api/social/stories");

      // Treat non-2xx as session/auth failure
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        const fresh: GroupedStories[] = data.data.groupedStories || [];
        setGroupedStories(fresh);
        setIsFromCache(false);
        setIsOffline(false);
        writeCache(fresh); // ✅ Persist full stories cache
        // ✅ Separately cache the user's own story for session-expiry fallback
        const selfEntry = fresh.find((g) => g.isSelf);
        if (selfEntry && selfEntry.stories.length > 0) {
          writeSelfCache(selfEntry);
          setCachedSelfStory({
            displayName: selfEntry.displayName,
            logoUrl: selfEntry.logoUrl,
            latestImageUrl: selfEntry.stories[0].imageUrl,
            cachedAt: Date.now(),
          });
        }
      } else {
        throw new Error(data.error || "API error");
      }
    } catch (err) {
      console.warn("[StoriesTray] Network/auth error — falling back to cache:", err);

      const cached = readCache();
      if (cached && cached.length > 0) {
        setGroupedStories(cached);
        setIsFromCache(true);
      } else {
        setGroupedStories([]);
        setIsFromCache(false);
      }
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Hydrate from cache immediately on mount ──────────────────────────────
  useEffect(() => {
    const cached = readCache();
    if (cached && cached.length > 0) {
      setGroupedStories(cached);
      setIsFromCache(true);
      setLoading(false); // Show cached content instantly
    }
    // Always hydrate self-story cache on mount for fallback display
    const selfCached = readSelfCache();
    if (selfCached) setCachedSelfStory(selfCached);
  }, []);

  // ── Fetch fresh data (works for both guests and authenticated users) ────
  useEffect(() => {
    if (!isAuthenticated) {
      const cached = readCache();
      if (cached && cached.length > 0) {
        setGroupedStories(cached);
        setIsFromCache(true);
        setLoading(false);
      } else {
        fetchStories();
      }
    } else {
      fetchStories();
    }
  }, [isAuthenticated]);

  // ── Online/offline browser events ───────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (isAuthenticated) fetchStories(true);
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isAuthenticated]);

  // ── Story viewer auto-progress ───────────────────────────────────────────
  useEffect(() => {
    if (activeGroupIndex === null) {
      setProgress(0);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const storyKey = `${activeGroupIndex}-${activeStoryIndex}`;
    const isNewStory = lastActiveStoryRef.current !== storyKey;

    if (isNewStory) {
      setProgress(0);
      lastActiveStoryRef.current = storyKey;
    }

    if (isPaused) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const duration = 5000;
    const stepTime = 50;
    const steps = duration / stepTime;

    // Start from current progress if resuming, otherwise 0
    const startProgress = isNewStory ? 0 : progress;
    let currentStep = Math.round((startProgress / 100) * steps);

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      currentStep++;
      const nextProgress = (currentStep / steps) * 100;
      setProgress(nextProgress);
      if (currentStep >= steps) {
        clearInterval(progressIntervalRef.current!);
        handleNextStory();
      }
    }, stepTime);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [activeGroupIndex, activeStoryIndex, isPaused]);

  // ── Create story ─────────────────────────────────────────────────────────
  const handleCreateStory = async () => {
    if (!uploadedFile && !selectedTemplate) {
      toast.error("Please upload a story photo or select a fashion template.");
      return;
    }

    try {
      setIsSubmitting(true);
      let finalImageUrl = selectedTemplate;

      if (uploadedFile) {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("folder", "social");

        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.data?.url) {
          finalImageUrl = uploadData.data.url;
        } else {
          toast.error(uploadData.error || "Failed to upload image. Please try again.");
          return;
        }
      }

      const res = await fetch("/api/social/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: finalImageUrl }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Story shared successfully!");
        handleRemoveFile();
        setSelectedTemplate("");
        setIsCreateOpen(false);
        clearCache(); // Invalidate stale cache after new story
        fetchStories();
      } else {
        toast.error(data.error || "Failed to share story");
      }
    } catch {
      toast.error("Failed to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Navigation helpers ───────────────────────────────────────────────────
  const handleNextStory = () => {
    if (activeGroupIndex === null) return;
    const currentGroup = groupedStories[activeGroupIndex];
    if (activeStoryIndex < currentGroup.stories.length - 1) {
      setActiveStoryIndex((p) => p + 1);
    } else if (activeGroupIndex < groupedStories.length - 1) {
      setActiveGroupIndex((p) => p! + 1);
      setActiveStoryIndex(0);
    } else {
      setActiveGroupIndex(null);
      setActiveStoryIndex(0);
    }
  };

  const handlePrevStory = () => {
    if (activeGroupIndex === null) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((p) => p - 1);
    } else if (activeGroupIndex > 0) {
      const prevGroup = groupedStories[activeGroupIndex - 1];
      setActiveGroupIndex((p) => p! - 1);
      setActiveStoryIndex(prevGroup.stories.length - 1);
    } else {
      setProgress(0);
    }
  };

  const openViewer = (groupIndex: number) => {
    setActiveGroupIndex(groupIndex);
    setActiveStoryIndex(0);
    setIsPaused(false);
  };

  const closeViewer = () => {
    setActiveGroupIndex(null);
    setActiveStoryIndex(0);
    setIsPaused(false);
  };

  const selfGroup = groupedStories.find((g) => g.isSelf);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full relative py-2">

      {/* ── Offline / cached banner ─────────────────────────────────────── */}
      {isOffline && groupedStories.length > 0 && (
        <div className="flex items-center gap-2 px-1 pb-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          <WifiOff className="h-3.5 w-3.5 flex-shrink-0" />
          {isFromCache
            ? "You're offline — showing cached stories"
            : "Connection issue — retrying…"}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent snap-x">

        {/* ── Create Story card ─────────────────────────────────────────── */}
        <div
          onClick={() => {
            if (!isAuthenticated) {
              toast.error("Please login to create a story.");
              return;
            }
            setIsCreateOpen(true);
          }}
          className="flex-shrink-0 w-32 h-48 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm cursor-pointer snap-start overflow-hidden flex flex-col group relative"
        >
          <div className="flex-1 w-full bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
            {selfGroup?.stories?.[0]?.imageUrl ? (
              // ✅ LIVE: Authenticated user has an active story
              <img
                src={selfGroup.stories[0].imageUrl}
                alt="Your story"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : !isAuthenticated && cachedSelfStory?.latestImageUrl ? (
              // ✅ CACHED: Session expired — show the previously loaded personal story
              <>
                <img
                  src={cachedSelfStory.latestImageUrl}
                  alt="Your cached story"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                />
                {/* Subtle "cached" overlay badge */}
                <div className="absolute top-2 right-2 z-10">
                  <WifiOff className="h-3 w-3 text-amber-300 drop-shadow" />
                </div>
              </>
            ) : (user?.vendor as any)?.logo ? (
              // Live: Authenticated but no story yet — show vendor logo
              <img
                src={(user?.vendor as any)?.logo}
                alt="Logo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              // New user or no data at all — generic placeholder
              <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
                <Store className="h-8 w-8 text-slate-300 dark:text-slate-700" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
          </div>
          {/* Blue plus */}
          <div className="absolute left-1/2 bottom-[40px] -translate-x-1/2 h-8 w-8 rounded-full bg-primary border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-md text-white group-hover:scale-110 transition-transform">
            <Plus className="h-4 w-4 stroke-[3]" />
          </div>
          <div className="h-12 w-full flex items-end justify-center pb-2.5 bg-white dark:bg-slate-900">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Create story</span>
          </div>
        </div>

        {/* ── Story cards ──────────────────────────────────────────────── */}
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="flex-shrink-0 w-32 h-48 rounded-2xl snap-start" />
          ))
        ) : (
          groupedStories.map((group, gIdx) => {
            const latestStory = group.stories[0];
            if (!latestStory) return null;

            return (
              <div
                key={group.userId}
                onClick={() => openViewer(gIdx)}
                className={cn(
                  "flex-shrink-0 w-32 h-48 rounded-2xl overflow-hidden shadow-sm cursor-pointer snap-start relative group",
                  isFromCache && "ring-1 ring-amber-400/40"
                )}
              >
                <img
                  src={latestStory.imageUrl}
                  alt={group.displayName}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

                {/* Profile ring */}
                <div className="absolute top-3 left-3 h-9 w-9 rounded-full border-2 border-primary bg-white dark:bg-slate-900 shadow-md overflow-hidden flex items-center justify-center">
                  {group.logoUrl ? (
                    <img src={group.logoUrl} alt={group.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="h-4 w-4 text-primary" />
                  )}
                </div>

                {/* Cached badge */}
                {isFromCache && (
                  <div className="absolute top-2 right-2 z-10">
                    <WifiOff className="h-3 w-3 text-amber-300 drop-shadow" />
                  </div>
                )}

                {/* Name overlay */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <p className="text-[10px] font-bold text-white leading-tight line-clamp-2 drop-shadow-md text-center">
                    {group.isSelf ? "Your Story" : group.displayName}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── CREATE STORY MODAL ──────────────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Create a Story
            </DialogTitle>
            <DialogDescription>
              Share a new look, brand outfit, or store announcement with your followers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Templates */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                Select a Stock Template
              </label>
              <div className="grid grid-cols-4 gap-2">
                {FASHION_TEMPLATES.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedTemplate(url);
                      handleRemoveFile();
                    }}
                    className={cn(
                      "aspect-[3/4] rounded-lg overflow-hidden border-2 cursor-pointer transition-all relative",
                      selectedTemplate === url
                        ? "border-primary scale-[1.03] shadow-md"
                        : "border-transparent hover:border-slate-200"
                    )}
                  >
                    <img src={url} alt={`Template ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Upload Story Photo</span>
                {uploadedFile && (
                  <button onClick={handleRemoveFile} className="text-red-500 hover:text-red-600 font-bold transition-colors">
                    Remove
                  </button>
                )}
              </label>

              {filePreviewUrl ? (
                <div className="aspect-[3/4] max-w-[180px] mx-auto rounded-2xl overflow-hidden border-2 border-primary relative shadow-md group">
                  <img src={filePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={handleRemoveFile}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-md transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-[16/9] w-full border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-950 transition-colors p-4 group">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-green-50/80 dark:bg-green-950/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <ImagePlus className="h-6 w-6 text-green-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
                      Click to upload photo
                    </span>
                    <span className="text-[10px] text-muted-foreground">PNG, JPG or WEBP up to 5MB</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" className="rounded-full" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={isSubmitting}
                className="rounded-full px-6 font-bold"
                onClick={handleCreateStory}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Share Story
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── FULLSCREEN STORY VIEWER ─────────────────────────────────────── */}
      {activeGroupIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-md">
          {/* Desktop prev */}
          <button
            onClick={handlePrevStory}
            className="absolute left-8 hidden md:flex h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-all z-10"
          >
            <ChevronLeft className="h-6 w-6 stroke-[3]" />
          </button>

          {/* Player */}
          <div className="relative w-full max-w-sm h-full md:h-[80vh] md:max-w-md md:rounded-3xl overflow-hidden bg-black flex flex-col items-center justify-center shadow-2xl">
            <img
              src={groupedStories[activeGroupIndex].stories[activeStoryIndex].imageUrl}
              alt="Story content"
              className="w-full h-full object-contain"
            />

            {/* Cached indicator inside viewer */}
            {isFromCache && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 z-30">
                <WifiOff className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] font-semibold text-amber-300">Cached story</span>
              </div>
            )}

            {/* Progress bar */}
            <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-20">
              {groupedStories[activeGroupIndex].stories.map((s, idx) => (
                <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all ease-linear"
                    style={{
                      width:
                        idx < activeStoryIndex
                          ? "100%"
                          : idx === activeStoryIndex
                          ? `${progress}%`
                          : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border-2 border-white bg-white/10 overflow-hidden flex items-center justify-center">
                  {groupedStories[activeGroupIndex].logoUrl ? (
                    <img
                      src={groupedStories[activeGroupIndex].logoUrl!}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm drop-shadow-md">
                    {groupedStories[activeGroupIndex].isSelf
                      ? "Your Story"
                      : groupedStories[activeGroupIndex].displayName}
                  </h4>
                  <p className="text-[10px] text-white/70 drop-shadow-sm font-semibold">
                    {new Date(
                      groupedStories[activeGroupIndex].stories[activeStoryIndex].createdAt
                    ).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                  title={isPaused ? "Play Story" : "Pause Story"}
                >
                  {isPaused ? (
                    <Play className="h-4 w-4 fill-white text-white" />
                  ) : (
                    <Pause className="h-4 w-4 fill-white text-white" />
                  )}
                </button>
                <button
                  onClick={closeViewer}
                  className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                  title="Close Viewer"
                >
                  <X className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Mobile tap zones */}
            <div 
              className="absolute inset-x-0 top-20 bottom-0 flex z-10"
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              <div onClick={handlePrevStory} className="w-1/3 h-full cursor-w-resize" />
              <div onClick={handleNextStory} className="w-2/3 h-full cursor-e-resize" />
            </div>
          </div>

          {/* Desktop next */}
          <button
            onClick={handleNextStory}
            className="absolute right-8 hidden md:flex h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-all z-10"
          >
            <ChevronRight className="h-6 w-6 stroke-[3]" />
          </button>
        </div>
      )}
    </div>
  );
}
