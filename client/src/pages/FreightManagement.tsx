import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function FreightManagement() {
  const { data: items, isLoading } = trpc.freight.list.useQuery();
  const createMutation = trpc.freight.create.useMutation();
  const updateMutation = trpc.freight.update.useMutation();
  const deleteMutation = trpc.freight.delete.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const handleSubmit = async () => {
    try { if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...form }); toast.success("Updated"); } else { await createMutation.mutateAsync(form); toast.success("Created"); } utils.freight.list.invalidate(); setDialogOpen(false); setEditingId(null); } catch { toast.error("Error"); }
  };
  const openEdit = (s: any) => { setEditingId(s.id); setForm({...s}); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900 font-serif">Freight Management</h1><p className="text-sm text-slate-500 mt-1">Manage Freight Management records</p></div><Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> New</Button></DialogTrigger><DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingId?"Edit":"New"} Freight Management</DialogTitle></DialogHeader><div className="grid grid-cols-2 gap-3">
<div><Label>bookingRef</Label><Input value={form.bookingRef||""} onChange={e => setForm({...form, bookingRef: e.target.value})} /></div>
<div><Label>shippingLine</Label><Input value={form.shippingLine||""} onChange={e => setForm({...form, shippingLine: e.target.value})} /></div>
<div><Label>containerType</Label><Input value={form.containerType||""} onChange={e => setForm({...form, containerType: e.target.value})} /></div>
<div><Label>originPort</Label><Input value={form.originPort||""} onChange={e => setForm({...form, originPort: e.target.value})} /></div>
<div><Label>destinationPort</Label><Input value={form.destinationPort||""} onChange={e => setForm({...form, destinationPort: e.target.value})} /></div>
<div><Label>freightCost</Label><Input value={form.freightCost||""} onChange={e => setForm({...form, freightCost: e.target.value})} /></div>
<div><Label>blNumber</Label><Input value={form.blNumber||""} onChange={e => setForm({...form, blNumber: e.target.value})} /></div>
<div><Label>status</Label><Input value={form.status||""} onChange={e => setForm({...form, status: e.target.value})} /></div>
<div><Label>remarks</Label><Input value={form.remarks||""} onChange={e => setForm({...form, remarks: e.target.value})} /></div>
</div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>{editingId?"Update":"Create"}</Button></div></DialogContent></Dialog></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-4">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200"><th className="text-left py-2 px-3 font-semibold text-slate-600">bookingRef</th><th className="text-left py-2 px-3 font-semibold text-slate-600">shippingLine</th><th className="text-left py-2 px-3 font-semibold text-slate-600">containerType</th><th className="text-left py-2 px-3 font-semibold text-slate-600">originPort</th><th className="text-left py-2 px-3 font-semibold text-slate-600">destinationPort</th><th className="text-left py-2 px-3 font-semibold text-slate-600">freightCost</th><th className="text-left py-2 px-3 font-semibold text-slate-600">blNumber</th><th className="text-left py-2 px-3 font-semibold text-slate-600">status</th><th className="text-left py-2 px-3 font-semibold text-slate-600">remarks</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Actions</th></tr></thead><tbody>{(items||[]).map(s => (<tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="py-2 px-3 text-slate-600">{s.bookingRef||"-"}</td><td className="py-2 px-3 text-slate-600">{s.shippingLine||"-"}</td><td className="py-2 px-3 text-slate-600">{s.containerType||"-"}</td><td className="py-2 px-3 text-slate-600">{s.originPort||"-"}</td><td className="py-2 px-3 text-slate-600">{s.destinationPort||"-"}</td><td className="py-2 px-3 text-slate-600">{s.freightCost||"-"}</td><td className="py-2 px-3 text-slate-600">{s.blNumber||"-"}</td><td className="py-2 px-3 text-slate-600">{s.status||"-"}</td><td className="py-2 px-3 text-slate-600">{s.remarks||"-"}</td><td className="py-2 px-3"><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="w-3.5 h-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => { if(confirm("Delete?")){deleteMutation.mutateAsync({id:s.id});utils.freight.list.invalidate();}}}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button></div></td></tr>))}</tbody></table>{(items||[]).length===0&&!isLoading&&<p className="text-center text-slate-400 py-8">No records</p>}</div>
      </CardContent></Card>
    </div>
  );
}