import { Loader2, MapPin, Info, Tag, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Product } from '@/services/userService';
import { getStockStatus } from './ProductCard';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  isLoading: boolean;
}

const ProductDetailsModal = ({
  isOpen,
  onClose,
  product,
  isLoading,
}: ProductDetailsModalProps) => {
  // Calculate final price with CGST + SGST
  const calculateFinalPrice = (product: Product) => {
    const basePrice = product.productDP || 0;
    const totalTaxRate = (product.cgst || 0) + (product.sgst || 0);
    return Math.round(basePrice * (1 + totalTaxRate / 100));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Product Details</DialogTitle>
          <DialogDescription>
            View detailed information about this product
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : product ? (
          <ScrollArea className="max-h-[85vh]">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left Column - Product Image */}
              <div className="relative bg-muted/30">
                <AspectRatio ratio={1} className="md:aspect-auto md:h-full">
                  <img
                    src={product.productImage?.url || '/placeholder.svg'}
                    alt={product.productName}
                    className="object-cover w-full h-full"
                  />
                </AspectRatio>
                {/* Stock Badge */}
                <div className="absolute top-4 right-4">
                  {(() => {
                    const status = getStockStatus(product);
                    return (
                      <Badge
                        variant={status.variant}
                        className={`text-sm px-3 py-1 ${status.pulse ? 'animate-pulse' : ''}`}
                      >
                        {status.label}
                      </Badge>
                    );
                  })()}
                </div>
              </div>

              {/* Right Column - Product Information */}
              <div className="p-6 flex flex-col">
                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="uppercase text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {product.category || 'General'}
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground leading-tight">
                    {product.productName}
                  </h2>
                  {product.hsnCode && (
                    <p className="text-xs text-muted-foreground mt-1">
                      HSN Code: {product.hsnCode}
                    </p>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                <Separator className="my-4" />

                {/* Pricing & Business Section */}
                <div className="bg-muted/30 rounded-xl p-4 mb-4 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Pricing & Business Details
                  </h3>

                  {/* Price Row */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-background rounded-lg p-3 text-center border">
                      <p className="text-xs text-muted-foreground mb-1">MRP</p>
                      <p className="text-lg font-semibold text-foreground">
                        ₹{product.mrp?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3 text-center border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">Dealer Price</p>
                      <p className="text-xl font-bold text-primary">
                        ₹{product.productDP?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="bg-background rounded-lg p-3 text-center border">
                      <p className="text-xs text-muted-foreground mb-1">Final (inc. Tax)</p>
                      <p className="text-lg font-semibold text-foreground">
                        ₹{calculateFinalPrice(product).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Networking Row */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-background rounded-lg p-3 text-center border">
                      <p className="text-xs text-muted-foreground mb-1">Business Volume</p>
                      <p className="text-lg font-bold text-foreground">
                        {product.bv || 0} <span className="text-sm font-normal text-muted-foreground">BV</span>
                      </p>
                    </div>
                    <div className="bg-background rounded-lg p-3 text-center border">
                      <p className="text-xs text-muted-foreground mb-1">Point Value</p>
                      <p className="text-lg font-bold text-foreground">
                        {product.pv || 0} <span className="text-sm font-normal text-muted-foreground">PV</span>
                      </p>
                    </div>
                  </div>

                  {/* Tax Info Row */}
                  {(product.cgst || product.sgst) && (
                    <div className="bg-background rounded-lg p-2 text-center border">
                      <p className="text-xs text-muted-foreground">
                        CGST: {product.cgst || 0}% | SGST: {product.sgst || 0}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Purchase Info - Footer */}
                <div className="mt-auto bg-accent/50 rounded-xl p-4 flex items-start gap-3 border border-border/50">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      Visit Your Nearest Franchise Store
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      To purchase this product at Dealer Price, please contact or visit your nearest authorized Franchise partner.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
