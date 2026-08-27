import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Package, Trash2, Send, Loader2, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { createStockRequest } from '@/services/franchiseService';
import api from '@/lib/api';
import { useFranchiseAuthStore } from '@/stores/useFranchiseAuthStore';

interface ProductDetails {
  _id: string;
  productName: string;
  productImage?: { url: string };
  price: number;
  productDP?: number;
  category?: string;
}

interface RequestItem {
  productId: string;
  productName: string;
  imageUrl?: string;
  category?: string;
  quantity: number;
}

const FranchiseRequestStock = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useFranchiseAuthStore();

  // Product lookup
  const [productIdInput, setProductIdInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [verifiedProduct, setVerifiedProduct] = useState<ProductDetails | null>(null);
  const [quantity, setQuantity] = useState('1');

  // Request list
  const [requestList, setRequestList] = useState<RequestItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductLookup = async () => {
    if (!productIdInput.trim()) {
      toast.error('Please enter a Product ID');
      return;
    }
    setIsSearching(true);
    setVerifiedProduct(null);
    try {
      const response = await api.get(`/api/v1/user/products/${productIdInput.trim()}`);
      const product = response.data?.data?.product || response.data?.product || response.data;
      if (!product || !product._id) {
        toast.error('Product not found');
        return;
      }
      setVerifiedProduct(product);
      toast.success(`Product found: ${product.productName}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Product not found');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToList = () => {
    if (!verifiedProduct) return;
    const qty = Number(quantity);
    if (!qty || qty < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    const exists = requestList.find((item) => item.productId === verifiedProduct._id);
    if (exists) {
      setRequestList((prev) =>
        prev.map((item) =>
          item.productId === verifiedProduct._id
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      );
      toast.success('Quantity updated');
    } else {
      setRequestList((prev) => [
        ...prev,
        {
          productId: verifiedProduct._id,
          productName: verifiedProduct.productName,
          imageUrl: verifiedProduct.productImage?.url,
          category: verifiedProduct.category,
          quantity: qty,
        },
      ]);
      toast.success('Product added to request list');
    }

    setVerifiedProduct(null);
    setProductIdInput('');
    setQuantity('1');
  };

  const handleRemoveItem = (productId: string) => {
    setRequestList((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleSubmit = async () => {
    if (requestList.length === 0) {
      toast.error('Add at least one product to request');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = requestList.map((item) => ({
        productId: item.productId,
        requestedQuantity: item.quantity,
      }));
      await createStockRequest(payload);
      toast.success('Stock request submitted successfully!');
      setRequestList([]);
      navigate('/franchise/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    navigate('/franchise/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/franchise/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Request Stock</h1>
              <p className="text-sm text-muted-foreground">Search products by ID and submit a stock request</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Product Lookup */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-5 w-5" />
                  Find Product
                </CardTitle>
                <CardDescription>Enter the Product ID to look up and verify</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter Product ID..."
                    value={productIdInput}
                    onChange={(e) => setProductIdInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleProductLookup()}
                  />
                  <Button onClick={handleProductLookup} disabled={isSearching}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Product Preview */}
                {verifiedProduct && (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0">
                          {verifiedProduct.productImage?.url ? (
                            <img src={verifiedProduct.productImage.url} alt={verifiedProduct.productName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">{verifiedProduct.productName}</p>
                          {verifiedProduct.category && (
                            <Badge variant="secondary" className="mt-1 capitalize">{verifiedProduct.category}</Badge>
                          )}
                          <p className="text-xs text-muted-foreground mt-1 font-mono">{verifiedProduct._id}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-end gap-3">
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="quantity">Quantity Needed</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleAddToList} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Request Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="h-5 w-5" />
                  Request Summary
                  {requestList.length > 0 && (
                    <Badge variant="secondary">{requestList.length} items</Badge>
                  )}
                </CardTitle>
                <CardDescription>Review products before submitting</CardDescription>
              </CardHeader>
              <CardContent>
                {requestList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No products added yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Search and add products from the left panel</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requestList.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{item.productName}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{item.productId}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{item.quantity}</Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveItem(item.productId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Total: <span className="font-semibold text-foreground">{requestList.reduce((s, i) => s + i.quantity, 0)}</span> units across{' '}
                        <span className="font-semibold text-foreground">{requestList.length}</span> products
                      </p>
                      <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Submit Request
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FranchiseRequestStock;
