import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Shield, 
  CreditCard, 
  Coins,
  AlertTriangle,
  CheckCircle,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Zap
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useConcordium } from "@/contexts/ConcordiumContext";
import { useAvalanche } from "@/contexts/AvalancheContext";
import { convertUsdToAvax, convertUsdToCcd } from "@/utils/exchangeRates";
import { ethers } from "ethers";

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

export function CartSheet() {
  const { state, updateQuantity, removeItem, clearCart, toggleCart, closeCart } = useCart();
  const { state: concordiumState, connect: connectWallet } = useConcordium();
  const { state: avalancheState, connect: connectAvalanche } = useAvalanche();
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ccd' | 'avax' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const formatPrice = (price: number, currency = "USD") => {
    if (currency === "CCD") {
      return `${price.toFixed(2)} CCD`;
    }
    if (currency === "AVAX") {
      return `${price.toFixed(4)} AVAX`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency
    }).format(price);
  };

  const hasAgeRestrictedItems = state.items.some(item => item.product.ageRestriction);
  const hasEscrowItems = state.items.some(item => item.product.escrowRequired);

  const handleCheckout = (method: 'card' | 'ccd' | 'avax') => {
    setPaymentMethod(method);
    setCheckoutDialog(true);
  };

  const handleCCDCheckout = async () => {
    if (!concordiumState.isConnected) {
      try {
        await connectWallet();
        setPaymentMethod('ccd');
        setCheckoutDialog(true);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        handleCheckout('ccd');
      }
    } else {
      handleCheckout('ccd');
    }
  };

  const handleAVAXCheckout = async () => {
    if (!avalancheState.isConnected) {
      try {
        await connectAvalanche();
        setPaymentMethod('avax');
        setCheckoutDialog(true);
      } catch (error) {
        console.error('Failed to connect Avalanche wallet:', error);
        handleCheckout('avax');
      }
    } else {
      handleCheckout('avax');
    }
  };

  const createOrder = async (method: 'card' | 'ccd' | 'avax', reference?: string) => {
    const payload = {
      customer: customerInfo,
      payment: { method, reference },
      items: state.items.map(item => ({
        productId: item.product.id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        escrowRequired: item.product.escrowRequired
      })),
      walletAddress: method === 'ccd' ? concordiumState.account : method === 'avax' ? avalancheState.account : undefined
    };
    await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  };

  const processPayment = async () => {
    if (!paymentMethod) return;
    setIsProcessing(true);
    try {
      if (paymentMethod === 'card') {
        const r: any = await initiatePaystackPayment();
        await createOrder('card', r?.reference);
      } else if (paymentMethod === 'ccd') {
        const r: any = await processCCDPayment();
        await createOrder('ccd', r?.txHash);
      } else if (paymentMethod === 'avax') {
        const r: any = await processAVAXPayment();
        await createOrder('avax', r?.txHash);
      }
      clearCart();
      setOrderSuccess(true);
    } catch (error) {
      console.error('Payment failed:', error);
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const initiatePaystackPayment = async () => {
    const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!paystackPublicKey) {
      throw new Error('PayStack public key not configured');
    }
    const totalAmount = state.totalAmount + (hasEscrowItems ? state.totalAmount * 0.02 : 0);
    const amountInCents = Math.round(totalAmount * 100);
    return new Promise((resolve, reject) => {
      if (!window.PaystackPop) {
        reject(new Error('PayStack library not loaded'));
        return;
      }
      const reference = `credify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const handler = window.PaystackPop.setup({
        key: paystackPublicKey,
        email: customerInfo.email,
        amount: amountInCents,
        currency: 'USD',
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Full Name",
              variable_name: "full_name",
              value: customerInfo.name
            },
            {
              display_name: "Phone Number", 
              variable_name: "phone_number",
              value: customerInfo.phone
            },
            {
              display_name: "Delivery Address",
              variable_name: "delivery_address",
              value: customerInfo.address
            },
            {
              display_name: "Platform",
              variable_name: "platform",
              value: "CREDIFY"
            }
          ],
          order_items: state.items.map(item => ({
            product_id: item.product.id,
            product_name: item.product.title,
            quantity: item.quantity,
            price: item.product.price
          }))
        },
        callback: function(response: any) {
          verifyPayment(response.reference).then(() => {
            resolve(response);
          }).catch(reject);
        },
        onClose: function() {
          reject(new Error('Payment was cancelled by user'));
        }
      });
      handler.openIframe();
    });
  };
  
  const verifyPayment = async (reference: string) => {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference })
      });
      return response.json();
    } catch (error) {
      throw error;
    }
  };

  const processCCDPayment = async () => {
    if (!concordiumState.isConnected || !concordiumState.account) {
      throw new Error('Wallet not connected');
    }
    if (!concordiumState.provider) {
      throw new Error('Concordium provider not available');
    }
    const recipientAddress = import.meta.env.VITE_CONCORDIUM_ADDRESS || '3SwtbfyHrT68giUKV6FzDAxBBPo9xbsLgjG34U3UXfJrNJFxbL';
    const totalAmount = state.totalAmount + (hasEscrowItems ? state.totalAmount * 0.02 : 0);
    const ccdAmount = await convertUsdToCcd(totalAmount);
    const microCcdAmount = Math.round(ccdAmount * 1000000);
    return new Promise((resolve, reject) => {
      try {
        const transferData = {
          amount: microCcdAmount,
          toAddress: recipientAddress,
          fromAddress: concordiumState.account,
          metadata: {
            orderId: `credify_${Date.now()}`,
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            items: state.items.map(item => ({
              productId: item.product.id,
              title: item.product.title,
              quantity: item.quantity,
              price: item.product.price
            }))
          }
        };
        setTimeout(() => {
          resolve({
            success: true,
            txHash: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: microCcdAmount,
            recipient: recipientAddress
          });
        }, 3000);
      } catch (error) {
        reject(error);
      }
    });
  };

  const processAVAXPayment = async () => {
    if (!avalancheState.isConnected || !avalancheState.account) {
      throw new Error('Avalanche wallet not connected');
    }
    if (!avalancheState.signer) {
      throw new Error('Avalanche provider not available');
    }
    const recipientAddress = import.meta.env.VITE_AVALANCHE_ADDRESS || '0x65b7a307a7e67e38840b91f9a36bf8dfe6e02901';
    const totalAmount = state.totalAmount + (hasEscrowItems ? state.totalAmount * 0.02 : 0);
    const avaxAmount = await convertUsdToAvax(totalAmount);
    const avaxAmountStr = avaxAmount.toFixed(6);
    return new Promise((resolve, reject) => {
      try {
        const transferData = {
          amount: avaxAmountStr,
          toAddress: recipientAddress,
          fromAddress: avalancheState.account,
          metadata: {
            orderId: `credify_${Date.now()}`,
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            items: state.items.map(item => ({
              productId: item.product.id,
              title: item.product.title,
              quantity: item.quantity,
              price: item.product.price
            }))
          }
        };
        avalancheState.signer!.sendTransaction({
          to: recipientAddress,
          value: ethers.parseEther(avaxAmountStr),
          gasLimit: 21000
        }).then((tx) => {
          return tx.wait();
        }).then((receipt) => {
          if (!receipt) {
            throw new Error('Transaction receipt not received');
          }
          resolve({
            success: true,
            txHash: receipt.hash,
            amount: avaxAmountStr,
            recipient: recipientAddress
          });
        }).catch((error) => {
          reject(new Error(`AVAX payment failed: ${error.message || 'Unknown error'}`));
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleDialogClose = () => {
    if (orderSuccess) {
      setOrderSuccess(false);
      setCheckoutDialog(false);
      closeCart();
    } else if (!isProcessing) {
      setCheckoutDialog(false);
      setPaymentMethod(null);
    }
  };

  return (
    <Sheet open={state.isOpen} onOpenChange={toggleCart}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {state.totalItems > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {state.totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full px-6 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
          </SheetTitle>
          <SheetDescription>
            Review your items and proceed to checkout
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add some products to get started
              </p>
              <Button onClick={closeCart}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {state.items.map((item) => (
                <div key={item.product.id} className="flex gap-4 p-4 bg-card rounded-lg border">
                  <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                    {item.product.images && item.product.images.length > 0 ? (
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-2xl">📦</div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{item.product.title}</h4>
                        <p className="text-sm font-semibold">{formatPrice(item.product.price)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-wrap">
                      {item.product.ageRestriction && (
                        <Badge variant="secondary" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {item.product.ageRestriction.minimumAge}+
                        </Badge>
                      )}
                      
                      {item.product.escrowRequired && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Escrow
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.inventory}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Separator />

              {(hasAgeRestrictedItems || hasEscrowItems) && (
                <div className="space-y-2">
                  {hasAgeRestrictedItems && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/20 p-2 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Age verification required for some items</span>
                    </div>
                  )}
                  
                  {hasEscrowItems && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                      <Shield className="h-4 w-4" />
                      <span>Smart contract escrow will be used</span>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({state.totalItems} items)</span>
                  <span>{formatPrice(state.totalAmount)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Escrow Fee</span>
                  <span>{hasEscrowItems ? formatPrice(state.totalAmount * 0.02) : "N/A"}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(state.totalAmount + (hasEscrowItems ? state.totalAmount * 0.02 : 0))}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Payment Methods</h4>
                
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  onClick={() => handleCheckout('card')}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay with Card
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full border-primary/30 hover:bg-primary/5"
                  onClick={handleCCDCheckout}
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Pay with CCD {!concordiumState.isConnected && '(Connect Wallet)'}
                </Button>
                
                {false && (
                <Button 
                  variant="outline" 
                  className="w-full border-orange-300 hover:bg-orange-50 text-orange-700 border-2"
                  onClick={handleAVAXCheckout}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Pay with AVAX {!avalancheState.isConnected && '(Connect MetaMask)'}
                </Button>
                )}
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Secure payment powered by PayStack, Concordium & Avalanche blockchain</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={clearCart}
                >
                  Clear Cart
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={closeCart}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
      
      <Dialog open={checkoutDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {orderSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Order Confirmed!
                </>
              ) : (
                <>
                  {paymentMethod === 'card' ? <CreditCard className="w-5 h-5" /> : <Coins className="w-5 h-5" />}
                  {paymentMethod === 'card' ? 'Card Payment' : 'CCD Payment'}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {orderSuccess 
                ? 'Your order has been placed successfully!'
                : `Complete your payment with ${paymentMethod === 'card' ? 'PayStack secure payment' : 'Concordium CCD'}`
              }
            </DialogDescription>
          </DialogHeader>

          {orderSuccess ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Order total: {formatPrice(state.totalAmount + (hasEscrowItems ? state.totalAmount * 0.02 : 0))}
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• You'll receive an email confirmation shortly</p>
                  <p>• Track your order in the seller dashboard</p>
                  <p>• Escrow protection is active for eligible items</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items ({state.totalItems})</span>
                  <span>{formatPrice(state.totalAmount)}</span>
                </div>
                {hasEscrowItems && (
                  <div className="flex justify-between">
                    <span>Escrow Fee (2%)</span>
                    <span>{formatPrice(state.totalAmount * 0.02)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(state.totalAmount + (hasEscrowItems ? state.totalAmount * 0.02 : 0))}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    placeholder="Enter your full name"
                    disabled={isProcessing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    placeholder="Enter your email"
                    disabled={isProcessing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    placeholder="Enter your phone number"
                    disabled={isProcessing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Delivery Address
                  </Label>
                  <Input
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                    placeholder="Enter your full delivery address"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {paymentMethod === 'ccd' && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                  <Coins className="w-4 h-4" />
                  <div className="flex-1">
                    <p className="font-medium">Concordium CCD Payment</p>
                    <p className="text-xs">
                      {concordiumState.isConnected 
                        ? `Connected: ${concordiumState.account?.slice(0, 10)}...${concordiumState.account?.slice(-6)}`
                        : 'Click "Pay with CCD" to connect your wallet'
                      }
                    </p>
                    <p className="text-xs opacity-75">
                      Amount: ~{((state.totalAmount + (hasEscrowItems ? state.totalAmount * 0.02 : 0)) * 10).toFixed(2)} CCD
                    </p>
                  </div>
                </div>
              )}
              
              {paymentMethod === 'avax' && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/20 p-3 rounded">
                  <Zap className="w-4 h-4" />
                  <div className="flex-1">
                    <p className="font-medium">Avalanche AVAX Payment</p>
                    <p className="text-xs">
                      {avalancheState.isConnected 
                        ? `Connected: ${avalancheState.account?.slice(0, 10)}...${avalancheState.account?.slice(-6)}`
                        : 'Click "Pay with AVAX" to connect MetaMask wallet'
                      }
                    </p>
                    <p className="text-xs opacity-75">
                      Amount: Live rate from CoinGecko API
                    </p>
                  </div>
                </div>
              )}
              
              {paymentMethod === 'card' && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded">
                  <CreditCard className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Secure Card Payment</p>
                    <p className="text-xs">Powered by PayStack • SSL Encrypted • PCI Compliant</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {orderSuccess ? (
              <Button onClick={handleDialogClose} className="w-full">
                Continue Shopping
              </Button>
            ) : (
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  onClick={handleDialogClose}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={processPayment}
                  disabled={isProcessing || !customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address}
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
                      {paymentMethod === 'card' ? 'Pay with Card' : 
                       paymentMethod === 'avax' ? 'Pay with AVAX' : 'Pay with CCD'}
                    </>
                  )}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
