import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold text-slate-900 font-serif">Settings</h1><p className="text-sm text-slate-500 mt-1">System configuration</p></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-5">
        <div className="space-y-4">
          <div><Label>Company Name</Label><Input defaultValue="ELMARAKBY Group" /></div>
          <div><Label>Default Currency</Label><Input defaultValue="USD" /></div>
          <div><Label>Default Port</Label><Input defaultValue="Alexandria" /></div>
          <div><Label>Email Domain</Label><Input defaultValue="@elmarakby.com" /></div>
          <div><Label>Customs Broker</Label><Input defaultValue="" /></div>
          <Button className="bg-blue-700 hover:bg-blue-800"><Save className="w-4 h-4 mr-1" /> Save Settings</Button>
        </div>
      </CardContent></Card>
    </div>
  );
}