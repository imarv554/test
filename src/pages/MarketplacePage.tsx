import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductCatalog } from "@/components/ProductCatalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletConnection } from "@/components/WalletConnection";
import IdentityVerification from "@/components/IdentityVerification";
import { Shield, ArrowLeft, Menu, X } from "lucide-react";

interface MarketplacePageProps {
  onNavigateHome: () => void;
}

export function MarketplacePage({ onNavigateHome }: MarketplacePageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-trust opacity-20 blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 -left-40 w-60 h-60 rounded-full bg-gradient-identity opacity-20 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-40 h-40 rounded-full bg-gradient-innovation opacity-30 blur-2xl animate-pulse-slow" />
      </div>


      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gradient-trust">CREDIFY Marketplace</h1>
          <p className="text-muted-foreground">
            Discover amazing products from verified sellers with blockchain-powered trust and security.
          </p>
        </div>

        <ProductCatalog />
      </main>

      
      {/* Identity Verification Modal */}
      <IdentityVerification
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onVerificationComplete={(tier) => {
          console.log('Verification completed for tier:', tier);
          // You could show a success message here
        }}
      />
    </div>
  );
}

export default MarketplacePage;