import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ship, TrendingUp, AlertTriangle, Clock, Package, DollarSign, CheckCircle, Activity, Container, Scale, Landmark, ClipboardList } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft: { label: "مسودة", color: "#94a3b8" },
  confirmed: { label: "مؤكدة", color: "#6366f1" },
  in_transit: { label: "في الطريق", color: "#3b82f6" },
  arrived: { label: "وصلت", color: "#0ea5e9" },
  customs: { label: "تخليص جمركي", color: "#f59e0b" },
  cleared: { label: "مُخلَّصة", color: "#10b981" },
  delivered: { label: "مُسلَّمة", color: "#475569" },
  delayed: { label: "متأخرة", color: "#ef4444" },
  cancelled: { label: "ملغاة", color: "#78716c" },
};

const CLEARED_META: Record<string, { label: string; color: string }> = {
  pending_acid: { label: "بانتظار ACID", color: "#ef4444" },
  acid_issued: { label: "تم إصدار ACID", color: "#f59e0b" },
  under_inspection: { label: "تحت الفحص", color: "#3b82f6" },
  released: { label: "تم الإفراج", color: "#10b981" },
  cleared: { label: "تخليص مكتمل", color: "#059669" },
};

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#64748b", "#8b5cf6", "#0ea5e9", "#ef4444", "#14b8a6", "#f97316"];

function KpiSkeleton() {
  return (
    <div className="flex items-center justify-between animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="w-12 h-12 rounded-xl" />
    </div>
  );
}

export default function Home() {
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: chartData, isLoading: chartLoading } = trpc.dashboard.chartData.useQuery();
  const { data: activities, isLoading: actLoading } = trpc.dashboard.recentActivities.useQuery();
  const { data: statusBreakdown, isLoading: brkLoading } = trpc.dashboard.statusBreakdown.useQuery();
  const { data: clearance, isLoading: clLoading } = trpc.dashboard.clearanceOverview.useQuery();

  const monthly = chartData?.monthly || [];
  const totalChartCost = monthly.reduce((s, m) => s + m.cost, 0);
  const avgClearance = clearance && clearance.total > 0
    ? Math.max(0, (clearance.released + clearance.cleared) / clearance.total * 100).toFixed(0)
    : "0";
  const onTimeCount = (statusBreakdown || []).filter(s => s.status !== "delayed" && s.status !== "cancelled").reduce((a, b) => a + b.count, 0);
  const totalForRate = (statusBreakdown || []).reduce((a, b) => a + b.count, 0);
  const onTimeRate = totalForRate > 0 ? Math.round((onTimeCount / totalForRate) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif">Executive Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">نظرة شاملة على أداء سلسلة التوريد — مؤشرات لحظية من بيانات حقيقية</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-5">
            {statsLoading ? <KpiSkeleton /> : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Active Shipments</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.activeShipments ?? 0}</p>
                  <p className="text-[11px] text-slate-500 mt-1">من إجمالي {stats?.totalShipments ?? 0} شحنة</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                  <Ship className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-5">
            {statsLoading ? <KpiSkeleton /> : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total Costs (USD)</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">${(stats?.totalCosts ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  <p className="text-[11px] text-slate-500 mt-1">إجمالي التكاليف المسجلة</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-5">
            {statsLoading ? <KpiSkeleton /> : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Cleared / Delivered</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.clearedShipments ?? 0}</p>
                  <p className="text-[11px] text-slate-500 mt-1">شحنة أُنجزت و{stats?.delayed ?? 0} متأخرة</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-5">
            {statsLoading ? <KpiSkeleton /> : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">Pending Tasks</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.pendingTasks ?? 0}</p>
                  <p className="text-[11px] text-slate-500 mt-1">مهام قيد التنفيذ أو الانتظار</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-blue-600" /> Monthly Shipments (آخر 6 أشهر)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading || monthly.length === 0 ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip formatter={(v: number) => [`${v} شحنة`, "Shipments"]} />
                  <Bar dataKey="shipments" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Shipments" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Monthly Costs (USD) — {totalChartCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading || monthly.length === 0 ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Tooltip formatter={(v: number) => [`$${Number(v).toLocaleString(undefined, {maximumFractionDigits: 0})}`, "Cost (USD)"]} />
                  <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} name="Cost (USD)" isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Overview + Clearance + Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">حالة الشحنات (حقيقي)</h3>
            {brkLoading ? <Skeleton className="h-[180px] w-full" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3}>
                    {statusBreakdown?.map((s, i) => (
                      <Cell key={s.status} fill={STATUS_META[s.status]?.color || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [`${v} شحنة`, STATUS_META[name]?.label || name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 space-y-1.5">
              {(statusBreakdown || []).map(s => (
                <div key={s.status} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_META[s.status]?.color || "#94a3b8" }} />
                    <span className="text-sm text-slate-600">{STATUS_META[s.status]?.label || s.status}</span>
                  </div>
                  <Badge variant="secondary">{s.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Landmark className="w-4 h-4 text-emerald-600" /> مراحل التخليص الجمركي (NAFEZA/ACID)</h3>
            {clLoading ? <Skeleton className="h-[220px] w-full" /> : (
              <div className="space-y-2.5">
                {[
                  { key: "pending_acid", icon: ClipboardList },
                  { key: "acid_issued", icon: Container },
                  { key: "under_inspection", icon: Scale },
                  { key: "released", icon: Ship },
                  { key: "cleared", icon: CheckCircle },
                ].map(({ key, icon: Icon }) => {
                  const n = clearance?.[key as keyof typeof clearance] ?? 0;
                  const total = clearance?.total ?? 1;
                  const pct = Math.round((n / total) * 100);
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" style={{ color: CLEARED_META[key].color }} />
                          <span className="text-xs text-slate-600">{CLEARED_META[key].label}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{n} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: CLEARED_META[key].color }} />
                      </div>
                    </div>
                  );
                })}
                <p className="text-[11px] text-slate-400 pt-1">إجمالي سجلات الجمارك: {clearance?.total ?? 0}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-600" /> أحدث الأنشطة</h3>
            {actLoading ? <Skeleton className="h-[220px] w-full" /> : (
              <div className="space-y-3">
                {(activities || []).map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Package className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 font-medium truncate">{a.label}</p>
                      <p className="text-[10px] text-slate-400 truncate">{a.detail}</p>
                      <p className="text-[10px] text-slate-400">
                        {a.createdAt ? new Date(a.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </div>
                  </div>
                ))}
                {(!activities || activities.length === 0) && (
                  <p className="text-xs text-slate-400">لا توجد أنشطة حديثة</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Key Metrics (محسوبة من البيانات الفعلية)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Clearance Completion", value: `${avgClearance}%`, desc: "نسبة الإفراج والتخليص المكتمل" },
              { label: "On-Time Rate", value: `${onTimeRate}%`, desc: "نسبة الشحنات غير المتأخرة" },
              { label: "Total Shipments", value: `${stats?.totalShipments ?? 0}`, desc: "إجمالي الشحنات في السجل" },
              { label: "Avg. Cost / Shipment", value: `$${stats?.totalShipments ? Math.round((stats?.totalCosts ?? 0) / stats.totalShipments).toLocaleString() : 0}`, desc: "متوسط التكلفة للشحنة" },
            ].map((m, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className="text-xl font-bold text-slate-800">{m.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{m.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      <div className="text-xs text-slate-400 text-center">
        EMG-SCOS Professional Edition v1.0 — Supply Chain Operating System
      </div>
    </div>
  );
}
