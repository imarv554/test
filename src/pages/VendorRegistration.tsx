import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Store,
  DollarSign,
  Shield,
  CheckCircle,
  CreditCard,
  Coins,
  Zap,
  Loader2,
  User,
  Mail,
  Building,
  Globe,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { useConcordium } from "@/contexts/ConcordiumContext";
import { useAvalanche } from "@/contexts/AvalancheContext";
import { convertUsdToAvax, convertUsdToCcd } from "@/utils/exchangeRates";
import { ethers } from "ethers";

interface VendorRegistrationProps {
  onNavigateHome: () => void;
}

interface VendorFormData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessDescription: string;
  website: string;
  businessAddress: string;
  concordiumAddress: string;
  avalancheAddress: string;
}

// PayStack types
declare global {
  interface Window {
    PaystackPop: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref?: string;
        callback: (response: any) => void;
        onClose: () => void;
        metadata?: any;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

export function VendorRegistration({ onNavigateHome }: VendorRegistrationProps) {
  const { state: concordiumState, connect: connectConcordium } = useConcordium();
  const { state: avalancheState, connect: connectAvalanche } = useAvalanche();
  
  const [formData, setFormData] = useState<VendorFormData>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    businessDescription: '',
    website: '',
    businessAddress: '',
    concordiumAddress: '',
    avalancheAddress: ''
  });

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ccd' | 'avax' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<VendorFormData>>({});

  const REGISTRATION_FEE = 10; // $10 USD

  const validateForm = (): boolean => {
    const errors: Partial<VendorFormData> = {};
    
    if (!formData.businessName.trim()) errors.businessName = 'Business name is required';
    if (!formData.ownerName.trim()) errors.ownerName = 'Owner name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.email.includes('@')) errors.email = 'Valid email is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.businessDescription.trim()) errors.businessDescription = 'Business description is required';
    if (!formData.businessAddress.trim()) errors.businessAddress = 'Business address is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof VendorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePaymentMethod = async (method: 'card' | 'ccd' | 'avax') => {
    if (!validateForm()) {
      alert('Please fill in all required fields before proceeding to payment.');
      return;
    }

    setPaymentMethod(method);
    setShowPaymentDialog(true);
  };

  const processPayment = async () => {
    if (!paymentMethod) return;
    
    setIsProcessing(true);
    
    try {
      let paymentResult;
      
      if (paymentMethod === 'card') {
        paymentResult = await processCardPayment();
      } else if (paymentMethod === 'ccd') {
        paymentResult = await processCCDPayment();
      } else if (paymentMethod === 'avax') {
        paymentResult = await processAVAXPayment();
      }

      // Save vendor registration after successful payment
      await saveVendorRegistration(paymentResult);
      
      setRegistrationSuccess(true);
      
    } catch (error) {
      console.error('Payment failed:', error);
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processCardPayment = async () => {
    const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    
    if (!paystackPublicKey) {
      throw new Error('PayStack public key not configured');
    }

    const amountInCents = REGISTRATION_FEE * 100; // Convert to cents for USD
    
    return new Promise((resolve, reject) => {
      if (!window.PaystackPop) {
        reject(new Error('PayStack library not loaded'));
        return;
      }
      
      const reference = `vendor_reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const handler = window.PaystackPop.setup({
        key: paystackPublicKey,
        email: formData.email,
        amount: amountInCents,
        currency: 'USD',
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Business Name",
              variable_name: "business_name",
              value: formData.businessName
            },
            {
              display_name: "Owner Name",
              variable_name: "owner_name", 
              value: formData.ownerName
            },
            {
              display_name: "Registration Type",
              variable_name: "registration_type",
              value: "Vendor Registration"
            },
            {
              display_name: "Platform",
              variable_name: "platform",
              value: "CREDIFY"
            }
          ]
        },
        callback: function(response: any) {
          console.log('PayStack vendor registration payment successful:', response);
          resolve({
            success: true,
            txHash: response.reference,
            amount: REGISTRATION_FEE,
            method: 'card'
          });
        },
        onClose: function() {
          reject(new Error('Payment was cancelled by user'));
        }
      });
      
      handler.openIframe();
    });
  };

  const processCCDPayment = async () => {
    if (!concordiumState.isConnected || !concordiumState.account) {
      throw new Error('Concordium wallet not connected');
    }

    const recipientAddress = import.meta.env.VITE_CONCORDIUM_ADDRESS || '3SwtbfyHrT68giUKV6FzDAxBBPo9xbsLgjG34U3UXfJrNJFxbL';
    const ccdAmount = await convertUsdToCcd(REGISTRATION_FEE);
    const microCcdAmount = Math.round(ccdAmount * 1000000);
    
    return new Promise((resolve, reject) => {
      try {
        const transferData = {
          amount: microCcdAmount,
          toAddress: recipientAddress,
          fromAddress: concordiumState.account,
          metadata: {
            registrationId: `vendor_reg_${Date.now()}`,
            businessName: formData.businessName,
            ownerName: formData.ownerName,
            email: formData.email,
            registrationType: 'Vendor Registration'
          }
        };
        
        console.log('Processing CCD vendor registration payment:', transferData);
        
        // Simulate CCD payment (replace with actual Concordium SDK in production)
        setTimeout(() => {
          resolve({
            success: true,
            txHash: `ccd_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: ccdAmount,
            method: 'ccd'
          });
        }, 3000);
        
      } catch (error) {
        reject(error);
      }
    });
  };

  const processAVAXPayment = async () => {
    if (!avalancheState.isConnected || !avalancheState.account || !avalancheState.signer) {
      throw new Error('Avalanche wallet not connected');
    }

    const recipientAddress = import.meta.env.VITE_AVALANCHE_ADDRESS || '0x65b7a307a7e67e38840b91f9a36bf8dfe6e02901';
    const avaxAmount = await convertUsdToAvax(REGISTRATION_FEE);
    const avaxAmountStr = avaxAmount.toFixed(6);
    
    try {
      console.log('Processing AVAX vendor registration payment:', {
        amount: avaxAmountStr,
        to: recipientAddress,
        from: avalancheState.account
      });

      const tx = await avalancheState.signer.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther(avaxAmountStr),
        gasLimit: 21000
      });

      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt not received');
      }

      return {
        success: true,
        txHash: receipt.hash,
        amount: avaxAmountStr,
        method: 'avax'
      };
      
    } catch (error) {
      throw new Error(`AVAX payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const saveVendorRegistration = async (paymentResult: any) => {
    const vendorData = {
      ...formData,
      id: Date.now().toString(),
      registrationDate: new Date().toISOString(),
      status: 'active',
      paymentDetails: paymentResult,
      registrationFee: REGISTRATION_FEE,
      productsCount: 0
    };

    // Save to localStorage (replace with database call in production)
    localStorage.setItem(`vendor_${vendorData.id}`, JSON.stringify(vendorData));
    console.log('Vendor registration saved:', vendorData);
  };

  const handleDialogClose = () => {
    if (registrationSuccess) {
      setRegistrationSuccess(false);
      setShowPaymentDialog(false);
      onNavigateHome();
    } else if (!isProcessing) {
      setShowPaymentDialog(false);
      setPaymentMethod(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/3">
      {/* Header */}
      <nav className="border-b border-border/30 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateHome}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">CREDIFY</span>
              <Badge variant="secondary" className="ml-2">Vendor Registration</Badge>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Become a CREDIFY Vendor</h1>
          <p className="text-muted-foreground mb-6">
            Join our verified marketplace and start selling to authenticated buyers worldwide
          </p>
          
          <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold text-primary">Registration Fee: $10 USD</span>
            <Badge variant="secondary" className="ml-2">One-time payment</Badge>
          </div>
        </div>

        {/* Benefits Section */}
        <Card className="p-6 mb-8 border-primary/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Why Become a CREDIFY Vendor?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Verified Buyers</p>
                <p className="text-xs text-muted-foreground">All customers are identity-verified</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Secure Payments</p>
                <p className="text-xs text-muted-foreground">Blockchain-powered escrow protection</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Global Reach</p>
                <p className="text-xs text-muted-foreground">Access to worldwide customer base</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Registration Form */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Vendor Registration Form</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-primary">Business Information</h4>
              
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Your business name"
                  className={formErrors.businessName ? 'border-red-500' : ''}
                />
                {formErrors.businessName && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.businessName}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="businessDescription">Business Description *</Label>
                <Textarea
                  id="businessDescription"
                  value={formData.businessDescription}
                  onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                  placeholder="Describe your business and products"
                  rows={3}
                  className={formErrors.businessDescription ? 'border-red-500' : ''}
                />
                {formErrors.businessDescription && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.businessDescription}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="businessAddress">Business Address *</Label>
                <Textarea
                  id="businessAddress"
                  value={formData.businessAddress}
                  onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                  placeholder="Your business address"
                  rows={2}
                  className={formErrors.businessAddress ? 'border-red-500' : ''}
                />
                {formErrors.businessAddress && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.businessAddress}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-primary">Contact Information</h4>
              
              <div>
                <Label htmlFor="ownerName">Owner/Contact Name *</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  placeholder="Your full name"
                  className={formErrors.ownerName ? 'border-red-500' : ''}
                />
                {formErrors.ownerName && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.ownerName}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  className={formErrors.email ? 'border-red-500' : ''}
                />
                {formErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className={formErrors.phone ? 'border-red-500' : ''}
                />
                {formErrors.phone && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="concordiumAddress">Concordium Wallet (Optional)</Label>
                <Input
                  id="concordiumAddress"
                  value={formData.concordiumAddress}
                  onChange={(e) => handleInputChange('concordiumAddress', e.target.value)}
                  placeholder="Your CCD wallet address"
                />
                <p className="text-xs text-muted-foreground mt-1">For receiving CCD payments</p>
              </div>
              
              <div>
                <Label htmlFor="avalancheAddress">Avalanche Wallet (Optional)</Label>
                <Input
                  id="avalancheAddress"
                  value={formData.avalancheAddress}
                  onChange={(e) => handleInputChange('avalancheAddress', e.target.value)}
                  placeholder="0x... your AVAX wallet address"
                />
                <p className="text-xs text-muted-foreground mt-1">For receiving AVAX payments</p>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Payment Options */}
          <div className="space-y-4">
            <h4 className="font-medium text-primary">Choose Payment Method</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Complete your vendor registration with a one-time $10 USD payment
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={() => handlePaymentMethod('card')}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay with Card
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full border-blue-300 hover:bg-blue-50 text-blue-700"
                onClick={() => handlePaymentMethod('ccd')}
              >
                <Coins className="w-4 h-4 mr-2" />
                Pay with CCD
              </Button>
              
              {/* AVAX Payment temporarily disabled */}
              {/*
              <Button 
                variant="outline" 
                className="w-full border-orange-300 hover:bg-orange-50 text-orange-700"
                onClick={() => handlePaymentMethod('avax')}
              >
                <Zap className="w-4 h-4 mr-2" />
                Pay with AVAX
              </Button>
              */}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Secure payment powered by PayStack, Concordium & Avalanche blockchain</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {registrationSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Registration Successful!
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5 text-primary" />
                  Complete Vendor Registration
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {registrationSuccess 
                ? 'Welcome to CREDIFY! Your vendor account has been activated.'
                : `Pay $${REGISTRATION_FEE} USD to complete your vendor registration`
              }
            </DialogDescription>
          </DialogHeader>

          {!registrationSuccess && !isProcessing && (
            <div className="space-y-4">
              {/* Business Info Summary */}
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm font-medium">{formData.businessName}</p>
                <p className="text-xs text-muted-foreground">{formData.ownerName} • {formData.email}</p>
              </div>

              {/* Payment Method Info */}
              {paymentMethod === 'card' && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded">
                  <CreditCard className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Secure Card Payment</p>
                    <p className="text-xs">Powered by PayStack • SSL Encrypted</p>
                  </div>
                </div>
              )}

              {paymentMethod === 'ccd' && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                  <Coins className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Concordium CCD Payment</p>
                    <p className="text-xs">
                      {concordiumState.isConnected 
                        ? `Connected: ${concordiumState.account?.slice(0, 10)}...` 
                        : 'Wallet connection required'}
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === 'avax' && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/20 p-3 rounded">
                  <Zap className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Avalanche AVAX Payment</p>
                    <p className="text-xs">
                      {avalancheState.isConnected 
                        ? `Connected: ${avalancheState.account?.slice(0, 10)}...` 
                        : 'MetaMask connection required'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {registrationSuccess && (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Your vendor account is now active. You can start uploading products and selling to verified customers.
              </p>
              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                <p className="text-xs text-green-700">
                  Check your email for vendor dashboard access instructions.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            {!registrationSuccess ? (
              <Button 
                onClick={processPayment}
                disabled={isProcessing}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {paymentMethod === 'card' ? 'Opening PayStack...' : 
                     paymentMethod === 'avax' ? 'Processing AVAX...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pay ${REGISTRATION_FEE} USD
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleDialogClose} className="flex-1">
                Continue to Dashboard
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}