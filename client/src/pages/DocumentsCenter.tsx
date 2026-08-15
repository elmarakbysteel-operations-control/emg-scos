import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, FileText, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";

export default function DocumentsCenter() {
  const { data: items, isLoading } = trpc.documents.list.useQuery();
  const createMutation = trpc.documents.create.useMutation();
  const updateMutation = trpc.documents.update.useMutation();
  const deleteMutation = trpc.documents.delete.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    shipmentId: null as number | null, docType: "commercial_invoice" as any,
    fileName: "", version: "1.0", status: "pending" as any,
    uploadDate: "", expiryDate: "", remarks: ""
  });

  const handleSubmit = async () => {
    try {
      if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...form }); toast.success("Updated successfully"); }
      else { await createMutation.mutateAsync(form); toast.success("Document uploaded"); }
      utils.documents.list.invalidate(); setDialogOpen(false); setEditingId(null);
    } catch { toast.error("Error occurred"); }
  };

  const openEdit = (s: any) => { setEditingId(s.id); setForm({ ...s }); setDialogOpen(true); };
  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      await deleteMutation.mutateAsync({ id });
      utils.documents.list.invalidate();
      toast.success("Deleted");
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    uploaded: "bg-blue-100 text-blue-700",
    verified: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    expired: "bg-gray-100 text-gray-600",
  };

  const docTypeLabels: Record<string, string> = {
    commercial_invoice: "Commercial Invoice",
    packing_list: "Packing List",
    bill_of_lading: "Bill of Lading",
    certificate_of_origin: "Certificate of Origin",
    import_license: "Import License",
    inspection_cert: "Inspection Certificate",
    insurance_cert: "Insurance Certificate",
    customs_declaration: "Customs Declaration",
    other: "Other",
  };

  const filtered = (items || []).filter((s: any) =>
    s.docType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (d: any) => {
    if (!d) return "-";
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Check for missing documents per shipment (alert)
  const requiredDocs = ["commercial_invoice", "packing_list", "bill_of_lading", "certificate_of_origin"];
  const shipmentIds = Array.from(new Set(filtered.map((d: any) => d.shipmentId).filter(Boolean)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-700" />
            Documents Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">Upload &amp; track shipment documents</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> Upload Document</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "Upload"} Document</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Document Type</Label>
                <Select value={form.docType} onValueChange={v => setForm({ ...form, docType: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial_invoice">Commercial Invoice</SelectItem>
                    <SelectItem value="packing_list">Packing List</SelectItem>
                    <SelectItem value="bill_of_lading">Bill of Lading</SelectItem>
                    <SelectItem value="certificate_of_origin">Certificate of Origin</SelectItem>
                    <SelectItem value="import_license">Import License</SelectItem>
                    <SelectItem value="inspection_cert">Inspection Certificate</SelectItem>
                    <SelectItem value="insurance_cert">Insurance Certificate</SelectItem>
                    <SelectItem value="customs_declaration">Customs Declaration</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>File Name</Label><Input value={form.fileName} onChange={e => setForm({ ...form, fileName: e.target.value })} placeholder="Commercial_Invoice_SH-2026-001.pdf" /></div>
              <div><Label>Version</Label><Input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} placeholder="1.0" /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="uploaded">Uploaded</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Upload Date</Label><Input type="date" value={form.uploadDate} onChange={e => setForm({ ...form, uploadDate: e.target.value })} /></div>
              <div><Label>Expiry Date</Label><Input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} /></div>
              <div className="col-span-2"><Label>Remarks</Label><Input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="bg-blue-700" onClick={handleSubmit}>{editingId ? "Update" : "Upload"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Missing documents alert */}
      {filtered.length > 0 && (
        <Card className="border-0 shadow-sm bg-amber-50/50">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-700">Review document status for each shipment. Pending/rejected documents require immediate action.</span>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-slate-400" />
            <Input placeholder="Search documents..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Document Type</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">File Name</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Shipment</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Version</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Upload Date</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Expiry</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="text-slate-700 font-medium">{docTypeLabels[s.docType] || s.docType}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-xs">{s.fileName || "-"}</td>
                    <td className="py-3 px-3 text-blue-700">{s.shipmentId ? `SH-${s.shipmentId}` : "-"}</td>
                    <td className="py-3 px-3 text-slate-600">{s.version || "-"}</td>
                    <td className="py-3 px-3"><Badge className={`${statusColors[s.status] || "bg-gray-100 text-gray-600"} border-0 text-xs`}>{s.status}</Badge></td>
                    <td className="py-3 px-3 text-slate-600">{formatDate(s.uploadDate)}</td>
                    <td className="py-3 px-3 text-slate-600">{formatDate(s.expiryDate)}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !isLoading && (
              <p className="text-center text-slate-400 py-8">No documents found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
