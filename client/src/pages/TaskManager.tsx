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

export default function TaskManager() {
  const { data: items, isLoading } = trpc.tasks.list.useQuery();
  const createMutation = trpc.tasks.create.useMutation();
  const updateMutation = trpc.tasks.update.useMutation();
  const deleteMutation = trpc.tasks.delete.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const handleSubmit = async () => {
    try { if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...form }); toast.success("Updated"); } else { await createMutation.mutateAsync(form); toast.success("Created"); } utils.tasks.list.invalidate(); setDialogOpen(false); setEditingId(null); } catch { toast.error("Error"); }
  };
  const openEdit = (s: any) => { setEditingId(s.id); setForm({...s}); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900 font-serif">Task Manager</h1><p className="text-sm text-slate-500 mt-1">Manage Task Manager records</p></div><Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> New</Button></DialogTrigger><DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingId?"Edit":"New"} Task Manager</DialogTitle></DialogHeader><div className="grid grid-cols-2 gap-3">
<div><Label>title</Label><Input value={form.title||""} onChange={e => setForm({...form, title: e.target.value})} /></div>
<div><Label>description</Label><Input value={form.description||""} onChange={e => setForm({...form, description: e.target.value})} /></div>
<div><Label>owner</Label><Input value={form.owner||""} onChange={e => setForm({...form, owner: e.target.value})} /></div>
<div><Label>priority</Label><Input value={form.priority||""} onChange={e => setForm({...form, priority: e.target.value})} /></div>
<div><Label>dueDate</Label><Input value={form.dueDate||""} onChange={e => setForm({...form, dueDate: e.target.value})} /></div>
<div><Label>status</Label><Input value={form.status||""} onChange={e => setForm({...form, status: e.target.value})} /></div>
<div><Label>progress</Label><Input value={form.progress||""} onChange={e => setForm({...form, progress: e.target.value})} /></div>
<div><Label>completionDate</Label><Input value={form.completionDate||""} onChange={e => setForm({...form, completionDate: e.target.value})} /></div>
</div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>{editingId?"Update":"Create"}</Button></div></DialogContent></Dialog></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-4">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200"><th className="text-left py-2 px-3 font-semibold text-slate-600">title</th><th className="text-left py-2 px-3 font-semibold text-slate-600">description</th><th className="text-left py-2 px-3 font-semibold text-slate-600">owner</th><th className="text-left py-2 px-3 font-semibold text-slate-600">priority</th><th className="text-left py-2 px-3 font-semibold text-slate-600">dueDate</th><th className="text-left py-2 px-3 font-semibold text-slate-600">status</th><th className="text-left py-2 px-3 font-semibold text-slate-600">progress</th><th className="text-left py-2 px-3 font-semibold text-slate-600">completionDate</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Actions</th></tr></thead><tbody>{(items||[]).map(s => (<tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="py-2 px-3 text-slate-600">{s.title||"-"}</td><td className="py-2 px-3 text-slate-600">{s.description||"-"}</td><td className="py-2 px-3 text-slate-600">{s.owner||"-"}</td><td className="py-2 px-3 text-slate-600">{s.priority||"-"}</td><td className="py-2 px-3 text-slate-600">{s.dueDate?(new Date(s.dueDate)).toLocaleDateString():"-"}</td><td className="py-2 px-3 text-slate-600">{s.status||"-"}</td><td className="py-2 px-3 text-slate-600">{s.progress||"-"}</td><td className="py-2 px-3 text-slate-600">{s.completionDate?(new Date(s.completionDate)).toLocaleDateString():"-"}</td><td className="py-2 px-3"><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="w-3.5 h-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => { if(confirm("Delete?")){deleteMutation.mutateAsync({id:s.id});utils.tasks.list.invalidate();}}}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button></div></td></tr>))}</tbody></table>{(items||[]).length===0&&!isLoading&&<p className="text-center text-slate-400 py-8">No records</p>}</div>
      </CardContent></Card>
    </div>
  );
}