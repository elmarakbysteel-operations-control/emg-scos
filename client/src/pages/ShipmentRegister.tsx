import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/exportExcel";
import { exportToPdf } from "@/lib/exportPdf";

const statusColors: Record<string, string> = { draft: "bg-slate-100 text-slate-700", confirmed: "bg-blue-100 text-blue-700", in_transit: "bg-cyan-100 text-cyan-700", arrived: "bg-purple-100 text-purple-700", customs: "bg-amber-100 text-amber-700", cleared: "bg-emerald-100 text-emerald-700", delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700", delayed: "bg-orange-100 text-orange-700" };

const defaultForm = { shipmentNo: "", companyId: null as number | null, plantId: null as number | null, supplierName: "", poNumber: "", material: "", incoterm: "", originCountry: "", originPort: "", destinationCountry: "", destinationPort: "", transportMode: "sea" as "sea"|"air"|"land"|"rail", forwarderName: "", shippingLine: "", bookingRef: "", containerNo: "", containerType: "", blAwbNumber: "", etd: "", eta: "", ata: "", status: "draft" as "draft"|"confirmed"|"in_transit"|"arrived"|"customs"|"cleared"|"delivered"|"cancelled"|"delayed", owner: "", priority: "medium" as "low"|"medium"|"high"|"urgent", cargoValue: 0, currency: "USD", weight: 0, volume: 0, healthScore: 100, remarks: "" };

export default function ShipmentRegister() {
  const { data: shipments, isLoading } = trpc.shipments.list.useQuery();
  const { data: overview } = trpc.tools.freeTimeOverview.useQuery();
  const freeTimeByShipmentId = useMemo(() => {
    const m = new Map<number, any>();
    for (const o of overview || []) m.set(o.id, o.freeTime);
    return m;
  }, [overview]);
  const createMutation = trpc.shipments.create.useMutation();
  const updateMutation = trpc.shipments.update.useMutation();
  const deleteMutation = trpc.shipments.delete.useMutation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(defaultForm);

  const filtered = (shipments || []).filter(s => {
    const ms = !search || s.shipmentNo.toLowerCase().includes(search.toLowerCase()) || (s.supplierName||"").toLowerCase().includes(search.toLowerCase());
    const ms2 = statusFilter === "all" || s.status === statusFilter;
    return ms && ms2;
  });

  const handleSubmit = async () => {
    try {
      if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...formData }); toast.success("Updated"); }
      else { await createMutation.mutateAsync(formData); toast.success("Created"); }
      utils.shipments.list.invalidate(); setDialogOpen(false); setEditingId(null); setFormData(defaultForm);
    } catch { toast.error("Error"); }
  };
  const openEdit = (s: any) => { setEditingId(s.id); setFormData({...defaultForm, ...s}); setDialogOpen(true); };
  const handleExcelExport = () => {
    exportToExcel(shipments || [], [
      { header: "Shipment No", key: "shipmentNo", getValue: (r: any) => r.shipmentNo },
      { header: "Supplier", key: "supplier", getValue: (r: any) => r.supplierName || "—" },
      { header: "PO Number", key: "po", getValue: (r: any) => r.poNumber || "—" },
      { header: "Material", key: "material", getValue: (r: any) => r.material || "—" },
      { header: "Incoterm", key: "incoterm", getValue: (r: any) => r.incoterm || "—" },
      { header: "Origin Port", key: "originPort", getValue: (r: any) => r.originPort || "—" },
      { header: "Destination Port", key: "destPort", getValue: (r: any) => r.destinationPort || "—" },
      { header: "Transport", key: "transport", getValue: (r: any) => r.transportMode || "—" },
      { header: "Shipping Line", key: "line", getValue: (r: any) => r.shippingLine || "—" },
      { header: "Container No", key: "container", getValue: (r: any) => r.containerNo || "—" },
      { header: "Container Type", key: "ct", getValue: (r: any) => r.containerType || "—" },
      { header: "BL/AWB", key: "bl", getValue: (r: any) => r.blAwbNumber || "—" },
      { header: "ETD", key: "etd", getValue: (r: any) => (r.etd ? new Date(r.etd).toLocaleDateString("en-GB") : "—") },
      { header: "ETA", key: "eta", getValue: (r: any) => (r.eta ? new Date(r.eta).toLocaleDateString("en-GB") : "—") },
      { header: "ATA", key: "ata", getValue: (r: any) => (r.ata ? new Date(r.ata).toLocaleDateString("en-GB") : "—") },
      { header: "Free Time Expiry", key: "freeTimeExpiry", getValue: (r: any) => { const f = freeTimeByShipmentId.get(r.id); return f && f.expiry ? new Date(f.expiry).toLocaleDateString("en-GB") : "—"; } },
      { header: "Status", key: "status", getValue: (r: any) => r.status || "—" },
      { header: "Priority", key: "priority", getValue: (r: any) => r.priority || "—" },
      { header: "Cargo Value (USD)", key: "value", getValue: (r: any) => r.cargoValue || 0 },
      { header: "Weight (kg)", key: "weight", getValue: (r: any) => r.cargoWeight || "—" },
      { header: "Health Score", key: "health", getValue: (r: any) => r.healthScore ?? "—" },
    ], `Shipments_${new Date().toISOString().slice(0, 10)}.xlsx`, "Shipments");
    toast.success("Exported to Excel");
  };
  const handlePdfExport = () => {
    exportToPdf(shipments || [], [
      { header: "Shipment No", getValue: (r: any) => r.shipmentNo },
      { header: "Supplier", getValue: (r: any) => r.supplierName || "—" },
      { header: "Material", getValue: (r: any) => r.material || "—" },
      { header: "Origin Port", getValue: (r: any) => r.originPort || "—" },
      { header: "Dest. Port", getValue: (r: any) => r.destinationPort || "—" },
      { header: "ETA", getValue: (r: any) => (r.eta ? new Date(r.eta).toLocaleDateString("en-GB") : "—") },
      { header: "Status", getValue: (r: any) => r.status || "—" },
      { header: "Priority", getValue: (r: any) => r.priority || "—" },
      { header: "Value (USD)", getValue: (r: any) => r.cargoValue || 0 },
    ], "Shipment Register Report", `Shipments_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("Exported to PDF");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div><h1 className="text-2xl font-bold text-slate-900 font-serif">Shipment Register</h1><p className="text-sm text-slate-500 mt-1">{(shipments||[]).length} total shipments</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExcelExport}>
            <FileSpreadsheet className="w-4 h-4 mr-1 text-emerald-600" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handlePdfExport}>
            <Download className="w-4 h-4 mr-1 text-destructive" /> PDF
          </Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> New</Button></DialogTrigger><DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingId ? "Edit" : "New"} Shipment</DialogTitle></DialogHeader><div className="grid grid-cols-2 gap-3"><div><Label>Shipment No</Label><Input value={formData.shipmentNo} onChange={e => setFormData({...formData, shipmentNo: e.target.value})} /></div><div><Label>Supplier</Label><Input value={formData.supplierName} onChange={e => setFormData({...formData, supplierName: e.target.value})} /></div><div><Label>PO Number</Label><Input value={formData.poNumber} onChange={e => setFormData({...formData, poNumber: e.target.value})} /></div><div><Label>Material</Label><Input value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} /></div><div><Label>Incoterm</Label><Input value={formData.incoterm} onChange={e => setFormData({...formData, incoterm: e.target.value})} /></div><div><Label>Origin Port</Label><Input value={formData.originPort} onChange={e => setFormData({...formData, originPort: e.target.value})} /></div><div><Label>Destination Port</Label><Input value={formData.destinationPort} onChange={e => setFormData({...formData, destinationPort: e.target.value})} /></div><div><Label>Transport</Label><Select value={formData.transportMode} onValueChange={v => setFormData({...formData, transportMode: v as any})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sea">Sea</SelectItem><SelectItem value="air">Air</SelectItem><SelectItem value="land">Land</SelectItem><SelectItem value="rail">Rail</SelectItem></SelectContent></Select></div><div><Label>Shipping Line</Label><Input value={formData.shippingLine} onChange={e => setFormData({...formData, shippingLine: e.target.value})} /></div><div><Label>BL/AWB</Label><Input value={formData.blAwbNumber} onChange={e => setFormData({...formData, blAwbNumber: e.target.value})} /></div><div><Label>ETD</Label><Input type="date" value={formData.etd?.split('T')[0]||""} onChange={e => setFormData({...formData, etd: e.target.value})} /></div><div><Label>ETA</Label><Input type="date" value={formData.eta?.split('T')[0]||""} onChange={e => setFormData({...formData, eta: e.target.value})} /></div><div><Label>Status</Label><Select value={formData.status} onValueChange={v => setFormData({...formData, status: v as any})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="confirmed">Confirmed</SelectItem><SelectItem value="in_transit">In Transit</SelectItem><SelectItem value="arrived">Arrived</SelectItem><SelectItem value="customs">Customs</SelectItem><SelectItem value="cleared">Cleared</SelectItem><SelectItem value="delivered">Delivered</SelectItem><SelectItem value="delayed">Delayed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select></div><div><Label>Priority</Label><Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v as any})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div><div><Label>Cargo Value</Label><Input type="number" value={formData.cargoValue||""} onChange={e => setFormData({...formData, cargoValue: +e.target.value})} /></div><div><Label>Owner</Label><Input value={formData.owner} onChange={e => setFormData({...formData, owner: e.target.value})} /></div></div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>{editingId ? "Update" : "Create"}</Button></div></DialogContent></Dialog>
      </div>
      <Card className="border-0 shadow-sm"><CardContent className="p-4">
        <div className="flex gap-3 mb-4"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="in_transit">In Transit</SelectItem><SelectItem value="customs">Customs</SelectItem><SelectItem value="cleared">Cleared</SelectItem><SelectItem value="delayed">Delayed</SelectItem></SelectContent></Select></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200"><th className="text-left py-2 px-3 font-semibold text-slate-600">No.</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Supplier</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Material</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Route</th><th className="text-left py-2 px-3 font-semibold text-slate-600">ETA</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Free Time</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Status</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Priority</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Value</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Actions</th></tr></thead><tbody>{filtered.map(s => (<tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="py-2 px-3 font-medium">{s.shipmentNo}</td><td className="py-2 px-3 text-slate-600">{s.supplierName||"-"}</td><td className="py-2 px-3 text-slate-600">{s.material||"-"}</td><td className="py-2 px-3 text-slate-600 text-xs">{s.originPort||"-"} → {s.destinationPort||"-"}</td><td className="py-2 px-3 text-slate-600 text-xs">{s.eta?new Date(s.eta).toLocaleDateString():"-"}</td><td className="py-2 px-3 text-xs">{(() => { const f = freeTimeByShipmentId.get(s.id); if (!f || !f.expiry) return "—"; const d = new Date(f.expiry); return <span className={f.expired ? "text-red-600 font-medium" : f.daysLeft <= 3 ? "text-red-600" : f.daysLeft <= 7 ? "text-amber-600" : "text-emerald-600"}>{f.expired ? "انتهى" : `${f.daysLeft} يوم (${d.toLocaleDateString("en-GB")})`}</span>; })()}</td><td className="py-2 px-3"><Badge className={`${statusColors[s.status||"draft"]} border-0 text-xs`}>{s.status}</Badge></td><td className="py-2 px-3"><Badge className={`${s.priority==="urgent"?"bg-red-100 text-red-700":s.priority==="high"?"bg-amber-100 text-amber-700":"bg-slate-100 text-slate-700"} border-0 text-xs`}>{s.priority}</Badge></td><td className="py-2 px-3 text-slate-600 text-xs">${(s.cargoValue||0).toLocaleString()}</td><td className="py-2 px-3"><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="w-3.5 h-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => { if(confirm("Delete?")){deleteMutation.mutateAsync({id:s.id});utils.shipments.list.invalidate();}}}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button></div></td></tr>))}</tbody></table>
        {(filtered.length===0&&!isLoading)&&<p className="text-center text-slate-400 py-8">No shipments</p>}
        </div>
      </CardContent></Card>
    </div>
  );
}
