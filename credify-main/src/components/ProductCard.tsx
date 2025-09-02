import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Shield, Star, Truck, AlertTriangle, Verified } from "lucide-react";
import { Product } from "@/lib/types";
import { useState } from "react";
import { AgeVerification } from "./AgeVerification";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);

  const handleAddToCart = async () => {
    // Check if product requires age verification
    if (product.ageRestriction) {
      setShowAgeVerification(true);
      return;
    }

    setIsLoading(true);
    try {
      await onAddToCart?.(product);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgeVerified = async () => {
    setIsLoading(true);
    try {
      await onAddToCart?.(product);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === "CCD") {
      return `${price.toFixed(2)} CCD`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency
    }).format(price);
  };

  return (
    <>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-glow hover:scale-[1.02] glass">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.images[0] || "/placeholder-product.jpg"}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        {product.ageRestriction && (
          <div className="absolute top-2 left-2">
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {product.ageRestriction.minimumAge}+
            </Badge>
          </div>
        )}
        
        {product.seller.isVerified && (
          <div className="absolute top-2 right-2">
            <Badge className="gradient-trust text-white">
              <Verified className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
            {product.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {product.category.name}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.price, product.currency)}
          </span>
          <Badge variant="outline" className="text-xs">
            {product.condition}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-current text-yellow-500" />
            <span className="text-xs font-medium">
              {(product.seller.reputationScore / 20).toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            by {product.seller.name}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {product.shipping.free && (
            <div className="flex items-center gap-1">
              <Truck className="w-3 h-3" />
              <span>Free shipping</span>
            </div>
          )}
          {product.escrowRequired && (
            <div className="flex items-center gap-1 text-primary">
              <Shield className="w-3 h-3" />
              <span>Escrow</span>
            </div>
          )}
        </div>

        <Button 
          className="w-full gradient-trust text-white hover:opacity-90 transition-opacity"
          onClick={handleAddToCart}
          disabled={isLoading || product.inventory === 0}
        >
          {isLoading ? (
            "Adding..."
          ) : product.inventory === 0 ? (
            "Out of Stock"
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </>
          )}
        </Button>
      </CardContent>
      </Card>

      {/* Age Verification Modal */}
      {product.ageRestriction && (
        <AgeVerification
          isOpen={showAgeVerification}
          onOpenChange={setShowAgeVerification}
          minimumAge={product.ageRestriction.minimumAge}
          productTitle={product.title}
          onVerified={handleAgeVerified}
          onCancel={() => setShowAgeVerification(false)}
        />
      )}
    </>
  );
}

export default ProductCard;