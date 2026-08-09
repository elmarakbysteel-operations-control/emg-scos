import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

export default function FormsLibrary() {
  const forms = [
    { name: "Shipping Instruction", desc: "Standard shipping instruction template" },
    { name: "Commercial Invoice Template", desc: "Commercial invoice format per customs" },
    { name: "Packing List Template", desc: "Standard packing list format" },
    { name: "Certificate of Origin Template", desc: "COO request template" },
    { name: "Import Declaration", desc: "NAFEZA import declaration form" },
    { name: "Temporary Admission Form", desc: "Temporary admission (T/A) application" },
    { name: "Re-Export Declaration", desc: "Re-export declaration form" },
    { name: "Credit Letter Template", desc: "Bank credit letter request template" },
    { name: "Incoterms Reference", desc: "Incoterms 2020 quick reference guide" },
    { name: "Customs Tariff Guide", desc: "Egyptian customs tariff classification guide" },
  ];
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold text-slate-900 font-serif">Forms Library</h1><p className="text-sm text-slate-500 mt-1">Standard templates and forms</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {forms.map((f, i) => (
          <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0"><h3 className="text-sm font-semibold text-slate-800">{f.name}</h3><p className="text-xs text-slate-500">{f.desc}</p></div>
            <Button size="sm" variant="outline"><Download className="w-3 h-3" /></Button>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}