import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, CheckSquare, Search } from "lucide-react";
import { toast } from "sonner";

export default function TaskManager() {
  const { data: items, isLoading } = trpc.tasks.list.useQuery();
  const createMutation = trpc.tasks.create.useMutation();
  const updateMutation = trpc.tasks.update.useMutation();
  const deleteMutation = trpc.tasks.delete.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    shipmentId: null as number | null, title: "", description: "",
    owner: "", priority: "medium" as any, dueDate: "", status: "not_started" as any, progress: 0
  });

  const handleSubmit = async () => {
    try {
      if (editingId) { await updateMutation.mutateAsync({ id: editingId, ...form }); toast.success("Updated successfully"); }
      else { await createMutation.mutateAsync(form); toast.success("Task created"); }
      utils.tasks.list.invalidate(); setDialogOpen(false); setEditingId(null);
    } catch { toast.error("Error occurred"); }
  };

  const openEdit = (s: any) => { setEditingId(s.id); setForm({ ...s }); setDialogOpen(true); };
  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteMutation.mutateAsync({ id });
      utils.tasks.list.invalidate();
      toast.success("Deleted");
    }
  };

  const priorityColors: Record<string, string> = {
    urgent: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-green-100 text-green-700",
  };

  const statusColors: Record<string, string> = {
    not_started: "bg-gray-100 text-gray-600",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const statusLabels: Record<string, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const filtered = (items || []).filter((s: any) =>
    s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.owner?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (d: any) => {
    if (!d) return "-";
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-700" />
            Task Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">Action items &amp; follow-ups</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> New Task</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "New"} Task</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Follow up ACID for SH-2026-001" /></div>
              <div className="col-span-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Owner</Label><Input value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} placeholder="Ahmed Elghobashy" /></div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Progress (%)</Label><Input type="number" value={form.progress || ""} onChange={e => setForm({ ...form, progress: +e.target.value })} placeholder="0" /></div>
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
            <Input placeholder="Search tasks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Task</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Description</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Owner</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Priority</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Due Date</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Progress</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-800 max-w-[200px] truncate">{s.title || "-"}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate">{s.description || "-"}</td>
                    <td className="py-3 px-3 text-slate-700">{s.owner || "-"}</td>
                    <td className="py-3 px-3"><Badge className={`${priorityColors[s.priority] || "bg-gray-100 text-gray-600"} border-0 text-xs`}>{s.priority}</Badge></td>
                    <td className="py-3 px-3 text-slate-600">{formatDate(s.dueDate)}</td>
                    <td className="py-3 px-3"><Badge className={`${statusColors[s.status] || "bg-gray-100 text-gray-600"} border-0 text-xs`}>{statusLabels[s.status] || s.status}</Badge></td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5">
                          <div className="bg-blue-700 h-1.5 rounded-full" style={{ width: `${s.progress || 0}%` }}></div>
                        </div>
                        <span className="text-xs text-slate-500">{s.progress || 0}%</span>
                      </div>
                    </td>
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
              <p className="text-center text-slate-400 py-8">No tasks found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
