"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, RefreshCw, Eye, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AuditRow {
  id: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: Record<string, any> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export function AdsSellerAuditLogsTab() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditRow | null>(null);

  const load = useCallback(async (p = 1, query = search) => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(p), limit: "25" });
      if (query) sp.set("search", query);
      const res = await fetch(`/api/ads-seller/audit-logs?${sp.toString()}`, { credentials: "include" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load audit logs");
      setLogs(json.data.logs);
      setPage(json.data.pagination.page);
      setTotalPages(json.data.pagination.pages || 1);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load(1);
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(1, search);
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.startsWith("auth.")) return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200";
    if (action.startsWith("ad.")) return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200";
    if (action.startsWith("product.")) return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200";
    return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Activity Audit Log
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable 6-point compliance trail of ads moderation, staff actions, and login security.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 sm:flex-initial">
            <div className="relative flex-1 sm:w-64">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search action or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary" className="h-9 text-xs">
              Filter
            </Button>
          </form>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => load(page)}
            disabled={loading}
            className="h-9 px-2.5"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="border rounded-2xl p-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs">Loading audit trail...</p>
        </div>
      ) : (
        <div className="border rounded-2xl bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b uppercase text-[10px] tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-semibold px-4 py-2.5">Time (UTC)</th>
                  <th className="text-left font-semibold px-4 py-2.5">Staff / Actor</th>
                  <th className="text-left font-semibold px-4 py-2.5">Action</th>
                  <th className="text-left font-semibold px-4 py-2.5">Entity</th>
                  <th className="text-left font-semibold px-4 py-2.5">IP</th>
                  <th className="text-right font-semibold px-4 py-2.5">Diff / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                      <span>{row.actorEmail || "Store Owner"}</span>
                      {row.actorRole && (
                        <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary">
                          {row.actorRole}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <Badge variant="outline" className={`font-mono text-[10px] ${getActionBadgeVariant(row.action)}`}>
                        {row.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {row.entity ? `${row.entity} ${row.entityId ? `#${row.entityId}` : ""}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                      {row.ip || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(row)}
                        className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View Diff
                      </Button>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No activity logs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              className="h-8 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
              className="h-8 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Audit Log Diff / Details Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Activity Event Details & Diff
            </DialogTitle>
            <DialogDescription className="text-xs">
              Complete before & after state metadata recorded for this action.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3.5 rounded-xl border border-border/50">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Action</span>
                  <Badge variant="outline" className={`font-mono text-[11px] mt-0.5 ${getActionBadgeVariant(selectedLog.action)}`}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Timestamp</span>
                  <span className="font-mono mt-0.5 block">{new Date(selectedLog.createdAt).toUTCString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Actor</span>
                  <span className="font-medium mt-0.5 block">{selectedLog.actorEmail || "Store Owner"}</span>
                  {selectedLog.actorRole && (
                    <span className="text-[10px] text-primary font-bold">Role: {selectedLog.actorRole}</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Entity / Target</span>
                  <span className="font-medium mt-0.5 block">
                    {selectedLog.entity || "None"} {selectedLog.entityId && `(#${selectedLog.entityId})`}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Client Context</span>
                  <span className="font-mono mt-0.5 block text-[11px]">IP: {selectedLog.ip || "Unknown"}</span>
                  {selectedLog.userAgent && (
                    <span className="text-muted-foreground truncate block text-[10px] mt-0.5">UA: {selectedLog.userAgent}</span>
                  )}
                </div>
              </div>

              <div>
                <span className="font-bold text-xs mb-1.5 block">Diff / State Metadata (Before & After):</span>
                <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl font-mono text-[11px] max-h-60 overflow-auto border border-slate-800">
                  {selectedLog.metadata
                    ? JSON.stringify(selectedLog.metadata, null, 2)
                    : "// No state diff metadata recorded for this action"}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
