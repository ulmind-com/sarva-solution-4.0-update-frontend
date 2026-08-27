import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Check,
  X,
  Clock,
  Loader2,
  RefreshCw,
  CreditCard,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  Wallet,
  Eye,
  Download,
  Building2,
  ShieldCheck,
  FileSpreadsheet,
  FilterX,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PayoutRequest {
  _id: string;
  memberId: string;
  grossAmount: number;
  netAmount: number;
  status: 'pending' | 'completed' | 'rejected' | 'processing' | 'failed';
  payoutType: string;
  scheduledFor: string;
  createdAt: string;
  processedAt?: string;
  userId: {
    _id?: string;
    fullName?: string;
    name?: string;
    email: string;
    phone?: number;
    memberId?: string;
  };
}

interface PayoutStats {
  pendingCount: number;
  pendingAmount: number;
  processedToday: number;
  processedTodayAmount: number;
  rejectedCount: number;
}

interface KYCInfo {
  status: string;
  aadhaarNumber?: string;
  panCardNumber?: string;
}

interface BankInfo {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  branch?: string;
}

interface UserDetails {
  kyc?: KYCInfo;
  bank?: BankInfo;
  fullName?: string;
  memberId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PayoutRequests = () => {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [stats, setStats] = useState<PayoutStats>({
    pendingCount: 0,
    pendingAmount: 0,
    processedToday: 0,
    processedTodayAmount: 0,
    rejectedCount: 0,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  // Date filter
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Eye / user-details modal
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; payout: PayoutRequest | null; userDetails: UserDetails | null; loading: boolean }>({
    open: false,
    payout: null,
    userDetails: null,
    loading: false,
  });

  // Single approve/reject
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'approve' | 'reject';
    payout: PayoutRequest;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSingleProcessing, setIsSingleProcessing] = useState(false);

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter]);

  // ─── Fetch payouts ──────────────────────────────────────────────────────────

  const fetchPayouts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/v1/admin/payouts`, {
        params: { status: statusFilter !== 'all' ? statusFilter : undefined },
      });
      const data = response.data.data || response.data;
      setPayouts(Array.isArray(data) ? data : data.payouts || []);
      if (data.stats) {
        setStats(data.stats);
      } else {
        calculateStats(Array.isArray(data) ? data : data.payouts || []);
      }
    } catch (error: any) {
      console.error('Error fetching payouts:', error);
      toast.error('Failed to fetch payout requests');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (payoutList: PayoutRequest[]) => {
    const today = new Date().toDateString();
    const pending = payoutList.filter((p) => p.status === 'pending');
    const processedToday = payoutList.filter(
      (p) =>
        p.status === 'completed' &&
        p.processedAt &&
        new Date(p.processedAt).toDateString() === today
    );
    const rejected = payoutList.filter((p) => p.status === 'rejected');
    setStats({
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, p) => sum + (p.netAmount || p.grossAmount || 0), 0),
      processedToday: processedToday.length,
      processedTodayAmount: processedToday.reduce(
        (sum, p) => sum + (p.netAmount || p.grossAmount || 0),
        0
      ),
      rejectedCount: rejected.length,
    });
  };

  // ─── Date filtered payouts ──────────────────────────────────────────────────

  const filteredPayouts = useMemo(() => {
    if (!dateFrom && !dateTo) return payouts;
    return payouts.filter((p) => {
      // Use local-date string comparison (yyyy-MM-dd) so that
      // From=2026-02-14 and To=2026-02-14 captures the full IST day.
      const localDate = format(new Date(p.scheduledFor || p.createdAt), 'yyyy-MM-dd');
      if (dateFrom && localDate < dateFrom) return false;
      if (dateTo && localDate > dateTo) return false;
      return true;
    });
  }, [payouts, dateFrom, dateTo]);

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  // ─── Selection ──────────────────────────────────────────────────────────────

  const pendingPayouts = filteredPayouts.filter((p) => p.status === 'pending');
  const allPendingSelected =
    pendingPayouts.length > 0 && pendingPayouts.every((p) => selectedIds.includes(p._id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(pendingPayouts.map((p) => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  // ─── Bulk actions ───────────────────────────────────────────────────────────

  const handleProcessBulk = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one payout to process');
      return;
    }
    setIsProcessing(true);
    try {
      await api.post('/api/v1/admin/payouts/process-bulk', { payoutIds: selectedIds });
      toast.success(`${selectedIds.length} payout(s) processed successfully`);
      setSelectedIds([]);
      fetchPayouts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process payouts');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectBulk = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one payout to reject');
      return;
    }
    setIsProcessing(true);
    try {
      await api.post('/api/v1/admin/payouts/reject-bulk', { payoutIds: selectedIds });
      toast.success(`${selectedIds.length} payout(s) rejected`);
      setSelectedIds([]);
      fetchPayouts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject payouts');
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Single approve / reject ────────────────────────────────────────────────

  const handleMarkAsPaid = (payoutId: string) => {
    const payout = payouts.find((p) => p._id === payoutId);
    if (payout) setConfirmDialog({ type: 'approve', payout });
  };

  const handleRejectSingle = (payoutId: string) => {
    const payout = payouts.find((p) => p._id === payoutId);
    if (payout) {
      setRejectReason('');
      setConfirmDialog({ type: 'reject', payout });
    }
  };

  const confirmApprove = async () => {
    if (!confirmDialog) return;
    setIsSingleProcessing(true);
    try {
      await api.patch(`/api/v1/admin/payouts/${confirmDialog.payout._id}/accept`);
      toast.success('Payout Approved');
      setConfirmDialog(null);
      fetchPayouts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve payout');
    } finally {
      setIsSingleProcessing(false);
    }
  };

  const confirmReject = async () => {
    if (!confirmDialog) return;
    setIsSingleProcessing(true);
    try {
      await api.patch(`/api/v1/admin/payouts/${confirmDialog.payout._id}/reject`, {
        rejectionReason: rejectReason || undefined,
      });
      toast.success('Payout Rejected');
      setConfirmDialog(null);
      setRejectReason('');
      fetchPayouts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject payout');
    } finally {
      setIsSingleProcessing(false);
    }
  };

  // ─── Eye / user details modal ───────────────────────────────────────────────

  const openUserDetails = async (payout: PayoutRequest) => {
    setDetailsModal({ open: true, payout, userDetails: null, loading: true });
    try {
      const memberId = payout.memberId || payout.userId?.memberId;
      const response = await api.get(`/api/v1/admin/users/${memberId}`);
      const body = response.data?.data || response.data;
      const user = body?.user || body;
      const bankAccount = body?.bankAccount || user?.bankAccount || null;
      setDetailsModal((prev) => ({
        ...prev,
        loading: false,
        userDetails: {
          fullName: user?.fullName || user?.name,
          memberId: user?.memberId,
          kyc: user?.kyc || (user as any).panCardNumber
            ? {
              status: user.kyc?.status,
              aadhaarNumber: user.kyc?.aadhaarNumber,
              panCardNumber: (user as any).panCardNumber || user.kyc?.panCardNumber,
            }
            : undefined,
          bank: bankAccount
            ? {
              accountName: bankAccount.accountName,
              accountNumber: bankAccount.accountNumber,
              bankName: bankAccount.bankName,
              ifscCode: bankAccount.ifscCode,
              branch: bankAccount.branch,
            }
            : undefined,
        },
      }));
    } catch (err) {
      console.error('Failed to fetch user details:', err);
      setDetailsModal((prev) => ({ ...prev, loading: false, userDetails: {} }));
      toast.error('Could not load user details');
    }
  };

  // ─── Export Helpers ─────────────────────────────────────────────────────────

  const [isExporting, setIsExporting] = useState(false);

  /** Fetch KYC + bank details for every visible payout row in parallel */
  const fetchAllUserDetails = async () => {
    const results: Record<string, { kyc?: KYCInfo; bank?: BankInfo }> = {};
    await Promise.allSettled(
      filteredPayouts.map(async (p) => {
        const memberId = p.memberId || p.userId?.memberId;
        if (!memberId) return;
        try {
          const res = await api.get(`/api/v1/admin/users/${memberId}`);
          const body = res.data?.data || res.data;
          const user = body?.user || body;
          const bankAccount = body?.bankAccount || user?.bankAccount || null;
          results[memberId] = {
            kyc: user?.kyc || (user as any).panCardNumber
              ? { status: user.kyc?.status, aadhaarNumber: user.kyc?.aadhaarNumber, panCardNumber: (user as any).panCardNumber || user.kyc?.panCardNumber }
              : undefined,
            bank: bankAccount
              ? { accountName: bankAccount.accountName, accountNumber: bankAccount.accountNumber, bankName: bankAccount.bankName, ifscCode: bankAccount.ifscCode, branch: bankAccount.branch }
              : undefined,
          };
        } catch { /* skip failed */ }
      })
    );
    return results;
  };

  const buildExportRows = (userMap: Record<string, { kyc?: KYCInfo; bank?: BankInfo }>) =>
    filteredPayouts.map((p) => {
      const mid = p.memberId || p.userId?.memberId || '';
      const ud = userMap[mid] || {};
      return {
        'Member ID': mid,
        'Full Name': p.userId?.fullName || p.userId?.name || '',
        Email: p.userId?.email || '',
        Phone: formatPhone(p.userId?.phone) || '',
        'Gross Amount': p.grossAmount || 0,
        'Net Amount': p.netAmount || p.grossAmount || 0,
        'Payout Type': formatPayoutType(p.payoutType),
        Status: p.status,
        'Scheduled/Created': formatDate(p.scheduledFor || p.createdAt),
        'Processed At': p.processedAt ? formatDate(p.processedAt) : '',
        // KYC
        'KYC Status': ud.kyc?.status || 'N/A',
        'Aadhaar Number': ud.kyc?.aadhaarNumber || 'N/A',
        'PAN Number': ud.kyc?.panCardNumber || 'N/A',
        // Bank
        'Account Holder': ud.bank?.accountName || 'N/A',
        'Account Number': ud.bank?.accountNumber || 'N/A',
        'Bank Name': ud.bank?.bankName || 'N/A',
        'IFSC Code': ud.bank?.ifscCode || 'N/A',
        'Branch': ud.bank?.branch || 'N/A',
      };
    });

  const downloadCSV = async () => {
    if (filteredPayouts.length === 0) { toast.error('No data to export'); return; }
    setIsExporting(true);
    toast.info('Fetching bank & KYC details, please wait…');
    try {
      const userMap = await fetchAllUserDetails();
      const rows = buildExportRows(userMap);
      const headers = Object.keys(rows[0]);
      const csvLines = [
        headers.join(','),
        ...rows.map((r) =>
          headers.map((h) => {
            let val = String((r as any)[h]).replace(/"/g, '""');
            // Prefix long numeric strings like Aadhaar or Phone with an equals-quote ="..." to force Excel text mode
            if ((h === 'Aadhaar Number' || h === 'Phone' || h === 'Account Number') && /^\d+$/.test(val)) {
              return `="""${val}"""`; // CSV formula equivalent string
            }
            return `"${val}"`;
          }).join(',')
        ),
      ];
      const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payout_requests_${format(new Date(), 'yyyyMMdd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadXLSX = async () => {
    if (filteredPayouts.length === 0) { toast.error('No data to export'); return; }
    setIsExporting(true);
    toast.info('Fetching bank & KYC details, please wait…');
    try {
      const userMap = await fetchAllUserDetails();
      const rows = buildExportRows(userMap);
      const headers = Object.keys(rows[0]);

      // Build SpreadsheetML (opens natively in Excel)
      const xmlRows = [
        `<Row>${headers.map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('')}</Row>`,
        ...rows.map(
          (r) =>
            `<Row>${headers
              .map((h) => {
                const v = (r as any)[h];
                // Force string type for everything except Gross Amount and Net Amount to prevent scientific notation
                const isNum = (h === 'Gross Amount' || h === 'Net Amount') && typeof v === 'number';
                return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeXml(String(v))}</Data></Cell>`;
              })
              .join('')}</Row>`
        ),
      ].join('');

      const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Payouts">
    <Table>${xmlRows}</Table>
  </Worksheet>
</Workbook>`;
      const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payout_requests_${format(new Date(), 'yyyyMMdd')}.xls`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel file downloaded');
    } finally {
      setIsExporting(false);
    }
  };

  const escapeXml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; label: string }> = {
      pending: { className: 'bg-chart-4/20 text-chart-4 border-chart-4/30', label: 'Pending' },
      completed: { className: 'bg-primary/20 text-primary border-primary/30', label: 'Completed' },
      processing: { className: 'bg-chart-2/20 text-chart-2 border-chart-2/30', label: 'Processing' },
      rejected: { className: 'bg-destructive/20 text-destructive border-destructive/30', label: 'Rejected' },
      failed: { className: 'bg-destructive/20 text-destructive border-destructive/30', label: 'Failed' },
    };
    return config[status] || config.pending;
  };

  const formatPayoutType = (type: string) => {
    if (!type) return 'Withdrawal';
    return type.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try { return format(new Date(dateString), 'MMM dd, yyyy'); } catch { return 'N/A'; }
  };

  const formatPhone = (phone?: number) => {
    if (!phone) return null;
    const phoneStr = phone.toString();
    if (phoneStr.startsWith('91') && phoneStr.length > 10) return `+91 ${phoneStr.slice(2)}`;
    return phoneStr;
  };

  const kycStatusColor = (status?: string) => {
    if (!status) return 'bg-muted text-muted-foreground';
    const map: Record<string, string> = {
      approved: 'bg-green-100 text-green-700 border-green-300',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      rejected: 'bg-red-100 text-red-700 border-red-300',
      none: 'bg-gray-100 text-gray-600 border-gray-300',
    };
    return map[status] || 'bg-muted text-muted-foreground';
  };

  const hasDateFilter = dateFrom || dateTo;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payout Requests</h1>
          <p className="text-muted-foreground">Manage withdrawal requests from users</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchPayouts} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold text-foreground">₹{stats.pendingAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.pendingCount} request(s)</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-chart-4/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processed Today</p>
                <p className="text-2xl font-bold text-foreground">₹{stats.processedTodayAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.processedToday} payout(s)</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-foreground">{stats.rejectedCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Total rejected</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <X className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main table card */}
      <Card className="border-border">
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-foreground">All Withdrawal Requests</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {selectedIds.length > 0 && (
                <>
                  <Button size="sm" onClick={handleProcessBulk} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                    Process ({selectedIds.length})
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleRejectBulk} disabled={isProcessing}>
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
              {/* Download buttons */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isExporting}>
                    {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    {isExporting ? 'Exporting...' : 'Export'}
                    {hasDateFilter && !isExporting && <span className="ml-1 text-xs text-primary">(filtered)</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={downloadCSV}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Download CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadXLSX}>
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                    Download Excel (.xls)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Status tabs */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:inline-flex">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Pending</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Processed</span>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Rejected</span>
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">All</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Date Filter */}
          <div className="flex flex-wrap items-end gap-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 w-36 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 w-36 text-sm"
              />
            </div>
            {hasDateFilter && (
              <Button variant="ghost" size="sm" onClick={clearDateFilter} className="h-8 gap-1 text-muted-foreground">
                <FilterX className="h-4 w-4" />
                Clear
              </Button>
            )}
            {hasDateFilter && (
              <span className="text-xs text-muted-foreground self-center">
                Showing {filteredPayouts.length} of {payouts.length} records
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-sm">
                No {statusFilter !== 'all' ? statusFilter : ''} withdrawal requests found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allPendingSelected}
                        onCheckedChange={handleSelectAll}
                        disabled={pendingPayouts.length === 0}
                      />
                    </TableHead>
                    <TableHead className="text-muted-foreground">Member Details</TableHead>
                    <TableHead className="text-muted-foreground">Contact Info</TableHead>
                    <TableHead className="text-right text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-muted-foreground">Schedule</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((payout) => {
                    const statusConfig = getStatusBadge(payout.status);
                    const displayName = payout.userId?.fullName || payout.userId?.name || 'Unknown';
                    const displayMemberId = payout.memberId || payout.userId?.memberId || 'N/A';
                    const phone = formatPhone(payout.userId?.phone);

                    return (
                      <TableRow key={payout._id} className="border-border">
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(payout._id)}
                            onCheckedChange={(checked) => handleSelectOne(payout._id, !!checked)}
                            disabled={payout.status !== 'pending'}
                          />
                        </TableCell>

                        {/* Member Details */}
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{displayName}</p>
                            <p className="text-xs font-mono text-muted-foreground">{displayMemberId}</p>
                          </div>
                        </TableCell>

                        {/* Contact Info */}
                        <TableCell>
                          <div className="space-y-1">
                            {phone && (
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{payout.userId?.email || 'N/A'}</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <p className="font-bold text-primary">
                              ₹{(payout.netAmount || payout.grossAmount || 0).toLocaleString()}
                            </p>
                            {payout.grossAmount && payout.netAmount && payout.grossAmount !== payout.netAmount && (
                              <p className="text-xs text-muted-foreground">
                                Gross: ₹{payout.grossAmount.toLocaleString()}
                              </p>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {formatPayoutType(payout.payoutType)}
                            </Badge>
                          </div>
                        </TableCell>

                        {/* Schedule */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(payout.scheduledFor || payout.createdAt)}</span>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge variant="outline" className={statusConfig.className}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Eye button — KYC + Bank details */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              title="View KYC & Bank Details"
                              onClick={() => openUserDetails(payout)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Approve / Reject dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleMarkAsPaid(payout._id)}
                                  disabled={payout.status !== 'pending'}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Mark as Paid
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRejectSingle(payout._id)}
                                  disabled={payout.status !== 'pending'}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── User KYC & Bank Details Modal ───────────────────────────────────── */}
      <Dialog
        open={detailsModal.open}
        onOpenChange={(open) => !open && setDetailsModal((prev) => ({ ...prev, open: false }))}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Member Details
              {detailsModal.payout && (
                <span className="ml-1 text-sm font-mono text-muted-foreground">
                  – {detailsModal.payout.memberId || detailsModal.payout.userId?.memberId}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {detailsModal.loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-5 pt-1">
              {/* ── KYC Section ───────────────────────────── */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h3 className="flex items-center gap-2 font-semibold text-sm text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  KYC Details
                </h3>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">KYC Status</p>
                    {detailsModal.userDetails?.kyc?.status ? (
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${kycStatusColor(detailsModal.userDetails.kyc.status)}`}
                      >
                        {detailsModal.userDetails.kyc.status}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">Not Submitted</Badge>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">PAN Number</p>
                    <p className="text-sm font-mono font-medium text-foreground">
                      {detailsModal.userDetails?.kyc?.panCardNumber || '—'}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Aadhaar Number</p>
                    <p className="text-sm font-mono font-medium text-foreground">
                      {detailsModal.userDetails?.kyc?.aadhaarNumber || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Bank Section ──────────────────────────── */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h3 className="flex items-center gap-2 font-semibold text-sm text-foreground">
                  <Building2 className="h-4 w-4 text-primary" />
                  Bank Account Details
                </h3>

                {detailsModal.userDetails?.bank ? (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Account Holder</p>
                      <p className="text-sm font-medium text-foreground">
                        {detailsModal.userDetails.bank.accountName || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Account Number</p>
                      <p className="text-sm font-mono font-medium text-foreground">
                        {detailsModal.userDetails.bank.accountNumber || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Bank Name</p>
                      <p className="text-sm font-medium text-foreground">
                        {detailsModal.userDetails.bank.bankName || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">IFSC Code</p>
                      <p className="text-sm font-mono font-medium text-primary">
                        {detailsModal.userDetails.bank.ifscCode || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Branch</p>
                      <p className="text-sm font-medium text-foreground">
                        {detailsModal.userDetails.bank.branch || '—'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No bank details on record.</p>
                )}
              </div>

              {/* ── Payout Info ───────────────────────────── */}
              {detailsModal.payout && (
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <h3 className="flex items-center gap-2 font-semibold text-sm text-foreground">
                    <Wallet className="h-4 w-4 text-primary" />
                    Payout Request Info
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Net Amount</p>
                      <p className="text-sm font-bold text-primary">
                        ₹{(detailsModal.payout.netAmount || detailsModal.payout.grossAmount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusBadge(detailsModal.payout.status).className}`}
                      >
                        {getStatusBadge(detailsModal.payout.status).label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Payout Type</p>
                      <p className="text-sm text-foreground">{formatPayoutType(detailsModal.payout.payoutType)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Requested On</p>
                      <p className="text-sm text-foreground">
                        {formatDate(detailsModal.payout.scheduledFor || detailsModal.payout.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Approve Confirmation Dialog ──────────────────────────────────────── */}
      <AlertDialog
        open={confirmDialog?.type === 'approve'}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Payout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this payout of{' '}
              <span className="font-bold">
                ₹{(confirmDialog?.payout.netAmount || confirmDialog?.payout.grossAmount || 0).toLocaleString()}
              </span>{' '}
              for{' '}
              <span className="font-bold">
                {confirmDialog?.payout.userId?.fullName || confirmDialog?.payout.userId?.name || 'Unknown'}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSingleProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApprove} disabled={isSingleProcessing}>
              {isSingleProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Reject Confirmation Dialog ───────────────────────────────────────── */}
      <AlertDialog
        open={confirmDialog?.type === 'reject'}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Reject Payout</AlertDialogTitle>
            <AlertDialogDescription>
              Reject payout of{' '}
              <span className="font-bold">
                ₹{(confirmDialog?.payout.netAmount || confirmDialog?.payout.grossAmount || 0).toLocaleString()}
              </span>{' '}
              for{' '}
              <span className="font-bold">
                {confirmDialog?.payout.userId?.fullName || confirmDialog?.payout.userId?.name || 'Unknown'}
              </span>
              ? The amount will be refunded to the user's wallet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reject-reason">Rejection Reason (optional)</Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g., Invalid bank details, suspicious activity..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSingleProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              disabled={isSingleProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSingleProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PayoutRequests;
