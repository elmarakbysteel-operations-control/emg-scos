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
import { SearchX, Plus, Pencil, Trash2, CheckCircle2, XCircle, AlertCircle, Circle } from "lucide-react";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const matchAr: Record<string, string> = { match: "مطابق", mismatch: "متناقض", missing: "مفقود", pending_review: "قيد المراجعة" };
const sevAr: Record<string, string> = { low: "منخفض", medium: "متوسط", high: "مرتفع", critical: "حرج" };
const docAr: Record<string, string> = { commercial_invoice: "الفاتورة التجارية", bill_of_lading: "بوليصة الشحن", certificate_of_origin: "شهادة المنشأ", packing_list: "قائمة التعبئة" };
const matchStyle: Record<string, string> = { match: "bg-emerald-500 text-white", mismatch: "bg-destructive text-white", missing: "bg-amber-500 text-white", pending_review: "bg-slate-400 text-white" };
const sevStyle: Record<string, string> = { critical: "border-destructive/50 bg-destructive/5", high: "border-amber-400/50 bg-amber-50/50", medium: "border-border", low: "border-border" };

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-EG", { day: "2-digit", month: "short", year: "numeric" });
}

const emptyForm = { shipmentId: "", docType: "commercial_invoice", docName: "", fieldName: "", expectedValue: "", actualValue: "", matches: "pending_review", severity: "medium", remarks: "" };

export default function DocDiscrepancy() {
  const { data: checks, isLoading, refetch } = trpc.docCheck.list.useQuery();
  const { data: shipments } = trpc.shipments.list.useQuery();
  const create = trpc.docCheck.create.useMutation({ onSuccess: () => { refetch(); toast.success("تمت الإضافة"); } });
  const update = trpc.docCheck.update.useMutation({ onSuccess: () => { refetch(); toast.success("تم التعديل"); } });
  const del = trpc.docCheck.delete.useMutation({ onSuccess: () => { refetch(); toast.success("تم الحذف"); } });
  const [form, setForm] = useState<any>(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  const stats = useMemo(() => {
    const list = checks || [];
    return {
      total: list.length,
      mismatch: list.filter(c => c.matches === "mismatch" || c.matches === "missing").length,
      critical: list.filter(c => c.matches !== "match" && c.severity === "critical").length,
      pending: list.filter(c => c.matches === "pending_review").length,
    };
  }, [checks]);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setDialogOpen(true); };
  const openEdit = (c: any) => {
    setEditing(c.id);
    setForm({
      shipmentId: String(c.shipmentId), docType: c.docType || "commercial_invoice", docName: c.docName || "",
      fieldName: c.fieldName || "", expectedValue: c.expectedValue || "", actualValue: c.actualValue || "",
      matches: c.matches || "pending_review", severity: c.severity || "medium", remarks: c.remarks || "",
    });
    setDialogOpen(true);
  };
  const submit = () => {
    if (!form.shipmentId || !form.fieldName) { toast.error("يرجى اختيار الشحنة وحقل الفحص"); return; }
    const data = {
      shipmentId: Number(form.shipmentId), docType: form.docType, docName: form.docName || null,
      fieldName: form.fieldName, expectedValue: form.expectedValue || null, actualValue: form.actualValue || null,
      matches: form.matches, severity: form.severity, remarks: form.remarks || null,
    };
    if (editing) update.mutate({ id: editing, ...data });
    else create.mutate(data);
    setDialogOpen(false);
  };
  const resolve = (id: number) => update.mutate({ id, resolved: "yes", matches: "match" });

  const shipName = (id: number) => shipments?.find(s => s.id === id)?.shipmentNo || `#${id}`;
  const matchIcon = (m: string) => m === "match" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : m === "mismatch" ? <XCircle className="h-4 w-4 text-destructive" /> : m === "missing" ? <AlertCircle className="h-4 w-4 text-amber-500" /> : <Circle className="h-4 w-4 text-slate-400" />;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <SearchX className="h-6 w-6" /> فحص التناقض المستندي (Document Discrepancy)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">مراجعة مسودات الفاتورة والبوليصة وشهادة المنشأ وقائمة التعبئة — التناقض قد يوقف الشهادة الجمركية 46</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 ml-1" /> إضافة بند فحص</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>إجمالي البنود</CardDescription></CardHeader><CardContent className="text-3xl font-bold">{stats.total}</CardContent></Card>
        <Card className="border-destructive/50 bg-destructive/5"><CardHeader className="pb-2"><CardDescription>تناقضات / مفقودات</CardDescription></CardHeader><CardContent className="text-3xl font-bold text-destructive">{stats.mismatch}</CardContent></Card>
        <Card className="border-destructive/50"><CardHeader className="pb-2"><CardDescription>حالات حرجة</CardDescription></CardHeader><CardContent className="text-3xl font-bold text-destructive">{stats.critical}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>قيد المراجعة</CardDescription></CardHeader><CardContent className="text-3xl font-bold">{stats.pending}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">سجل الفحص</CardTitle><CardDescription>كل بند يقارن القيمة المتوقعة (الفاتورة) بالقيمة الفعلية (البوليصة/الشهادة)</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
          ) : !checks || checks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">لا توجد بنود فحص — أضف أول بند من الزر أعلى الصفحة بعد استلام مسودات المستندات من المورد.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشحنة</TableHead>
                    <TableHead>المستند</TableHead>
                    <TableHead>الحقل</TableHead>
                    <TableHead>المتوقع</TableHead>
                    <TableHead>الفعلي</TableHead>
                    <TableHead>النتيجة</TableHead>
                    <TableHead>الخطورة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checks.map(c => (
                    <TableRow key={c.id} className={sevStyle[c.severity || "medium"]}>
                      <TableCell className="font-mono text-xs font-semibold">{shipName(c.shipmentId)}</TableCell>
                      <TableCell>{docAr[c.docType || "commercial_invoice"] || c.docType}</TableCell>
                      <TableCell className="font-medium">{c.fieldName}</TableCell>
                      <TableCell className="text-xs">{c.expectedValue || "—"}</TableCell>
                      <TableCell className="text-xs">{c.actualValue || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {matchIcon(c.matches || "pending_review")}
                          <Badge className={matchStyle[c.matches || "pending_review"]}>{matchAr[c.matches || "pending_review"]}</Badge>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className={c.severity === "critical" ? "text-destructive border-destructive/50 font-semibold" : ""}>{sevAr[c.severity || "medium"]}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {c.resolved === "no" && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-emerald-600" onClick={() => resolve(c.id)}>تم</Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del.mutate({ id: c.id })}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل بند الفحص" : "إضافة بند فحص جديد"}</DialogTitle>
            <DialogDescription>قارن بين القيمة المتوقعة في الفاتورة والقيمة الفعلية في المستند الآخر</DialogDescription>
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
            <div>
              <label className="text-xs font-medium mb-1 block">نوع المستند</label>
              <Select value={form.docType} onValueChange={v => setForm({ ...form, docType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(docAr).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium mb-1 block">اسم المستند</label><Input value={form.docName} onChange={e => setForm({ ...form, docName: e.target.value })} placeholder="مثال: Invoice Draft v1" /></div>
            <div><label className="text-xs font-medium mb-1 block">الحقل المفحوص *</label><Input value={form.fieldName} onChange={e => setForm({ ...form, fieldName: e.target.value })} placeholder="مثال: HS Code / الوزن / الوصف" /></div>
            <div>
              <label className="text-xs font-medium mb-1 block">النتيجة</label>
              <Select value={form.matches} onValueChange={v => setForm({ ...form, matches: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(matchAr).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><label className="text-xs font-medium mb-1 block">القيمة المتوقعة (الفاتورة)</label><Input value={form.expectedValue} onChange={e => setForm({ ...form, expectedValue: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-xs font-medium mb-1 block">القيمة الفعلية (البوليصة/الشهادة)</label><Input value={form.actualValue} onChange={e => setForm({ ...form, actualValue: e.target.value })} /></div>
            <div>
              <label className="text-xs font-medium mb-1 block">الخطورة</label>
              <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(sevAr).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium mb-1 block">ملاحظات</label><Input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={submit}>{editing ? "حفظ" : "إضافة"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
