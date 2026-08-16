import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Pencil, Trash2, FileText, AlertTriangle, Search, Upload, ExternalLink,
  FileType, FileSpreadsheet, Image as ImageIcon, FileArchive, Sparkles, Loader2,
} from "lucide-react";
import { toast } from "sonner";

const docAr: Record<string, string> = {
  commercial_invoice: "فاتورة تجارية", packing_list: "قائمة تعبئة", certificate_of_origin: "شهادة منشأ",
  bill_of_lading: "بوليصة شحن", air_waybill: "بوليصة جوية", import_license: "رخصة استيراد",
  inspection_cert: "شهادة فحص", insurance_cert: "بوليصة تأمين", customs_declaration: "بيان جمركي",
  msds: "MSDS", coa: "COA", other: "أخرى",
};
const statusAr: Record<string, string> = {
  pending: "قيد الانتظار", uploaded: "مرفوع", verified: "معتمد", rejected: "مرفوض", expired: "منتهي",
};
const statusColor: Record<string, string> = {
  pending: "bg-amber-500 text-white", uploaded: "bg-blue-500 text-white",
  verified: "bg-emerald-500 text-white", rejected: "bg-destructive text-white",
  expired: "bg-slate-400 text-white",
};

function fmtDate(d: any) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("ar-EG", { day: "2-digit", month: "short", year: "numeric" });
}
function iconFor(name: string) {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return <FileType className="h-4 w-4 text-destructive" />;
  if (/\.(xlsx|xls|csv)$/.test(n)) return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
  if (/\.(png|jpg|jpeg|webp)$/.test(n)) return <ImageIcon className="h-4 w-4 text-blue-500" />;
  if (/\.(zip|rar|7z)$/.test(n)) return <FileArchive className="h-4 w-4 text-amber-600" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

export default function DocumentsCenter() {
  const { data: items, isLoading } = trpc.documents.list.useQuery();
  const { data: shipments } = trpc.shipments.list.useQuery();
  const createMutation = trpc.documents.create.useMutation({ onSuccess: () => { utils.documents.list.invalidate(); toast.success("تمت الإضافة"); } });
  const updateMutation = trpc.documents.update.useMutation({ onSuccess: () => { utils.documents.list.invalidate(); toast.success("تم التعديل"); } });
  const deleteMutation = trpc.documents.delete.useMutation({ onSuccess: () => { utils.documents.list.invalidate(); toast.success("تم الحذف"); } });
  const upload = trpc.shipmentDocs.upload.useMutation({
    onSuccess: () => { utils.documents.list.invalidate(); utils.shipmentDocs.list.invalidate(); toast.success("تم رفع الملف بنجاح"); setUploadDialog(false); setFile(null); setUploading(false); },
    onError: () => { toast.error("فشل رفع الملف"); setUploading(false); },
  });
  const extractMutation = trpc.shipmentDocs.extract.useMutation({
    onSuccess: (data) => { setExtracted({ docId: lastExtractDocId ?? 0, fields: data.fields || [], summary: data.summary || "", docType: data.docType }); setExtractDialog(true); utils.documents.list.invalidate(); toast.success("تم استخراج البيانات بنجاح — راجع النتائج قبل الاعتماد"); },
    onError: (e) => { utils.documents.list.invalidate(); toast.error(e.message); },
  });
  const applyMutation = trpc.shipmentDocs.applyExtraction.useMutation({
    onSuccess: () => { utils.documents.list.invalidate(); utils.shipments.list.invalidate(); toast.success("تم الاعتماد وحفظ البيانات في سجل الشحنات"); setExtractDialog(false); setExtracted(null); },
    onError: () => toast.error("فشل حفظ البيانات المستخرجة"),
  });
  const utils = trpc.useUtils();

  // AI extraction review state
  const [extractDialog, setExtractDialog] = useState(false);
  const [lastExtractDocId, setLastExtractDocId] = useState<number | null>(null);
  const [extracted, setExtracted] = useState<{ docId: number; fields: { fieldName: string; value: string; confidence: number }[]; summary: string; docType: string } | null>(null);
  const [editFieldIdx, setEditFieldIdx] = useState<number | null>(null);
  const [editFieldValue, setEditFieldValue] = useState("");

  const handleExtract = (doc: any) => {
    setLastExtractDocId(doc.id);
    setExtracted(null);
    extractMutation.mutate({ id: doc.id });
  };
  const handleApply = () => {
    if (!extracted) return;
    const active = extracted.fields.filter(f => String(f.value || "").trim() !== "");
    applyMutation.mutate({ id: extracted.docId, fields: active });
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    shipmentId: null as number | null, docType: "commercial_invoice" as string,
    fileName: "", fileUrl: null as string | null, version: "1.0", status: "pending" as string,
    uploadDate: "", expiryDate: "", remarks: "",
  });
  const [uploadDialog, setUploadDialog] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadShipmentId, setUploadShipmentId] = useState<string>("");
  const [uploadDocType, setUploadDocType] = useState("commercial_invoice");
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    try {
      if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...form }); }
      else { await createMutation.mutateAsync(form); }
      setDialogOpen(false); setEditingId(null);
    } catch { toast.error("حدث خطأ"); }
  };
  const openEdit = (s: any) => {
    setEditingId(s.id);
    setForm({
      shipmentId: s.shipmentId, docType: s.docType || "commercial_invoice", fileName: s.fileName || "",
      fileUrl: s.fileUrl || null, version: s.version || "1.0", status: s.status || "pending",
      uploadDate: s.uploadDate ? new Date(s.uploadDate).toISOString().slice(0, 10) : "",
      expiryDate: s.expiryDate ? new Date(s.expiryDate).toISOString().slice(0, 10) : "",
      remarks: s.remarks || "",
    });
    setDialogOpen(true);
  };
  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المستند؟")) {
      await deleteMutation.mutateAsync({ id });
      toast.success("تم الحذف");
    }
  };

  const doUpload = async () => {
    if (!file || !uploadShipmentId) { toast.error("اختر الشحنة والملف أولًا"); return; }
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      upload.mutate({ fileName: file.name, mimeType: file.type || "application/octet-stream", base64, shipmentId: Number(uploadShipmentId), docType: uploadDocType });
    } catch { toast.error("تعذر قراءة الملف"); setUploading(false); }
  };

  const filtered = useMemo(() => (items || []).filter((s: any) =>
    (s.docType || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.fileName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.remarks || "").toLowerCase().includes(searchTerm.toLowerCase())
  ), [items, searchTerm]);

  const requiredDocs = ["commercial_invoice", "packing_list", "bill_of_lading", "certificate_of_origin"];
  const shipmentIds = Array.from(new Set(filtered.map((d: any) => d.shipmentId).filter(Boolean)));
  const missingByShipment = useMemo(() => {
    const result: Record<number, string[]> = {};
    for (const sid of shipmentIds) {
      const have = new Set(filtered.filter((d: any) => d.shipmentId === sid && d.status === "verified").map((d: any) => d.docType));
      const missing = requiredDocs.filter(r => !have.has(r));
      if (missing.length) result[sid] = missing;
    }
    return result;
  }, [shipmentIds, filtered]);

  const shipName = (id: number) => shipments?.find(s => s.id === id)?.shipmentNo || `#${id}`;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" /> مركز المستندات (Documents Center)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">رفع وتتبع مستندات الشحنات — الفواتير والبوالص وشهادات المنشأ وبيانات التخليص</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadDialog(true)}><Upload className="h-4 w-4 ml-1" /> رفع ملف فعلي</Button>
          <Button onClick={() => { setForm({ shipmentId: null, docType: "commercial_invoice", fileName: "", fileUrl: null, version: "1.0", status: "pending", uploadDate: "", expiryDate: "", remarks: "" }); setDialogOpen(true); }}><Plus className="h-4 w-4 ml-1" /> تسجيل مستند</Button>
        </div>
      </div>

      {/* Missing documents alerts */}
      {Object.keys(missingByShipment).length > 0 && (
        <Card className="border-amber-400/60 bg-amber-50/60">
          <CardContent className="p-3 space-y-1">
            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /><span className="text-sm font-semibold text-amber-700">مستندات أساسية مفقودة (غير معتمدة) لشحنات:</span></div>
            {Object.entries(missingByShipment).map(([sid, docs]) => (
              <p key={sid} className="text-xs text-amber-700 pr-6">
                <span className="font-mono font-semibold">{shipName(Number(sid))}</span>: {docs.map(d => docAr[d] || d).join("، ")}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">المستندات</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="ابحث باسم الملف أو نوع المستند..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">جاري التحميل...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">لا توجد مستندات مسجلة بعد.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الملف</TableHead>
                    <TableHead>نوع المستند</TableHead>
                    <TableHead>الشحنة</TableHead>
                    <TableHead>الإصدار</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الذكاء الاصطناعي</TableHead>
                    <TableHead>تاريخ الرفع</TableHead>
                    <TableHead>الانتهاء</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {iconFor(s.fileName || "")}
                          <span className="font-medium text-xs truncate max-w-48" title={s.fileName}>{s.fileName || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{docAr[s.docType] || s.docType}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{s.shipmentId ? shipName(s.shipmentId) : "—"}</TableCell>
                      <TableCell className="text-xs">{s.version || "—"}</TableCell>
                      <TableCell><Badge className={statusColor[s.status] || "bg-slate-400 text-white"}>{statusAr[s.status] || s.status}</Badge></TableCell>
                      <TableCell>
                        {extractMutation.isPending && lastExtractDocId === s.id ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-400"><Loader2 className="h-3 w-3 ml-1 animate-spin" />قراءة الملف...</Badge>
                        ) : s.extractionStatus === "done" && s.extractedData ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-400 cursor-pointer" onClick={() => { setLastExtractDocId(s.id); setExtracted(JSON.parse(s.extractedData)); setExtractDialog(true); }}><Sparkles className="h-3 w-3 ml-1" />بيانات مستخرجة</Badge>
                        ) : s.extractionStatus === "failed" ? (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/40">فشل الاستخراج</Badge>
                        ) : (s.fileUrl && (s.docType === "commercial_invoice" || s.docType === "bill_of_lading" || s.docType === "certificate_of_origin" || s.docType === "packing_list")) ? (
                          <Button variant="outline" size="sm" className="h-6 gap-1 text-xs" onClick={() => handleExtract(s)}><Sparkles className="h-3 w-3" />استخراج بالذكاء الاصطناعي</Button>
                        ) : s.extractionStatus === "running" ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-400"><Loader2 className="h-3 w-3 ml-1 animate-spin" />قراءة الملف...</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{fmtDate(s.uploadDate)}</TableCell>
                      <TableCell className="text-xs">{fmtDate(s.expiryDate)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {s.fileUrl && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                              <a href={s.fileUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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

      {/* Record document dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editingId ? "تعديل المستند" : "تسجيل مستند"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>نوع المستند</Label>
              <Select value={form.docType} onValueChange={v => setForm({ ...form, docType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(docAr).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>الشحنة</Label>
              <Select value={form.shipmentId !== null ? String(form.shipmentId) : undefined} onValueChange={v => setForm({ ...form, shipmentId: Number(v) })}>
                <SelectTrigger><SelectValue placeholder="اختر الشحنة (اختياري)" /></SelectTrigger>
                <SelectContent>
                  {(shipments || []).map(s => <SelectItem key={s.id} value={String(s.id)}>{s.shipmentNo} — {s.material || "—"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>اسم الملف</Label><Input value={form.fileName} onChange={e => setForm({ ...form, fileName: e.target.value })} placeholder="Commercial_Invoice.pdf" /></div>
            <div className="col-span-2"><Label>رابط الملف (اختياري)</Label><Input value={form.fileUrl || ""} onChange={e => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." /></div>
            <div><Label>الإصدار</Label><Input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} placeholder="1.0" /></div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusAr).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>تاريخ الرفع</Label><Input type="date" value={form.uploadDate} onChange={e => setForm({ ...form, uploadDate: e.target.value })} /></div>
            <div><Label>تاريخ الانتهاء</Label><Input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} /></div>
            <div className="col-span-2"><Label>ملاحظات</Label><Input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit}>{editingId ? "حفظ التعديلات" : "تسجيل"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Extraction review dialog */}
      <Dialog open={extractDialog} onOpenChange={o => { if (!o && !applyMutation.isPending) setExtractDialog(false); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-violet-500" /> مراجعة البيانات المستخرجة بالذكاء الاصطناعي</DialogTitle>
            <DialogDescription>{extracted?.summary || "راجِع الحقول المستخرجة من المستند وعدّل أي قيمة غير صحيحة قبل الاعتماد"}</DialogDescription>
          </DialogHeader>
          {extracted ? (
            <div className="space-y-3">
              <Badge className="bg-violet-100 text-violet-700 border-violet-300">نوع المستند: {docAr[extracted.docType] || extracted.docType}</Badge>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الحقل</TableHead>
                      <TableHead>القيمة المستخرجة</TableHead>
                      <TableHead>الثقة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extracted.fields.map((f, i) => (
                      <TableRow key={i} className={f.confidence < 70 ? "bg-amber-50/50" : ""}>
                        <TableCell className="text-xs font-medium whitespace-nowrap">{f.fieldName}</TableCell>
                        <TableCell>
                          {editFieldIdx === i ? (
                            <div className="flex gap-1">
                              <Input className="h-7 text-xs" value={editFieldValue} onChange={e => setEditFieldValue(e.target.value)} autoFocus onKeyDown={e => { if (e.key === "Enter") { extracted.fields[i].value = editFieldValue; setEditFieldIdx(null); } }} />
                              <Button size="sm" className="h-7 px-2 text-xs" onClick={() => { extracted.fields[i].value = editFieldValue; setEditFieldIdx(null); }}>✓</Button>
                            </div>
                          ) : (
                            <span className={f.value ? "font-mono text-xs" : "text-muted-foreground text-xs italic"}>{f.value || "لم يُعثر عليه"}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, f.confidence))}%`, background: f.confidence >= 80 ? "#10b981" : f.confidence >= 60 ? "#f59e0b" : "#ef4444" }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{Math.round(f.confidence)}%</span>
                            {f.value && editFieldIdx !== i && (
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditFieldIdx(i); setEditFieldValue(f.value); }}><Pencil className="h-3 w-3" /></Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground">الحقول ذات الثقة المنخفضة مظللة بالبرتقالي — يُنصح بمراجعتها يدويًا. سيتم تحديث الشحنة (بيانات الفاتورة/الشحن/الجمارك) بالسجلات المطابقة للحقول أعلاه.</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">جاري استخراج البيانات...</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtractDialog(false)}>إلغاء</Button>
            <Button onClick={handleApply} disabled={!extracted || applyMutation.isPending}>
              {applyMutation.isPending ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Sparkles className="h-4 w-4 ml-1" />}
              اعتماد وحفظ في سجل الشحنات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload real file dialog */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>رفع ملف فعلي</DialogTitle><DialogDescription>سيتم حفظ الملف في التخزين السحابي وربطه بالشحنة</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>الشحنة</Label>
              <Select value={uploadShipmentId} onValueChange={setUploadShipmentId}>
                <SelectTrigger><SelectValue placeholder="اختر الشحنة" /></SelectTrigger>
                <SelectContent>
                  {(shipments || []).map(s => <SelectItem key={s.id} value={String(s.id)}>{s.shipmentNo} — {s.material || "—"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>نوع المستند</Label>
              <Select value={uploadDocType} onValueChange={setUploadDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(docAr).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الملف (حد أقصى ~4 ميجابايت)</Label>
              <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.doc,.docx,.zip" />
            </div>
            {file && <p className="text-xs text-muted-foreground">{file.name} — {(file.size / 1024).toFixed(1)} كيلوبايت</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialog(false)}>إلغاء</Button>
            <Button onClick={doUpload} disabled={uploading || !file}>{uploading ? "جاري الرفع..." : "رفع"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
