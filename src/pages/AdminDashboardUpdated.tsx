import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Shield,
  Users,
  ShoppingBag,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Settings,
  Database,
  TrendingUp,
  UserCheck,
  CreditCard,
  Calendar,
  LogOut,
  Plus,
  Upload,
  UserPlus
} from "lucide-react";

interface AdminDashboardProps {
  onNavigateHome: () => void;
  onLogout: () => void;
}

export function AdminDashboard({ onNavigateHome, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    images: '',
    inventory: ''
  });
  const [newVendor, setNewVendor] = useState({
    name: '',
    email: '',
    businessName: '',
    concordiumAddress: ''
  });

  // Check authentication on component mount
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_authenticated');
    const loginTime = sessionStorage.getItem('admin_login_time');
    
    // Check if session is valid (24 hours)
    if (!isAuthenticated || !loginTime) {
      onLogout();
      return;
    }
    
    const sessionAge = Date.now() - parseInt(loginTime);
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxSessionAge) {
      sessionStorage.removeItem('admin_authenticated');
      sessionStorage.removeItem('admin_login_time');
      onLogout();
    }
  }, [onLogout]);

  const handleUploadProduct = async () => {
    try {
      // In production, this would make an API call to save the product
      const productData = {
        ...newProduct,
        id: Date.now().toString(),
        price: parseFloat(newProduct.price),
        inventory: parseInt(newProduct.inventory),
        images: newProduct.images.split(',').map(url => url.trim()),
        seller: {
          id: 'admin',
          name: 'CREDIFY Admin',
          reputationScore: 100,
          isVerified: true
        },
        createdAt: new Date(),
        escrowRequired: false,
        condition: 'NEW',
        shipping: {
          free: true,
          estimatedDays: 3
        }
      };
      
      console.log('Uploading product:', productData);
      alert('Product uploaded successfully!');
      
      // Reset form
      setNewProduct({
        title: '',
        description: '',
        price: '',
        category: '',
        images: '',
        inventory: ''
      });
      setShowProductForm(false);
    } catch (error) {
      console.error('Failed to upload product:', error);
      alert('Failed to upload product. Please try again.');
    }
  };

  const handleOnboardVendor = async () => {
    try {
      // In production, this would make an API call to register the vendor
      const vendorData = {
        ...newVendor,
        id: Date.now().toString(),
        reputationScore: 0,
        isVerified: true,
        registeredAt: new Date(),
        products: [],
        totalSales: 0
      };
      
      console.log('Onboarding vendor:', vendorData);
      alert('Vendor onboarded successfully!');
      
      // Reset form
      setNewVendor({
        name: '',
        email: '',
        businessName: '',
        concordiumAddress: ''
      });
      setShowVendorForm(false);
    } catch (error) {
      console.error('Failed to onboard vendor:', error);
      alert('Failed to onboard vendor. Please try again.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_login_time');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onNavigateHome}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold">CREDIFY Admin Panel</h1>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  RESTRICTED ACCESS
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Admin Authenticated
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-2">Upload Product</h3>
                <p className="text-sm text-muted-foreground">Add new products to the marketplace</p>
              </div>
              <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload New Product</DialogTitle>
                    <DialogDescription>
                      Add a new product to the CREDIFY marketplace
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Product Title</Label>
                      <Input
                        id="title"
                        value={newProduct.title}
                        onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                        placeholder="Enter product title"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        placeholder="Enter product description"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (USD)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="inventory">Inventory</Label>
                        <Input
                          id="inventory"
                          type="number"
                          value={newProduct.inventory}
                          onChange={(e) => setNewProduct({...newProduct, inventory: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                        placeholder="e.g., Electronics, Books, Clothing"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="images">Image URLs (comma-separated)</Label>
                      <Textarea
                        id="images"
                        value={newProduct.images}
                        onChange={(e) => setNewProduct({...newProduct, images: e.target.value})}
                        placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowProductForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUploadProduct}
                        disabled={!newProduct.title || !newProduct.price}
                        className="flex-1"
                      >
                        Upload Product
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-2">Onboard Vendor</h3>
                <p className="text-sm text-muted-foreground">Register new sellers on the platform</p>
              </div>
              <Dialog open={showVendorForm} onOpenChange={setShowVendorForm}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Onboard
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Onboard New Vendor</DialogTitle>
                    <DialogDescription>
                      Register a new vendor/seller on CREDIFY
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendorName">Vendor Name</Label>
                      <Input
                        id="vendorName"
                        value={newVendor.name}
                        onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                        placeholder="Enter vendor full name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="vendorEmail">Email Address</Label>
                      <Input
                        id="vendorEmail"
                        type="email"
                        value={newVendor.email}
                        onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                        placeholder="vendor@example.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={newVendor.businessName}
                        onChange={(e) => setNewVendor({...newVendor, businessName: e.target.value})}
                        placeholder="Enter business/store name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="concordiumAddress">Concordium Address</Label>
                      <Input
                        id="concordiumAddress"
                        value={newVendor.concordiumAddress}
                        onChange={(e) => setNewVendor({...newVendor, concordiumAddress: e.target.value})}
                        placeholder="3SwtbfyHrT68giUKV6FzDAxBBPo9xbsLgjG34U3UXfJrNJFxbL"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowVendorForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleOnboardVendor}
                        disabled={!newVendor.name || !newVendor.email}
                        className="flex-1"
                      >
                        Onboard Vendor
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-2">System Status</h3>
                <p className="text-sm text-muted-foreground">Platform health and metrics</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Activity className="w-3 h-3 mr-1" />
                All Systems Operational
              </Badge>
            </div>
          </Card>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">247</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Vendors</p>
                <p className="text-2xl font-bold">18</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">$12,847</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified Users</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
              <UserCheck className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Recent Admin Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Product uploaded successfully</p>
                  <p className="text-sm text-muted-foreground">iPhone 15 Pro added to Electronics</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">2 minutes ago</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <UserPlus className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">New vendor onboarded</p>
                  <p className="text-sm text-muted-foreground">TechGear Store - Electronics category</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">1 hour ago</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">System maintenance completed</p>
                  <p className="text-sm text-muted-foreground">Payment gateway updated successfully</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">3 hours ago</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;