import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TenantProvider } from "@/contexts/TenantContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import OrderManagement from "./pages/OrderManagement";
import MenuManagement from "./pages/MenuManagement";
import DineInService from "./pages/DineInService";
import TakeawayOrders from "./pages/TakeawayOrders";
import DeliveryService from "./pages/DeliveryService";
import StaffManagement from "./pages/StaffManagement";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import PaymentProcessing from "./pages/PaymentProcessing";
import TenantPaymentGatewaySettings from "./pages/PaymentGatewaySettings";
import TransactionHistory from "./pages/TransactionHistory";
import SystemSettings from "./pages/SystemSettings";
import RestaurantSettings from "./pages/RestaurantSettings";
import UserManagement from "./pages/UserManagement";
import BackupManagement from "./pages/BackupManagement";
import TenantOnboarding from "./pages/TenantOnboarding";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import UserProfile from "./pages/UserProfile";
import TenantManagement from "./pages/superadmin/TenantManagement";
import SuperAdminUserManagement from "./pages/superadmin/UserManagement";
import SuperAdminAnalytics from "./pages/superadmin/Analytics";
import PaymentGatewaySettings from "./pages/superadmin/PaymentGatewaySettings";
import SuperAdminSystemSettings from "./pages/superadmin/SystemSettings";
import CustomerMenu from "./pages/CustomerMenu";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <TenantProvider>
          <CartProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            
            {/* Customer Routes */}
            <Route path="/order" element={<CustomerMenu />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            
            {/* Protected Routes */}
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <TenantOnboarding />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'superadmin']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'staff', 'customer']}>
                <OrderManagement />
              </ProtectedRoute>
            } />
            <Route path="/menu" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'staff']}>
                <MenuManagement />
              </ProtectedRoute>
            } />
            <Route path="/dine-in" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'staff']}>
                <DineInService />
              </ProtectedRoute>
            } />
            <Route path="/takeaway" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'staff']}>
                <TakeawayOrders />
              </ProtectedRoute>
            } />
            <Route path="/delivery" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'staff']}>
                <DeliveryService />
              </ProtectedRoute>
            } />
            <Route path="/staff" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <StaffManagement />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Analytics />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/payments" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <PaymentProcessing />
              </ProtectedRoute>
            } />
            <Route path="/payments/gateway-settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TenantPaymentGatewaySettings />
              </ProtectedRoute>
            } />
            <Route path="/payments/transactions" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <TransactionHistory />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SystemSettings />
              </ProtectedRoute>
            } />
            <Route path="/settings/restaurant" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RestaurantSettings />
              </ProtectedRoute>
            } />
            <Route path="/settings/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/settings/backup" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <BackupManagement />
              </ProtectedRoute>
            } />
            
            {/* User Profile Route */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            
            {/* SuperAdmin Routes */}
            <Route path="/superadmin/dashboard" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/tenants" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <TenantManagement />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/users" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdminUserManagement />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/analytics" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdminAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/payment-settings" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <PaymentGatewaySettings />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/settings" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdminSystemSettings />
              </ProtectedRoute>
            } />
            
            {/* Unauthorized route */}
            <Route path="/unauthorized" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
                  <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
              </div>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
            </TooltipProvider>
          </CartProvider>
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
