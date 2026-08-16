import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Settings, BellRing, TestTube2, Send } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";

const EVENT_META: Record<string, { ar: string; en: string; desc: string }> = {
  free_time_expiry: { ar: "اقتراب انتهاء السماح المجاني", en: "Free Time Expiry Alert", desc: "تنبيه فوري عند اقتراب انتهاء أيام السماح المجاني لأي شحنة (7 أيام)" },
  demurrage_risk: { ar: "خطر Demurrage", en: "Demurrage Warning", desc: "تنبيه فوري عند انتهاء السماح المجاني وبدء احتساب الغرامات اليومية" },
  lc_expiry: { ar: "انتهاء الاعتمادات المستندية", en: "LC/TT Expiry", desc: "تنبيه عند اقتراب أو انتهاء صلاحية الاعتماد/التحويل المصرفي" },
  eta_overdue: { ar: "تأخر وصول الشحنة", en: "ETA Overdue", desc: "تنبيه عند تأخر وصول الشحنة عن الموعد المتوقع" },
  document_missing: { ar: "نقص مستندات", en: "Document Gap Alert", desc: "تنبيه عند اكتشاف نقص في المستندات المطلوبة" },
  shipment_arrived: { ar: "وصول شحنة جديدة", en: "Shipment Arrival", desc: "تنبيه عند تسجيل وصول شحنة وإنشاء مهام التخليص تلقائيًا" },
  discrepancy_found: { ar: "تناقض مستندي", en: "Document Discrepancy", desc: "تنبيه عند اكتشاف تناقض بين الفاتورة والبوليصة والبيان الجمركي" },
};

export default function SettingsPage() {
  const { data: settings, isLoading, refetch } = trpc.notifications.settings.useQuery(undefined, { staleTime: 30_000 });
  const updateMutation = trpc.notifications.updateSetting.useMutation();
  const utils = trpc.useUtils();

  const enabledMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of settings || []) m.set(s.eventKey, s.enabled);
    return m;
  }, [settings]);

  const testMutation = trpc.notifications.test.useMutation({
    onSuccess: (res) => {
      if (res.success) toast.success("تم إرسال الإشعار التجريبي إلى هاتفك/حسابك بنجاح ✓");
      else toast.warning("فشل إرسال الإشعار التجريبي — تحقق من إعدادات الحساب");
    },
    onError: (e) => toast.error(`تعذر إرسال الإشعار: ${e.message}`),
  });

  const digestMutation = trpc.notifications.sendDigest.useMutation({
    onSuccess: (res) => {
      if ((res as any).sent > 0) toast.success(`تم إرسال ${((res as any).sent)} إشعار — تحقق من جرس التنبيهات`);
      else toast.info("لا توجد تنبيهات جديدة غير مرسلة حاليًا");
    },
    onError: (e) => toast.error(`تعذر الإرسال: ${e.message}`),
  });

  const [companyName, setCompanyName] = useState("ELMARAKBY Group");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [defaultPort, setDefaultPort] = useState("Alexandria");
  const [emailDomain, setEmailDomain] = useState("@elmarakby.com");
  const [brokerName, setBrokerName] = useState("");
  const [saved, setSaved] = useState(true);

  const toggle = async (eventKey: string) => {
    const cur = enabledMap.get(eventKey) ?? "yes";
    const next = cur === "yes" ? "no" : "yes";
    try {
      await updateMutation.mutateAsync({ eventKey, enabled: next as "yes" | "no" });
      toast.success(cur === "yes" ? "تم إيقاف هذا الإشعار" : "تم تفعيل هذا الإشعار");
      utils.notifications.settings.invalidate();
    } catch {
      toast.error("تعذر تحديث الإعداد — تحقق من الاتصال");
    }
  };

  const handleSave = () => {
    localStorage.setItem(
      "emg-settings",
      JSON.stringify({ companyName, defaultCurrency, defaultPort, emailDomain, brokerName })
    );
    setSaved(true);
    toast.success("تم حفظ الإعدادات العامة بنجاح");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-700" /> Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">System configuration &amp; notification preferences</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ---------- General Settings ---------- */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-slate-700 mb-4">General Settings</h3>
            <div className="space-y-4">
              <div>
                <Label>Company Name</Label>
                <Input value={companyName} onChange={(e) => { setCompanyName(e.target.value); setSaved(false); }} />
              </div>
              <div>
                <Label>Default Currency</Label>
                <Input value={defaultCurrency} onChange={(e) => { setDefaultCurrency(e.target.value); setSaved(false); }} />
              </div>
              <div>
                <Label>Default Port</Label>
                <Input value={defaultPort} onChange={(e) => { setDefaultPort(e.target.value); setSaved(false); }} />
              </div>
              <div>
                <Label>Email Domain</Label>
                <Input value={emailDomain} onChange={(e) => { setEmailDomain(e.target.value); setSaved(false); }} />
              </div>
              <div>
                <Label>Customs Broker</Label>
                <Input value={brokerName} placeholder="Enter customs broker name" onChange={(e) => { setBrokerName(e.target.value); setSaved(false); }} />
              </div>
              <Button className="bg-blue-700 hover:bg-blue-800 w-full" onClick={handleSave} disabled={saved}>
                <Save className="w-4 h-4 mr-1" /> {saved ? "Saved ✓" : "Save Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ---------- Custom Notifications ---------- */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <BellRing className="w-4 h-4 text-blue-700" /> Custom Notifications
              </h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={testMutation.isPending}
                  onClick={() => testMutation.mutate()}
                >
                  <TestTube2 className="w-3.5 h-3.5 mr-1" />
                  {testMutation.isPending ? "..." : "اختبار إشعار"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-blue-700 border-blue-300"
                  disabled={digestMutation.isPending}
                  onClick={() => digestMutation.mutate()}
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  {digestMutation.isPending ? "..." : "إرسال كل المعلقة"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              الإشعارات المخصصة تصل فوريًا إلى حسابك (جرس التنبيهات + إشعارات Manus). المهمة المجدولة اليومية (06:00 UTC)
              تجمع التنبيهات الجديدة وترسل ملخصًا واحدًا لكل نوع — بدون تكرار، والإشعارات الفاشلة تُعاد المحاولة تلقائيًا.
              {isLoading ? " (جارٍ تحميل التفضيلات...)" : ""}
            </p>
            <div className="space-y-1">
              {Object.entries(EVENT_META).map(([key, meta]) => {
                const enabled = enabledMap.get(key) ?? "yes";
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {meta.ar} <span className="text-xs text-slate-400 font-normal">({meta.en})</span>
                      </p>
                      <p className="text-xs text-slate-500 leading-snug mt-0.5">{meta.desc}</p>
                    </div>
                    <Switch
                      checked={enabled === "yes"}
                      onCheckedChange={() => toggle(key)}
                      disabled={updateMutation.isPending || isLoading}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
