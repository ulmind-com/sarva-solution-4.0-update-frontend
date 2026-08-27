import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Search, Loader2, RefreshCw, ChevronLeft, ChevronRight, Copy, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import api from '@/lib/api';
import { toast } from 'sonner';
import { deleteProduct } from '@/services/adminService';
import EditProductDialog from '@/components/admin/EditProductDialog';

interface Product {
  _id: string;
  productName?: string;
  name?: string;
  price: number;
  mrp?: number;
  bv?: number;
  pv?: number;
  description: string;
  category?: string;
  segment?: string;
  stockQuantity?: number;
  stockCount?: number;
  cgst?: number;
  sgst?: number;
  hsnCode?: string;
  productDP?: number;
  discount?: number;
  isFeatured?: boolean;
  isActivationPackage?: boolean;
  isActive?: boolean;
  productImage?: {
    url: string;
    public_id?: string;
  };
  image?: {
    url: string;
    publicId?: string;
  };
  createdAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  limit: number;
}

const getProductName = (product: Product): string => {
  return product.productName || product.name || 'Unnamed Product';
};

const getProductCategory = (product: Product): string => {
  return product.category || product.segment || 'Uncategorized';
};

const getProductStock = (product: Product): number | null => {
  return product.stockQuantity ?? product.stockCount ?? null;
};

const getProductImageUrl = (product: Product): string | null => {
  return product.productImage?.url || product.image?.url || null;
};

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 20,
  });

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async (page = 1, showRefreshSpinner = false) => {
    if (showRefreshSpinner) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const response = await api.get(`/api/v1/admin/product/list`, {
        params: { page, limit: 20 },
      });
      
      const data = response.data.data || response.data;
      setProducts(data.products || data || []);
      
      if (data.pagination) {
        setPagination(data.pagination);
      } else {
        setPagination((prev) => ({
          ...prev,
          currentPage: page,
          totalProducts: data.products?.length || data.length || 0,
        }));
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter((product) => {
    const name = getProductName(product).toLowerCase();
    const category = getProductCategory(product).toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || category.includes(search);
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'health care': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'aquaculture': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'agriculture': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      'personal care': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
      'home care': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'luxury goods': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'offer package': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    };
    return colors[category.toLowerCase()] || 'bg-muted text-muted-foreground';
  };

  const getStockBadgeStyle = (product: Product) => {
    const stock = getProductStock(product);
    
    if (stock === null) return '';
    if (stock <= 0) return 'text-destructive font-bold';
    if (stock < 10) return 'text-destructive font-medium';
    return 'text-foreground';
  };

  const handlePageChange = (newPage: number) => {
    fetchProducts(newPage);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deleteTarget._id);
      toast.success('Product deleted successfully');
      setDeleteTarget(null);
      fetchProducts(pagination.currentPage, true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product List</h1>
          <p className="text-muted-foreground">
            {pagination.totalProducts} products in inventory
          </p>
        </div>
        <Button onClick={() => navigate('/admin/products/add')} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Search and Refresh */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => fetchProducts(pagination.currentPage, true)}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              {searchTerm ? 'No products found' : 'No products yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? 'Try a different search term' : 'Add your first product to get started'}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/admin/products/add')} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                   <TableHead>Product Name</TableHead>
                   <TableHead>Product ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">MRP</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>HSN</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stock = getProductStock(product);
                  const isLowStock = stock !== null && stock < 10;
                  
                  return (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden">
                          {getProductImageUrl(product) ? (
                            <img
                              src={getProductImageUrl(product)!}
                              alt={getProductName(product)}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{getProductName(product)}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {product.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-1">
                           <span className="font-mono text-[10px] text-muted-foreground">
                             {product._id}
                           </span>
                           <Button
                             variant="ghost"
                             size="icon"
                             className="h-5 w-5"
                             onClick={(e) => {
                               e.stopPropagation();
                               navigator.clipboard.writeText(product._id);
                               toast.success('Product ID copied');
                             }}
                           >
                             <Copy className="h-3 w-3" />
                           </Button>
                         </div>
                       </TableCell>
                       <TableCell>
                         <Badge
                           variant="secondary"
                           className={`capitalize ${getCategoryColor(getProductCategory(product))}`}
                         >
                           {getProductCategory(product)}
                         </Badge>
                       </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{product.price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {product.mrp ? `₹${product.mrp.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {stock !== null ? (
                          <Badge 
                            variant={isLowStock ? 'destructive' : 'outline'}
                            className={isLowStock ? '' : getStockBadgeStyle(product)}
                          >
                            {stock}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.hsnCode || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => { setEditProduct(product); setEditOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(product)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <EditProductDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        product={editProduct}
        onSuccess={() => fetchProducts(pagination.currentPage, true)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget ? (deleteTarget.productName || deleteTarget.name) : ''}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductList;
