import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BellRing, AlertTriangle, Clock, RotateCcw, Calculator, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const statusAr: Record<string, string> = {
  draft: "مسودة", confirmed: "مؤكدة", in_transit: "في الطريق", arrived: "وصلت",
  customs: "تحت التخليص", cleared: "مُفروجة", delivered: "مُسلَّمة", delayed: "متأخرة", cancelled: "ملغية",
};

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-EG", { day: "2-digit", month: "short", year: "numeric" });
}

export default function FreeTimeAlerts() {
  const { data: overview, isLoading } = trpc.tools.freeTimeOverview.useQuery();
  const { data: alerts, refetch } = trpc.alerts.list.useQuery();
  const regen = trpc.alerts.regenerate.useMutation({
    onSuccess: () => { toast.success("تم إعادة حساب التنبيهات"); refetch(); },
  });
  const markRead = trpc.alerts.markRead.useMutation({
    onSuccess: () => refetch(),
  });
  const [estDemurrage, setEstDemurrage] = useState(25);

  const rows = useMemo(() => {
    return (overview || [])
      .filter(s => s.freeTime?.expiry && !["delivered", "cancelled"].includes(s.status || ""))
      .map(s => {
        const f = s.freeTime;
        return { s, f };
      })
      .sort((a, b) => (a.f.daysLeft ?? 999) - (b.f.daysLeft ?? 999));
  }, [overview]);

  const critical = rows.filter(r => r.f.expired).length;
  const atRisk = rows.filter(r => r.f.atRisk).length;
  const healthy = rows.filter(r => !r.f.expired && !r.f.atRisk).length;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BellRing className="h-6 w-6 text-destructive" />
            تنبيهات Free Time والغرامات
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            مراقبة أيام السماح المجانية، العد التنازلي للانتهاء، وتقدير غرامات Demurrage/Detention
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => regen.mutate()} disabled={regen.isPending}>
          <RotateCcw className="h-4 w-4 ml-1" /> إعادة حساب التنبيهات
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-2"><CardDescription>Free Time منتهي — خطر غرامة فورية</CardDescription></CardHeader>
          <CardContent className="text-3xl font-bold text-destructive">{critical} شحنات</CardContent>
        </Card>
        <Card className="border-amber-400/50 bg-amber-50">
          <CardHeader className="pb-2"><CardDescription>تنتهي خلال 7 أيام</CardDescription></CardHeader>
          <CardContent className="text-3xl font-bold text-amber-600">{atRisk} شحنات</CardContent>
        </Card>
        <Card className="border-emerald-400/50 bg-emerald-50">
          <CardHeader className="pb-2"><CardDescription>ضمن المدة الآمنة</CardDescription></CardHeader>
          <CardContent className="text-3xl font-bold text-emerald-600">{healthy} شحنات</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">العد التنازلي — جميع الشحنات النشطة</CardTitle>
          <CardDescription>محسوب من تاريخ الوصول + أيام السماح المجاني المسجلة لكل شحنة</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || !overview ? (
            <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">لا توجد شحنات نشطة لها تاريخ وصول وسماح مجاني — حدّث تواريخ الوصول وأيام السماح في سجل الشحنات.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الشحنة</TableHead>
                    <TableHead>المادة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الوصول</TableHead>
                    <TableHead>أيام السماح</TableHead>
                    <TableHead>انتهاء Free Time</TableHead>
                    <TableHead>المتبقي</TableHead>
                    <TableHead>أيام الغرامة</TableHead>
                    <TableHead>التقييم</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ s, f }) => (
                    <TableRow key={s.id} className={f.expired ? "bg-destructive/5" : f.atRisk ? "bg-amber-50/60" : ""}>
                      <TableCell className="font-mono text-xs font-semibold">{s.shipmentNo}</TableCell>
                      <TableCell className="max-w-48 truncate">{s.material || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{statusAr[s.status || "draft"] || s.status}</Badge></TableCell>
                      <TableCell>{fmtDate(s.arrivalDate || s.ata || s.eta)}</TableCell>
                      <TableCell className="font-semibold">{s.freeTimeDays || 0} يوم</TableCell>
                      <TableCell>{f.expiry ? fmtDate(f.expiry) : "—"}</TableCell>
                      <TableCell className="font-bold">
                        {f.expired ? <span className="text-destructive">انتهى</span> : f.daysLeft !== null && f.daysLeft !== undefined ? <span className={f.daysLeft <= 3 ? "text-destructive" : f.daysLeft <= 7 ? "text-amber-600" : "text-emerald-600"}>{f.daysLeft} يوم</span> : "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-destructive">{f.demurrageDays || 0} يوم</TableCell>
                      <TableCell>
                        {f.expired ? (
                          <Badge className="bg-destructive text-white"><AlertTriangle className="h-3 w-3 ml-1" /> خطر غرامة</Badge>
                        ) : f.atRisk ? (
                          <Badge className="bg-amber-500 text-white"><Clock className="h-3 w-3 ml-1" /> حرج</Badge>
                        ) : (
                          <Badge className="bg-emerald-500 text-white"><CheckCircle2 className="h-3 w-3 ml-1" /> آمن</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Calculator className="h-5 w-5" /> حاسبة الغرامات (تقديرية)</CardTitle>
            <CardDescription>قدّر تكلفة Demurrage/Detention المحتملة حسب المعدلات السوقية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium whitespace-nowrap">أيام التأخير:</label>
              <input
                type="range" min="0" max="30" value={estDemurrage}
                onChange={e => setEstDemurrage(Number(e.target.value))}
                className="flex-1"
              />
              <span className="font-bold w-14 text-center text-destructive">{estDemurrage} يوم</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Demurrage (لحظي)</p>
                <p className="text-xl font-bold">${Math.round(estDemurrage * 60).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">~$60/يوم للحاوية</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Demurrage (مرتفع)</p>
                <p className="text-xl font-bold">${Math.round(estDemurrage * 100).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">~$100/يوم</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Port Storage</p>
                <p className="text-xl font-bold">${Math.round(estDemurrage * 40).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">~$40/يوم</p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              هذه أرقام تقديرية سوقية تقريبية. المعدلات الفعلية يحددها الخط الملاحي والميناء، وقد تتضاعف مع طول المدة.
              اطلب دائمًا خطاب تمديد السماح المجاني من الخط الملاحي قبل وصول الشحنة إذا توقعت تأخرًا في التخليص.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">آخر التنبيهات المسجلة</CardTitle>
            <CardDescription>تنبيهات Free Time وانتهاية الاعتمادات البنكية</CardDescription>
          </CardHeader>
          <CardContent>
            {!alerts || alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">لا توجد تنبيهات مسجلة حاليًا.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {alerts.slice(0, 15).map(a => (
                  <div key={a.id} className={`flex items-start gap-2 rounded-lg border p-2.5 text-sm ${a.read === "yes" ? "opacity-60" : ""} ${a.severity === "critical" ? "border-destructive/40 bg-destructive/5" : a.severity === "high" ? "border-amber-400/50 bg-amber-50/50" : "border-border"}`}>
                    <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${a.severity === "critical" ? "text-destructive" : a.severity === "high" ? "text-amber-600" : "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs leading-snug">{a.title}</p>
                      <p className="text-xs text-muted-foreground leading-snug">{a.message}</p>
                    </div>
                    {a.read === "no" && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => markRead.mutate({ id: a.id })}>
                        تعليم مقروء
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
