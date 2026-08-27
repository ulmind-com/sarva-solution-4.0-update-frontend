import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Minus, History, Loader2, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Product {
  _id: string;
  productName?: string;
  name?: string;
  price: number;
  category?: string;
  segment?: string;
  stockQuantity?: number;
  stockCount?: number;
  productImage?: {
    url: string;
  };
}

interface StockHistoryItem {
  _id: string;
  type: 'add' | 'remove';
  quantity: number;
  reason: string;
  referenceNo?: string;
  batchNo?: string;
  createdAt: string;
  performedBy?: {
    fullName: string;
  };
}

const StockDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [addStockModal, setAddStockModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [removeStockModal, setRemoveStockModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [historyModal, setHistoryModal] = useState<{ open: boolean; product: Product | null; history: StockHistoryItem[] }>({ open: false, product: null, history: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Form state - simplified to only quantity
  const [stockQuantity, setStockQuantity] = useState('');

  const fetchData = useCallback(async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const productsRes = await api.get('/api/v1/admin/product/list');
      const productsData = productsRes.data.data?.products || productsRes.data.data || productsRes.data.products || [];
      setProducts(productsData);
    } catch (error: any) {
      console.error('Error fetching stock data:', error);
      toast.error('Failed to fetch stock data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper functions to handle both old and new API field names
  const getProductName = (product: Product): string => {
    return product.productName || product.name || 'Unnamed Product';
  };

  const getProductCategory = (product: Product): string => {
    return product.category || product.segment || 'Uncategorized';
  };

  const getProductStock = (product: Product): number => {
    return product.stockQuantity ?? product.stockCount ?? 0;
  };

  const filteredProducts = products?.filter((product) => {
    const searchLower = searchTerm?.toLowerCase() || '';
    const name = getProductName(product).toLowerCase();
    return name.includes(searchLower);
  }) || [];

  const handleAddStock = async () => {
    if (!addStockModal.product || !stockQuantity) {
      toast.error('Please enter a quantity');
      return;
    }

    const qty = parseInt(stockQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid positive quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch(`/api/v1/admin/product/stock/add/${addStockModal.product._id}`, {
        quantityToAdd: qty,
      });

      toast.success('Stock added successfully');
      setAddStockModal({ open: false, product: null });
      setStockQuantity('');
      fetchData(true);
    } catch (error: any) {
      console.error('Error adding stock:', error);
      toast.error(error.response?.data?.message || 'Failed to add stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStock = async () => {
    if (!removeStockModal.product || !stockQuantity) {
      toast.error('Please enter a quantity');
      return;
    }

    const qty = parseInt(stockQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid positive quantity');
      return;
    }

    // Check if quantity exceeds current stock - use stockQuantity first, then stockCount
    const currentStock = removeStockModal.product.stockQuantity ?? removeStockModal.product.stockCount ?? 0;
    if (qty > currentStock) {
      toast.error(`Cannot remove more than current stock (${currentStock})`);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch(`/api/v1/admin/product/stock/remove/${removeStockModal.product._id}`, {
        quantityToRemove: qty,
      });

      toast.success('Stock removed successfully');
      setRemoveStockModal({ open: false, product: null });
      setStockQuantity('');
      fetchData(true);
    } catch (error: any) {
      console.error('Error removing stock:', error);
      toast.error(error.response?.data?.message || 'Failed to remove stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchStockHistory = async (product: Product) => {
    setHistoryModal({ open: true, product, history: [] });
    setIsLoadingHistory(true);

    try {
      const response = await api.get(`/api/v1/admin/product/stock/history/${product._id}`);
      setHistoryModal((prev) => ({
        ...prev,
        history: response.data.data || response.data.history || [],
      }));
    } catch (error: any) {
      console.error('Error fetching stock history:', error);
      toast.error('Failed to fetch stock history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Dashboard</h1>
          <p className="text-muted-foreground">Manage your inventory stock levels</p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stock Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Current Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stock = getProductStock(product);
                  return (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden">
                          {product.productImage?.url ? (
                            <img
                              src={product.productImage.url}
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
                      <TableCell className="font-medium">{getProductName(product)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {getProductCategory(product)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={stock < 10 ? 'destructive' : 'outline'}
                        >
                          {stock}
                        </Badge>
                      </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                          onClick={() => {
                            setStockQuantity('');
                            setAddStockModal({ open: true, product });
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => {
                            setStockQuantity('');
                            setRemoveStockModal({ open: true, product });
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => fetchStockHistory(product)}
                        >
                          <History className="h-4 w-4" />
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

      {/* Add Stock Modal */}
      <Dialog open={addStockModal.open} onOpenChange={(open) => setAddStockModal({ open, product: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
            <DialogDescription>
              Add stock for <strong>{addStockModal.product ? getProductName(addStockModal.product) : ''}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-quantity">Quantity *</Label>
              <Input
                id="add-quantity"
                type="number"
                min="1"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="Enter quantity to add"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStockModal({ open: false, product: null })}>
              Cancel
            </Button>
            <Button onClick={handleAddStock} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Stock Modal */}
      <Dialog open={removeStockModal.open} onOpenChange={(open) => setRemoveStockModal({ open, product: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Stock</DialogTitle>
            <DialogDescription>
              Remove stock from <strong>{removeStockModal.product ? getProductName(removeStockModal.product) : ''}</strong>
              {removeStockModal.product && (
                <span className="block mt-1 text-sm">
                  Current stock: <strong>{getProductStock(removeStockModal.product)}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="remove-quantity">Quantity *</Label>
              <Input
                id="remove-quantity"
                type="number"
                min="1"
                max={removeStockModal.product ? getProductStock(removeStockModal.product) : undefined}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="Enter quantity to remove"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveStockModal({ open: false, product: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveStock} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock History Modal */}
      <Dialog open={historyModal.open} onOpenChange={(open) => setHistoryModal({ open, product: null, history: [] })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Stock History</DialogTitle>
            <DialogDescription>
              History for <strong>{historyModal.product ? getProductName(historyModal.product) : ''}</strong>
            </DialogDescription>
          </DialogHeader>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : historyModal.history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stock history found
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyModal.history.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="text-sm">{formatDate(item.createdAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.type === 'add' ? 'default' : 'destructive'}
                          className={item.type === 'add' ? 'bg-green-500' : ''}
                        >
                          {item.type === 'add' ? 'Added' : 'Removed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={item.type === 'add' ? 'text-green-600' : 'text-red-600'}>
                          {item.type === 'add' ? '+' : '-'}{item.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {item.reason || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockDashboard;
