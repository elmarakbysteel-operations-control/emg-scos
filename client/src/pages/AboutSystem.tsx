import { Card, CardContent } from "@/components/ui/card";
import { Shield, Cpu, Database, Globe } from "lucide-react";

export default function AboutSystem() {
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold text-slate-900 font-serif">About System</h1><p className="text-sm text-slate-500 mt-1">EMG-SCOS Professional Edition v1.0</p></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-6">
        <div className="space-y-6">
          <div><h2 className="text-lg font-bold text-slate-800">EMG-SCOS</h2><p className="text-sm text-slate-600 mt-1">Enterprise Management & Governance - Supply Chain Operating System</p><p className="text-xs text-slate-500 mt-2">Version 1.0 Professional Edition</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Shield, title: "Security", desc: "Enterprise-grade authentication with role-based access control" },
              { icon: Cpu, title: "Performance", desc: "Real-time data processing with optimized queries" },
              { icon: Database, title: "Data Integrity", desc: "Relational database with referential integrity constraints" },
              { icon: Globe, title: "Compliance", desc: "NAFEZA, ACID, UCR compliant workflows" },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50"><f.icon className="w-5 h-5 text-blue-600 mt-0.5" /><div><h3 className="text-sm font-semibold text-slate-800">{f.title}</h3><p className="text-xs text-slate-500">{f.desc}</p></div></div>
            ))}
          </div>
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-400">Built for ELMARAKBY Group - International Logistics & Customs Clearance</p>
            <p className="text-xs text-slate-400 mt-1">Copyright 2026 EMG-SCOS. All rights reserved.</p>
          </div>
        </div>
      </CardContent></Card>
    </div>
  );
}