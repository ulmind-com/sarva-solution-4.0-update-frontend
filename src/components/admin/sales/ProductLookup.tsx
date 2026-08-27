import { useState, useEffect } from 'react';
import { Package, Loader2, Search, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface ProductDetails {
  _id: string;
  productName: string;
  productImage?: { url: string };
  stockQuantity: number;
  price: number;
  mrp: number;
  productDP: number;
  bv: number;
  pv: number;
  category: string;
}

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitDP: number;
  bv: number;
  pv: number;
  maxStock: number;
}

interface ProductLookupProps {
  onAddToCart: (item: CartItem) => void;
  isDisabled: boolean;
}

const ProductLookup = ({ onAddToCart, isDisabled }: ProductLookupProps) => {
  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Original state variables needed for bottom part of component
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);

  // Fetch all products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const response = await api.get('/api/v1/admin/product/list', { params: { limit: 1000 } });
        const data = response.data?.data?.products || response.data?.products || response.data || [];
        // Map the data to ProductDetails matching the required fields
        const mappedProducts = data.map((p: any) => ({
          _id: p._id,
          productName: p.productName || p.name || 'Unnamed Product',
          productImage: p.productImage || p.image,
          stockQuantity: p.stockQuantity ?? p.stockCount ?? 0,
          price: p.price || 0,
          mrp: p.mrp || 0,
          productDP: p.productDP || p.price || 0,
          bv: p.bv || 0,
          pv: p.pv || 0,
          category: p.category || p.segment || 'Uncategorized',
        }));
        setProducts(mappedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products for lookup');
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.productName.toLowerCase().includes(lowerSearch) ||
            p._id.toLowerCase().includes(lowerSearch)
        )
      );
    }
  }, [searchTerm, products]);

  const handleSelectProduct = (product: ProductDetails) => {
    setProductDetails(product);
    setProductId(product._id);
    setSearchTerm(product.productName);
    setIsFocused(false);
  };

  const handleAddToCart = () => {
    if (!productDetails) return;

    if (quantity <= 0) {
      toast.error('Quantity must be at least 1');
      return;
    }

    if (quantity > productDetails.stockQuantity) {
      toast.error(`Only ${productDetails.stockQuantity} units available in stock`);
      return;
    }

    onAddToCart({
      productId: productDetails._id,
      name: productDetails.productName,
      quantity,
      unitDP: productDetails.productDP || productDetails.price,
      bv: productDetails.bv || 0,
      pv: productDetails.pv || 0,
      maxStock: productDetails.stockQuantity,
    });

    // Reset
    setProductId('');
    setQuantity(1);
    setProductDetails(null);
    toast.success('Added to bill');
  };

  const handleClear = () => {
    setProductId('');
    setSearchTerm('');
    setQuantity(1);
    setProductDetails(null);
  };

  return (
    <Card className={isDisabled ? 'opacity-50 pointer-events-none' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          Product Lookup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isDisabled && (
          <p className="text-sm text-muted-foreground">
            Please verify a franchise first
          </p>
        )}

        {!isDisabled && (
          <>
            <div className="relative">
              {isLoadingProducts ? (
                <div className="flex items-center gap-2 p-2 border rounded-md text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading products...
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search product by name or ID..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!isFocused) setIsFocused(true);
                        if (productDetails && e.target.value !== productDetails.productName) {
                          setProductDetails(null);
                          setProductId('');
                        }
                      }}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => {
                        // Delay hiding to allow clicking dropdown items
                        setTimeout(() => setIsFocused(false), 200);
                      }}
                      className="pl-9"
                    />
                  </div>

                  {/* Dropdown list */}
                  {isFocused && (
                    <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-popover border border-border rounded-md shadow-md z-50">
                      {filteredProducts.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                          No products found
                        </div>
                      ) : (
                        filteredProducts.map((p) => (
                          <div
                            key={p._id}
                            className="p-2 hover:bg-muted cursor-pointer flex items-center justify-between border-b last:border-b-0"
                            onClick={() => handleSelectProduct(p)}
                          >
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-medium truncate">{p.productName}</p>
                              <p className="text-xs text-muted-foreground truncate">ID: {p._id}</p>
                            </div>
                            <div className="text-right ml-2 flex-shrink-0">
                              <p className="text-sm font-bold text-primary">₹{(p.productDP || p.price)?.toLocaleString()}</p>
                              <p className="text-[10px] text-muted-foreground">Stock: {p.stockQuantity}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {productDetails && (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex gap-3">
                  {productDetails.productImage?.url ? (
                    <img
                      src={productDetails.productImage.url}
                      alt={productDetails.productName}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{productDetails.productName}</p>
                    <Badge variant="outline" className="text-xs capitalize">
                      {productDetails.category}
                    </Badge>
                    <div className="flex items-center gap-2 mt-1">
                      {productDetails.stockQuantity < 10 ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low Stock: {productDetails.stockQuantity}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Stock: {productDetails.stockQuantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-xs text-muted-foreground">DP</p>
                    <p className="font-bold">₹{(productDetails.productDP || productDetails.price)?.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-xs text-muted-foreground">MRP</p>
                    <p className="font-medium">₹{productDetails.mrp?.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-xs text-muted-foreground">BV</p>
                    <p className="font-medium">{productDetails.bv || 0}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    max={productDetails.stockQuantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-24"
                    placeholder="Qty"
                  />
                  <Button className="flex-1" onClick={handleAddToCart}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Bill
                  </Button>
                  <Button variant="outline" onClick={handleClear}>
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductLookup;
