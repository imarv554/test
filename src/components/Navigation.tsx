import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { WalletConnection } from "@/components/WalletConnection";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="relative z-50 border-b border-border/30 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <NavLink 
            to="/" 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-46 flex items-center justify-center">
              <img src="/credify-logo.png" alt="Credify Logo" />
            </div>
          </NavLink>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => scrollToSection('features')} 
              className="text-sm hover:text-primary transition-colors font-medium"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')} 
              className="text-sm hover:text-primary transition-colors font-medium"
            >
              How It Works
            </button>
            <NavLink 
              to="/marketplace" 
              className={({ isActive }) => 
                `text-sm hover:text-primary transition-colors font-medium ${isActive ? 'text-primary' : ''}`
              }
            >
              Marketplace
            </NavLink>
            <NavLink 
              to="/vendor-login" 
              className={({ isActive }) => 
                `text-sm hover:text-primary transition-colors font-medium ${isActive ? 'text-primary' : ''}`
              }
            >
              Vendor Login
            </NavLink>
            <WalletConnection />
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/30 mt-4 pt-4 pb-4 space-y-4">
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => scrollToSection('features')} 
                className="text-sm hover:text-primary transition-colors py-2 text-left font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')} 
                className="text-sm hover:text-primary transition-colors py-2 text-left font-medium"
              >
                How It Works
              </button>
              <NavLink 
                to="/marketplace" 
                className={({ isActive }) => 
                  `text-sm hover:text-primary transition-colors py-2 text-left font-medium ${isActive ? 'text-primary' : ''}`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Marketplace
              </NavLink>
              <NavLink 
                to="/vendor-login" 
                className={({ isActive }) => 
                  `text-sm hover:text-primary transition-colors py-2 text-left font-medium ${isActive ? 'text-primary' : ''}`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Vendor Login
              </NavLink>
              <div className="py-2">
                <WalletConnection />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}