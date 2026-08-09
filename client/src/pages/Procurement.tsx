import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Procurement() {
  const { data: items, isLoading } = trpc.procurement.list.useQuery();
  const createMutation = trpc.procurement.create.useMutation();
  const updateMutation = trpc.procurement.update.useMutation();
  const deleteMutation = trpc.procurement.delete.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ prNumber: "", poNumber: "", supplierId: null as number | null, shipmentId: null as number | null, supplierName: "", material: "", quantity: 0, unit: "", unitPrice: 0, totalValue: 0, currency: "USD", status: "rfq_sent" as any, approvalStatus: "pending" as any });

  const handleSubmit = async () => {
    try { if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...form }); toast.success("Updated"); } else { await createMutation.mutateAsync(form); toast.success("Created"); } utils.procurement.list.invalidate(); setDialogOpen(false); setEditingId(null); } catch { toast.error("Error"); }
  };
  const openEdit = (s: any) => { setEditingId(s.id); setForm({...s}); setDialogOpen(true); };
  const sc: Record<string, string> = { rfq_sent: "bg-blue-100 text-blue-700", quotation_received: "bg-purple-100 text-purple-700", under_review: "bg-amber-100 text-amber-700", approved: "bg-emerald-100 text-emerald-700", po_issued: "bg-cyan-100 text-cyan-700", shipped: "bg-indigo-100 text-indigo-700", received: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900 font-serif">Procurement</h1><p className="text-sm text-slate-500 mt-1">Purchase orders and RFQ tracking</p></div><Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> New</Button></DialogTrigger><DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingId?"Edit":"New"} PO</DialogTitle></DialogHeader><div className="grid grid-cols-2 gap-3"><div><Label>PR Number</Label><Input value={form.prNumber} onChange={e => setForm({...form, prNumber: e.target.value})} /></div><div><Label>PO Number</Label><Input value={form.poNumber} onChange={e => setForm({...form, poNumber: e.target.value})} /></div><div><Label>Supplier</Label><Input value={form.supplierName} onChange={e => setForm({...form, supplierName: e.target.value})} /></div><div><Label>Material</Label><Input value={form.material} onChange={e => setForm({...form, material: e.target.value})} /></div><div><Label>Quantity</Label><Input type="number" value={form.quantity||""} onChange={e => setForm({...form, quantity: +e.target.value})} /></div><div><Label>Unit Price</Label><Input type="number" value={form.unitPrice||""} onChange={e => setForm({...form, unitPrice: +e.target.value})} /></div><div><Label>Total Value</Label><Input type="number" value={form.totalValue||""} onChange={e => setForm({...form, totalValue: +e.target.value})} /></div><div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm({...form, status: v as any})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rfq_sent">RFQ Sent</SelectItem><SelectItem value="quotation_received">Quotation Received</SelectItem><SelectItem value="under_review">Under Review</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="po_issued">PO Issued</SelectItem><SelectItem value="shipped">Shipped</SelectItem><SelectItem value="received">Received</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select></div></div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>{editingId?"Update":"Create"}</Button></div></DialogContent></Dialog></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200"><th className="text-left py-2 px-3 font-semibold text-slate-600">PR No.</th><th className="text-left py-2 px-3 font-semibold text-slate-600">PO No.</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Supplier</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Material</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Qty</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Value</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Status</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Approval</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Actions</th></tr></thead><tbody>{(items||[]).map(s => (<tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="py-2 px-3 font-medium">{s.prNumber||"-"}</td><td className="py-2 px-3">{s.poNumber||"-"}</td><td className="py-2 px-3 text-slate-600">{s.supplierName||"-"}</td><td className="py-2 px-3 text-slate-600">{s.material||"-"}</td><td className="py-2 px-3 text-slate-600">{s.quantity||"-"} {s.unit||""}</td><td className="py-2 px-3 text-slate-600">${(s.totalValue||0).toLocaleString()}</td><td className="py-2 px-3"><Badge className={`${sc[s.status||"rfq_sent"]} border-0 text-xs`}>{s.status}</Badge></td><td className="py-2 px-3"><Badge className={`${s.approvalStatus==="approved"?"bg-emerald-100 text-emerald-700":s.approvalStatus==="rejected"?"bg-red-100 text-red-700":"bg-amber-100 text-amber-700"} border-0 text-xs`}>{s.approvalStatus}</Badge></td><td className="py-2 px-3"><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="w-3.5 h-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => { if(confirm("Delete?")){deleteMutation.mutateAsync({id:s.id});utils.procurement.list.invalidate();}}}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button></div></td></tr>))}</tbody></table>{(items||[]).length===0&&!isLoading&&<p className="text-center text-slate-400 py-8">No procurement records</p>}</div></CardContent></Card>
    </div>
  );
}
