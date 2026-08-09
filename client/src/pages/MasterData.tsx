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

export default function MasterData() {
  const { data: items, isLoading } = trpc.companies.list.useQuery();
  const createMutation = trpc.companies.create.useMutation();
  const updateMutation = trpc.companies.update.useMutation();
  const deleteMutation = trpc.companies.delete.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const handleSubmit = async () => {
    try { if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...form }); toast.success("Updated"); } else { await createMutation.mutateAsync(form); toast.success("Created"); } utils.companies.list.invalidate(); setDialogOpen(false); setEditingId(null); } catch { toast.error("Error"); }
  };
  const openEdit = (s: any) => { setEditingId(s.id); setForm({...s}); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900 font-serif">Master Data</h1><p className="text-sm text-slate-500 mt-1">Manage Master Data records</p></div><Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> New</Button></DialogTrigger><DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingId?"Edit":"New"} Master Data</DialogTitle></DialogHeader><div className="grid grid-cols-2 gap-3">
<div><Label>name</Label><Input value={form.name||""} onChange={e => setForm({...form, name: e.target.value})} /></div>
<div><Label>code</Label><Input value={form.code||""} onChange={e => setForm({...form, code: e.target.value})} /></div>
<div><Label>address</Label><Input value={form.address||""} onChange={e => setForm({...form, address: e.target.value})} /></div>
<div><Label>phone</Label><Input value={form.phone||""} onChange={e => setForm({...form, phone: e.target.value})} /></div>
<div><Label>email</Label><Input value={form.email||""} onChange={e => setForm({...form, email: e.target.value})} /></div>
<div><Label>active</Label><Input value={form.active||""} onChange={e => setForm({...form, active: e.target.value})} /></div>
</div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>{editingId?"Update":"Create"}</Button></div></DialogContent></Dialog></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-4">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200"><th className="text-left py-2 px-3 font-semibold text-slate-600">name</th><th className="text-left py-2 px-3 font-semibold text-slate-600">code</th><th className="text-left py-2 px-3 font-semibold text-slate-600">address</th><th className="text-left py-2 px-3 font-semibold text-slate-600">phone</th><th className="text-left py-2 px-3 font-semibold text-slate-600">email</th><th className="text-left py-2 px-3 font-semibold text-slate-600">active</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Actions</th></tr></thead><tbody>{(items||[]).map(s => (<tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="py-2 px-3 text-slate-600">{s.name||"-"}</td><td className="py-2 px-3 text-slate-600">{s.code||"-"}</td><td className="py-2 px-3 text-slate-600">{s.address||"-"}</td><td className="py-2 px-3 text-slate-600">{s.phone||"-"}</td><td className="py-2 px-3 text-slate-600">{s.email||"-"}</td><td className="py-2 px-3 text-slate-600">{s.active||"-"}</td><td className="py-2 px-3"><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="w-3.5 h-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => { if(confirm("Delete?")){deleteMutation.mutateAsync({id:s.id});utils.companies.list.invalidate();}}}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button></div></td></tr>))}</tbody></table>{(items||[]).length===0&&!isLoading&&<p className="text-center text-slate-400 py-8">No records</p>}</div>
      </CardContent></Card>
    </div>
  );
}