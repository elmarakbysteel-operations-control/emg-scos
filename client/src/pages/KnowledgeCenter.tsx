import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Ship, FileText, Globe, CheckCircle, ArrowRight } from "lucide-react";

export default function KnowledgeCenter() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-700" />
          Knowledge Center
        </h1>
        <p className="text-sm text-slate-500 mt-1">Customs procedures, Incoterms &amp; Egyptian import/export regulations</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-800">NAFEZA System</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">NAFEZA (Egyptian Advanced Cargo Information System) is the national single window for customs operations. All importers must register shipments through NAFEZA by obtaining an ACID number before shipment departure from origin port.</p>
            <div className="flex items-center gap-2 mb-3 mt-4">
              <FileText className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-slate-800">ACID Number</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">Advance Cargo Information Declaration (ACID) is a mandatory 19-digit number that must be obtained from NAFEZA before shipment. The ACID must appear on all shipping documents and be validated through CargoX platform.</p>
            <div className="flex items-center gap-2 mb-3 mt-4">
              <Ship className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-slate-800">UCR (Unique Consignment Reference)</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">UCR is a unique reference number assigned to each consignment for tracking purposes across customs systems. It facilitates electronic processing and reduces documentation delays.</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Incoterms 2020
            </h3>
            <Accordion type="single" collapsible>
              {[
                { term: "EXW (Ex Works)", desc: "Seller makes goods available at their premises. Buyer bears all costs and risks from that point." },
                { term: "FCA (Free Carrier)", desc: "Seller delivers goods to carrier nominated by buyer at named place. Risk transfers on delivery." },
                { term: "FOB (Free On Board)", desc: "Seller delivers goods on board the vessel at the named port of shipment. Risk transfers at the ship's rail." },
                { term: "CIF (Cost, Insurance & Freight)", desc: "Seller pays cost, insurance and freight to destination port. Risk transfers at loading port." },
                { term: "DAP (Delivered At Place)", desc: "Seller delivers goods at named destination, ready for unloading. Buyer handles import clearance." },
                { term: "DDP (Delivered Duty Paid)", desc: "Seller bears all costs and risks until goods are delivered to the named place, including import duties." },
              ].map((item, i) => (
                <AccordionItem key={i} value={"item-" + i}><AccordionTrigger className="text-sm font-medium">{item.term}</AccordionTrigger><AccordionContent><p className="text-xs text-slate-600">{item.desc}</p></AccordionContent></AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-emerald-600" />
              Import Procedures (Egypt)
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              {["Obtain ACID number from NAFEZA before shipment", "Upload documents to CargoX platform", "Goods arrive at Egyptian port", "Submit customs declaration with ACID", "Customs inspection (physical/documentary)", "Pay duties and taxes", "Release of goods"].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{i + 1}. {step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-blue-600" />
              Export Procedures (Egypt)
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              {["Obtain export declaration from NAFEZA", "Prepare commercial documents (Invoice, Packing List, COO)", "Goods inspection at port of export", "Customs clearance for export", "Loading on vessel/aircraft", "Obtain BL/AWB", "Send documents to buyer"].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <span>{i + 1}. {step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
