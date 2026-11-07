"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Search, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AuditRow {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: any;
  ip: string | null;
  createdAt: string;
}

export function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Immutable trail of administrative operations, role changes, and API actions.
        </p>
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
              placeholder="Filter by actor or action..."
              className="pl-8 h-9 text-xs w-64"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary">Filter</Button>
        </form>
      </div>

      <div className="border rounded-xl bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Timestamp</th>
              <th className="text-left px-4 py-2.5 font-semibold">Actor</th>
              <th className="text-left px-4 py-2.5 font-semibold">Action</th>
              <th className="text-left px-4 py-2.5 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-muted-foreground">
                  No audit entries found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t text-xs">
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                    {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                  </td>
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                    {log.actorEmail || log.actorId || "System"}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <Badge variant="outline" className="font-mono text-[10px]">{log.action}</Badge>
                  </td>
                  <td className="px-4 py-2.5 max-w-md truncate text-muted-foreground">
                    {log.entity && <span className="font-medium text-foreground">{log.entity}: </span>}
                    {log.entityId && <span className="font-mono mr-2">{log.entityId}</span>}
                    {log.metadata && JSON.stringify(log.metadata)}
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
    </div>
  );
}

