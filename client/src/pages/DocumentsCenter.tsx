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

export default function DocumentsCenter() {
  const { data: items, isLoading } = trpc.documents.list.useQuery();
  const createMutation = trpc.documents.create.useMutation();
  const updateMutation = trpc.documents.update.useMutation();
  const deleteMutation = trpc.documents.delete.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const handleSubmit = async () => {
    try { if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...form }); toast.success("Updated"); } else { await createMutation.mutateAsync(form); toast.success("Created"); } utils.documents.list.invalidate(); setDialogOpen(false); setEditingId(null); } catch { toast.error("Error"); }
  };
  const openEdit = (s: any) => { setEditingId(s.id); setForm({...s}); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900 font-serif">Documents Center</h1><p className="text-sm text-slate-500 mt-1">Manage Documents Center records</p></div><Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> New</Button></DialogTrigger><DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingId?"Edit":"New"} Documents Center</DialogTitle></DialogHeader><div className="grid grid-cols-2 gap-3">
<div><Label>docType</Label><Input value={form.docType||""} onChange={e => setForm({...form, docType: e.target.value})} /></div>
<div><Label>fileName</Label><Input value={form.fileName||""} onChange={e => setForm({...form, fileName: e.target.value})} /></div>
<div><Label>version</Label><Input value={form.version||""} onChange={e => setForm({...form, version: e.target.value})} /></div>
<div><Label>status</Label><Input value={form.status||""} onChange={e => setForm({...form, status: e.target.value})} /></div>
<div><Label>uploadDate</Label><Input value={form.uploadDate||""} onChange={e => setForm({...form, uploadDate: e.target.value})} /></div>
<div><Label>expiryDate</Label><Input value={form.expiryDate||""} onChange={e => setForm({...form, expiryDate: e.target.value})} /></div>
<div><Label>remarks</Label><Input value={form.remarks||""} onChange={e => setForm({...form, remarks: e.target.value})} /></div>
</div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>{editingId?"Update":"Create"}</Button></div></DialogContent></Dialog></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-4">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200"><th className="text-left py-2 px-3 font-semibold text-slate-600">docType</th><th className="text-left py-2 px-3 font-semibold text-slate-600">fileName</th><th className="text-left py-2 px-3 font-semibold text-slate-600">version</th><th className="text-left py-2 px-3 font-semibold text-slate-600">status</th><th className="text-left py-2 px-3 font-semibold text-slate-600">uploadDate</th><th className="text-left py-2 px-3 font-semibold text-slate-600">expiryDate</th><th className="text-left py-2 px-3 font-semibold text-slate-600">remarks</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Actions</th></tr></thead><tbody>{(items||[]).map(s => (<tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="py-2 px-3 text-slate-600">{s.docType||"-"}</td><td className="py-2 px-3 text-slate-600">{s.fileName||"-"}</td><td className="py-2 px-3 text-slate-600">{s.version||"-"}</td><td className="py-2 px-3 text-slate-600">{s.status||"-"}</td><td className="py-2 px-3 text-slate-600">{s.uploadDate?(new Date(s.uploadDate)).toLocaleDateString():"-"}</td><td className="py-2 px-3 text-slate-600">{s.expiryDate?(new Date(s.expiryDate)).toLocaleDateString():"-"}</td><td className="py-2 px-3 text-slate-600">{s.remarks||"-"}</td><td className="py-2 px-3"><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="w-3.5 h-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => { if(confirm("Delete?")){deleteMutation.mutateAsync({id:s.id});utils.documents.list.invalidate();}}}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button></div></td></tr>))}</tbody></table>{(items||[]).length===0&&!isLoading&&<p className="text-center text-slate-400 py-8">No records</p>}</div>
      </CardContent></Card>
    </div>
  );
}