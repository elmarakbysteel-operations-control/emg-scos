import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, FileCheck, Search, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/exportExcel";
import { exportToPdf } from "@/lib/exportPdf";

export default function CustomsManagement() {
  const { data: items, isLoading } = trpc.customs.list.useQuery();
  const createMutation = trpc.customs.create.useMutation();
  const updateMutation = trpc.customs.update.useMutation();
  const deleteMutation = trpc.customs.delete.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    shipmentId: null as number | null, acidNumber: "", ucrNumber: "",
    declarationNumber: "", broker: "", arrivalDate: "", releaseDate: "",
    clearanceTime: 0, status: "pending_acid" as any, remarks: ""
  });

  const handleSubmit = async () => {
    try {
      if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...form }); toast.success("Updated successfully"); }
      else { await createMutation.mutateAsync(form); toast.success("Customs record created"); }
      utils.customs.list.invalidate(); setDialogOpen(false); setEditingId(null);
    } catch { toast.error("Error occurred"); }
  };

  const openEdit = (s: any) => { setEditingId(s.id); setForm({ ...s }); setDialogOpen(true); };
  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this record?")) {
      await deleteMutation.mutateAsync({ id });
      utils.customs.list.invalidate();
      toast.success("Deleted");
    }
  };
  const handleExcelExport = () => {
    exportToExcel(filtered, [
      { header: "ACID Number", key: "acid", getValue: (r: any) => r.acidNumber || "—" },
      { header: "UCR Number", key: "ucr", getValue: (r: any) => r.ucrNumber || "—" },
      { header: "Declaration No", key: "decl", getValue: (r: any) => r.declarationNumber || "—" },
      { header: "Broker", key: "broker", getValue: (r: any) => r.broker || "—" },
      { header: "Arrival Date", key: "arrival", getValue: (r: any) => (r.arrivalDate ? new Date(r.arrivalDate).toLocaleDateString("en-GB") : "—") },
      { header: "Release Date", key: "release", getValue: (r: any) => (r.releaseDate ? new Date(r.releaseDate).toLocaleDateString("en-GB") : "—") },
      { header: "Clearance Time (hrs)", key: "clearance", getValue: (r: any) => r.clearanceTime || "—" },
      { header: "Status", key: "status", getValue: (r: any) => statusLabels[r.status] || r.status || "—" },
    ], `Customs_${new Date().toISOString().slice(0, 10)}.xlsx`, "Customs Clearance");
    toast.success("Exported to Excel");
  };
  const handlePdfExport = () => {
    exportToPdf(filtered, [
      { header: "ACID Number", getValue: (r: any) => r.acidNumber || "—" },
      { header: "UCR Number", getValue: (r: any) => r.ucrNumber || "—" },
      { header: "Broker", getValue: (r: any) => r.broker || "—" },
      { header: "Arrival", getValue: (r: any) => formatDate(r.arrivalDate) },
      { header: "Release", getValue: (r: any) => formatDate(r.releaseDate) },
      { header: "Clearance (hrs)", getValue: (r: any) => r.clearanceTime ? `${r.clearanceTime} hrs` : "—" },
      { header: "Status", getValue: (r: any) => statusLabels[r.status] || r.status || "—" },
    ], "Customs Management Report", `Customs_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("Exported to PDF");
  };

  const statusColors: Record<string, string> = {
    pending_acid: "bg-red-100 text-red-700",
    acid_issued: "bg-amber-100 text-amber-700",
    arrived: "bg-blue-100 text-blue-700",
    under_inspection: "bg-purple-100 text-purple-700",
    duties_paid: "bg-cyan-100 text-cyan-700",
    cleared: "bg-emerald-100 text-emerald-700",
    rejected: "bg-gray-100 text-gray-600",
  };

  const statusLabels: Record<string, string> = {
    pending_acid: "Pending ACID",
    acid_issued: "ACID Issued",
    arrived: "Arrived",
    under_inspection: "Under Inspection",
    duties_paid: "Duties Paid",
    cleared: "Cleared",
    rejected: "Rejected",
  };

  const filtered = (items || []).filter((s: any) =>
    s.acidNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.ucrNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.broker?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (d: any) => {
    if (!d) return "-";
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-blue-700" />
            Customs Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">NAFEZA clearance &amp; ACID tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExcelExport}><FileSpreadsheet className="w-4 h-4 mr-1 text-emerald-600" /> Excel</Button>
          <Button variant="outline" size="sm" onClick={handlePdfExport}><Download className="w-4 h-4 mr-1 text-destructive" /> PDF</Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> New Record</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "New"} Customs Record</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>ACID Number</Label><Input value={form.acidNumber} onChange={e => setForm({ ...form, acidNumber: e.target.value })} placeholder="ACID-2026-001" /></div>
              <div><Label>UCR Number</Label><Input value={form.ucrNumber} onChange={e => setForm({ ...form, ucrNumber: e.target.value })} placeholder="UCR-MSC-7845621" /></div>
              <div><Label>Declaration No.</Label><Input value={form.declarationNumber} onChange={e => setForm({ ...form, declarationNumber: e.target.value })} /></div>
              <div><Label>Customs Broker</Label><Input value={form.broker} onChange={e => setForm({ ...form, broker: e.target.value })} placeholder="Al-Shams Customs Broker" /></div>
              <div><Label>Arrival Date</Label><Input type="date" value={form.arrivalDate} onChange={e => setForm({ ...form, arrivalDate: e.target.value })} /></div>
              <div><Label>Release Date</Label><Input type="date" value={form.releaseDate} onChange={e => setForm({ ...form, releaseDate: e.target.value })} /></div>
              <div><Label>Clearance Time (hours)</Label><Input type="number" value={form.clearanceTime || ""} onChange={e => setForm({ ...form, clearanceTime: +e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_acid">Pending ACID</SelectItem>
                    <SelectItem value="acid_issued">ACID Issued</SelectItem>
                    <SelectItem value="arrived">Arrived</SelectItem>
                    <SelectItem value="under_inspection">Under Inspection</SelectItem>
                    <SelectItem value="duties_paid">Duties Paid</SelectItem>
                    <SelectItem value="cleared">Cleared</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Remarks</Label><Input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="bg-blue-700" onClick={handleSubmit}>{editingId ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-slate-400" />
            <Input placeholder="Search by ACID, UCR, or broker..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">ACID</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">UCR</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Declaration</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Broker</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Arrival</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Release</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Clearance</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-medium text-blue-700">{s.acidNumber || "-"}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-xs">{s.ucrNumber || "-"}</td>
                    <td className="py-3 px-3 text-slate-700">{s.declarationNumber || "-"}</td>
                    <td className="py-3 px-3 text-slate-600">{s.broker || "-"}</td>
                    <td className="py-3 px-3 text-slate-600">{formatDate(s.arrivalDate)}</td>
                    <td className="py-3 px-3 text-slate-600">{formatDate(s.releaseDate)}</td>
                    <td className="py-3 px-3 text-slate-600">{s.clearanceTime ? `${s.clearanceTime} hrs` : "-"}</td>
                    <td className="py-3 px-3"><Badge className={`${statusColors[s.status] || "bg-gray-100 text-gray-600"} border-0 text-xs`}>{statusLabels[s.status] || s.status}</Badge></td>
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
              <p className="text-center text-slate-400 py-8">No customs records found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
