import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Clock, DollarSign, FileCheck, AlertTriangle } from "lucide-react";

export default function KpiDashboard() {
  const kpis = [
    { label: "On-Time Delivery Rate", value: 94, target: 95, unit: "%", icon: Clock, color: "text-emerald-600" },
    { label: "Customs Clearance Time", value: 3.2, target: 3, unit: " days", icon: Target, color: "text-blue-600" },
    { label: "Cost Variance", value: -4.2, target: 0, unit: "%", icon: DollarSign, color: "text-emerald-600" },
    { label: "Document Compliance", value: 97, target: 98, unit: "%", icon: FileCheck, color: "text-blue-600" },
    { label: "Supplier On-Time Rate", value: 88, target: 90, unit: "%", icon: TrendingUp, color: "text-amber-600" },
    { label: "Delayed Shipments", value: 8, target: 5, unit: "", icon: AlertTriangle, color: "text-red-600" },
  ];
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold text-slate-900 font-serif">KPI Dashboard</h1><p className="text-sm text-slate-500 mt-1">Key Performance Indicators</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k, i) => (
          <Card key={i} className="border-0 shadow-sm"><CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3"><k.icon className={"w-6 h-6 " + k.color} /><div><h3 className="text-sm font-semibold text-slate-800">{k.label}</h3><p className="text-xs text-slate-500">Target: {k.target}{k.unit}</p></div></div>
            <div className="flex items-end gap-2 mb-2"><span className="text-2xl font-bold text-slate-900">{k.value}{k.unit}</span></div>
            <Progress value={Math.min(k.value / k.target * 100, 100)} className="h-2" />
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}