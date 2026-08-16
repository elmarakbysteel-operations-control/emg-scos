import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Ship, Search, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/exportExcel";
import { exportToPdf } from "@/lib/exportPdf";

export default function FreightManagement() {
  const { data: items, isLoading } = trpc.freight.list.useQuery();
  const createMutation = trpc.freight.create.useMutation();
  const updateMutation = trpc.freight.update.useMutation();
  const deleteMutation = trpc.freight.delete.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    bookingRef: "", shipmentId: null as number | null, shippingLine: "",
    containerType: "40HC", originPort: "", destinationPort: "",
    etd: "", eta: "", freightCost: 0, blNumber: "",
    status: "booked" as any, remarks: ""
  });

  const handleSubmit = async () => {
    try {
      if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...form }); toast.success("Updated successfully"); }
      else { await createMutation.mutateAsync(form); toast.success("Booking created"); }
      utils.freight.list.invalidate(); setDialogOpen(false); setEditingId(null);
    } catch { toast.error("Error occurred"); }
  };

  const openEdit = (s: any) => { setEditingId(s.id); setForm({ ...s }); setDialogOpen(true); };
  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this booking?")) {
      await deleteMutation.mutateAsync({ id });
      utils.freight.list.invalidate();
      toast.success("Deleted");
    }
  };
  const handleExcelExport = () => {
    exportToExcel(filtered, [
      { header: "Booking Ref", key: "ref", getValue: (r: any) => r.bookingRef || "—" },
      { header: "Shipping Line", key: "line", getValue: (r: any) => r.shippingLine || "—" },
      { header: "Container", key: "container", getValue: (r: any) => r.containerType || "—" },
      { header: "Origin Port", key: "origin", getValue: (r: any) => r.originPort || "—" },
      { header: "Destination Port", key: "dest", getValue: (r: any) => r.destinationPort || "—" },
      { header: "ETD", key: "etd", getValue: (r: any) => (r.etd ? new Date(r.etd).toLocaleDateString("en-GB") : "—") },
      { header: "ETA", key: "eta", getValue: (r: any) => (r.eta ? new Date(r.eta).toLocaleDateString("en-GB") : "—") },
      { header: "Freight Cost (USD)", key: "cost", getValue: (r: any) => r.freightCost || 0 },
      { header: "BL Number", key: "bl", getValue: (r: any) => r.blNumber || "—" },
      { header: "Status", key: "status", getValue: (r: any) => r.status || "—" },
    ], `Freight_${new Date().toISOString().slice(0, 10)}.xlsx`, "Freight Bookings");
    toast.success("Exported to Excel");
  };
  const handlePdfExport = () => {
    exportToPdf(filtered, [
      { header: "Booking Ref", getValue: (r: any) => r.bookingRef || "—" },
      { header: "Shipping Line", getValue: (r: any) => r.shippingLine || "—" },
      { header: "Route", getValue: (r: any) => `${r.originPort || "—"} → ${r.destinationPort || "—"}` },
      { header: "ETA", getValue: (r: any) => (r.eta ? new Date(r.eta).toLocaleDateString("en-GB") : "—") },
      { header: "Freight Cost (USD)", getValue: (r: any) => r.freightCost || 0 },
      { header: "BL Number", getValue: (r: any) => r.blNumber || "—" },
      { header: "Status", getValue: (r: any) => r.status || "—" },
    ], "Freight Management Report", `Freight_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("Exported to PDF");
  };

  const statusColors: Record<string, string> = {
    booked: "bg-blue-100 text-blue-700",
    in_transit: "bg-amber-100 text-amber-700",
    arrived: "bg-emerald-100 text-emerald-700",
    delayed: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
  };

  const filtered = (items || []).filter((s: any) =>
    s.bookingRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.shippingLine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.originPort?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.destinationPort?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <Ship className="w-6 h-6 text-blue-700" />
            Freight Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Booking &amp; BL tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExcelExport}><FileSpreadsheet className="w-4 h-4 mr-1 text-emerald-600" /> Excel</Button>
          <Button variant="outline" size="sm" onClick={handlePdfExport}><Download className="w-4 h-4 mr-1 text-destructive" /> PDF</Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> New Booking</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "New"} Booking</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Booking Ref</Label><Input value={form.bookingRef} onChange={e => setForm({ ...form, bookingRef: e.target.value })} placeholder="BK-2026-001" /></div>
              <div><Label>Shipping Line</Label><Input value={form.shippingLine} onChange={e => setForm({ ...form, shippingLine: e.target.value })} placeholder="MSC / Maersk / COSCO" /></div>
              <div>
                <Label>Container Type</Label>
                <Select value={form.containerType} onValueChange={v => setForm({ ...form, containerType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20GP">20' GP</SelectItem>
                    <SelectItem value="40GP">40' GP</SelectItem>
                    <SelectItem value="40HC">40' HC</SelectItem>
                    <SelectItem value="45HC">45' HC</SelectItem>
                    <SelectItem value="LCL">LCL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Freight Cost (USD)</Label><Input type="number" value={form.freightCost || ""} onChange={e => setForm({ ...form, freightCost: +e.target.value })} /></div>
              <div><Label>Origin Port</Label><Input value={form.originPort} onChange={e => setForm({ ...form, originPort: e.target.value })} placeholder="Fos-sur-Mer" /></div>
              <div><Label>Destination Port</Label><Input value={form.destinationPort} onChange={e => setForm({ ...form, destinationPort: e.target.value })} placeholder="Alexandria" /></div>
              <div><Label>ETD</Label><Input type="date" value={form.etd} onChange={e => setForm({ ...form, etd: e.target.value })} /></div>
              <div><Label>ETA</Label><Input type="date" value={form.eta} onChange={e => setForm({ ...form, eta: e.target.value })} /></div>
              <div><Label>BL Number</Label><Input value={form.blNumber} onChange={e => setForm({ ...form, blNumber: e.target.value })} placeholder="MEDU2026001" /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="arrived">Arrived</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
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
            <Input placeholder="Search by ref, shipping line, or port..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Booking Ref</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Shipping Line</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Container</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Route</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">ETD / ETA</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Freight Cost</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">BL Number</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-medium text-blue-700">{s.bookingRef || "-"}</td>
                    <td className="py-3 px-3 text-slate-700">{s.shippingLine || "-"}</td>
                    <td className="py-3 px-3"><Badge variant="outline" className="text-xs">{s.containerType}</Badge></td>
                    <td className="py-3 px-3 text-slate-600">{s.originPort} → {s.destinationPort}</td>
                    <td className="py-3 px-3 text-slate-600 text-xs">
                      <div>{formatDate(s.etd)}</div>
                      <div className="text-slate-400">{formatDate(s.eta)}</div>
                    </td>
                    <td className="py-3 px-3 font-medium">${(s.freightCost || 0).toLocaleString()}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-xs">{s.blNumber || "-"}</td>
                    <td className="py-3 px-3"><Badge className={`${statusColors[s.status] || "bg-gray-100 text-gray-600"} border-0 text-xs`}>{s.status}</Badge></td>
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
              <p className="text-center text-slate-400 py-8">No freight bookings found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
