import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Building2, Database } from "lucide-react";
import { toast } from "sonner";

export default function MasterData() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-700" />
          Master Data
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage reference data: Companies, Plants, Departments</p>
      </div>
      <Tabs defaultValue="companies" className="w-full">
        <TabsList>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="plants">Plants</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>
        <TabsContent value="companies"><CompaniesTab /></TabsContent>
        <TabsContent value="plants"><PlantsTab /></TabsContent>
        <TabsContent value="departments"><DepartmentsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function CompaniesTab() {
  const { data: items, isLoading } = trpc.companies.list.useQuery();
  const createMutation = trpc.companies.create.useMutation();
  const deleteMutation = trpc.companies.delete.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", address: "", phone: "", email: "", active: "yes" as any });

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync(form);
      toast.success("Company added");
      utils.companies.list.invalidate();
      setDialogOpen(false);
      setForm({ name: "", code: "", address: "", phone: "", email: "", active: "yes" });
    } catch { toast.error("Error"); }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold text-slate-700">Companies</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm" className="bg-blue-700"><Plus className="w-3 h-3 mr-1" /> Add</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Add Company</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Elmarakby Steel" /></div>
                <div><Label>Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="EMS" /></div>
                <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button className="bg-blue-700" onClick={handleSubmit}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-200">
            <th className="text-left py-2 px-3 font-semibold text-slate-600">Name</th>
            <th className="text-left py-2 px-3 font-semibold text-slate-600">Code</th>
            <th className="text-left py-2 px-3 font-semibold text-slate-600">Address</th>
            <th className="text-left py-2 px-3 font-semibold text-slate-600">Phone</th>
            <th className="text-left py-2 px-3 font-semibold text-slate-600">Email</th>
            <th className="text-left py-2 px-3 font-semibold text-slate-600">Actions</th>
          </tr></thead>
          <tbody>{(items || []).map((s: any) => (
            <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="py-2 px-3 font-medium">{s.name || "-"}</td>
              <td className="py-2 px-3 text-slate-600 font-mono text-xs">{s.code || "-"}</td>
              <td className="py-2 px-3 text-slate-600">{s.address || "-"}</td>
              <td className="py-2 px-3 text-slate-600">{s.phone || "-"}</td>
              <td className="py-2 px-3 text-slate-600">{s.email || "-"}</td>
              <td className="py-2 px-3">
                <Button size="sm" variant="ghost" onClick={async () => { if (confirm("Delete?")) { await deleteMutation.mutateAsync({ id: s.id }); utils.companies.list.invalidate(); } }}>
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </Button>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {(items || []).length === 0 && !isLoading && <p className="text-center text-slate-400 py-8">No companies found</p>}
      </CardContent>
    </Card>
  );
}

function PlantsTab() {
  const { data: items, isLoading } = trpc.plants.list.useQuery();
  const createMutation = trpc.plants.create.useMutation();
  const deleteMutation = trpc.plants.delete.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", companyId: null as number | null, location: "", active: "yes" as any });

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync(form);
      toast.success("Plant added");
      utils.plants.list.invalidate();
      setDialogOpen(false);
      setForm({ name: "", code: "", companyId: null, location: "", active: "yes" });
    } catch { toast.error("Error"); }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold text-slate-700">Plants</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm" className="bg-blue-700"><Plus className="w-3 h-3 mr-1" /> Add</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Add Plant</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Plant 1 - October City" /></div>
                <div><Label>Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
                <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button className="bg-blue-700" onClick={handleSubmit}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-200">
            <th className="text-left py-2 px-3 font-semibold text-slate-600">Name</th>
            <th className="text-left py-2 px-3 font-semibold text-slate-600">Code</th>
            <th className="text-left py-2 px-3 font-semibold text-slate-600">Location</th>
            <th className="text-left py-2 px-3 font-semibold text-slate-600">Actions</th>
          </tr></thead>
          <tbody>{(items || []).map((s: any) => (
            <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="py-2 px-3 font-medium">{s.name || "-"}</td>
              <td className="py-2 px-3 text-slate-600 font-mono text-xs">{s.code || "-"}</td>
              <td className="py-2 px-3 text-slate-600">{s.location || "-"}</td>
              <td className="py-2 px-3">
                <Button size="sm" variant="ghost" onClick={async () => { if (confirm("Delete?")) { await deleteMutation.mutateAsync({ id: s.id }); utils.plants.list.invalidate(); } }}>
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </Button>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {(items || []).length === 0 && !isLoading && <p className="text-center text-slate-400 py-8">No plants found</p>}
      </CardContent>
    </Card>
  );
}

function DepartmentsTab() {
  const { data: items, isLoading } = trpc.departments.list.useQuery();
  const createMutation = trpc.departments.create.useMutation();
  const deleteMutation = trpc.departments.delete.useMutation();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", companyId: null as number | null, description: "", active: "yes" as any });

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync(form);
      toast.success("Department added");
      utils.departments.list.invalidate();
      setDialogOpen(false);
      setForm({ name: "", code: "", companyId: null, description: "", active: "yes" });
    } catch { toast.error("Error"); }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold text-slate-700">Departments</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm" className="bg-blue-700"><Plus className="w-3 h-3 mr-1" /> Add</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Logistics & Shipping" /></div>
                <div><Label>Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
                <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button className="bg-blue-700" onClick={handleSubmit}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-200">
            <th className="text-left py-2 px-3 font-semibold text-slate-600">Name</th>
            <th className="text-left py-2 px-3 font-semibold text-slate-600">Code</th>
            <th className="text-left py-2 px-3 font-semibold text-slate-600">Description</th>
            <th className="text-left py-2 px-3 font-semibold text-slate-600">Actions</th>
          </tr></thead>
          <tbody>{(items || []).map((s: any) => (
            <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="py-2 px-3 font-medium">{s.name || "-"}</td>
              <td className="py-2 px-3 text-slate-600 font-mono text-xs">{s.code || "-"}</td>
              <td className="py-2 px-3 text-slate-600">{s.description || "-"}</td>
              <td className="py-2 px-3">
                <Button size="sm" variant="ghost" onClick={async () => { if (confirm("Delete?")) { await deleteMutation.mutateAsync({ id: s.id }); utils.departments.list.invalidate(); } }}>
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </Button>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {(items || []).length === 0 && !isLoading && <p className="text-center text-slate-400 py-8">No departments found</p>}
      </CardContent>
    </Card>
  );
}
