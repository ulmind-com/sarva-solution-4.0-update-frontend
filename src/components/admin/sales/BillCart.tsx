import { ShoppingCart, Trash2, FileText, Loader2, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { type CartItem } from './ProductLookup';
import { type VerifiedFranchise } from './FranchiseVerification';

interface InvoiceResult {
  invoiceNo: string;
  pdfUrl: string;
}

interface BillCartProps {
  cart: CartItem[];
  franchise: VerifiedFranchise | null;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onSaleComplete: () => void;
}

const BillCart = ({ cart, franchise, onRemoveItem, onClearCart, onSaleComplete }: BillCartProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState<InvoiceResult | null>(null);

  const totalAmount = cart.reduce((sum, item) => sum + item.unitDP * item.quantity, 0);
  const totalBV = cart.reduce((sum, item) => sum + item.bv * item.quantity, 0);
  const totalPV = cart.reduce((sum, item) => sum + item.pv * item.quantity, 0);

  const handleGenerateInvoice = async () => {
    if (!franchise) {
      toast.error('Please verify a franchise first');
      return;
    }

    if (cart.length === 0) {
      toast.error('Please add products to the bill');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        franchiseId: franchise.vendorId, // Using vendorId as per API requirement
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const response = await api.post('/api/v1/admin/sales/sell-to-franchise', payload);
      
      const invoiceData = response.data?.data?.invoice || response.data?.invoice || response.data;
      const invoiceNo = invoiceData?.invoiceNo || invoiceData?.invoiceNumber || 'N/A';
      const pdfUrl = invoiceData?.pdfUrl || '';

      setInvoiceResult({ invoiceNo, pdfUrl });
      setShowSuccessDialog(true);
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      toast.error(error.response?.data?.message || 'Failed to process sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    setShowSuccessDialog(false);
    setInvoiceResult(null);
    onClearCart();
    onSaleComplete();
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              Bill
            </span>
            {cart.length > 0 && (
              <Badge>{cart.length} items</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-8">
              <ShoppingCart className="h-12 w-12 mb-2 opacity-50" />
              <p>No items in bill</p>
              <p className="text-sm">Add products to generate invoice</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Unit DP</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">BV</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium text-sm max-w-[120px] truncate">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{item.unitDP?.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{(item.unitDP * item.quantity)?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">{item.bv * item.quantity}</TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => onRemoveItem(item.productId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-auto pt-4">
                <Separator className="mb-4" />
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total BV</span>
                    <span className="font-medium">{totalBV} BV</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total PV</span>
                    <span className="font-medium">{totalPV} PV</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span>₹{totalAmount?.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleGenerateInvoice}
                  disabled={isSubmitting || !franchise}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Generate Invoice
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <DialogTitle className="text-center">Sale Completed!</DialogTitle>
            <DialogDescription className="text-center">
              Invoice <span className="font-mono font-bold">{invoiceResult?.invoiceNo}</span> has been generated successfully.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 mt-4">
            {invoiceResult?.pdfUrl && (
              <Button
                className="w-full"
                onClick={() => window.open(invoiceResult.pdfUrl, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Invoice PDF
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDialogClose}
            >
              Close & Start New Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BillCart;
