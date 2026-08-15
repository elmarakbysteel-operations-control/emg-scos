import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Activity } from "lucide-react";

export default function AuditLog() {
  const { data: items, isLoading } = trpc.auditLog.list.useQuery();

  const formatDate = (d: any) => {
    if (!d) return "-";
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const actionColors: Record<string, string> = {
    create: "bg-emerald-100 text-emerald-700",
    update: "bg-blue-100 text-blue-700",
    delete: "bg-red-100 text-red-700",
    login: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-700" />
          Audit Log
        </h1>
        <p className="text-sm text-slate-500 mt-1">System activity log - all user actions are tracked</p>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">User</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Action</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Module</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Details</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {(items || []).map((s: any) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 text-slate-700 font-medium">{s.userId || "System"}</td>
                    <td className="py-3 px-3"><Badge className={`${actionColors[s.action] || "bg-gray-100 text-gray-600"} border-0 text-xs`}>{s.action || "-"}</Badge></td>
                    <td className="py-3 px-3 text-slate-600">{s.module || "-"}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{s.details || "-"}</td>
                    <td className="py-3 px-3 text-slate-500 text-xs">{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(items || []).length === 0 && !isLoading && (
              <p className="text-center text-slate-400 py-8">No audit records found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
