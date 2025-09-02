import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  ShoppingBag, 
  ArrowRight, 
  Briefcase, 
  Fingerprint, 
  Lock, 
  Users, 
  Activity, 
  Sparkles 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import IdentityVerification from "@/components/IdentityVerification";

export function HomePage() {
  const navigate = useNavigate();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/3">
      {/* Simplified Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-xl" />
        <div className="absolute bottom-20 -left-20 w-60 h-60 rounded-full bg-primary/5 blur-2xl" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Identity-First Commerce Revolution
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Trust Without
            </span>
            <br />
            <span className="text-foreground">
              Compromise
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            The world's first <span className="text-primary font-semibold">identity-verified e-commerce platform</span> powered by 
            Concordium blockchain. Zero-knowledge proofs, cryptographic trust, and privacy-preserving compliance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-8"
              onClick={() => navigate('/marketplace')}
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Start Shopping
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          {/* Prominent Become a Vendor Section */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/20 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ready to Start Selling?</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Join our vendor program for just $10 and start selling to verified customers worldwide.
              </p>
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white px-8 font-semibold"
                onClick={() => navigate('/vendor-registration')}
              >
                <Briefcase className="w-5 h-5 mr-2" />
                Become a Vendor - $10
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose CREDIFY?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Experience the future of e-commerce with our cutting-edge identity verification and blockchain technology.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 border-border/50 hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Fingerprint className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Zero-Knowledge Verification</h3>
                <p className="text-sm text-muted-foreground">Prove your identity without revealing personal data using advanced cryptographic proofs</p>
              </Card>
              
              <Card className="p-6 border-border/50 hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Smart Contract Escrow</h3>
                <p className="text-sm text-muted-foreground">Automated, secure transactions with built-in dispute resolution on Concordium blockchain</p>
              </Card>
              
              <Card className="p-6 border-border/50 hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Portable Reputation</h3>
                <p className="text-sm text-muted-foreground">Build your trust score once and use it across all platforms in the CREDIFY ecosystem</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Simple, secure, and revolutionary - here's how CREDIFY transforms online commerce</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-4 mx-auto">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2">Verify Identity</h3>
                <p className="text-sm text-muted-foreground">Connect your Concordium wallet and complete zero-knowledge identity verification</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-4 mx-auto">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2">Shop Securely</h3>
                <p className="text-sm text-muted-foreground">Browse verified products from trusted sellers with blockchain-powered security</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-4 mx-auto">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2">Build Reputation</h3>
                <p className="text-sm text-muted-foreground">Complete transactions to earn permanent reputation tokens that follow you everywhere</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">$48B</div>
                <div className="text-sm text-muted-foreground">Annual fraud prevented</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
                <div className="text-sm text-muted-foreground">Identity verified users</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Automated security</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">0-Fee</div>
                <div className="text-sm text-muted-foreground">Identity verification</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 md:p-12 text-center border-primary/20 bg-primary/5">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to revolutionize your commerce experience?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">Join thousands of verified buyers and sellers in the future of e-commerce</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-white px-8"
                  onClick={() => navigate('/marketplace')}
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Start Shopping
                </Button>
                <Button variant="outline" size="lg" className="border-primary/30 px-6">
                  <Activity className="w-4 h-4 mr-2" />
                  View Live Stats
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Identity Verification Modal */}
      <IdentityVerification
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onVerificationComplete={(tier) => {
          console.log('Verification completed for tier:', tier);
          setIsVerificationModalOpen(false);
        }}
      />
    </div>
  );
}