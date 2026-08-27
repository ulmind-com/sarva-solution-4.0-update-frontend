import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Check, X, Clock, Package, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  getFranchiseRequests,
  approveFranchiseRequest,
  type FranchiseRequest,
} from '@/services/adminService';

const FranchiseRequests = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['franchise-requests'],
    queryFn: () => getFranchiseRequests(1, 100),
  });

  const approveMutation = useMutation({
    mutationFn: approveFranchiseRequest,
    onSuccess: () => {
      toast.success('Request Approved & Processed');
      queryClient.invalidateQueries({ queryKey: ['franchise-requests'] });
    },
    onError: () => {
      toast.error('Failed to approve request');
    },
  });

  const requests: FranchiseRequest[] = data?.requests || [];

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.requestNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.franchise?.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.franchise?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.items?.[0]?.product?.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeTab === 'all' || request.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTotalQuantity = (request: FranchiseRequest) =>
    request.items?.reduce((acc, item) => acc + (item.requestedQuantity || 0), 0) || 0;

  const getEstimatedTotal = (request: FranchiseRequest) => {
    if (request.estimatedTotal != null) return request.estimatedTotal;
    return request.items?.reduce((acc, item) => acc + (item.product?.productDP || 0) * (item.requestedQuantity || 0), 0) || 0;
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Franchise Product Requests</h1>
        <p className="text-muted-foreground">Manage product requests from franchise partners</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Franchise</TableHead>
                  <TableHead>Product(s)</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Est. Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request._id}>
                      {/* Request ID */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs font-medium">{request.requestNo}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => {
                              navigator.clipboard.writeText(request.requestNo);
                              toast.success('Request ID copied');
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Franchise */}
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.franchise?.shopName || '-'}</p>
                          <p className="text-xs text-muted-foreground">{request.franchise?.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {request.franchise?.city} • {request.franchise?.vendorId}
                          </p>
                        </div>
                      </TableCell>

                      {/* Products */}
                      <TableCell>
                        {request.items?.length > 0 ? (
                          <div>
                            <p className="text-sm">{request.items[0].product?.productName || 'Unknown'}</p>
                            {request.items.length > 1 && (
                              <Badge variant="outline" className="mt-1 text-[10px]">
                                + {request.items.length - 1} more
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No Products</span>
                        )}
                      </TableCell>

                      {/* Quantity */}
                      <TableCell className="text-center">
                        <Badge variant="outline">{getTotalQuantity(request)}</Badge>
                      </TableCell>

                      {/* Total */}
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-foreground">
                            ₹{request.grandTotal?.toFixed(2) || getEstimatedTotal(request).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            Base: ₹{request.totalTaxableValue?.toFixed(2) || getEstimatedTotal(request).toLocaleString('en-IN')}
                          </span>
                          {((request as any).totalCGST > 0 || (request as any).totalSGST > 0) && (
                            <span className="text-xs text-muted-foreground">
                              CGST: ₹{(request as any).totalCGST?.toFixed(2)} | SGST: ₹{(request as any).totalSGST?.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm">
                        {formatDate(request.requestDate || request.createdAt)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>{getStatusBadge(request.status)}</TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(request._id)}
                          >
                            {approveMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            Approve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FranchiseRequests;
