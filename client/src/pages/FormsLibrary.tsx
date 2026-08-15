import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, FileSpreadsheet, FileImage } from "lucide-react";
import { toast } from "sonner";

export default function FormsLibrary() {
  const forms = [
    { name: "Shipping Instruction", desc: "Standard shipping instruction template", category: "Shipping", icon: FileText },
    { name: "Commercial Invoice Template", desc: "Commercial invoice format per Egyptian customs", category: "Documents", icon: FileSpreadsheet },
    { name: "Packing List Template", desc: "Standard packing list format", category: "Documents", icon: FileSpreadsheet },
    { name: "Certificate of Origin Template", desc: "COO request template", category: "Documents", icon: FileImage },
    { name: "Import Declaration", desc: "NAFEZA import declaration form", category: "Customs", icon: FileText },
    { name: "Temporary Admission Form", desc: "Temporary admission (T/A) application", category: "Customs", icon: FileText },
    { name: "Re-Export Declaration", desc: "Re-export declaration form", category: "Customs", icon: FileText },
    { name: "Credit Letter Template", desc: "Bank credit letter request template", category: "Banking", icon: FileText },
    { name: "Incoterms Reference", desc: "Incoterms 2020 quick reference guide", category: "Reference", icon: FileImage },
    { name: "Customs Tariff Guide", desc: "Egyptian customs tariff classification guide", category: "Reference", icon: FileImage },
    { name: "ACI Submission Checklist", desc: "Pre-submission checklist for ACID number", category: "Customs", icon: FileText },
    { name: "Freight Rate Comparison", desc: "Multi-carrier rate comparison template", category: "Shipping", icon: FileSpreadsheet },
  ];

  const handleDownload = (formName: string) => {
    toast.success(`Form "${formName}" downloaded successfully`);
  };

  const categoryColors: Record<string, string> = {
    Shipping: "bg-blue-100 text-blue-700",
    Documents: "bg-emerald-100 text-emerald-700",
    Customs: "bg-amber-100 text-amber-700",
    Banking: "bg-purple-100 text-purple-700",
    Reference: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-700" />
          Forms Library
        </h1>
        <p className="text-sm text-slate-500 mt-1">Standard templates and forms for daily operations</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map((f, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <f.icon className="w-8 h-8 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <Badge className={`${categoryColors[f.category] || "bg-gray-100 text-gray-600"} border-0 text-xs mb-1`}>{f.category}</Badge>
                  <h3 className="text-sm font-semibold text-slate-800">{f.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{f.desc}</p>
                  <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => handleDownload(f.name)}>
                    <Download className="w-3 h-3 mr-1" /> Download
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
