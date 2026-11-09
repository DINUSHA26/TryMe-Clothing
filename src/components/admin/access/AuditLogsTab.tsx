"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Search, Shield, MapPin, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AuditRow {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: any;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditRow | null>(null);

  const load = useCallback(async (p = page, q = search) => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(p), limit: "25" });
      if (q.trim()) sp.set("search", q.trim());
      const res = await fetch(`/api/admin/audit-logs?${sp}`, { credentials: "include" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load audit logs");
      setLogs(json.data.logs);
      setTotalPages(json.data.pagination.totalPages || 1);
      setPage(p);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load(1, search);
  }, []);

  const getActionBadgeVariant = (action: string) => {
    if (action.startsWith("auth.")) return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900";
    if (action.startsWith("order.")) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900";
    if (action.startsWith("product.")) return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900";
    if (action.startsWith("vendor.")) return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900";
    if (action.startsWith("payout.")) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900";
    return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-primary" />
            System Audit Trail (Forensics & Compliance)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable 6-point log of all user activities, security logins, status overrides, and administrative actions.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(1, search);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by actor, action or entity..."
              className="pl-8 h-9 text-xs w-64"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary">Filter</Button>
        </form>
      </div>

      <div className="border rounded-xl bg-card overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Timestamp (UTC)</th>
              <th className="text-left px-4 py-2.5 font-semibold">Actor (Who)</th>
              <th className="text-left px-4 py-2.5 font-semibold">Action (What)</th>
              <th className="text-left px-4 py-2.5 font-semibold">Target (Entity)</th>
              <th className="text-left px-4 py-2.5 font-semibold">Context (IP & Device)</th>
              <th className="text-right px-4 py-2.5 font-semibold">Diff / Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-muted-foreground">
                  No audit entries found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t text-xs hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground font-mono">
                    {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                  </td>
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                    <div>
                      <span>{log.actorEmail || log.actorId || "System"}</span>
                      {log.actorRole && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                          {log.actorRole}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <Badge variant="outline" className={`font-mono text-[10px] ${getActionBadgeVariant(log.action)}`}>
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {log.entity ? (
                      <span className="font-semibold text-foreground">
                        {log.entity}
                        {log.entityId && <span className="font-mono text-muted-foreground ml-1">#{log.entityId}</span>}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-muted-foreground/60" />
                      {log.ip || "Unknown IP"}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                      className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View Diff
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>Previous</Button>
          <span className="text-xs flex items-center px-2 text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>Next</Button>
        </div>
      )}

      {/* Audit Log Diff / Details Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Audit Event Details & Diff
            </DialogTitle>
            <DialogDescription className="text-xs">
              Complete metadata and forensic details recorded for this action.
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
                  <span className="font-mono mt-0.5 block">{format(new Date(selectedLog.createdAt), "yyyy-MM-dd HH:mm:ss (UTC)")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Actor (Who)</span>
                  <span className="font-medium mt-0.5 block">{selectedLog.actorEmail || selectedLog.actorId || "System"}</span>
                  {selectedLog.actorRole && (
                    <span className="text-[10px] text-primary font-bold">Role: {selectedLog.actorRole}</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Target (Entity)</span>
                  <span className="font-medium mt-0.5 block">
                    {selectedLog.entity || "None"} {selectedLog.entityId && `(${selectedLog.entityId})`}
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
