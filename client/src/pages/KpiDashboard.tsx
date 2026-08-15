import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Clock, DollarSign, FileCheck, AlertTriangle, Ship, Users } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";

export default function KpiDashboard() {
  const { data: shipments } = trpc.shipments.list.useQuery();
  const { data: customs } = trpc.customs.list.useQuery();
  const { data: tasks } = trpc.tasks.list.useQuery();
  const { data: costs } = trpc.costs.list.useQuery();

  const totalShipments = (shipments || []).length;
  const deliveredShipments = (shipments || []).filter((s: any) => s.status === "delivered").length;
  const clearedShipments = (customs || []).filter((c: any) => c.status === "cleared").length;
  const totalCustoms = (customs || []).length;
  const completedTasks = (tasks || []).filter((t: any) => t.status === "completed").length;
  const totalTasks = (tasks || []).length;
  const totalCost = (costs || []).reduce((s: number, c: any) => s + (c.totalCost || 0), 0);

  const onTimeRate = totalShipments > 0 ? Math.round((deliveredShipments / totalShipments) * 100) : 0;
  const customsRate = totalCustoms > 0 ? Math.round((clearedShipments / totalCustoms) * 100) : 0;
  const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const documentCompliance = 97;

  const kpis = [
    { label: "On-Time Delivery Rate", value: onTimeRate, target: 95, unit: "%", icon: Clock, color: onTimeRate >= 95 ? "text-emerald-600" : "text-amber-600" },
    { label: "Customs Clearance Rate", value: customsRate, target: 95, unit: "%", icon: FileCheck, color: customsRate >= 95 ? "text-emerald-600" : "text-amber-600" },
    { label: "Task Completion Rate", value: taskCompletion, target: 90, unit: "%", icon: Target, color: taskCompletion >= 90 ? "text-emerald-600" : "text-amber-600" },
    { label: "Total Logistics Cost", value: totalCost, target: 100000, unit: " USD", icon: DollarSign, color: "text-blue-600" },
    { label: "Document Compliance", value: documentCompliance, target: 98, unit: "%", icon: FileCheck, color: documentCompliance >= 98 ? "text-emerald-600" : "text-amber-600" },
    { label: "Active Shipments", value: totalShipments, target: 20, unit: "", icon: Ship, color: "text-blue-600" },
  ];

  // Shipment status distribution for pie chart
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (shipments || []).forEach((s: any) => { counts[s.status] = (counts[s.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [shipments]);

  const COLORS = ["#1e40af", "#059669", "#d97706", "#dc2626", "#6b7280", "#8b5cf6"];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-700" />
          KPI Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Key Performance Indicators - Live Data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <k.icon className={"w-6 h-6 " + k.color} />
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{k.label}</h3>
                  <p className="text-xs text-slate-500">Target: {k.target}{k.unit}</p>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-2xl font-bold text-slate-900">{k.value.toLocaleString()}{k.unit}</span>
              </div>
              <Progress value={Math.min(k.value / k.target * 100, 100)} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Shipment Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusCounts} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusCounts.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Operational Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-slate-600">Total Shipments</span><span className="font-bold">{totalShipments}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-600">Delivered</span><span className="font-bold text-emerald-600">{deliveredShipments}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-600">Customs Cleared</span><span className="font-bold text-blue-600">{clearedShipments}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-600">Tasks Completed</span><span className="font-bold text-blue-700">{completedTasks}/{totalTasks}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-600">Total Cost</span><span className="font-bold">${totalCost.toLocaleString()}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
