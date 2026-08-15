import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Landmark, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const statusAr: Record<string, string> = {
  pending_application: "قيد التقديم", submitted_to_bank: "مقدَّم للبنك", issued: "صادر",
  amendment: "تعديل", documents_presented: "تم تقديم المستندات", accepted: "مقبول",
  paid: "مدفوع", closed: "مُغلق", rejected: "مرفوض",
};
const typeAr: Record<string, string> = {
  lc: "LC", lc_at_sight: "LC عند النظر", lc_90days: "LC 90 يوم", lc_120days: "LC 120 يوم",
  tt: "تحويل TT", cash_against_documents: "CAD",
};
const statusColor: Record<string, string> = {
  paid: "bg-emerald-500 text-white", closed: "bg-emerald-500 text-white", accepted: "bg-blue-500 text-white",
  issued: "bg-indigo-500 text-white", documents_presented: "bg-cyan-600 text-white",
  amendment: "bg-violet-500 text-white", submitted_to_bank: "bg-amber-500 text-white",
  pending_application: "bg-slate-400 text-white", rejected: "bg-destructive text-white",
};

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-EG", { day: "2-digit", month: "short", year: "numeric" });
}

const emptyForm = { shipmentId: "", bankName: "", paymentType: "lc", lcNumber: "", amount: "", currency: "USD", status: "pending_application", applicationDate: "", issuanceDate: "", expiryDate: "", remarks: "" };

export default function BankLCTracking() {
  const { data: lcs, isLoading, refetch } = trpc.bankLc.list.useQuery();
  const { data: shipments } = trpc.shipments.list.useQuery();
  const create = trpc.bankLc.create.useMutation({ onSuccess: () => { refetch(); toast.success("تمت الإضافة"); } });
  const update = trpc.bankLc.update.useMutation({ onSuccess: () => { refetch(); toast.success("تم التعديل"); } });
  const del = trpc.bankLc.delete.useMutation({ onSuccess: () => { refetch(); toast.success("تم الحذف"); } });
  const [form, setForm] = useState<any>(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  const stats = useMemo(() => {
    const total = (lcs || []).reduce((s, l) => s + (l.amount || 0), 0);
    const open = (lcs || []).filter(l => !["paid", "closed"].includes(l.status || "")).length;
    const expiring = (lcs || []).filter(l => {
      if (!l.expiryDate || ["paid", "closed"].includes(l.status || "")) return false;
      return new Date(l.expiryDate).getTime() - Date.now() < 7 * 86400000;
    }).length;
    return { total, open, expiring };
  }, [lcs]);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setDialogOpen(true); };
  const openEdit = (lc: any) => {
    setEditing(lc.id);
    setForm({
      shipmentId: String(lc.shipmentId), bankName: lc.bankName || "", paymentType: lc.paymentType || "lc",
      lcNumber: lc.lcNumber || "", amount: String(lc.amount || ""), currency: lc.currency || "USD",
      status: lc.status || "pending_application",
      applicationDate: lc.applicationDate ? new Date(lc.applicationDate).toISOString().slice(0, 10) : "",
      issuanceDate: lc.issuanceDate ? new Date(lc.issuanceDate).toISOString().slice(0, 10) : "",
      expiryDate: lc.expiryDate ? new Date(lc.expiryDate).toISOString().slice(0, 10) : "",
      remarks: lc.remarks || "",
    });
    setDialogOpen(true);
  };
  const submit = () => {
    if (!form.shipmentId || !form.bankName) { toast.error("يرجى اختيار الشحنة واسم البنك"); return; }
    const data = {
      shipmentId: Number(form.shipmentId), bankName: form.bankName, paymentType: form.paymentType,
      lcNumber: form.lcNumber || null, amount: Number(form.amount || 0), currency: form.currency, status: form.status,
      applicationDate: form.applicationDate ? new Date(form.applicationDate) : null,
      issuanceDate: form.issuanceDate ? new Date(form.issuanceDate) : null,
      expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
      remarks: form.remarks || null,
    };
    if (editing) update.mutate({ id: editing, ...data });
    else create.mutate(data);
    setDialogOpen(false);
  };

  const shipName = (id: number) => shipments?.find(s => s.id === id)?.shipmentNo || `#${id}`;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="h-6 w-6" /> متابعة الاعتمادات البنكية (Bank & LC)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">تتبع الاعتمادات المستندية والتحويلات البنكية لكل شحنة — من التقديم حتى السداد</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 ml-1" /> إضافة اعتماد / تحويل</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>إجمالي المبالغ المسجلة</CardDescription></CardHeader><CardContent className="text-3xl font-bold">${Math.round(stats.total).toLocaleString()}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>اعتمادات مفتوحة (غير مسددة)</CardDescription></CardHeader><CardContent className="text-3xl font-bold">{stats.open}</CardContent></Card>
        <Card className={stats.expiring > 0 ? "border-destructive/50" : ""}><CardHeader className="pb-2"><CardDescription>تنتهي خلال 7 أيام</CardDescription></CardHeader><CardContent className="text-3xl font-bold flex items-center gap-2">{stats.expiring}{stats.expiring > 0 && <AlertTriangle className="h-5 w-5 text-destructive" />}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">سجل الاعتمادات والتحويلات</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
          ) : !lcs || lcs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">لا توجد اعتمادات مسجلة بعد — أضف أول اعتماد من الزر أعلى الصفحة.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الاعتماد</TableHead>
                    <TableHead>الشحنة</TableHead>
                    <TableHead>البنك</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ التقديم</TableHead>
                    <TableHead>انتهاء الصلاحية</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lcs.map(lc => {
                    const expSoon = lc.expiryDate && !["paid", "closed"].includes(lc.status || "") && new Date(lc.expiryDate).getTime() - Date.now() < 7 * 86400000;
                    return (
                      <TableRow key={lc.id} className={expSoon ? "bg-destructive/5" : ""}>
                        <TableCell className="font-mono text-xs font-semibold">{lc.lcNumber || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{shipName(lc.shipmentId)}</TableCell>
                        <TableCell>{lc.bankName || "—"}</TableCell>
                        <TableCell><Badge variant="outline">{typeAr[lc.paymentType || "lc"] || lc.paymentType}</Badge></TableCell>
                        <TableCell className="font-semibold">{Number(lc.amount || 0).toLocaleString()} {lc.currency}</TableCell>
                        <TableCell><Badge className={statusColor[lc.status || "pending_application"]}>{statusAr[lc.status || "pending_application"] || lc.status}</Badge></TableCell>
                        <TableCell>{fmtDate(lc.applicationDate)}</TableCell>
                        <TableCell className={expSoon ? "font-bold text-destructive" : ""}>{fmtDate(lc.expiryDate)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(lc)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del.mutate({ id: lc.id })}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل الاعتماد / التحويل" : "إضافة اعتماد / تحويل جديد"}</DialogTitle>
            <DialogDescription>سجّل بيانات الاعتماد المستندي أو التحويل البنكي المرتبط بالشحنة</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium mb-1 block">الشحنة *</label>
              <Select value={form.shipmentId} onValueChange={v => setForm({ ...form, shipmentId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر الشحنة" /></SelectTrigger>
                <SelectContent>
                  {(shipments || []).map(s => <SelectItem key={s.id} value={String(s.id)}>{s.shipmentNo} — {s.material || "—"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium mb-1 block">اسم البنك *</label><Input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="مثال: البنك الأهلي" /></div>
            <div>
              <label className="text-xs font-medium mb-1 block">النوع</label>
              <Select value={form.paymentType} onValueChange={v => setForm({ ...form, paymentType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeAr).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium mb-1 block">رقم الاعتماد</label><Input value={form.lcNumber} onChange={e => setForm({ ...form, lcNumber: e.target.value })} placeholder="LC-..." /></div>
            <div><label className="text-xs font-medium mb-1 block">المبلغ</label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" /></div>
            <div>
              <label className="text-xs font-medium mb-1 block">الحالة</label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusAr).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium mb-1 block">تاريخ التقديم</label><Input type="date" value={form.applicationDate} onChange={e => setForm({ ...form, applicationDate: e.target.value })} /></div>
            <div><label className="text-xs font-medium mb-1 block">تاريخ الإصدار</label><Input type="date" value={form.issuanceDate} onChange={e => setForm({ ...form, issuanceDate: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-xs font-medium mb-1 block">تاريخ انتهاء الصلاحية</label><Input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-xs font-medium mb-1 block">ملاحظات</label><Textarea value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={submit}>{editing ? "حفظ التعديلات" : "إضافة"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
