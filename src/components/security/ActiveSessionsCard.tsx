"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Laptop,
  Smartphone,
  Tablet,
  Shield,
  LogOut,
  RefreshCw,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

interface ActiveSessionsCardProps {
  maxAllowed?: number;
  roleLabel?: string;
}

export function ActiveSessionsCard({ maxAllowed = 2, roleLabel = "Admin" }: ActiveSessionsCardProps) {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/sessions", { credentials: "include" });
      const json = await res.json();
      if (json.success && json.data) {
        setSessions(json.data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this session? The device will be logged out immediately.")) {
      return;
    }
    setRevokingId(id);
    try {
      const res = await fetch(`/api/auth/sessions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to revoke session");
      }
      toast.success("Session revoked successfully");
      fetchSessions();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke session");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOther = async () => {
    if (!confirm("Log out all other devices? Only this current browser will remain logged in.")) {
      return;
    }
    setRevokingAll(true);
    try {
      const res = await fetch("/api/auth/sessions/revoke-others", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to log out other devices");
      }
      toast.success(json.data?.message || "All other devices logged out");
      fetchSessions();
    } catch (err: any) {
      toast.error(err.message || "Failed to log out other devices");
    } finally {
      setRevokingAll(false);
    }
  };

  const getDeviceIcon = (session: ActiveSession) => {
    const text = `${session.device} ${session.os}`.toLowerCase();
    if (text.includes("iphone") || text.includes("android") || text.includes("mobile")) {
      return <Smartphone className="h-5 w-5 text-indigo-500" />;
    }
    if (text.includes("ipad") || text.includes("tablet")) {
      return <Tablet className="h-5 w-5 text-purple-500" />;
    }
    return <Laptop className="h-5 w-5 text-blue-500" />;
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <Card className="border border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                Active Devices & Security Sessions
                <Badge variant="outline" className="text-xs font-normal">
                  {sessions.length} / {maxAllowed} Allowed
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your active logins. If you notice any suspicious device, revoke it instantly.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSessions}
              disabled={loading}
              className="h-8 px-2.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {otherSessionsCount > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevokeAllOther}
                disabled={revokingAll}
                className="h-8 px-3 text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                {revokingAll ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                )}
                Log Out All Other Devices
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs">Loading active devices...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-xs">
            No active sessions found.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {sessions.map((session) => {
              const lastActiveText = (() => {
                try {
                  const dist = formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true });
                  return dist.includes("less than a minute") ? "Active now" : dist;
                } catch {
                  return "Active now";
                }
              })();

              return (
                <div
                  key={session.id}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                    session.isCurrent
                      ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-2.5 rounded-xl bg-muted/60 mt-0.5 flex-shrink-0">
                      {getDeviceIcon(session)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground truncate">
                          {session.device || "Unknown Device"}
                        </span>
                        {session.isCurrent && (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] px-2 py-0.5 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            This Device (Current)
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <MapPin className="w-3 h-3 text-muted-foreground/70" />
                          {session.ip || "Unknown IP"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground/70" />
                          Last active: <strong className="text-foreground/80">{lastActiveText}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {session.isCurrent ? (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 px-3 py-1.5 bg-emerald-500/10 rounded-lg">
                        Online
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={revokingId === session.id}
                        onClick={() => handleRevoke(session.id)}
                        className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50"
                      >
                        {revokingId === session.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <LogOut className="h-3.5 w-3.5 mr-1" />
                        )}
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
