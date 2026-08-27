import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllProducts, getProductDetails, Product } from '@/services/userService';
import { toast } from 'sonner';
import ProductCard from '@/components/catalog/ProductCard';
import ProductDetailsModal from '@/components/catalog/ProductDetailsModal';

const ProductCatalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  // Details Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await getAllProducts(currentPage, 12);
      if (response.success) {
        setProducts(response.data.products);
        setTotalPages(response.data.pagination.totalPages);
        setHasNextPage(response.data.pagination.hasNextPage);
        setHasPrevPage(response.data.pagination.hasPrevPage);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        (product.productName || '').toLowerCase().includes(query) ||
        (product.category || '').toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const handleOpenDetails = async (product: Product) => {
    setIsDetailsOpen(true);
    setIsLoadingDetails(true);
    try {
      const response = await getProductDetails(product._id);
      if (response.success && response.data?.product) {
        setSelectedProduct(response.data.product);
      } else {
        // Fallback to basic product data if nested structure missing
        setSelectedProduct(product);
      }
    } catch (error) {
      console.error('Failed to fetch product details:', error);
      // Fallback to basic product data
      setSelectedProduct(product);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Our Products</h1>
          <p className="text-muted-foreground">Browse our complete product catalog</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Skeleton className="h-20 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Products Found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search query' : 'Products will appear here soon'}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product._id}
                product={product}
                index={index}
                onClick={() => handleOpenDetails(product)}
              />
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={!hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        product={selectedProduct}
        isLoading={isLoadingDetails}
      />
    </div>
  );
};

export default ProductCatalog;
