import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Grid, List, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { Product } from "@/lib/types";
import { useCart } from "@/contexts/CartContext";

const mockProducts: Product[] = [
  {
    id: "1",
    title: "Premium Wireless Headphones",
    description: "High-quality wireless headphones with noise cancellation and premium sound quality",
    price: 299.99,
    currency: "USD",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"],
    category: { id: "electronics", name: "Electronics", requiresVerification: false },
    seller: {
      id: "seller1",
      name: "TechStore Pro",
      reputationScore: 95,
      isVerified: true
    },
    escrowRequired: true,
    inventory: 15,
    condition: "NEW",
    shipping: { free: true, estimatedDays: 3 },
    createdAt: new Date()
  },
  {
    id: "2",
    title: "Vintage Whiskey Collection",
    description: "Rare vintage whiskey bottles for collectors - aged 25 years",
    price: 500.00,
    currency: "USD",
    images: ["https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop"],
    category: { id: "alcohol", name: "Alcoholic Beverages", requiresVerification: true },
    seller: {
      id: "seller2",
      name: "Premium Spirits",
      reputationScore: 88,
      isVerified: true
    },
    ageRestriction: {
      minimumAge: 21,
      requiresZKProof: true
    },
    escrowRequired: true,
    inventory: 5,
    condition: "NEW",
    shipping: { free: false, cost: 25, estimatedDays: 5 },
    createdAt: new Date()
  },
  {
    id: "3",
    title: "Smart Watch Pro",
    description: "Latest smartwatch with health monitoring, GPS, and 7-day battery life",
    price: 449.99,
    currency: "USD",
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"],
    category: { id: "electronics", name: "Electronics", requiresVerification: false },
    seller: {
      id: "seller3",
      name: "Digital World",
      reputationScore: 92,
      isVerified: true
    },
    escrowRequired: true,
    inventory: 8,
    condition: "NEW",
    shipping: { free: true, estimatedDays: 2 },
    createdAt: new Date()
  },
  {
    id: "4",
    title: "Designer Handbag",
    description: "Luxury leather handbag from top designer brand - authentic with certificate",
    price: 1299.99,
    currency: "USD",
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop"],
    category: { id: "fashion", name: "Fashion & Accessories", requiresVerification: false },
    seller: {
      id: "seller4",
      name: "Fashion Hub",
      reputationScore: 89,
      isVerified: true
    },
    escrowRequired: true,
    inventory: 3,
    condition: "NEW",
    shipping: { free: true, estimatedDays: 4 },
    createdAt: new Date()
  },
  {
    id: "5",
    title: "Gaming Laptop RTX 4080",
    description: "High-performance gaming laptop with RTX 4080, 32GB RAM, and 1TB NVMe SSD",
    price: 2499.99,
    currency: "USD",
    images: ["https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop"],
    category: { id: "electronics", name: "Electronics", requiresVerification: false },
    seller: {
      id: "seller1",
      name: "TechStore Pro",
      reputationScore: 95,
      isVerified: true
    },
    escrowRequired: true,
    inventory: 4,
    condition: "NEW",
    shipping: { free: true, estimatedDays: 3 },
    createdAt: new Date()
  },
  {
    id: "6",
    title: "Organic Coffee Beans",
    description: "Premium single-origin organic coffee beans - freshly roasted weekly",
    price: 24.99,
    currency: "USD",
    images: ["https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop"],
    category: { id: "food", name: "Food & Beverages", requiresVerification: false },
    seller: {
      id: "seller5",
      name: "Bean Corner",
      reputationScore: 94,
      isVerified: true
    },
    escrowRequired: false,
    inventory: 25,
    condition: "NEW",
    shipping: { free: false, cost: 8.99, estimatedDays: 2 },
    createdAt: new Date()
  },
  {
    id: "7",
    title: "Premium Cigar Set",
    description: "Hand-rolled Cuban cigars with humidor case - perfect for collectors",
    price: 350.00,
    currency: "USD",
    images: ["https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop"],
    category: { id: "tobacco", name: "Tobacco Products", requiresVerification: true },
    seller: {
      id: "seller6",
      name: "Cigar Lounge",
      reputationScore: 87,
      isVerified: true
    },
    ageRestriction: {
      minimumAge: 18,
      requiresZKProof: true
    },
    escrowRequired: true,
    inventory: 6,
    condition: "NEW",
    shipping: { free: false, cost: 15, estimatedDays: 4 },
    createdAt: new Date()
  },
  {
    id: "8",
    title: "Wireless Earbuds Pro",
    description: "True wireless earbuds with active noise cancellation and wireless charging",
    price: 199.99,
    currency: "USD",
    images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop"],
    category: { id: "electronics", name: "Electronics", requiresVerification: false },
    seller: {
      id: "seller3",
      name: "Digital World",
      reputationScore: 92,
      isVerified: true
    },
    escrowRequired: false,
    inventory: 12,
    condition: "NEW",
    shipping: { free: true, estimatedDays: 2 },
    createdAt: new Date()
  }
];

interface ProductCatalogProps {
  searchQuery?: string;
}

export function ProductCatalog({ searchQuery = "" }: ProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [search, setSearch] = useState(searchQuery);
  const [sortBy, setSortBy] = useState("relevance");
  const [showAgeRestricted, setShowAgeRestricted] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        const mapped = (data.products || []).map((p: any) => ({
          id: p._id || p.id,
          title: p.title,
          description: p.description,
          price: p.price,
          currency: p.currency,
          images: p.images || [],
          category: p.category,
          seller: p.seller,
          ageRestriction: p.ageRestriction,
          escrowRequired: p.escrowRequired,
          inventory: p.inventory,
          condition: p.condition,
          shipping: p.shipping,
          createdAt: new Date(p.createdAt || Date.now())
        } as Product));
        if (mapped.length > 0) setProducts(mapped);
      } catch (e) {}
    };
    load();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(search.toLowerCase()) ||
                          product.description.toLowerCase().includes(search.toLowerCase());
      const ageRestrictionFilter = showAgeRestricted || !product.ageRestriction;
      return matchesSearch && ageRestrictionFilter;
    });
  }, [products, search, showAgeRestricted]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    switch (sortBy) {
      case "price_low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price_high":
        return sorted.sort((a, b) => b.price - a.price);
      case "rating":
        return sorted.sort((a, b) => b.seller.reputationScore - a.seller.reputationScore);
      default:
        return sorted;
    }
  }, [filteredProducts, sortBy]);

  const { addItem, openCart } = useCart();

  const handleAddToCart = (product: Product) => {
    addItem(product);
    openCart();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
          
          <div className="flex">
            <Button 
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant={showAgeRestricted ? "default" : "outline"}
          size="sm"
          onClick={() => setShowAgeRestricted(!showAgeRestricted)}
        >
          <Filter className="w-3 h-3 mr-1" />
          Show Age-Restricted
        </Button>
        
        <Badge variant="secondary">
          {sortedProducts.length} products found
        </Badge>
      </div>

      <div className={viewMode === "grid" 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" 
        : "space-y-4"
      }>
        {sortedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
      
      {sortedProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

export default ProductCatalog;
