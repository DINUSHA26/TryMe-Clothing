"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, History, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AuditRow {
  id: string;
  actorEmail: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: Record<string, any> | null;
  ip: string | null;
  createdAt: string;
}

export function VendorAuditLogsTab() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async (p = 1, query = search) => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(p), limit: "25" });
      if (query) sp.set("search", query);
      const res = await fetch(`/api/vendor/audit-logs?${sp.toString()}`, { credentials: "include" });
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Store Activity Audit Log</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time record of all actions, logins, status changes, and catalog updates made by store staff.
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search actions or email..."
              className="pl-8 h-8 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => load(page)}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading audit history...
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wide">
                <tr>
                  <th className="text-left font-semibold px-4 py-2.5">Time</th>
                  <th className="text-left font-semibold px-4 py-2.5">Staff / Actor</th>
                  <th className="text-left font-semibold px-4 py-2.5">Action</th>
                  <th className="text-left font-semibold px-4 py-2.5">Details</th>
                  <th className="text-right font-semibold px-4 py-2.5">IP</th>
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
                    <td className="px-4 py-2.5 font-medium">{row.actorEmail || "Store Owner"}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {row.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground max-w-md truncate">
                      {row.metadata ? (
                        <span className="font-mono text-[11px]">{JSON.stringify(row.metadata)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                      {row.ip || "—"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
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
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="h-7 text-xs"
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => load(page + 1)}
            className="h-7 text-xs"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

