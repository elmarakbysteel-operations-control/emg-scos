import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Users, Star, Search } from "lucide-react";
import { toast } from "sonner";

export default function SupplierManagement() {
  const { data: items, isLoading } = trpc.suppliers.list.useQuery();
  const createMutation = trpc.suppliers.create.useMutation();
  const updateMutation = trpc.suppliers.update.useMutation();
  const deleteMutation = trpc.suppliers.delete.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    name: "", code: "", country: "", city: "", contactPerson: "",
    email: "", phone: "", rating: 0, performance: "average" as any, active: "yes" as any
  });

  const handleSubmit = async () => {
    try {
      if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...form }); toast.success("Updated successfully"); }
      else { await createMutation.mutateAsync(form); toast.success("Supplier added"); }
      utils.suppliers.list.invalidate(); setDialogOpen(false); setEditingId(null);
      setForm({ name: "", code: "", country: "", city: "", contactPerson: "", email: "", phone: "", rating: 0, performance: "average", active: "yes" });
    } catch { toast.error("Error occurred"); }
  };

  const openEdit = (s: any) => {
    setEditingId(s.id);
    setForm({
      name: s.name || "", code: s.code || "", country: s.country || "", city: s.city || "",
      contactPerson: s.contactPerson || "", email: s.email || "", phone: s.phone || "",
      rating: s.rating || 0, performance: s.performance || "average", active: s.active || "yes"
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      await deleteMutation.mutateAsync({ id });
      utils.suppliers.list.invalidate();
      toast.success("Deleted");
    }
  };

  const perfColors: Record<string, string> = {
    excellent: "bg-emerald-100 text-emerald-700",
    good: "bg-blue-100 text-blue-700",
    average: "bg-amber-100 text-amber-700",
    poor: "bg-red-100 text-red-700",
  };

  const filtered = (items || []).filter((s: any) =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-700" />
            Supplier Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage global suppliers &amp; performance</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> New Supplier</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "New"} Supplier</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="ArcelorMittal Steel" /></div>
              <div><Label>Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="SUP-001" /></div>
              <div><Label>Country</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Germany" /></div>
              <div><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>Contact Person</Label><Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Rating (1-5)</Label><Input type="number" min="1" max="5" value={form.rating || ""} onChange={e => setForm({ ...form, rating: +e.target.value })} /></div>
              <div>
                <Label>Performance</Label>
                <Select value={form.performance} onValueChange={v => setForm({ ...form, performance: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Active</Label>
                <Select value={form.active} onValueChange={v => setForm({ ...form, active: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <Input placeholder="Search suppliers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Supplier</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Code</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Location</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Contact</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Email</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Phone</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Rating</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Performance</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-800">{s.name || "-"}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-xs">{s.code || "-"}</td>
                    <td className="py-3 px-3 text-slate-600">{s.city}{s.city && s.country ? ", " : ""}{s.country || ""}</td>
                    <td className="py-3 px-3 text-slate-700">{s.contactPerson || "-"}</td>
                    <td className="py-3 px-3 text-slate-600">{s.email || "-"}</td>
                    <td className="py-3 px-3 text-slate-600">{s.phone || "-"}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i <= (s.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3"><Badge className={`${perfColors[s.performance] || "bg-gray-100 text-gray-600"} border-0 text-xs`}>{s.performance}</Badge></td>
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
              <p className="text-center text-slate-400 py-8">No suppliers found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
