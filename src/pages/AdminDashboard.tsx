import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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

interface StoredOrder {
  id: string;
  customerName: string;
  paymentMethod: string;
  amount: string;
  date: string;
  status: string;
  items?: any[];
}

interface StoredVendor {
  id: string;
  businessName: string;
  name: string;
  email: string;
  productsCount: number;
  registrationDate: string;
  dateOnboarded: string;
  status: string;
}

interface StoredProduct {
  id: string;
  title: string;
  category: string;
  vendor: string;
  price: string;
  inventory: string;
  dateAdded: string;
  status: string;
  images: string;
}

export function AdminDashboard({ onNavigateHome, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{type: 'vendor' | 'product', id: string} | null>(null);
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

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_login_time');
    onLogout();
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally save to your database
    console.log('Adding product:', newProduct);
    
    // Create product object with current date
    const productData = {
      ...newProduct,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString().split('T')[0],
      vendor: 'Admin', // Added by admin
      status: 'active'
    };
    
    // In a real app, you'd save to your database here
    localStorage.setItem(`product_${productData.id}`, JSON.stringify(productData));
    
    // Reset form and close dialog
    setNewProduct({
      title: '',
      description: '',
      price: '',
      category: '',
      images: '',
      inventory: ''
    });
    setShowProductForm(false);
    
    alert('Product added successfully!');
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally save to your database
    console.log('Adding vendor:', newVendor);
    
    // Create vendor object with current date
    const vendorData = {
      ...newVendor,
      id: Date.now().toString(),
      dateOnboarded: new Date().toISOString().split('T')[0],
      status: 'active',
      productsCount: 0,
      onboardedBy: 'Admin'
    };
    
    // In a real app, you'd save to your database here
    localStorage.setItem(`vendor_${vendorData.id}`, JSON.stringify(vendorData));

    // Persist to backend and trigger confirmation email to vendor
    try {
      await fetch('/api/vendors/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: vendorData.businessName,
          name: vendorData.name,
          email: vendorData.email,
          concordiumAddress: vendorData.concordiumAddress,
          phone: vendorData.phone
        })
      });
    } catch (e) {
      console.warn('Backend vendor onboard failed:', e);
    }
    
    // Reset form and close dialog
    setNewVendor({
      name: '',
      email: '',
      businessName: '',
      concordiumAddress: ''
    });
    setShowVendorForm(false);
    
    alert('Vendor onboarded successfully!');
  };

  const renderProductForm = () => (
    <form onSubmit={handleProductSubmit} className="space-y-4">
      <div>
        <Label htmlFor="product-title">Product Title</Label>
        <Input
          id="product-title"
          value={newProduct.title}
          onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
          placeholder="Enter product title"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="product-description">Description</Label>
        <Textarea
          id="product-description"
          value={newProduct.description}
          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
          placeholder="Enter product description"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="product-price">Price ($)</Label>
          <Input
            id="product-price"
            type="number"
            step="0.01"
            value={newProduct.price}
            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
            placeholder="0.00"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="product-inventory">Inventory</Label>
          <Input
            id="product-inventory"
            type="number"
            value={newProduct.inventory}
            onChange={(e) => setNewProduct({...newProduct, inventory: e.target.value})}
            placeholder="0"
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="product-category">Category</Label>
        <Input
          id="product-category"
          value={newProduct.category}
          onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
          placeholder="e.g., Electronics, Fashion, Books"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="product-images">Image URL</Label>
        <Input
          id="product-images"
          value={newProduct.images}
          onChange={(e) => setNewProduct({...newProduct, images: e.target.value})}
          placeholder="Enter image URL"
          required
        />
      </div>
      
      <div className="flex justify-end gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setShowProductForm(false)}
        >
          Cancel
        </Button>
        <Button type="submit">
          <Upload className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>
    </form>
  );

  const renderVendorForm = () => (
    <form onSubmit={handleVendorSubmit} className="space-y-4">
      <div>
        <Label htmlFor="vendor-name">Vendor Name</Label>
        <Input
          id="vendor-name"
          value={newVendor.name}
          onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
          placeholder="Enter vendor name"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="vendor-email">Email Address</Label>
        <Input
          id="vendor-email"
          type="email"
          value={newVendor.email}
          onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
          placeholder="vendor@example.com"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="vendor-business">Business Name</Label>
        <Input
          id="vendor-business"
          value={newVendor.businessName}
          onChange={(e) => setNewVendor({...newVendor, businessName: e.target.value})}
          placeholder="Enter business name"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="vendor-concordium">Concordium Wallet Address</Label>
        <Input
          id="vendor-concordium"
          value={newVendor.concordiumAddress}
          onChange={(e) => setNewVendor({...newVendor, concordiumAddress: e.target.value})}
          placeholder="Enter Concordium wallet address"
          required
        />
      </div>
      
      <div className="flex justify-end gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setShowVendorForm(false)}
        >
          Cancel
        </Button>
        <Button type="submit">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </div>
    </form>
  );

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "vendors", label: "Vendors", icon: Users },
    { id: "products", label: "Products", icon: Database },
    { id: "users", label: "Users", icon: UserCheck },
    { id: "system", label: "System", icon: Settings },
  ];

  const handleDeleteItem = (type: 'vendor' | 'product', id: string) => {
    setDeleteTarget({ type, id });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'vendor') {
      localStorage.removeItem(`vendor_${deleteTarget.id}`);
      console.log(`Vendor ${deleteTarget.id} removed`);
    } else if (deleteTarget.type === 'product') {
      localStorage.removeItem(`product_${deleteTarget.id}`);
      console.log(`Product ${deleteTarget.id} removed`);
    }
    
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
    alert(`${deleteTarget.type} removed successfully!`);
  };

  const getStoredOrders = (): StoredOrder[] => {
    const orders: StoredOrder[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('order_')) {
        try {
          const order = JSON.parse(localStorage.getItem(key) || '{}') as StoredOrder;
          orders.push(order);
        } catch (e) {
          console.error('Error parsing order:', e);
        }
      }
    }
    return orders.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
  };

  const getStoredVendors = (): StoredVendor[] => {
    const vendors: StoredVendor[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('vendor_')) {
        try {
          const vendor = JSON.parse(localStorage.getItem(key) || '{}') as StoredVendor;
          vendors.push(vendor);
        } catch (e) {
          console.error('Error parsing vendor:', e);
        }
      }
    }
    return vendors.sort((a, b) => new Date(b.registrationDate || b.dateOnboarded || '').getTime() - new Date(a.registrationDate || a.dateOnboarded || '').getTime());
  };

  const getStoredProducts = (): StoredProduct[] => {
    const products: StoredProduct[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('product_')) {
        try {
          const product = JSON.parse(localStorage.getItem(key) || '{}') as StoredProduct;
          products.push(product);
        } catch (e) {
          console.error('Error parsing product:', e);
        }
      }
    }
    return products.sort((a, b) => new Date(b.dateAdded || '').getTime() - new Date(a.dateAdded || '').getTime());
  };

  const renderOrders = () => {
    const orders = getStoredOrders();
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Order Tracking & Management</h3>
          <Badge variant="secondary">{orders.length} Total Orders</Badge>
        </div>
        
        <Card className="p-6">
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No orders found in the system</p>
                <p className="text-sm">Orders will appear here when customers make purchases</p>
              </div>
            ) : (
              orders.map((order, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{order.id || `Order #${index + 1}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customerName || 'Unknown Customer'} • {order.paymentMethod || 'Unknown Payment'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-medium">${order.amount || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p>{order.date ? new Date(order.date).toLocaleDateString() : 'Unknown'}</p>
                    </div>
                    <Badge variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}>
                      {order.status || 'unknown'}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetails(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderVendors = () => {
    const vendors = getStoredVendors();
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Vendor Management</h3>
          <div className="flex gap-3">
            <Badge variant="secondary">{vendors.length} Active Vendors</Badge>
            <Button onClick={() => setShowVendorForm(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </div>
        </div>
        
        <Card className="p-6">
          <div className="space-y-4">
            {vendors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No vendors registered yet</p>
                <p className="text-sm">Vendors will appear here after registration</p>
              </div>
            ) : (
              vendors.map((vendor, index) => (
                <div key={vendor.id || index} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">{(vendor.businessName || vendor.name || 'V')[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium">{vendor.businessName || vendor.name || 'Unknown Business'}</p>
                      <p className="text-sm text-muted-foreground">{vendor.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground">Products</p>
                      <p className="font-medium">{vendor.productsCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Joined</p>
                      <p>{vendor.registrationDate ? new Date(vendor.registrationDate).toLocaleDateString() : vendor.dateOnboarded ? new Date(vendor.dateOnboarded).toLocaleDateString() : 'Unknown'}</p>
                    </div>
                    <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                      {vendor.status || 'active'}
                    </Badge>
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteItem('vendor', vendor.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderProducts = () => {
    const products = getStoredProducts();
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Product Management</h3>
          <div className="flex gap-3">
            <Badge variant="secondary">{products.length} Total Products</Badge>
            <Button onClick={() => setShowProductForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>
        
        <Card className="p-6">
          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No products in the system</p>
                <p className="text-sm">Products added by admin or vendors will appear here</p>
              </div>
            ) : (
              products.map((product, index) => (
                <div key={product.id || index} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                      {product.images ? (
                        <img src={product.images} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <Database className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{product.title || 'Untitled Product'}</p>
                      <p className="text-sm text-muted-foreground">{product.category || 'No category'} • {product.vendor || 'Unknown vendor'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-medium">${product.price || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Stock</p>
                      <p className="font-medium">{product.inventory || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Added</p>
                      <p>{product.dateAdded ? new Date(product.dateAdded).toLocaleDateString() : 'Unknown'}</p>
                    </div>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status || 'active'}
                    </Badge>
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteItem('product', product.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">12,458</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12% from last month
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Transactions</p>
              <p className="text-2xl font-bold">1,247</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +8% from last month
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">$2.4M</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +15% from last month
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">System Health</p>
              <p className="text-2xl font-bold">99.9%</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <CheckCircle className="w-3 h-3 mr-1" />
                All systems operational
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Verifications</h3>
          <div className="space-y-3">
            {[
              { name: "Alice Johnson", email: "alice@example.com", status: "verified", time: "2 min ago" },
              { name: "Bob Smith", email: "bob@example.com", status: "pending", time: "5 min ago" },
              { name: "Carol Davis", email: "carol@example.com", status: "verified", time: "8 min ago" },
              { name: "David Wilson", email: "david@example.com", status: "rejected", time: "12 min ago" },
            ].map((user, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.status === 'verified' ? 'default' : user.status === 'pending' ? 'secondary' : 'destructive'}>
                    {user.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{user.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">System Alerts</h3>
          <div className="space-y-3">
            {[
              { type: "info", message: "New user verification threshold reached", time: "1 hour ago" },
              { type: "warning", message: "High transaction volume detected", time: "2 hours ago" },
              { type: "success", message: "Daily backup completed successfully", time: "4 hours ago" },
              { type: "error", message: "Payment gateway latency spike", time: "6 hours ago" },
            ].map((alert, index) => (
              <div key={index} className="flex items-start gap-3 py-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                  alert.type === 'error' ? 'bg-red-100' : 
                  alert.type === 'warning' ? 'bg-yellow-100' : 
                  alert.type === 'success' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {alert.type === 'error' ? <AlertTriangle className="w-4 h-4 text-red-600" /> :
                   alert.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-600" /> :
                   alert.type === 'success' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                   <Activity className="w-4 h-4 text-blue-600" />}
                </div>
                <div>
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">User Management</h3>
        <Button>Add New User</Button>
      </div>
      
      <Card className="p-6">
        <div className="space-y-4">
          {[
            { name: "Alice Johnson", email: "alice@example.com", status: "verified", joined: "2024-01-15", transactions: 23 },
            { name: "Bob Smith", email: "bob@example.com", status: "pending", joined: "2024-01-18", transactions: 5 },
            { name: "Carol Davis", email: "carol@example.com", status: "verified", joined: "2024-01-12", transactions: 31 },
            { name: "David Wilson", email: "david@example.com", status: "suspended", joined: "2024-01-20", transactions: 0 },
          ].map((user, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">{user.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Joined</p>
                  <p>{user.joined}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Transactions</p>
                  <p>{user.transactions}</p>
                </div>
                <Badge variant={user.status === 'verified' ? 'default' : user.status === 'pending' ? 'secondary' : 'destructive'}>
                  {user.status}
                </Badge>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Transaction Management</h3>
        <Button variant="outline">Export Report</Button>
      </div>
      
      <Card className="p-6">
        <div className="space-y-4">
          {[
            { id: "#TX001", buyer: "Alice Johnson", seller: "TechStore Pro", amount: "$299.99", status: "completed", date: "2024-01-20" },
            { id: "#TX002", buyer: "Bob Smith", seller: "Digital World", amount: "$149.50", status: "pending", date: "2024-01-20" },
            { id: "#TX003", buyer: "Carol Davis", seller: "Fashion Hub", amount: "$89.00", status: "disputed", date: "2024-01-19" },
            { id: "#TX004", buyer: "David Wilson", seller: "Book Corner", amount: "$24.99", status: "refunded", date: "2024-01-19" },
          ].map((transaction, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{transaction.id}</p>
                  <p className="text-sm text-muted-foreground">{transaction.buyer} → {transaction.seller}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">{transaction.amount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p>{transaction.date}</p>
                </div>
                <Badge variant={
                  transaction.status === 'completed' ? 'default' : 
                  transaction.status === 'pending' ? 'secondary' : 
                  transaction.status === 'disputed' ? 'destructive' : 'outline'
                }>
                  {transaction.status}
                </Badge>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderSystem = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">System Configuration & Management</h3>
        <div className="flex gap-3">
          <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Upload a new product to the marketplace
                </DialogDescription>
              </DialogHeader>
              {renderProductForm()}
            </DialogContent>
          </Dialog>
          
          <Dialog open={showVendorForm} onOpenChange={setShowVendorForm}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Onboard New Vendor</DialogTitle>
                <DialogDescription>
                  Add a new vendor to the marketplace
                </DialogDescription>
              </DialogHeader>
              {renderVendorForm()}
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Status
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Connection Status</span>
              <Badge variant="default">Connected</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Last Backup</span>
              <span className="text-sm text-muted-foreground">2 hours ago</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Storage Used</span>
              <span className="text-sm text-muted-foreground">67% (2.4GB)</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Settings
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">2FA Enabled</span>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">SSL Certificate</span>
              <Badge variant="default">Valid</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Last Security Scan</span>
              <span className="text-sm text-muted-foreground">1 day ago</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Products */}
      <Card className="p-6">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Recent Products
        </h4>
        <div className="space-y-3">
          {[
            { name: "iPhone 15 Pro", category: "Electronics", price: "$999", vendor: "TechStore Pro", date: "2024-01-20" },
            { name: "Nike Air Max", category: "Fashion", price: "$149", vendor: "Fashion Hub", date: "2024-01-19" },
            { name: "MacBook Air M3", category: "Electronics", price: "$1299", vendor: "Apple Store", date: "2024-01-18" },
          ].map((product, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.category} • {product.vendor}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">{product.price}</span>
                <span className="text-muted-foreground">{product.date}</span>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Vendors */}
      <Card className="p-6">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Recent Vendors
        </h4>
        <div className="space-y-3">
          {[
            { name: "TechStore Pro", email: "contact@techstore.com", business: "TechStore Ltd", products: 45, joined: "2024-01-15" },
            { name: "Fashion Hub", email: "info@fashionhub.com", business: "Fashion Hub Inc", products: 23, joined: "2024-01-18" },
            { name: "Book Corner", email: "hello@bookcorner.com", business: "Book Corner LLC", products: 67, joined: "2024-01-12" },
          ].map((vendor, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">{vendor.name[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{vendor.name}</p>
                  <p className="text-xs text-muted-foreground">{vendor.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">Products</p>
                  <p className="font-medium">{vendor.products}</p>
                </div>
                <span className="text-muted-foreground">{vendor.joined}</span>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview": return renderOverview();
      case "orders": return renderOrders();
      case "vendors": return renderVendors();
      case "products": return renderProducts();
      case "users": return renderUsers();
      case "system": return renderSystem();
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/3">
      {/* Header */}
      <nav className="border-b border-border/30 bg-background/95 backdrop-blur-sm">
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
              <div className="h-4 w-px bg-border/50" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold">CREDIFY</span>
                  <Badge variant="secondary" className="ml-2">Admin</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <div className="h-4 w-px bg-border/50" />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, transactions, and system configuration</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 bg-muted/50 rounded-lg w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information for this order
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Order ID: {selectedOrder.id || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">Customer: {selectedOrder.customerName || 'Unknown'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">${selectedOrder.amount || '0.00'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{selectedOrder.paymentMethod || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedOrder.date ? new Date(selectedOrder.date).toLocaleString() : 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={selectedOrder.status === 'completed' ? 'default' : selectedOrder.status === 'pending' ? 'secondary' : 'destructive'}>
                    {selectedOrder.status || 'unknown'}
                  </Badge>
                </div>
              </div>
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Items:</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                        <span>{item.name || item.title || 'Unknown Item'}</span>
                        <span>${item.price || '0.00'} x {item.quantity || 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowOrderDetails(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete this {deleteTarget?.type}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete {deleteTarget?.type}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}