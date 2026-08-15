import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function CostControl() {
  const { data: items, isLoading } = trpc.costs.list.useQuery();
  const createMutation = trpc.costs.create.useMutation();
  const updateMutation = trpc.costs.update.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    shipmentId: null as number | null, cargoValue: 0, freightCost: 0,
    insuranceCost: 0, customsCost: 0, transportationCost: 0,
    storageCost: 0, demurrageCost: 0, detentionCost: 0,
    handlingCost: 0, otherCharges: 0, budget: 0, currency: "USD"
  });

  const handleSubmit = async () => {
    try {
      if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...form }); toast.success("Updated successfully"); }
      else { await createMutation.mutateAsync(form); toast.success("Cost record created"); }
      utils.costs.list.invalidate(); setDialogOpen(false); setEditingId(null);
    } catch { toast.error("Error occurred"); }
  };

  const openEdit = (s: any) => { setEditingId(s.id); setForm({ ...s }); setDialogOpen(true); };

  const totalFreight = (items || []).reduce((sum: number, c: any) => sum + (c.freightCost || 0), 0);
  const totalDemurrage = (items || []).reduce((sum: number, c: any) => sum + (c.demurrageCost || 0), 0);
  const totalBudget = (items || []).reduce((sum: number, c: any) => sum + (c.budget || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-blue-700" />
            Cost Control
          </h1>
          <p className="text-sm text-slate-500 mt-1">Cost tracking &amp; budget management</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> New Cost</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "New"} Cost Record</DialogTitle></DialogHeader>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Cargo Value (USD)</Label><Input type="number" value={form.cargoValue || ""} onChange={e => setForm({ ...form, cargoValue: +e.target.value })} /></div>
              <div><Label>Freight Cost</Label><Input type="number" value={form.freightCost || ""} onChange={e => setForm({ ...form, freightCost: +e.target.value })} /></div>
              <div><Label>Insurance</Label><Input type="number" value={form.insuranceCost || ""} onChange={e => setForm({ ...form, insuranceCost: +e.target.value })} /></div>
              <div><Label>Customs Duties</Label><Input type="number" value={form.customsCost || ""} onChange={e => setForm({ ...form, customsCost: +e.target.value })} /></div>
              <div><Label>Transportation</Label><Input type="number" value={form.transportationCost || ""} onChange={e => setForm({ ...form, transportationCost: +e.target.value })} /></div>
              <div><Label>Storage</Label><Input type="number" value={form.storageCost || ""} onChange={e => setForm({ ...form, storageCost: +e.target.value })} /></div>
              <div><Label>Demurrage</Label><Input type="number" value={form.demurrageCost || ""} onChange={e => setForm({ ...form, demurrageCost: +e.target.value })} /></div>
              <div><Label>Detention</Label><Input type="number" value={form.detentionCost || ""} onChange={e => setForm({ ...form, detentionCost: +e.target.value })} /></div>
              <div><Label>Handling</Label><Input type="number" value={form.handlingCost || ""} onChange={e => setForm({ ...form, handlingCost: +e.target.value })} /></div>
              <div><Label>Other Charges</Label><Input type="number" value={form.otherCharges || ""} onChange={e => setForm({ ...form, otherCharges: +e.target.value })} /></div>
              <div><Label>Budget</Label><Input type="number" value={form.budget || ""} onChange={e => setForm({ ...form, budget: +e.target.value })} /></div>
              <div>
                <Label>Currency</Label>
                <Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} placeholder="USD / EUR / EGP" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="bg-blue-700" onClick={handleSubmit}>{editingId ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm"><DollarSign className="w-4 h-4" />Total Freight</div>
            <p className="text-2xl font-bold text-slate-900 mt-1">${totalFreight.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm"><TrendingUp className="w-4 h-4" />Demurrage &amp; Detention</div>
            <p className="text-2xl font-bold text-red-600 mt-1">${totalDemurrage.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm"><DollarSign className="w-4 h-4" />Total Budget</div>
            <p className="text-2xl font-bold text-blue-700 mt-1">${totalBudget.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Shipment</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Cargo Value</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Freight</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Insurance</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Customs</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Transport</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Storage</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Demurrage</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Detention</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Total Cost</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Budget</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(items || []).map((s: any) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 text-slate-700 font-medium">SH-{s.id}</td>
                    <td className="py-3 px-3 text-slate-600">${(s.cargoValue || 0).toLocaleString()}</td>
                    <td className="py-3 px-3 text-slate-600">${(s.freightCost || 0).toLocaleString()}</td>
                    <td className="py-3 px-3 text-slate-600">${(s.insuranceCost || 0).toLocaleString()}</td>
                    <td className="py-3 px-3 text-slate-600">${(s.customsCost || 0).toLocaleString()}</td>
                    <td className="py-3 px-3 text-slate-600">${(s.transportationCost || 0).toLocaleString()}</td>
                    <td className="py-3 px-3 text-slate-600">${(s.storageCost || 0).toLocaleString()}</td>
                    <td className="py-3 px-3">{s.demurrageCost > 0 ? <span className="text-red-600 font-medium">${(s.demurrageCost || 0).toLocaleString()}</span> : "-"}</td>
                    <td className="py-3 px-3">{s.detentionCost > 0 ? <span className="text-red-600 font-medium">${(s.detentionCost || 0).toLocaleString()}</span> : "-"}</td>
                    <td className="py-3 px-3 font-bold">${(s.totalCost || 0).toLocaleString()}</td>
                    <td className="py-3 px-3 text-blue-700">${(s.budget || 0).toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Edit className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(items || []).length === 0 && !isLoading && (
              <p className="text-center text-slate-400 py-8">No cost records found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
