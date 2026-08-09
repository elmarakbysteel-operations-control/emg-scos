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

export default function CustomsManagement() {
  const { data: items, isLoading } = trpc.customs.list.useQuery();
  const createMutation = trpc.customs.create.useMutation();
  const updateMutation = trpc.customs.update.useMutation();
  const deleteMutation = trpc.customs.delete.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const handleSubmit = async () => {
    try { if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...form }); toast.success("Updated"); } else { await createMutation.mutateAsync(form); toast.success("Created"); } utils.customs.list.invalidate(); setDialogOpen(false); setEditingId(null); } catch { toast.error("Error"); }
  };
  const openEdit = (s: any) => { setEditingId(s.id); setForm({...s}); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900 font-serif">Customs Management</h1><p className="text-sm text-slate-500 mt-1">Manage Customs Management records</p></div><Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> New</Button></DialogTrigger><DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingId?"Edit":"New"} Customs Management</DialogTitle></DialogHeader><div className="grid grid-cols-2 gap-3">
<div><Label>acidNumber</Label><Input value={form.acidNumber||""} onChange={e => setForm({...form, acidNumber: e.target.value})} /></div>
<div><Label>ucrNumber</Label><Input value={form.ucrNumber||""} onChange={e => setForm({...form, ucrNumber: e.target.value})} /></div>
<div><Label>declarationNumber</Label><Input value={form.declarationNumber||""} onChange={e => setForm({...form, declarationNumber: e.target.value})} /></div>
<div><Label>broker</Label><Input value={form.broker||""} onChange={e => setForm({...form, broker: e.target.value})} /></div>
<div><Label>arrivalDate</Label><Input value={form.arrivalDate||""} onChange={e => setForm({...form, arrivalDate: e.target.value})} /></div>
<div><Label>releaseDate</Label><Input value={form.releaseDate||""} onChange={e => setForm({...form, releaseDate: e.target.value})} /></div>
<div><Label>clearanceTime</Label><Input value={form.clearanceTime||""} onChange={e => setForm({...form, clearanceTime: e.target.value})} /></div>
<div><Label>status</Label><Input value={form.status||""} onChange={e => setForm({...form, status: e.target.value})} /></div>
<div><Label>remarks</Label><Input value={form.remarks||""} onChange={e => setForm({...form, remarks: e.target.value})} /></div>
</div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>{editingId?"Update":"Create"}</Button></div></DialogContent></Dialog></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-4">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200"><th className="text-left py-2 px-3 font-semibold text-slate-600">acidNumber</th><th className="text-left py-2 px-3 font-semibold text-slate-600">ucrNumber</th><th className="text-left py-2 px-3 font-semibold text-slate-600">declarationNumber</th><th className="text-left py-2 px-3 font-semibold text-slate-600">broker</th><th className="text-left py-2 px-3 font-semibold text-slate-600">arrivalDate</th><th className="text-left py-2 px-3 font-semibold text-slate-600">releaseDate</th><th className="text-left py-2 px-3 font-semibold text-slate-600">clearanceTime</th><th className="text-left py-2 px-3 font-semibold text-slate-600">status</th><th className="text-left py-2 px-3 font-semibold text-slate-600">remarks</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Actions</th></tr></thead><tbody>{(items||[]).map(s => (<tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="py-2 px-3 text-slate-600">{s.acidNumber||"-"}</td><td className="py-2 px-3 text-slate-600">{s.ucrNumber||"-"}</td><td className="py-2 px-3 text-slate-600">{s.declarationNumber||"-"}</td><td className="py-2 px-3 text-slate-600">{s.broker||"-"}</td><td className="py-2 px-3 text-slate-600">{s.arrivalDate?(new Date(s.arrivalDate)).toLocaleDateString():"-"}</td><td className="py-2 px-3 text-slate-600">{s.releaseDate?(new Date(s.releaseDate)).toLocaleDateString():"-"}</td><td className="py-2 px-3 text-slate-600">{s.clearanceTime||"-"}</td><td className="py-2 px-3 text-slate-600">{s.status||"-"}</td><td className="py-2 px-3 text-slate-600">{s.remarks||"-"}</td><td className="py-2 px-3"><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="w-3.5 h-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => { if(confirm("Delete?")){deleteMutation.mutateAsync({id:s.id});utils.customs.list.invalidate();}}}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button></div></td></tr>))}</tbody></table>{(items||[]).length===0&&!isLoading&&<p className="text-center text-slate-400 py-8">No records</p>}</div>
      </CardContent></Card>
    </div>
  );
}