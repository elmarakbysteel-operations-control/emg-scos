import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Cpu, Database, Globe, Anchor, Info } from "lucide-react";

export default function AboutSystem() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
          <Info className="w-6 h-6 text-blue-700" />
          About System
        </h1>
        <p className="text-sm text-slate-500 mt-1">EMG-SCOS Professional Edition v1.0</p>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Anchor className="w-10 h-10 text-blue-700" />
              <div>
                <h2 className="text-lg font-bold text-slate-800">EMG-SCOS</h2>
                <p className="text-sm text-slate-600">Enterprise Management &amp; Governance - Supply Chain Operating System</p>
                <Badge className="mt-1 bg-blue-100 text-blue-700 border-0">Professional Edition v1.0</Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Shield, title: "Security", desc: "Enterprise-grade authentication with role-based access control" },
                { icon: Cpu, title: "Performance", desc: "Real-time data processing with optimized queries" },
                { icon: Database, title: "Data Integrity", desc: "Relational database with referential integrity constraints" },
                { icon: Globe, title: "Compliance", desc: "NAFEZA, ACID, UCR compliant workflows" },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                  <f.icon className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{f.title}</h3>
                    <p className="text-xs text-slate-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600">Built for <strong>ELMARAKBY Group</strong> - International Logistics &amp; Customs Clearance</p>
              <p className="text-xs text-slate-400 mt-2">Copyright 2026 EMG-SCOS. All rights reserved.</p>
              <p className="text-xs text-slate-400 mt-1">Developed by Ahmed Adel Ahmed Ibrahim El-Ghabashi - International Shipping &amp; Customs Clearance Logistics Specialist</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
