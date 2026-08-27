import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { getFranchiseSalesHistory } from '@/services/franchiseService';
import { useFranchiseAuthStore } from '@/stores/useFranchiseAuthStore';
import { generateInvoicePDF } from '@/lib/generateInvoicePDF';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SaleItem {
  product?: { productName?: string; hsnCode?: string };
  productName?: string;
  quantity?: number;
  requestedQuantity?: number;
  price?: number;
  amount?: number;
  pv?: number;
}

interface Sale {
  _id: string;
  saleNo: string;
  saleDate: string;
  createdAt_IST?: string;
  user?: { fullName?: string; memberId?: string; phone?: string; email?: string; address?: { country?: string; city?: string; state?: string } };
  memberId?: string;
  items: SaleItem[];
  subTotal?: number;
  gstAmount?: number;
  totalPV?: number;
  totalBV?: number;
  grandTotal: number;
  paymentMethod?: string;
  paymentStatus?: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const FranchiseOrderHistory = () => {
  const navigate = useNavigate();
  const { isAuthenticated, franchise } = useFranchiseAuthStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/franchise/login');
      return;
    }
    fetchSales(currentPage);
  }, [currentPage, isAuthenticated]);

  const fetchSales = async (page: number) => {
    setIsLoading(true);
    try {
      const data = await getFranchiseSalesHistory(page, 20);
      setSales(data.sales || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load sales history');
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    if (!sales.length) { toast.error('No data to export'); return; }
    const headers = ['Sale No', 'Date', 'Member ID', 'Customer', 'Phone', 'Items', 'Total PV', 'Grand Total', 'Payment', 'Status'];
    const rows = sales.map((s) => [
      s.saleNo,
      s.createdAt_IST || new Date(s.saleDate).toLocaleDateString(),
      s.user?.memberId || s.memberId || '',
      s.user?.fullName || '',
      s.user?.phone || '',
      s.items.length.toString(),
      (s.totalPV ?? 0).toString(),
      s.grandTotal.toString(),
      s.paymentMethod || '',
      s.paymentStatus || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const exportPDF = () => {
    if (!sales.length) { toast.error('No data to export'); return; }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Franchise Order History', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Sale No', 'Date', 'Customer', 'Items', 'PV', 'Total (₹)', 'Status']],
      body: sales.map((s) => [
        s.saleNo,
        s.createdAt_IST || new Date(s.saleDate).toLocaleDateString(),
        s.user?.fullName || s.memberId || '',
        s.items.length,
        s.totalPV ?? 0,
        s.grandTotal,
        s.paymentStatus || '',
      ]),
    });

    doc.save(`order-history-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('PDF downloaded');
  };

  const handleDownloadInvoice = (sale: Sale) => {
    generateInvoicePDF(sale, franchise?.shopName || franchise?.name || 'Franchise Store');
    toast.success(`Invoice ${sale.saleNo} downloaded`);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/franchise/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Order History</h1>
                <p className="text-sm text-muted-foreground">View your past sales and invoices</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportPDF}>
                <FileText className="h-4 w-4 mr-1" /> PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales Records</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No sales history found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sale No & Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-center">Order Stats</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Invoice</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale) => (
                        <TableRow key={sale._id}>
                          <TableCell>
                            <div>
                              <p className="font-mono text-sm font-medium">{sale.saleNo}</p>
                              <p className="text-xs text-muted-foreground">
                                {sale.createdAt_IST || new Date(sale.saleDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{sale.user?.fullName || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">
                                {[sale.user?.memberId || sale.memberId, sale.user?.phone].filter(Boolean).join(' | ')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <p className="text-sm">{sale.items.length} Items | {sale.totalPV ?? 0} PV</p>
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <p className="font-semibold text-sm text-green-600 dark:text-green-400">
                                ₹{sale.grandTotal.toLocaleString('en-IN')}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {sale.paymentMethod || 'N/A'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={sale.paymentStatus === 'paid' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {sale.paymentStatus || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadInvoice(sale)}
                              title="Download Invoice"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrevPage}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNextPage}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FranchiseOrderHistory;
