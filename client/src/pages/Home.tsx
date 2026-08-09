import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ship, TrendingUp, AlertTriangle, Clock, Package, DollarSign, CheckCircle, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Separator } from "@/components/ui/separator";

const monthlyData = [
  { month: "Jan", shipments: 12, cost: 45000 },
  { month: "Feb", shipments: 18, cost: 62000 },
  { month: "Mar", shipments: 22, cost: 71000 },
  { month: "Apr", shipments: 15, cost: 53000 },
  { month: "May", shipments: 28, cost: 89000 },
  { month: "Jun", shipments: 31, cost: 95000 },
  { month: "Jul", shipments: 25, cost: 78000 },
  { month: "Aug", shipments: 33, cost: 102000 },
];

export default function Home() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif">Executive Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Supply Chain Performance Overview — Real-time KPIs</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Active Shipments</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.activeShipments ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                <Ship className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total Costs (USD)</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">${stats?.totalCosts?.toLocaleString() ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Delayed</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.delayed ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">Pending Tasks</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.pendingTasks ?? 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-blue-600" /> Monthly Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="shipments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Monthly Costs (USD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Shipment Status</h3>
            <div className="space-y-2">
              {[
                { label: "In Transit", count: 8, color: "bg-blue-500" },
                { label: "Customs Clearance", count: 4, color: "bg-amber-500" },
                { label: "Cleared", count: 12, color: "bg-emerald-500" },
                { label: "Delivered", count: 6, color: "bg-slate-500" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className="text-sm text-slate-600">{s.label}</span>
                  </div>
                  <Badge variant="secondary">{s.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Activities</h3>
            <div className="space-y-3">
              {[
                { icon: Package, text: "Shipment #SH-2024-089 arrived at Alexandria Port", time: "2h ago" },
                { icon: CheckCircle, text: "Customs clearance completed for ACID-4521", time: "4h ago" },
                { icon: Activity, text: "New PO created: PO-2024-156", time: "5h ago" },
                { icon: AlertTriangle, text: "Delay alert: Container MSCU-4521 (3 days)", time: "6h ago" },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <a.icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600 truncate">{a.text}</p>
                    <p className="text-[10px] text-slate-400">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Key Metrics</h3>
            <div className="space-y-3">
              {[
                { label: "Avg. Clearance Time", value: "3.2 days", trend: "+0.3" },
                { label: "On-Time Delivery", value: "94%", trend: "+2%" },
                { label: "Cost Variance", value: "-4.2%", trend: "improved" },
                { label: "Document Compliance", value: "97%", trend: "+1%" },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                  <span className="text-xs text-slate-500">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{m.value}</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{m.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-4" />

      <div className="text-xs text-slate-400 text-center">
        EMG-SCOS Professional Edition v1.0 — Supply Chain Operating System
      </div>
    </div>
  );
}
