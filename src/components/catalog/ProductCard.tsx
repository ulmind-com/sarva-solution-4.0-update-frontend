import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Product } from '@/services/userService';

interface ProductCardProps {
  product: Product;
  index: number;
  onClick: () => void;
}

// Stock status logic (masks actual numbers)
export const getStockStatus = (product: Product) => {
  if (!product.isInStock) {
    return { label: 'Out of Stock', variant: 'destructive' as const, pulse: false };
  }
  if (product.stockQuantity < 10) {
    return { label: 'Hurry! Low Stock', variant: 'secondary' as const, pulse: true };
  }
  return { label: 'In Stock', variant: 'default' as const, pulse: false };
};

const ProductCard = ({ product, index, onClick }: ProductCardProps) => {
  const stockStatus = getStockStatus(product);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
        onClick={onClick}
      >
        {/* Product Image */}
        <div className="relative">
          <AspectRatio ratio={1}>
            <img
              src={product.productImage?.url || '/placeholder.svg'}
              alt={product.productName}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          </AspectRatio>
          {/* Stock Badge */}
          <div className="absolute top-2 right-2">
            <Badge
              variant={stockStatus.variant}
              className={stockStatus.pulse ? 'animate-pulse' : ''}
            >
              {stockStatus.label}
            </Badge>
          </div>
        </div>

        {/* Product Info */}
        <CardContent className="p-4">
          <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1">
            {product.category || 'General'}
          </p>
          <h3 className="font-semibold text-foreground line-clamp-2 min-h-[2.5rem]">
            {product.productName}
          </h3>
        </CardContent>

        {/* Pricing Grid - No strikethrough on MRP */}
        <CardFooter className="p-4 pt-0">
          <div className="w-full grid grid-cols-2 gap-2 text-sm">
            <div className="bg-muted/50 rounded-md p-2 text-center">
              <p className="text-muted-foreground text-xs">MRP</p>
              <p className="font-medium text-foreground">
                ₹{product.mrp?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-primary/10 rounded-md p-2 text-center">
              <p className="text-muted-foreground text-xs">DP</p>
              <p className="font-bold text-primary">
                ₹{product.productDP?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-muted/50 rounded-md p-2 text-center">
              <p className="text-muted-foreground text-xs">BV</p>
              <p className="font-medium text-foreground">{product.bv || 0}</p>
            </div>
            <div className="bg-muted/50 rounded-md p-2 text-center">
              <p className="text-muted-foreground text-xs">PV</p>
              <p className="font-medium text-foreground">{product.pv || 0}</p>
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ProductCard;
