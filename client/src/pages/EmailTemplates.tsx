import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Mail, Search } from "lucide-react";
import { toast } from "sonner";

export default function EmailTemplates() {
  const { data: items, isLoading } = trpc.emailTemplates.list.useQuery();
  const createMutation = trpc.emailTemplates.create.useMutation();
  const updateMutation = trpc.emailTemplates.update.useMutation();
  const deleteMutation = trpc.emailTemplates.delete.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    title: "", category: "freight_booking" as any, subject: "",
    body: "", active: "yes" as any
  });

  const handleSubmit = async () => {
    try {
      if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...form }); toast.success("Updated successfully"); }
      else { await createMutation.mutateAsync(form); toast.success("Template created"); }
      utils.emailTemplates.list.invalidate(); setDialogOpen(false); setEditingId(null);
    } catch { toast.error("Error occurred"); }
  };

  const openEdit = (s: any) => { setEditingId(s.id); setForm({ ...s }); setDialogOpen(true); };
  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      await deleteMutation.mutateAsync({ id });
      utils.emailTemplates.list.invalidate();
      toast.success("Deleted");
    }
  };

  const categoryLabels: Record<string, string> = {
    freight_booking: "Freight Booking",
    aci_submission: "ACI / NAFEZA",
    customs_clearance: "Customs Clearance",
    payment_followup: "Payment Follow-up",
    delivery_notice: "Delivery Notice",
    general: "General",
  };

  const filtered = (items || []).filter((s: any) =>
    s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-700" />
            Email Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">Professional email templates for shipping operations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> New Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "New"} Email Template</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Freight Booking Request" /></div>
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="freight_booking" />
              </div>
              <div>
                <Label>Active</Label>
                <Input value={form.active} onChange={e => setForm({ ...form, active: e.target.value as any })} placeholder="yes/no" />
              </div>
              <div className="col-span-2"><Label>Subject</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Freight Booking Request - SH-2026-001" /></div>
              <div className="col-span-2"><Label>Body</Label><Textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={8} placeholder="Dear {{Recipient}},&#10;&#10;Please provide your best freight offer for the following shipment..." /></div>
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
            <Input placeholder="Search templates..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
          <div className="space-y-3">
            {filtered.map((s: any) => (
              <Card key={s.id} className="border border-slate-100 hover:border-blue-200 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{s.title || "-"}</h3>
                        <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">{categoryLabels[s.category] || s.category}</Badge>
                        {s.active === "yes" && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Active</Badge>}
                      </div>
                      <p className="text-sm font-medium text-slate-700 mb-1">Subject: {s.subject || "-"}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{s.body || "-"}</p>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && !isLoading && (
              <p className="text-center text-slate-400 py-8">No email templates found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
