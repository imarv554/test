import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AvalancheProvider } from "@/contexts/AvalancheContext";
import { ConcordiumProvider } from "@/contexts/ConcordiumContext";
import { CartProvider } from "@/contexts/CartContext";
import { CartSheet } from "@/components/ShoppingCart";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HomePage } from "@/pages/HomePage";
import { MarketplacePage } from "@/pages/MarketplacePage";
import { SellerDashboard } from "@/pages/SellerDashboard";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { VendorRegistration } from "@/pages/VendorRegistration";
import { OrderTracking } from "@/pages/OrderTracking";

export default function App() {
  const location = useLocation();

  // Handle secret admin URLs
  useEffect(() => {
    const checkAdminAccess = () => {
      const path = location.pathname;
      const hash = location.hash;
      const search = location.search;

      if (
        path === '/credify-admin-secure' ||
        hash === '#credify-admin-secure' ||
        search.includes('admin-secure') ||
        path.includes('admin-secure')
      ) {
        window.history.replaceState({}, '', '/admin-login');
      }
    };

    checkAdminAccess();
  }, [location]);

  return (
    <AvalancheProvider>
      <ConcordiumProvider>
        <CartProvider>
          <ErrorBoundary>
            <div className="relative">
              <Navigation />
              <div className="fixed bottom-4 right-4 z-50">
                <CartSheet />
              </div>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/seller" element={<SellerDashboard />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/vendor-registration" element={<VendorRegistration />} />
                <Route path="/order-tracking" element={<OrderTracking />} />
                <Route path="/credify-admin-secure" element={<Navigate to="/admin-login" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Footer />
            </div>
          </ErrorBoundary>
        </CartProvider>
      </ConcordiumProvider>
    </AvalancheProvider>
  );
}