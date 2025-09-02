import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  ArrowLeft, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Users,
  Star,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { WalletConnection } from "@/components/WalletConnection";

interface SellerDashboardProps {
  onNavigateHome: () => void;
}

// Mock data for demonstration
const mockStats = {
  totalRevenue: 12450.50,
  totalOrders: 89,
  activeListings: 15,
  reputationScore: 95,
  pendingOrders: 3,
  completedOrders: 86,
};

const mockOrders = [
  {
    id: "ORD-001",
    product: "Premium Wireless Headphones",
    buyer: "Alice Johnson",
    amount: 299.99,
    status: "completed",
    date: "2024-01-15",
    escrowStatus: "released"
  },
  {
    id: "ORD-002", 
    product: "Smart Watch Pro",
    buyer: "Bob Smith",
    amount: 450.00,
    status: "pending_delivery",
    date: "2024-01-14",
    escrowStatus: "active"
  },
  {
    id: "ORD-003",
    product: "Wireless Earbuds",
    buyer: "Carol Davis",
    amount: 129.99,
    status: "dispute",
    date: "2024-01-13",
    escrowStatus: "disputed"
  }
];

const mockProducts = [
  {
    id: "1",
    title: "Premium Wireless Headphones",
    price: 299.99,
    inventory: 15,
    status: "active",
    views: 234,
    sales: 12
  },
  {
    id: "2", 
    title: "Smart Watch Pro",
    price: 450.00,
    inventory: 8,
    status: "active",
    views: 189,
    sales: 7
  },
  {
    id: "3",
    title: "Wireless Earbuds",
    price: 129.99,
    inventory: 0,
    status: "out_of_stock",
    views: 156,
    sales: 15
  }
];

export function SellerDashboard({ onNavigateHome }: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "pending_delivery": return "bg-yellow-500";
      case "dispute": return "bg-red-500";
      case "active": return "bg-green-500";
      case "out_of_stock": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: "bg-green-100 text-green-700 border-green-200",
      pending_delivery: "bg-yellow-100 text-yellow-700 border-yellow-200", 
      dispute: "bg-red-100 text-red-700 border-red-200",
      active: "bg-green-100 text-green-700 border-green-200",
      out_of_stock: "bg-red-100 text-red-700 border-red-200"
    };
    
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-trust opacity-20 blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 -left-40 w-60 h-60 rounded-full bg-gradient-identity opacity-20 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-40 h-40 rounded-full bg-gradient-innovation opacity-30 blur-2xl animate-pulse-slow" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-border/50 glass">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
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
                <div className="w-8 h-8 rounded-lg gradient-trust flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold" style={{fontFamily: 'var(--font-display)'}}>CREDIFY</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <Badge variant="secondary" className="glass">
                Seller Dashboard
              </Badge>
              <WalletConnection showAddress />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gradient-trust">Seller Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your products, track orders, and grow your business on CREDIFY.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass hover:shadow-glow transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${mockStats.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass hover:shadow-glow transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{mockStats.totalOrders}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass hover:shadow-glow transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                  <p className="text-2xl font-bold">{mockStats.activeListings}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass hover:shadow-glow transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reputation Score</p>
                  <p className="text-2xl font-bold">{mockStats.reputationScore}/100</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{order.product}</p>
                          <p className="text-xs text-muted-foreground">{order.buyer} • {order.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${order.amount}</p>
                          <Badge variant="outline" className={`text-xs ${getStatusBadge(order.status)}`}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Top Performing Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockProducts.slice(0, 3).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{product.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.views} views • {product.sales} sales
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${product.price}</p>
                          <p className="text-xs text-muted-foreground">{product.inventory} left</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Product Management</h2>
              <Button className="gradient-trust text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            <div className="grid gap-6">
              {mockProducts.map((product) => (
                <Card key={product.id} className="glass">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-semibold">{product.title}</h3>
                          <Badge variant="outline" className={getStatusBadge(product.status)}>
                            {product.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span>Price: ${product.price}</span>
                          <span>Inventory: {product.inventory}</span>
                          <span>Views: {product.views}</span>
                          <span>Sales: {product.sales}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-bold">Order Management</h2>

            <div className="space-y-4">
              {mockOrders.map((order) => (
                <Card key={order.id} className="glass">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-semibold">{order.id}</h3>
                          <Badge variant="outline" className={getStatusBadge(order.status)}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={getStatusBadge(order.escrowStatus)}>
                            Escrow: {order.escrowStatus}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>Product: {order.product}</p>
                          <p>Buyer: {order.buyer}</p>
                          <p>Date: {order.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${order.amount}</p>
                        <div className="flex gap-2 mt-2">
                          {order.status === "pending_delivery" && (
                            <Button size="sm" className="gradient-trust text-white">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm Delivery
                            </Button>
                          )}
                          {order.status === "dispute" && (
                            <Button size="sm" variant="outline">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              View Dispute
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Sales Analytics</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/20 rounded">
                    <p className="text-muted-foreground">Chart placeholder - Revenue over time</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>Order Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/20 rounded">
                    <p className="text-muted-foreground">Chart placeholder - Order status pie chart</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>Top Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/20 rounded">
                    <p className="text-muted-foreground">Chart placeholder - Category performance</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>Customer Acquisition</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/20 rounded">
                    <p className="text-muted-foreground">Chart placeholder - New vs returning customers</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 glass mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md gradient-trust flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm">CREDIFY</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Powered by Concordium Mainnet • Built for the future of commerce
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default SellerDashboard;