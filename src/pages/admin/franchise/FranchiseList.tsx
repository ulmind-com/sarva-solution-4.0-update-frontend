import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Store, Search, Loader2, RefreshCw, Ban, Phone, MapPin, MoreHorizontal, Pencil, Trash2, Eye, Trophy, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { toast } from 'sonner';
import { updateFranchise, deleteFranchise } from '@/services/adminService';

interface Franchise {
  _id: string;
  vendorId: string;
  name: string;
  shopName: string;
  email: string;
  phone: string;
  city?: string;
  status: 'active' | 'inactive' | 'blocked';
  isBlocked: boolean;
  isMaster?: boolean;
  shopAddress?: {
    street: string;
    pincode: string;
    state: string;
  };
  createdAt: string;
}

const ITEMS_PER_PAGE = 20;

const FranchiseList = () => {
  const navigate = useNavigate();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Block modal
  const [blockModal, setBlockModal] = useState<{ open: boolean; franchise: Franchise | null }>({ open: false, franchise: null });
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  // Edit modal
  const [editModal, setEditModal] = useState<{ open: boolean; franchise: Franchise | null }>({ open: false, franchise: null });
  const [editForm, setEditForm] = useState({ name: '', shopName: '', phone: '', city: '', password: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; franchise: Franchise | null }>({ open: false, franchise: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFranchises = useCallback(async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };
      if (cityFilter !== 'all') params.city = cityFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await api.get('/api/v1/admin/franchise/list', { params });
      // Handle nested response: { data: { franchises: [], pagination: {} } } or { franchises: [], pagination: {} }
      const responseData = response.data?.data || response.data;
      const franchiseArray = responseData?.franchises || [];
      setFranchises(Array.isArray(franchiseArray) ? franchiseArray : []);

      // Parse pagination from backend response
      const pagination = responseData?.pagination;
      if (pagination) {
        setTotalCount(pagination.total || 0);
        setTotalPages(pagination.totalPages || 1);
        setCurrentPage(pagination.currentPage || 1);
      } else {
        // Fallback if backend doesn't return pagination
        setTotalCount(franchiseArray.length);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error('Error fetching franchises:', error);
      toast.error('Failed to fetch franchises');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [cityFilter, statusFilter, currentPage]);

  useEffect(() => {
    fetchFranchises();
  }, [fetchFranchises]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [cityFilter, statusFilter]);

  const filteredFranchises = franchises.filter((franchise) => {
    const searchLower = searchTerm?.toLowerCase() || '';
    const name = franchise?.name?.toLowerCase() || '';
    const shopName = franchise?.shopName?.toLowerCase() || '';
    const email = franchise?.email?.toLowerCase() || '';
    const vendorId = franchise?.vendorId?.toLowerCase() || '';
    
    return (
      name.includes(searchLower) ||
      shopName.includes(searchLower) ||
      email.includes(searchLower) ||
      vendorId.includes(searchLower)
    );
  });

  const uniqueCities = [...new Set(franchises.map((f) => f.city).filter(Boolean))];

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleBlockFranchise = async () => {
    if (!blockModal.franchise) return;
    setIsBlocking(true);
    try {
      await api.patch(`/api/v1/admin/franchise/block/${blockModal.franchise._id}`, { reason: blockReason });
      toast.success('Franchise blocked successfully');
      setBlockModal({ open: false, franchise: null });
      setBlockReason('');
      fetchFranchises(true);
    } catch (error: any) {
      console.error('Error blocking franchise:', error);
      toast.error(error.response?.data?.message || 'Failed to block franchise');
    } finally {
      setIsBlocking(false);
    }
  };

  const openEditModal = (franchise: Franchise) => {
    setEditForm({
      name: franchise.name || '',
      shopName: franchise.shopName || '',
      phone: franchise.phone || '',
      city: franchise.city || '',
      password: '',
    });
    setEditModal({ open: true, franchise });
  };

  const handleUpdateFranchise = async () => {
    if (!editModal.franchise) return;
    setIsUpdating(true);
    try {
      const payload: Record<string, string> = {};
      if (editForm.name) payload.name = editForm.name;
      if (editForm.shopName) payload.shopName = editForm.shopName;
      if (editForm.phone) payload.phone = editForm.phone;
      if (editForm.city) payload.city = editForm.city;
      if (editForm.password) payload.password = editForm.password;

      await updateFranchise(editModal.franchise._id, payload);
      toast.success('Franchise updated successfully');
      setEditModal({ open: false, franchise: null });
      fetchFranchises(true);
    } catch (error: any) {
      console.error('Error updating franchise:', error);
      toast.error(error.response?.data?.message || 'Failed to update franchise');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteFranchise = async () => {
    if (!deleteDialog.franchise) return;
    setIsDeleting(true);
    try {
      await deleteFranchise(deleteDialog.franchise._id);
      toast.success('Franchise deleted successfully');
      setDeleteDialog({ open: false, franchise: null });
      fetchFranchises(true);
    } catch (error: any) {
      console.error('Error deleting franchise:', error);
      toast.error(error.response?.data?.message || 'Failed to delete franchise');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (franchise: Franchise) => {
    if (franchise.isBlocked) {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    switch (franchise.status) {
      case 'active':
        return <Badge className="bg-emerald-600 hover:bg-emerald-700">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{franchise.status || 'Unknown'}</Badge>;
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Franchises</h1>
          <p className="text-muted-foreground">{totalCount} franchise partners</p>
        </div>
        <Button onClick={() => navigate('/admin/franchise/add')} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Franchise
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, shop, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {uniqueCities.map((city) => (
              <SelectItem key={city} value={city!}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => fetchFranchises(true)}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Franchises Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredFranchises.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No franchises found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? 'Try a different search term' : 'Add your first franchise to get started'}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/admin/franchise/add')} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Franchise
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
                  <TableHead>Shop Details</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFranchises.map((franchise) => (
                  <TableRow key={franchise._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${franchise.isMaster ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20' : 'bg-primary/10 text-primary'}`}>
                          {franchise.isMaster ? <Trophy className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                        </div>
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground line-clamp-1 max-w-[150px]">{franchise.shopName || 'Unnamed Shop'}</p>
                            {franchise.isMaster && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20 uppercase tracking-widest leading-none">
                                  Master
                                </Badge>
                            )}
                          </div>
                          <p className="text-xs font-mono text-muted-foreground">{franchise.vendorId || '-'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{franchise.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{franchise.email || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {franchise.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {franchise.city ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {franchise.city}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(franchise)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/franchise/inventory/${franchise._id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Inventory
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(franchise)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!franchise.isBlocked && (
                            <DropdownMenuItem onClick={() => setBlockModal({ open: true, franchise })}>
                              <Ban className="h-4 w-4 mr-2" />
                              Block
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteDialog({ open: true, franchise })}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {getPageNumbers().map((page, idx) =>
                  typeof page === 'string' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-sm text-muted-foreground">…</span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Block Modal */}
      <Dialog open={blockModal.open} onOpenChange={(open) => setBlockModal({ open, franchise: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Franchise</DialogTitle>
            <DialogDescription>
              Are you sure you want to block <strong>{blockModal.franchise?.shopName}</strong>? They will no longer be able to access the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="block-reason">Reason for blocking</Label>
              <Textarea
                id="block-reason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter reason for blocking this franchise"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockModal({ open: false, franchise: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBlockFranchise} disabled={isBlocking}>
              {isBlocking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Block Franchise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Franchise Modal */}
      <Dialog open={editModal.open} onOpenChange={(open) => { if (!open) setEditModal({ open: false, franchise: null }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Franchise</DialogTitle>
            <DialogDescription>
              Update details for <strong>{editModal.franchise?.shopName}</strong>. Email and Vendor ID cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-shopName">Shop Name</Label>
              <Input id="edit-shopName" value={editForm.shopName} onChange={(e) => setEditForm(f => ({ ...f, shopName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Owner Name</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-city">City</Label>
              <Input id="edit-city" value={editForm.city} onChange={(e) => setEditForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password (optional)</Label>
              <Input id="edit-password" type="password" value={editForm.password} onChange={(e) => setEditForm(f => ({ ...f, password: e.target.value }))} placeholder="Leave blank to keep unchanged" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal({ open: false, franchise: null })}>Cancel</Button>
            <Button onClick={handleUpdateFranchise} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => { if (!open) setDeleteDialog({ open: false, franchise: null }); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Franchise</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteDialog.franchise?.shopName}</strong>? This will soft delete the franchise and prevent their access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFranchise}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FranchiseList;
