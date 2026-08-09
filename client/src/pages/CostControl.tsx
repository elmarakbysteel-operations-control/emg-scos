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

export default function CostControl() {
  const { data: items, isLoading } = trpc.costs.list.useQuery();
  const createMutation = trpc.costs.create.useMutation();
  const updateMutation = trpc.costs.update.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const handleSubmit = async () => {
    try { if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...form }); toast.success("Updated"); } else { await createMutation.mutateAsync(form); toast.success("Created"); } utils.costs.list.invalidate(); setDialogOpen(false); setEditingId(null); } catch { toast.error("Error"); }
  };
  const openEdit = (s: any) => { setEditingId(s.id); setForm({...s}); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900 font-serif">Cost Control</h1><p className="text-sm text-slate-500 mt-1">Manage Cost Control records</p></div><Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> New</Button></DialogTrigger><DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingId?"Edit":"New"} Cost Control</DialogTitle></DialogHeader><div className="grid grid-cols-2 gap-3">
<div><Label>freightCost</Label><Input value={form.freightCost||""} onChange={e => setForm({...form, freightCost: e.target.value})} /></div>
<div><Label>insuranceCost</Label><Input value={form.insuranceCost||""} onChange={e => setForm({...form, insuranceCost: e.target.value})} /></div>
<div><Label>customsCost</Label><Input value={form.customsCost||""} onChange={e => setForm({...form, customsCost: e.target.value})} /></div>
<div><Label>transportationCost</Label><Input value={form.transportationCost||""} onChange={e => setForm({...form, transportationCost: e.target.value})} /></div>
<div><Label>storageCost</Label><Input value={form.storageCost||""} onChange={e => setForm({...form, storageCost: e.target.value})} /></div>
<div><Label>demurrageCost</Label><Input value={form.demurrageCost||""} onChange={e => setForm({...form, demurrageCost: e.target.value})} /></div>
<div><Label>detentionCost</Label><Input value={form.detentionCost||""} onChange={e => setForm({...form, detentionCost: e.target.value})} /></div>
<div><Label>handlingCost</Label><Input value={form.handlingCost||""} onChange={e => setForm({...form, handlingCost: e.target.value})} /></div>
<div><Label>otherCharges</Label><Input value={form.otherCharges||""} onChange={e => setForm({...form, otherCharges: e.target.value})} /></div>
<div><Label>budget</Label><Input value={form.budget||""} onChange={e => setForm({...form, budget: e.target.value})} /></div>
<div><Label>currency</Label><Input value={form.currency||""} onChange={e => setForm({...form, currency: e.target.value})} /></div>
</div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>{editingId?"Update":"Create"}</Button></div></DialogContent></Dialog></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-4">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200"><th className="text-left py-2 px-3 font-semibold text-slate-600">freightCost</th><th className="text-left py-2 px-3 font-semibold text-slate-600">insuranceCost</th><th className="text-left py-2 px-3 font-semibold text-slate-600">customsCost</th><th className="text-left py-2 px-3 font-semibold text-slate-600">transportationCost</th><th className="text-left py-2 px-3 font-semibold text-slate-600">storageCost</th><th className="text-left py-2 px-3 font-semibold text-slate-600">demurrageCost</th><th className="text-left py-2 px-3 font-semibold text-slate-600">detentionCost</th><th className="text-left py-2 px-3 font-semibold text-slate-600">handlingCost</th><th className="text-left py-2 px-3 font-semibold text-slate-600">otherCharges</th><th className="text-left py-2 px-3 font-semibold text-slate-600">budget</th><th className="text-left py-2 px-3 font-semibold text-slate-600">currency</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Actions</th></tr></thead><tbody>{(items||[]).map(s => (<tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="py-2 px-3 text-slate-600">{s.freightCost||"-"}</td><td className="py-2 px-3 text-slate-600">{s.insuranceCost||"-"}</td><td className="py-2 px-3 text-slate-600">{s.customsCost||"-"}</td><td className="py-2 px-3 text-slate-600">{s.transportationCost||"-"}</td><td className="py-2 px-3 text-slate-600">{s.storageCost||"-"}</td><td className="py-2 px-3 text-slate-600">{s.demurrageCost||"-"}</td><td className="py-2 px-3 text-slate-600">{s.detentionCost||"-"}</td><td className="py-2 px-3 text-slate-600">{s.handlingCost||"-"}</td><td className="py-2 px-3 text-slate-600">{s.otherCharges||"-"}</td><td className="py-2 px-3 text-slate-600">{s.budget||"-"}</td><td className="py-2 px-3 text-slate-600">{s.currency||"-"}</td><td className="py-2 px-3"><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="w-3.5 h-3.5" /></Button></div></td></tr>))}</tbody></table>{(items||[]).length===0&&!isLoading&&<p className="text-center text-slate-400 py-8">No records</p>}</div>
      </CardContent></Card>
    </div>
  );
}