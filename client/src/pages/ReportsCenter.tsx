import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, BarChart3, Ship, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/exportExcel";
import { exportToPdf } from "@/lib/exportPdf";
import { FileSpreadsheet } from "lucide-react";

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

  const handleExport = (format: "xlsx" | "pdf", reportKey: string) => {
    const date = new Date().toISOString().slice(0, 10);
    try {
      if (reportKey === "shipments") {
        const cols = [
          { header: "Shipment No", key: "shipmentNo", getValue: (r: any) => r.shipmentNo },
          { header: "Material", key: "material", getValue: (r: any) => r.material },
          { header: "Supplier", key: "supplier", getValue: (r: any) => r.supplierName },
          { header: "PO Number", key: "po", getValue: (r: any) => r.poNumber },
          { header: "Incoterm", key: "incoterm", getValue: (r: any) => r.incoterm },
          { header: "Origin Country", key: "origin", getValue: (r: any) => r.originCountry },
          { header: "Origin Port", key: "originPort", getValue: (r: any) => r.originPort || "—" },
          { header: "Dest. Port", key: "destPort", getValue: (r: any) => r.destinationPort },
          { header: "Transport", key: "transport", getValue: (r: any) => r.transportMode },
          { header: "Shipping Line", key: "line", getValue: (r: any) => r.shippingLine || "—" },
          { header: "Container", key: "container", getValue: (r: any) => r.containerNo || "—" },
          { header: "Container Type", key: "ct", getValue: (r: any) => r.containerType || "—" },
          { header: "BL/AWB", key: "bl", getValue: (r: any) => r.blAwbNumber || "—" },
          { header: "Cargo Value (USD)", key: "value", getValue: (r: any) => r.cargoValue || 0 },
          { header: "Weight (kg)", key: "weight", getValue: (r: any) => r.cargoWeight || "—" },
          { header: "ETD", key: "etd", getValue: (r: any) => (r.etd ? new Date(r.etd).toLocaleDateString("en-GB") : "—") },
          { header: "ETA", key: "eta", getValue: (r: any) => (r.eta ? new Date(r.eta).toLocaleDateString("en-GB") : "—") },
          { header: "Status", key: "status", getValue: (r: any) => r.status },
        ];
        if (format === "xlsx") exportToExcel(shipments || [], cols, `Shipments_${date}.xlsx`, "Shipments");
        else exportToPdf(shipments || [], cols, "Shipment Register Report", `Shipments_${date}.pdf`);
      } else if (reportKey === "costs") {
        const cols = [
          { header: "Shipment", key: "shipment", getValue: (r: any) => `#${r.shipmentId}` },
          { header: "Category", key: "category", getValue: (r: any) => r.category || "—" },
          { header: "Description", key: "desc", getValue: (r: any) => r.description || "—" },
          { header: "Currency", key: "currency", getValue: (r: any) => r.currency || "USD" },
          { header: "Amount", key: "amount", getValue: (r: any) => r.amount || 0 },
          { header: "Total Cost (USD)", key: "total", getValue: (r: any) => r.totalCost || 0 },
          { header: "Status", key: "status", getValue: (r: any) => r.status || "—" },
        ];
        if (format === "xlsx") exportToExcel(costs || [], cols, `Costs_${date}.xlsx`, "Costs");
        else exportToPdf(costs || [], cols, "Cost Analysis Report", `Costs_${date}.pdf`);
      } else if (reportKey === "customs") {
        const cols = [
          { header: "Shipment", key: "shipment", getValue: (r: any) => `#${r.shipmentId}` },
          { header: "ACID", key: "acid", getValue: (r: any) => r.acidNumber || "—" },
          { header: "Declaration No", key: "decl", getValue: (r: any) => r.declarationNo || "—" },
          { header: "Clearance No", key: "clear", getValue: (r: any) => r.clearanceNo || "—" },
          { header: "Broker", key: "broker", getValue: (r: any) => r.brokerName || "—" },
          { header: "Port", key: "port", getValue: (r: any) => r.portName || "—" },
          { header: "Customs Value", key: "value", getValue: (r: any) => r.customsValue || 0 },
          { header: "Duties & Taxes", key: "duties", getValue: (r: any) => r.dutiesTaxes || 0 },
          { header: "Arrival", key: "arrival", getValue: (r: any) => (r.arrivalDate ? new Date(r.arrivalDate).toLocaleDateString("en-GB") : "—") },
          { header: "Release", key: "release", getValue: (r: any) => (r.releaseDate ? new Date(r.releaseDate).toLocaleDateString("en-GB") : "—") },
          { header: "Status", key: "status", getValue: (r: any) => r.status },
        ];
        if (format === "xlsx") exportToExcel(customs || [], cols, `Customs_${date}.xlsx`, "Customs");
        else exportToPdf(customs || [], cols, "Customs Clearance Report", `Customs_${date}.pdf`);
      } else {
        toast.info("This report type is available in the dedicated module pages");
        return;
      }
      toast.success(format === "xlsx" ? "تم تصدير Excel بنجاح" : "تم تصدير PDF بنجاح");
    } catch {
      toast.error("فشل التصدير");
    }
  };

  const reports = [
    { title: "Shipment Summary", desc: `${totalShipments} total shipments tracked`, icon: Ship, data: totalShipments, exportable: true },
    { title: "Cost Analysis", desc: `Total logistics cost: $${totalCost.toLocaleString()}`, icon: DollarSign, data: totalCost, exportable: true },
    { title: "Customs Clearance", desc: `Avg clearance: ${avgClearanceDays} days | ${clearedShipments} released/cleared of ${customs?.length || 0}`, icon: FileText, data: clearedShipments, exportable: true },
    { title: "Supplier Performance", desc: `${(suppliers || []).length} active suppliers`, icon: Users, data: (suppliers || []).length, exportable: false },
    { title: "Freight Cost Report", desc: "Freight cost trends by route", icon: BarChart3, data: 0, exportable: false },
    { title: "Document Compliance", desc: "Document status & gaps analysis", icon: FileText, data: 0, exportable: false },
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
                  <div className="flex gap-1.5 mt-3">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleExport("xlsx", ["shipments", "costs", "customs"][i] || "")} disabled={!r.exportable}>
                      <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Excel
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleExport("pdf", ["shipments", "costs", "customs"][i] || "")} disabled={!r.exportable}>
                      <Download className="w-3 h-3 mr-1 text-destructive" /> PDF
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
