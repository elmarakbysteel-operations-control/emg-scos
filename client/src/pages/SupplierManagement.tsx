import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function SupplierManagement() {
  const { data: items, isLoading } = trpc.suppliers.list.useQuery();
  const createMutation = trpc.suppliers.create.useMutation();
  const updateMutation = trpc.suppliers.update.useMutation();
  const deleteMutation = trpc.suppliers.delete.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", code: "", country: "", city: "", contactPerson: "", email: "", phone: "", rating: 0, performance: "average" as "excellent"|"good"|"average"|"poor", active: "yes" as "yes"|"no" });

  const handleSubmit = async () => {
    try { if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...form }); toast.success("Updated"); } else { await createMutation.mutateAsync(form); toast.success("Created"); } utils.suppliers.list.invalidate(); setDialogOpen(false); setEditingId(null); setForm({ name: "", code: "", country: "", city: "", contactPerson: "", email: "", phone: "", rating: 0, performance: "average", active: "yes" }); } catch { toast.error("Error"); }
  };
  const openEdit = (s: any) => { setEditingId(s.id); setForm({ name: s.name || "", code: s.code || "", country: s.country || "", city: s.city || "", contactPerson: s.contactPerson || "", email: s.email || "", phone: s.phone || "", rating: s.rating || 0, performance: s.performance || "average", active: s.active || "yes" }); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900 font-serif">Supplier Management</h1><p className="text-sm text-slate-500 mt-1">Manage suppliers</p></div><Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> New</Button></DialogTrigger><DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingId?"Edit":"New"} Supplier</DialogTitle></DialogHeader><div className="grid grid-cols-2 gap-3"><div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div><div><Label>Code</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value})} /></div><div><Label>Country</Label><Input value={form.country} onChange={e => setForm({...form, country: e.target.value})} /></div><div><Label>City</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div><div><Label>Contact</Label><Input value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} /></div><div><Label>Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div><div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div><div><Label>Rating</Label><Input type="number" value={form.rating||""} onChange={e => setForm({...form, rating: +e.target.value})} /></div><div><Label>Performance</Label><Input value={form.performance} onChange={e => setForm({...form, performance: e.target.value as any})} /></div><div><Label>Active</Label><Input value={form.active} onChange={e => setForm({...form, active: e.target.value as any})} /></div></div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>{editingId?"Update":"Create"}</Button></div></DialogContent></Dialog></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-4">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200"><th className="text-left py-2 px-3 font-semibold text-slate-600">Name</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Code</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Country</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Contact</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Email</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Phone</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Rating</th><th className="text-left py-2 px-3 font-semibold text-slate-600">Actions</th></tr></thead><tbody>{(items||[]).map(s => (<tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50"><td className="py-2 px-3 font-medium">{s.name||"-"}</td><td className="py-2 px-3 text-slate-600">{s.code||"-"}</td><td className="py-2 px-3 text-slate-600">{s.country||"-"}</td><td className="py-2 px-3 text-slate-600">{s.contactPerson||"-"}</td><td className="py-2 px-3 text-slate-600">{s.email||"-"}</td><td className="py-2 px-3 text-slate-600">{s.phone||"-"}</td><td className="py-2 px-3 text-slate-600">{s.rating||0}</td><td className="py-2 px-3"><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="w-3.5 h-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => { if(confirm("Delete?")){deleteMutation.mutateAsync({id:s.id});utils.suppliers.list.invalidate();}}}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button></div></td></tr>))}</tbody></table>{(items||[]).length===0&&!isLoading&&<p className="text-center text-slate-400 py-8">No records</p>}</div>
      </CardContent></Card>
    </div>
  );
}
