import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function KnowledgeCenter() {
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold text-slate-900 font-serif">Knowledge Center</h1><p className="text-sm text-slate-500 mt-1">Customs procedures, Incoterms & regulations</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-5">
          <h3 className="font-semibold text-slate-800 mb-3">NAFEZA System</h3>
          <p className="text-sm text-slate-600 leading-relaxed">NAFEZA (Egyptian Advanced Cargo Information System) is the national single window for customs operations. All importers must register shipments through NAFEZA by obtaining an ACID number before shipment departure from origin port.</p>
          <h3 className="font-semibold text-slate-800 mt-4 mb-3">ACID Number</h3>
          <p className="text-sm text-slate-600 leading-relaxed">Advance Cargo Information Declaration (ACID) is a mandatory 19-digit number that must be obtained from NAFEZA before shipment. The ACID must appear on all shipping documents and be validated through CargoX platform.</p>
          <h3 className="font-semibold text-slate-800 mt-4 mb-3">UCR (Unique Consignment Reference)</h3>
          <p className="text-sm text-slate-600 leading-relaxed">UCR is a unique reference number assigned to each consignment for tracking purposes across customs systems. It facilitates electronic processing and reduces documentation delays.</p>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Incoterms 2020</h3>
          <Accordion type="single" collapsible>
            {[
              { term: "EXW (Ex Works)", desc: "Seller makes goods available at their premises. Buyer bears all costs and risks from that point." },
              { term: "FOB (Free On Board)", desc: "Seller delivers goods on board the vessel at the named port of shipment. Risk transfers at the ship's rail." },
              { term: "CIF (Cost, Insurance & Freight)", desc: "Seller pays cost, insurance and freight to destination port. Risk transfers at loading port." },
              { term: "DDP (Delivered Duty Paid)", desc: "Seller bears all costs and risks until goods are delivered to the named place, including import duties." },
              { term: "DAP (Delivered At Place)", desc: "Seller delivers goods at named destination, ready for unloading. Buyer handles import clearance." },
              { term: "FCA (Free Carrier)", desc: "Seller delivers goods to carrier nominated by buyer at named place. Risk transfers on delivery." },
            ].map((item, i) => (
              <AccordionItem key={i} value={"item-" + i}><AccordionTrigger className="text-sm font-medium">{item.term}</AccordionTrigger><AccordionContent><p className="text-xs text-slate-600">{item.desc}</p></AccordionContent></AccordionItem>
            ))}
          </Accordion>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Import Procedures (Egypt)</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p>1. Obtain ACID number from NAFEZA before shipment</p>
            <p>2. Upload documents to CargoX platform</p>
            <p>3. Goods arrive at Egyptian port</p>
            <p>4. Submit customs declaration with ACID</p>
            <p>5. Customs inspection (physical/documentary)</p>
            <p>6. Pay duties and taxes</p>
            <p>7. Release of goods</p>
          </div>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Export Procedures (Egypt)</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p>1. Obtain export declaration from NAFEZA</p>
            <p>2. Prepare commercial documents (Invoice, Packing List, COO)</p>
            <p>3. Goods inspection at port of export</p>
            <p>4. Customs clearance for export</p>
            <p>5. Loading on vessel/aircraft</p>
            <p>6. Obtain BL/AWB</p>
            <p>7. Send documents to buyer</p>
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}