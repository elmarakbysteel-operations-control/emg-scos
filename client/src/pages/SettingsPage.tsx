import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Settings } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-700" />
          Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">System configuration</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-slate-700 mb-4">General Settings</h3>
            <div className="space-y-4">
              <div><Label>Company Name</Label><Input defaultValue="ELMARAKBY Group" /></div>
              <div><Label>Default Currency</Label><Input defaultValue="USD" /></div>
              <div><Label>Default Port</Label><Input defaultValue="Alexandria" /></div>
              <div><Label>Email Domain</Label><Input defaultValue="@elmarakby.com" /></div>
              <div><Label>Customs Broker</Label><Input defaultValue="" placeholder="Enter customs broker name" /></div>
              <Button className="bg-blue-700 hover:bg-blue-800 w-full" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" /> Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-slate-700 mb-4">Notifications &amp; Alerts</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-slate-700">Free Time Expiry Alert</p><p className="text-xs text-slate-500">Alert when free time is about to expire</p></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-slate-700">Demurrage Warning</p><p className="text-xs text-slate-500">Warning when demurrage charges apply</p></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-slate-700">Document Gap Alert</p><p className="text-xs text-slate-500">Alert when required documents are missing</p></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-slate-700">ETA Update Notification</p><p className="text-xs text-slate-500">Notify on ETA changes</p></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-slate-700">Task Deadline Reminder</p><p className="text-xs text-slate-500">Reminder before task deadlines</p></div>
                <Switch />
              </div>
              <Button className="bg-blue-700 hover:bg-blue-800 w-full" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" /> Save Notification Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
