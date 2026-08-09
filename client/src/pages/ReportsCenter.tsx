import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, BarChart3 } from "lucide-react";

export default function ReportsCenter() {
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold text-slate-900 font-serif">Reports Center</h1><p className="text-sm text-slate-500 mt-1">Generate and download reports</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[{ title: "Shipment Summary", desc: "Monthly shipment performance report", icon: BarChart3 },
          { title: "Cost Analysis", desc: "Detailed cost breakdown", icon: FileText },
          { title: "Customs Clearance", desc: "Customs processing time analysis", icon: FileText },
          { title: "Supplier Performance", desc: "Supplier delivery metrics", icon: BarChart3 },
          { title: "Freight Cost Report", desc: "Freight cost trends", icon: BarChart3 },
          { title: "Document Compliance", desc: "Document status report", icon: FileText },
        ].map((r, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow"><CardContent className="p-5">
            <div className="flex items-start gap-3"><r.icon className="w-8 h-8 text-blue-600" /><div className="flex-1"><h3 className="font-semibold text-slate-800">{r.title}</h3><p className="text-xs text-slate-500 mt-1">{r.desc}</p><Button size="sm" variant="outline" className="mt-3 text-xs"><Download className="w-3 h-3 mr-1" /> Generate</Button></div></div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}