import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { TenantProvider } from "@/contexts/TenantContext";

import ProtectedRoute from "./components/ProtectedRoute";
import { AnalyticsLoading } from "./components/loading/AnalyticsLoading";
import { InventoryLoading } from "./components/loading/InventoryLoading";

// Critical pages - load immediately
import { Login } from "./features/auth";
import Index from "./pages/Index";

// Lazy load all other pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OrderManagement = lazy(() => import("./features/orders/pages/OrderManagement"));
const MenuManagement = lazy(() => import("./features/menu/pages/MenuManagement"));
const InventoryManagement = lazy(() => import("./features/inventory/pages/InventoryManagement"));
const DineInService = lazy(() => import("./pages/DineInService"));
const TakeawayOrders = lazy(() => import("./pages/TakeawayOrders"));
const DeliveryService = lazy(() => import("./pages/DeliveryService"));
const KitchenDisplay = lazy(() => import("./pages/KitchenDisplay"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const Analytics = lazy(() => import("./pages/Analytics"));
const RealTimeAnalytics = lazy(() => import("./pages/RealTimeAnalytics"));
const Reports = lazy(() => import("./pages/Reports"));
const PaymentProcessing = lazy(() => import("./pages/PaymentProcessing"));
const TenantPaymentGatewaySettings = lazy(() => import("./pages/PaymentGatewaySettings"));
const TransactionHistory = lazy(() => import("./pages/TransactionHistory"));
const SystemSettings = lazy(() => import("./pages/SystemSettings"));
const RestaurantSettings = lazy(() => import("./pages/RestaurantSettings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const BackupManagement = lazy(() => import("./pages/BackupManagement"));
const BranchManagement = lazy(() => import("./pages/BranchManagement"));
const TenantOnboarding = lazy(() => import("./pages/TenantOnboarding"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const UserProfile = lazy(() => import("./features/auth/pages/UserProfile"));
const TenantManagement = lazy(() => import("./pages/superadmin/TenantManagement"));
const SuperAdminUserManagement = lazy(() => import("./pages/superadmin/UserManagement"));
const SuperAdminAnalytics = lazy(() => import("./pages/superadmin/Analytics"));
const PaymentGatewaySettings = lazy(() => import("./pages/superadmin/PaymentGatewaySettings"));
const SuperAdminSystemSettings = lazy(() => import("./pages/superadmin/SystemSettings"));
const CustomerMenu = lazy(() => import("./features/menu/pages/CustomerMenu"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
import NotFound from "./pages/NotFound";

// Loading component for lazy loaded pages
const PageLoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex items-center space-x-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-lg text-muted-foreground">Loading...</span>
    </div>
  </div>
);

// Helper component to wrap lazy loaded components with Suspense
const LazyRoute = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <Suspense fallback={fallback || <PageLoadingSpinner />}>
    {children}
  </Suspense>
);

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
            {/* Public Routes - No Suspense needed */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            
            {/* Customer Routes - Wrapped in Suspense */}
            <Route path="/order" element={
              <LazyRoute><CustomerMenu /></LazyRoute>
            } />
            <Route path="/checkout" element={
              <LazyRoute><Checkout /></LazyRoute>
            } />
            <Route path="/order-confirmation" element={
              <LazyRoute><OrderConfirmation /></LazyRoute>
            } />
            
            {/* Protected Routes */}
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <LazyRoute><TenantOnboarding /></LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'superadmin']}>
                <LazyRoute><Dashboard /></LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'staff', 'customer']}>
                <LazyRoute><OrderManagement /></LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/menu" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'staff']}>
                <MenuManagement />
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <LazyRoute fallback={<InventoryLoading />}>
                  <InventoryManagement />
                </LazyRoute>
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
            <Route path="/kitchen" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'staff']}>
                <LazyRoute><KitchenDisplay /></LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/staff" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <StaffManagement />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <LazyRoute fallback={<AnalyticsLoading />}>
                  <Analytics />
                </LazyRoute>
              </ProtectedRoute>
            } />
            <Route path="/real-time-analytics" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <LazyRoute fallback={<AnalyticsLoading />}>
                  <RealTimeAnalytics />
                </LazyRoute>
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
            <Route path="/branches" element={
              <ProtectedRoute allowedRoles={['admin', 'owner']}>
                <LazyRoute><BranchManagement /></LazyRoute>
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
