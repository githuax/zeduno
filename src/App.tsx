import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TenantProvider } from "@/contexts/TenantContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import OrderManagement from "./pages/OrderManagement";
import DineInService from "./pages/DineInService";
import TakeawayOrders from "./pages/TakeawayOrders";
import DeliveryService from "./pages/DeliveryService";
import StaffManagement from "./pages/StaffManagement";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import PaymentProcessing from "./pages/PaymentProcessing";
import TransactionHistory from "./pages/TransactionHistory";
import SystemSettings from "./pages/SystemSettings";
import RestaurantSettings from "./pages/RestaurantSettings";
import UserManagement from "./pages/UserManagement";
import BackupManagement from "./pages/BackupManagement";
import TenantOnboarding from "./pages/TenantOnboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TenantProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/onboarding" element={<TenantOnboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders" element={<OrderManagement />} />
            <Route path="/dine-in" element={<DineInService />} />
            <Route path="/takeaway" element={<TakeawayOrders />} />
            <Route path="/delivery" element={<DeliveryService />} />
            <Route path="/staff" element={<StaffManagement />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/payments" element={<PaymentProcessing />} />
            <Route path="/payments/transactions" element={<TransactionHistory />} />
            <Route path="/settings" element={<SystemSettings />} />
            <Route path="/settings/restaurant" element={<RestaurantSettings />} />
            <Route path="/settings/users" element={<UserManagement />} />
            <Route path="/settings/backup" element={<BackupManagement />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TenantProvider>
  </QueryClientProvider>
);

export default App;
