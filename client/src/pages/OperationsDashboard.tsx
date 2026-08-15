import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ship, Clock, AlertCircle, Package } from "lucide-react";

export default function OperationsDashboard() {
  const { data: shipments } = trpc.shipments.list.useQuery();
  const { data: tasks } = trpc.tasks.list.useQuery();

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  // "Today's Arrivals": shipments physically arrived (ata or arrived status) within last 2 days,
  // or whose ETA falls on the current day — whichever applies.
  const arrivedShipments = (shipments || []).filter(s => s.status === "arrived" || s.status === "customs" || s.status === "cleared" || s.status === "delivered");
  const recentArrivals = arrivedShipments.filter(s => {
    if (s.ata) { const d = new Date(s.ata).getTime(); return Math.abs(d - now) <= 2 * day; }
    if (s.eta) { const d = new Date(s.eta).getTime(); return d <= now && now - d <= 2 * day; }
    return false;
  });

  const upcomingShipments = (shipments || []).filter(s => {
    if (!s.eta) return false;
    if (["arrived", "customs", "cleared", "delivered", "cancelled"].includes(s.status || "")) return false;
    const diff = new Date(s.eta).getTime() - now;
    return diff >= 0 && diff <= 7 * day;
  });

  const overdueShipments = (shipments || []).filter(s => {
    if (!s.eta || s.status === "delivered" || s.status === "cancelled" || s.status === "arrived" || s.status === "customs" || s.status === "cleared") return false;
    return new Date(s.eta).getTime() < now;
  });

  const activeTasks = (tasks || []).filter(t => t.status !== "completed" && t.status !== "cancelled");

  const statusColors: Record<string, string> = { draft: "bg-slate-100 text-slate-700", confirmed: "bg-blue-100 text-blue-700", in_transit: "bg-cyan-100 text-cyan-700", arrived: "bg-purple-100 text-purple-700", customs: "bg-amber-100 text-amber-700", cleared: "bg-emerald-100 text-emerald-700", delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700", delayed: "bg-orange-100 text-orange-700" };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900 font-serif">Operations Dashboard</h1><p className="text-sm text-slate-500 mt-1">Real-time operational overview — live from the shipment register</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Ship className="w-5 h-5 text-blue-600" /></div><div><p className="text-xs text-slate-500">Recent Arrivals (48h)</p><p className="text-xl font-bold">{recentArrivals.length}</p></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Clock className="w-5 h-5 text-purple-600" /></div><div><p className="text-xs text-slate-500">Upcoming ETA (7 days)</p><p className="text-xl font-bold">{upcomingShipments.length}</p></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-600" /></div><div><p className="text-xs text-slate-500">Overdue ETA</p><p className="text-xl font-bold">{overdueShipments.length}</p></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Package className="w-5 h-5 text-amber-600" /></div><div><p className="text-xs text-slate-500">Active Tasks</p><p className="text-xl font-bold">{activeTasks.length}</p></div></CardContent></Card>
      </div>

      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-800">Arrived / In Clearance (last 48h or physically arrived)</CardTitle></CardHeader><CardContent>{recentArrivals.length === 0 ? <p className="text-sm text-slate-400 py-4 text-center">No arrivals in the last 48 hours — {arrivedShipments.length} shipments have arrived in total</p> : <div className="space-y-2">{recentArrivals.slice(0, 6).map(s => <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"><div className="flex items-center gap-3"><span className="text-sm font-medium">{s.shipmentNo}</span><span className="text-xs text-slate-500">{s.supplierName} — {s.destinationPort}</span></div><div className="flex items-center gap-2"><span className="text-xs">{s.eta ? new Date(s.eta).toLocaleDateString() : '-'}</span><Badge className={`${statusColors[s.status || "draft"]} border-0 text-xs`}>{s.status}</Badge></div></div>)}</div>}</CardContent></Card>

      {overdueShipments.length > 0 && <Card className="border-0 shadow-sm border-l-4 border-l-red-500"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-red-700">Overdue Shipments (ETA passed, not yet arrived)</CardTitle></CardHeader><CardContent><div className="space-y-2">{overdueShipments.slice(0, 5).map(s => <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"><span className="text-sm font-medium">{s.shipmentNo}</span><div className="flex items-center gap-2"><span className="text-xs text-red-600">ETA: {s.eta ? new Date(s.eta).toLocaleDateString() : '-'}</span><Badge className={`${statusColors[s.status || "draft"]} border-0 text-xs`}>{s.status}</Badge></div></div>)}</div></CardContent></Card>}

      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-800">Upcoming Arrivals (next 7 days by ETA)</CardTitle></CardHeader><CardContent>{upcomingShipments.length === 0 ? <p className="text-sm text-slate-400 py-4 text-center">No ETAs scheduled within the next 7 days — {upcomingShipments.length} incoming</p> : <div className="space-y-2">{upcomingShipments.slice(0, 5).map(s => <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"><div className="flex items-center gap-3"><span className="text-sm font-medium">{s.shipmentNo}</span><span className="text-xs text-slate-500">{s.supplierName} — {s.destinationPort}</span></div><div className="flex items-center gap-2"><span className="text-xs">{s.eta ? new Date(s.eta).toLocaleDateString() : '-'}</span><Badge className={`${statusColors[s.status || "draft"]} border-0 text-xs`}>{s.status}</Badge></div></div>)}</div>}</CardContent></Card>

      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-800">Active Tasks</CardTitle></CardHeader><CardContent>{activeTasks.length === 0 ? <p className="text-sm text-slate-400 py-4 text-center">No active tasks</p> : <div className="space-y-2">{activeTasks.slice(0, 8).map(t => <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"><span className="text-sm">{t.title}</span><div className="flex items-center gap-2"><Badge className={`${t.priority === 'urgent' ? 'bg-red-100 text-red-700' : t.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'} border-0 text-xs`}>{t.priority}</Badge><Badge className="bg-blue-100 text-blue-700 border-0 text-xs">{t.status?.replace('_', ' ')}</Badge></div></div>)}</div>}</CardContent></Card>
    </div>
  );
}
