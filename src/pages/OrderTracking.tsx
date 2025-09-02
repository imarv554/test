import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Shield,
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Mail,
  Wallet,
  Eye,
  Calendar,
  DollarSign
} from "lucide-react";
import { WalletConnection } from "@/components/WalletConnection";
import { useConcordium } from "@/contexts/ConcordiumContext";

interface OrderTrackingProps {
  onNavigateHome: () => void;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  amount: string;
  date: string;
  status: string;
  items: any[];
  trackingId?: string;
  walletAddress?: string;
}

export function OrderTracking({ onNavigateHome }: OrderTrackingProps) {
  const { state: concordiumState } = useConcordium();
  const [trackingMethod, setTrackingMethod] = useState<'wallet' | 'email' | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [foundOrders, setFoundOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const searchOrdersByEmail = () => {
    if (!searchEmail.trim()) {
      alert('Please enter your email address');
      return;
    }

    setIsLoading(true);
    
    // Search localStorage for orders matching the email
    const orders: Order[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('order_')) {
        try {
          const order = JSON.parse(localStorage.getItem(key) || '{}') as Order;
          if (order.customerEmail && order.customerEmail.toLowerCase() === searchEmail.toLowerCase()) {
            orders.push(order);
          }
        } catch (e) {
          console.error('Error parsing order:', e);
        }
      }
    }

    // Also search through cart/payment records that might have been stored differently
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('payment_') || key?.startsWith('checkout_')) {
        try {
          const record = JSON.parse(localStorage.getItem(key) || '{}');
          if (record.email && record.email.toLowerCase() === searchEmail.toLowerCase()) {
            const order: Order = {
              id: record.reference || record.id || `order_${Date.now()}`,
              customerName: record.name || record.customerName || 'Unknown',
              customerEmail: record.email,
              paymentMethod: record.paymentMethod || 'PayStack',
              amount: record.amount || record.totalAmount || '0.00',
              date: record.date || record.timestamp || new Date().toISOString(),
              status: record.status || 'completed',
              items: record.items || [],
              trackingId: record.reference
            };
            orders.push(order);
          }
        } catch (e) {
          console.error('Error parsing payment record:', e);
        }
      }
    }

    setFoundOrders(orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsLoading(false);
  };

  const searchOrdersByWallet = () => {
    if (!concordiumState.isConnected || !concordiumState.account) {
      alert('Please connect your Concordium wallet first');
      return;
    }

    setIsLoading(true);
    
    // Search localStorage for orders matching the wallet address
    const orders: Order[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('order_')) {
        try {
          const order = JSON.parse(localStorage.getItem(key) || '{}') as Order;
          if (order.walletAddress && order.walletAddress === concordiumState.account) {
            orders.push(order);
          }
        } catch (e) {
          console.error('Error parsing order:', e);
        }
      }
    }

    // Also search through CCD payment records
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('ccd_payment_') || key?.startsWith('concordium_')) {
        try {
          const record = JSON.parse(localStorage.getItem(key) || '{}');
          if (record.fromAddress && record.fromAddress === concordiumState.account) {
            const order: Order = {
              id: record.txHash || record.id || `order_${Date.now()}`,
              customerName: record.customerName || 'CCD User',
              customerEmail: record.customerEmail || '',
              paymentMethod: 'CCD',
              amount: record.amount || record.ccdAmount || '0.00',
              date: record.date || record.timestamp || new Date().toISOString(),
              status: record.status || 'completed',
              items: record.items || [],
              walletAddress: record.fromAddress,
              trackingId: record.txHash
            };
            orders.push(order);
          }
        } catch (e) {
          console.error('Error parsing CCD record:', e);
        }
      }
    }

    setFoundOrders(orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-purple-500" />;
      case 'delivered':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'shipped':
        return 'default';
      case 'delivered':
      case 'completed':
        return 'default';
      default:
        return 'destructive';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/3">

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-muted-foreground mb-6">
            Find your order using either your wallet address or email address
          </p>
        </div>

        {!trackingMethod ? (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Choose Tracking Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  size="lg"
                  className="h-20 flex-col gap-2"
                  onClick={() => setTrackingMethod('wallet')}
                >
                  <Wallet className="w-6 h-6" />
                  <div className="text-center">
                    <p className="font-medium">Connect Wallet</p>
                    <p className="text-xs opacity-75">For CCD payments</p>
                  </div>
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg"
                  className="h-20 flex-col gap-2"
                  onClick={() => setTrackingMethod('email')}
                >
                  <Mail className="w-6 h-6" />
                  <div className="text-center">
                    <p className="font-medium">Use Email</p>
                    <p className="text-xs opacity-75">For card payments</p>
                  </div>
                </Button>
              </div>
            </Card>
            
            <Card className="p-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">How Order Tracking Works</p>
                  <ul className="text-sm text-blue-700 dark:text-blue-200 mt-2 space-y-1">
                    <li>• <strong>Wallet Tracking:</strong> For orders paid with CCD cryptocurrency</li>
                    <li>• <strong>Email Tracking:</strong> For orders paid with credit/debit cards via PayStack</li>
                    <li>• Your order information is stored securely and privately</li>
                    <li>• Track shipping status, payment details, and order history</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        ) : trackingMethod === 'email' ? (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Track by Email</h3>
                <Button variant="ghost" onClick={() => setTrackingMethod(null)}>
                  Change Method
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter the email used during checkout"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <Button 
                  onClick={searchOrdersByEmail}
                  disabled={isLoading || !searchEmail.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Search className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Find My Orders
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Track by Wallet</h3>
                <Button variant="ghost" onClick={() => setTrackingMethod(null)}>
                  Change Method
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <WalletConnection variant="button" size="default" showAddress />
                </div>
                
                {concordiumState.isConnected && (
                  <Button 
                    onClick={searchOrdersByWallet}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Search className="w-4 h-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Find My Orders
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Search Results */}
        {foundOrders.length > 0 && (
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">
              Your Orders ({foundOrders.length} found)
            </h3>
            
            <div className="space-y-4">
              {foundOrders.map((order, index) => (
                <div key={order.id || index} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <p className="font-medium">Order #{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.date).toLocaleDateString()} • {order.paymentMethod}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">${order.amount}</p>
                        <Badge variant={getStatusColor(order.status) as any}>
                          {order.status}
                        </Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </div>
                  
                  {order.items && order.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <p className="text-sm text-muted-foreground mb-2">
                        Items ({order.items.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {order.items.slice(0, 3).map((item: any, itemIndex: number) => (
                          <Badge key={itemIndex} variant="secondary" className="text-xs">
                            {item.name || item.title || `Item ${itemIndex + 1}`}
                          </Badge>
                        ))}
                        {order.items.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{order.items.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {foundOrders.length === 0 && (trackingMethod === 'email' ? searchEmail && !isLoading : concordiumState.isConnected && !isLoading) && (
          <Card className="p-6 mt-6 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
            <p className="text-muted-foreground mb-4">
              {trackingMethod === 'email' 
                ? `No orders found for ${searchEmail}. Please check your email address or try a different one.`
                : 'No orders found for this wallet address. Make sure you\'re using the correct wallet that was used for payment.'
              }
            </p>
            <Button variant="outline" onClick={() => setTrackingMethod(null)}>
              Try Different Method
            </Button>
          </Card>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information for your order
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {getStatusIcon(selectedOrder.status)}
                <div>
                  <p className="font-medium">Order #{selectedOrder.id}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: <Badge variant={getStatusColor(selectedOrder.status) as any} className="ml-1">
                      {selectedOrder.status}
                    </Badge>
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Order Date
                    </p>
                    <p className="font-medium">{new Date(selectedOrder.date).toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Total Amount
                    </p>
                    <p className="font-medium">${selectedOrder.amount}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-muted-foreground">Payment Method</p>
                    <p className="font-medium">{selectedOrder.paymentMethod}</p>
                  </div>
                  
                  {selectedOrder.trackingId && (
                    <div>
                      <p className="text-muted-foreground">Tracking ID</p>
                      <p className="font-mono text-xs bg-muted p-1 rounded break-all">
                        {selectedOrder.trackingId}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium mb-3">Items Ordered</p>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded">
                          <div>
                            <p className="font-medium text-sm">{item.name || item.title || `Item ${index + 1}`}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity || 1}</p>
                          </div>
                          <p className="font-medium text-sm">${item.price || '0.00'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowOrderDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}