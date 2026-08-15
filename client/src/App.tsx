import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import OperationsDashboard from "./pages/OperationsDashboard";
import ShipmentRegister from "./pages/ShipmentRegister";
import Procurement from "./pages/Procurement";
import SupplierManagement from "./pages/SupplierManagement";
import FreightManagement from "./pages/FreightManagement";
import CustomsManagement from "./pages/CustomsManagement";
import CostControl from "./pages/CostControl";
import DocumentsCenter from "./pages/DocumentsCenter";
import TaskManager from "./pages/TaskManager";
import ReportsCenter from "./pages/ReportsCenter";
import FreeTimeAlerts from "./pages/FreeTimeAlerts";
import BankLCTracking from "./pages/BankLCTracking";
import DocDiscrepancy from "./pages/DocDiscrepancy";
import KpiDashboard from "./pages/KpiDashboard";
import MasterData from "./pages/MasterData";
import EmailTemplates from "./pages/EmailTemplates";
import FormsLibrary from "./pages/FormsLibrary";
import KnowledgeCenter from "./pages/KnowledgeCenter";
import SettingsPage from "./pages/SettingsPage";
import AuditLog from "./pages/AuditLog";
import AboutSystem from "./pages/AboutSystem";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <DashboardLayout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/operations" component={OperationsDashboard} />
              <Route path="/shipments" component={ShipmentRegister} />
              <Route path="/alerts" component={FreeTimeAlerts} />
              <Route path="/procurement" component={Procurement} />
              <Route path="/suppliers" component={SupplierManagement} />
              <Route path="/freight" component={FreightManagement} />
              <Route path="/bank-lc" component={BankLCTracking} />
              <Route path="/customs" component={CustomsManagement} />
              <Route path="/doc-check" component={DocDiscrepancy} />
              <Route path="/costs" component={CostControl} />
              <Route path="/documents" component={DocumentsCenter} />
              <Route path="/tasks" component={TaskManager} />
              <Route path="/reports" component={ReportsCenter} />
              <Route path="/kpi" component={KpiDashboard} />
              <Route path="/master-data" component={MasterData} />
              <Route path="/email-templates" component={EmailTemplates} />
              <Route path="/forms" component={FormsLibrary} />
              <Route path="/knowledge" component={KnowledgeCenter} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/audit" component={AuditLog} />
              <Route path="/about" component={AboutSystem} />
              <Route path="/404" component={NotFound} />
              <Route component={NotFound} />
            </Switch>
          </DashboardLayout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
