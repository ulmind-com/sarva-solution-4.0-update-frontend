import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, User, Package, Trash2, ShoppingCart, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getMemberByCode, processFranchiseSale, getFranchiseInventory } from '@/services/franchiseService';
import { useFranchiseAuthStore } from '@/stores/useFranchiseAuthStore';

interface VerifiedMember {
  _id: string;
  memberId: string;
  fullName: string;
  status: string;
  phone?: string;
  email?: string;
  isFirstPurchaseDone?: boolean;
}

interface InventoryItem {
  _id: string;
  product: {
    _id: string;
    productName: string;
    productImage?: { url: string };
    price?: number;
    productDP?: number;
    mrp?: number;
    bv: number;
    pv: number;
    category?: string;
    stockQuantity?: number;
  };
  stockQuantity: number;
  purchasePrice?: number;
}

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  bv: number;
  pv: number;
  maxStock: number;
}

const FranchiseCreateBill = () => {
  const navigate = useNavigate();
  const { isAuthenticated, franchise } = useFranchiseAuthStore();

  // Member State
  const [memberIdInput, setMemberIdInput] = useState('');
  const [verifiedMember, setVerifiedMember] = useState<VerifiedMember | null>(null);
  const [isMemberLoading, setIsMemberLoading] = useState(false);

  // Inventory State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Sale State
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [saleResult, setSaleResult] = useState<{
    saleNo?: string;
    grandTotal?: number;
    totalBV?: number;
    totalPV?: number;
    userActivated?: boolean;
    isFirstPurchase?: boolean;
    emailSent?: boolean;
  } | null>(null);

  // Redirect if not authenticated (after all hooks)
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/franchise/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch franchise inventory on mount
  useEffect(() => {
    const fetchInventory = async () => {
      setIsInventoryLoading(true);
      try {
        const response = await getFranchiseInventory();
        const items = response.data?.inventory || response.inventory || response.data || [];
        setInventory(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
        toast.error('Failed to load inventory');
      } finally {
        setIsInventoryLoading(false);
      }
    };
    if (isAuthenticated) fetchInventory();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  // ===== Member Verification =====
  const handleVerifyMember = async () => {
    if (!memberIdInput.trim()) {
      toast.error('Please enter a Member ID');
      return;
    }

    setIsMemberLoading(true);
    try {
      const response = await getMemberByCode(memberIdInput.trim());
      const member = response.data?.user || response.user || response.data || response;
      
      if (member && member.memberId) {
        setVerifiedMember({
          _id: member._id,
          memberId: member.memberId,
          fullName: member.fullName || member.name || 'Unknown Member',
          status: member.status || 'active',
          phone: member.phone,
          email: member.email,
          isFirstPurchaseDone: member.isFirstPurchaseDone,
        });
        toast.success('Member verified successfully!');
      } else {
        toast.error('Member not found');
        setVerifiedMember(null);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Member not found';
      toast.error(errorMsg);
      setVerifiedMember(null);
    } finally {
      setIsMemberLoading(false);
    }
  };

  const handleClearMember = () => {
    setVerifiedMember(null);
    setMemberIdInput('');
    setSelectedInventoryItem(null);
    setSelectedProductId('');
    setCart([]);
  };

  // ===== Product Selection from Inventory =====
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const item = inventory.find((i) => i.product._id === productId);
    setSelectedInventoryItem(item || null);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!selectedInventoryItem) return;
    const product = selectedInventoryItem.product;
    const availableStock = selectedInventoryItem.stockQuantity;

    if (quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.productId === product._id);
    const existingQty = existingIndex >= 0 ? cart[existingIndex].quantity : 0;

    if (existingQty + quantity > availableStock) {
      toast.error(`Only ${availableStock - existingQty} more units available`);
      return;
    }

    const price = product.productDP || product.price || selectedInventoryItem.purchasePrice || 0;

    if (existingIndex >= 0) {
      setCart(cart.map((item, i) =>
        i === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
      ));
    } else {
      setCart([...cart, {
        productId: product._id,
        name: product.productName,
        quantity,
        price,
        bv: product.bv || 0,
        pv: product.pv || 0,
        maxStock: availableStock,
      }]);
    }

    toast.success(`${product.productName} added to bill`);
    setSelectedInventoryItem(null);
    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalBV = cart.reduce((sum, item) => sum + (item.bv * item.quantity), 0);
  const totalPV = cart.reduce((sum, item) => sum + (item.pv * item.quantity), 0);

  const isFirstPurchase = verifiedMember ? !verifiedMember.isFirstPurchaseDone : false;

  // ===== Generate Bill =====
  const handleGenerateBill = async () => {
    if (!verifiedMember) {
      toast.error('Please verify member first');
      return;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        memberId: verifiedMember.memberId,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod,
      };

      const response = await processFranchiseSale(payload);
      const data = response.data || response;
      setSaleResult({
        saleNo: data.sale?.saleNo,
        grandTotal: data.grandTotal,
        totalBV: data.totalBV,
        totalPV: data.totalPV,
        userActivated: data.userActivated,
        isFirstPurchase: data.isFirstPurchase,
        emailSent: data.emailSent,
      });
      setShowSuccessDialog(true);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to generate bill';
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessDialog(false);
    setSaleResult(null);
    setVerifiedMember(null);
    setMemberIdInput('');
    setSelectedInventoryItem(null);
    setSelectedProductId('');
    setCart([]);
    setPaymentMethod('cash');
  };

  // Filter inventory to only show items with stock > 0
  const availableInventory = inventory.filter((item) => item.stockQuantity > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/franchise/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">Create Bill</h1>
            <p className="text-xs text-muted-foreground">{franchise?.shopName}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left Column - Search & Add */}
          <div className="lg:col-span-3 space-y-6">
            {/* Step 1: Member Verification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Step 1: Verify Member
                </CardTitle>
                <CardDescription>Enter the Member ID to verify the buyer</CardDescription>
              </CardHeader>
              <CardContent>
                {!verifiedMember ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter Member ID (e.g., SS000001)"
                      value={memberIdInput}
                      onChange={(e) => setMemberIdInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyMember()}
                    />
                    <Button type="button" onClick={handleVerifyMember} disabled={isMemberLoading}>
                      <Search className="h-4 w-4 mr-2" />
                      {isMemberLoading ? 'Verifying...' : 'Verify'}
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 border-2 border-green-500/50 rounded-lg bg-green-500/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{verifiedMember.fullName}</p>
                          <p className="text-sm text-muted-foreground">ID: {verifiedMember.memberId}</p>
                          <p className="text-xs text-muted-foreground">{verifiedMember.email} • {verifiedMember.phone}</p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-500">
                        {verifiedMember.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3" onClick={handleClearMember}>
                      Change Member
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Product Addition from Inventory */}
            <Card className={!verifiedMember ? 'opacity-50 pointer-events-none' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" />
                  Step 2: Add Products
                </CardTitle>
                <CardDescription>Select products from your inventory</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Inventory Dropdown */}
                {isInventoryLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-4 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading inventory...</span>
                  </div>
                ) : availableInventory.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No products in inventory. Request stock first.</p>
                  </div>
                ) : (
                  <Select value={selectedProductId} onValueChange={handleProductSelect} disabled={!verifiedMember}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Product from Inventory" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableInventory.map((item) => (
                        <SelectItem key={item.product._id} value={item.product._id}>
                          {item.product.productName} (Stock: {item.stockQuantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Selected Product Preview */}
                {selectedInventoryItem && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex gap-4">
                      {selectedInventoryItem.product.productImage?.url ? (
                        <img
                          src={selectedInventoryItem.product.productImage.url}
                          alt={selectedInventoryItem.product.productName}
                          className="h-20 w-20 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{selectedInventoryItem.product.productName}</h4>
                        {selectedInventoryItem.product.category && (
                          <Badge variant="secondary" className="mt-1">{selectedInventoryItem.product.category}</Badge>
                        )}
                        <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                          <div className="p-2 bg-background rounded text-center">
                            <p className="text-muted-foreground text-xs">Price</p>
                            <p className="font-bold">₹{selectedInventoryItem.product.productDP || selectedInventoryItem.product.price || selectedInventoryItem.purchasePrice || 0}</p>
                          </div>
                          <div className="p-2 bg-background rounded text-center">
                            <p className="text-muted-foreground text-xs">BV</p>
                            <p className="font-bold">{selectedInventoryItem.product.bv || 0}</p>
                          </div>
                          <div className="p-2 bg-background rounded text-center">
                            <p className="text-muted-foreground text-xs">PV</p>
                            <p className="font-bold">{selectedInventoryItem.product.pv || 0}</p>
                          </div>
                        </div>
                        <p className="text-xs mt-2 font-medium text-green-600">
                          Available Stock: {selectedInventoryItem.stockQuantity} units
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Qty:</span>
                        <Input
                          type="number"
                          min={1}
                          max={selectedInventoryItem.stockQuantity}
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                      </div>
                      <Button type="button" onClick={handleAddToCart} className="flex-1">
                        Add to Bill
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Cart & Summary */}
          <div className="lg:col-span-2">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="h-5 w-5" />
                  Bill Summary
                </CardTitle>
                <CardDescription>
                  {cart.length} item(s) in bill
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Table */}
                {cart.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ₹{item.price} × {item.quantity}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right font-medium">
                              ₹{item.price * item.quantity}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleRemoveFromCart(item.productId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No items in bill</p>
                    <p className="text-sm">Add products to generate bill</p>
                  </div>
                )}

                {/* Grand Totals */}
                {cart.length > 0 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Amount</span>
                        <span className="text-2xl font-bold text-primary">₹{totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total BV</span>
                        <span className="font-semibold">{totalBV}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total PV</span>
                        <span className="font-semibold">{totalPV}</span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Payment Method</label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* PV Warning */}
                    {cart.length > 0 && isFirstPurchase && totalPV < 1 && (
                      <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
                        <p className="text-sm text-destructive font-medium">
                          ⚠️ Order must have at least 1 PV to proceed.
                        </p>
                      </div>
                    )}

                    {/* Generate Bill Button */}
                    <Button
                      type="button"
                      className="w-full"
                      size="lg"
                      onClick={handleGenerateBill}
                      disabled={isProcessing || !verifiedMember || cart.length === 0 || (isFirstPurchase && totalPV < 1)}
                    >
                      {isProcessing 
                        ? 'Processing...' 
                        : isFirstPurchase && totalPV < 1 && cart.length > 0 
                          ? 'Minimum 1 PV Required' 
                          : 'Generate Bill'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <DialogTitle className="text-center text-xl">Sale Completed Successfully! ✅</DialogTitle>
            <DialogDescription className="text-center">
              Invoice generated for {verifiedMember?.fullName}
            </DialogDescription>
          </DialogHeader>
          
          {saleResult?.saleNo && (
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Sale No</p>
              <p className="font-mono font-bold text-lg">{saleResult.saleNo}</p>
            </div>
          )}

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Grand Total</p>
            <p className="text-3xl font-bold text-primary">
              ₹{(saleResult?.grandTotal ?? totalAmount).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total BV</p>
              <p className="font-bold text-lg">{saleResult?.totalBV ?? totalBV}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total PV</p>
              <p className="font-bold text-lg">{saleResult?.totalPV ?? totalPV}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {saleResult?.userActivated && (
              <Badge className="bg-green-500">User Activated! 🎉</Badge>
            )}
            {saleResult?.isFirstPurchase && (
              <Badge variant="secondary">First Purchase</Badge>
            )}
            {saleResult?.emailSent && (
              <Badge variant="outline">Invoice Emailed ✉️</Badge>
            )}
          </div>

          <Button type="button" onClick={handleCloseSuccess} className="w-full">
            Create New Bill
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FranchiseCreateBill;
