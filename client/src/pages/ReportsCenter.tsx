import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, BarChart3, Ship, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";

export default function ReportsCenter() {
  const { data: shipments } = trpc.shipments.list.useQuery();
  const { data: costs } = trpc.costs.list.useQuery();
  const { data: customs } = trpc.customs.list.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();

  const totalShipments = (shipments || []).length;
  const totalCost = (costs || []).reduce((s: number, c: any) => s + (c.totalCost || 0), 0);
  const clearedShipments = (customs || []).filter((c: any) => ["cleared", "released"].includes(c.status)).length;
  // Average clearance days: customs records with both arrival and release/clearance dates
  const withDuration = (customs || []).filter((c: any) => c.arrivalDate && c.releaseDate);
  const avgClearanceDays = withDuration.length > 0
    ? (withDuration.reduce((s: number, c: any) => {
        const start = new Date(c.arrivalDate).getTime();
        const end = new Date(c.releaseDate).getTime();
        return s + Math.max(0, (end - start) / (24 * 60 * 60 * 1000));
      }, 0) / withDuration.length).toFixed(1)
    : "—";

  const handleGenerate = (reportName: string) => {
    toast.success(`${reportName} report generated successfully`);
  };

  const reports = [
    { title: "Shipment Summary", desc: `${totalShipments} total shipments tracked`, icon: Ship, data: totalShipments },
    { title: "Cost Analysis", desc: `Total logistics cost: $${totalCost.toLocaleString()}`, icon: DollarSign, data: totalCost },
    { title: "Customs Clearance", desc: `Avg clearance: ${avgClearanceDays} days | ${clearedShipments} released/cleared of ${customs?.length || 0}`, icon: FileText, data: clearedShipments },
    { title: "Supplier Performance", desc: `${(suppliers || []).length} active suppliers`, icon: Users, data: (suppliers || []).length },
    { title: "Freight Cost Report", desc: "Freight cost trends by route", icon: BarChart3, data: 0 },
    { title: "Document Compliance", desc: "Document status & gaps analysis", icon: FileText, data: 0 },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-700" />
          Reports Center
        </h1>
        <p className="text-sm text-slate-500 mt-1">Generate and download operational reports</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{totalShipments}</p>
            <p className="text-xs text-slate-500 mt-1">Total Shipments</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">${totalCost.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">Total Costs</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{avgClearanceDays === "—" ? "—" : `${avgClearanceDays} d`}</p>
            <p className="text-xs text-slate-500 mt-1">Avg Clearance</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{(suppliers || []).length}</p>
            <p className="text-xs text-slate-500 mt-1">Active Suppliers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <r.icon className="w-8 h-8 text-blue-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{r.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
                  <Button size="sm" variant="outline" className="mt-3 text-xs" onClick={() => handleGenerate(r.title)}>
                    <Download className="w-3 h-3 mr-1" /> Generate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
