import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AuditLog() {
  const { data: items, isLoading } = trpc.auditLog.list.useQuery();
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold text-slate-900 font-serif">Audit Log</h1><p className="text-sm text-slate-500 mt-1">System activity log</p></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-4">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200"><th className="text-left py-2 px-3 font-semibold text-slate-600">User</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Action</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Module</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Details</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Timestamp</th></tr></thead><tbody>{(items||[]).map(s => (<tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="py-2 px-3 text-slate-600">{s.userId||"-"}</td><td className="py-2 px-3">{s.action||"-"}</td><td className="py-2 px-3 text-slate-600">{s.module||"-"}</td><td className="py-2 px-3 text-slate-600">{s.details||"-"}</td><td className="py-2 px-3 text-slate-500 text-xs">{s.createdAt?new Date(s.createdAt).toLocaleString():"-"}</td></tr>))}</tbody></table>{(items||[]).length===0&&!isLoading&&<p className="text-center text-slate-400 py-8">No records</p>}</div>
      </CardContent></Card>
    </div>
  );
}