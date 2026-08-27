import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Package, Loader2 } from 'lucide-react';

interface NP {
  _id: string;
  productName: string;
  description?: string;
  price: number;
  mrp: number;
  discount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  category?: string;
  stockQuantity: number;
  isActive: boolean;
  isFeatured?: boolean;
  productImage?: { url?: string };
}

const empty = { productName: '', description: '', price: '', mrp: '', discount: '0', cgst: '0', sgst: '0', igst: '0', category: '', stockQuantity: '0', isFeatured: false, isActive: true };

const NewStoreProducts = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<NP[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NP | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/admin/newstore/products', { params: { limit: 100 } });
      setProducts(res.data?.data?.products || []);
    } catch {
      toast({ title: 'Failed to load products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(empty); setFile(null); setOpen(true); };
  const openEdit = (p: NP) => {
    setEditing(p);
    setForm({
      productName: p.productName, description: p.description || '', price: String(p.price), mrp: String(p.mrp),
      discount: String(p.discount || 0), cgst: String(p.cgst || 0), sgst: String(p.sgst || 0), igst: String(p.igst || 0),
      category: p.category || '', stockQuantity: String(p.stockQuantity),
      isFeatured: !!p.isFeatured, isActive: p.isActive,
    });
    setFile(null);
    setOpen(true);
  };

  const save = async () => {
    if (!form.productName || !form.price || !form.mrp) {
      toast({ title: 'Name, price and MRP are required', variant: 'destructive' });
      return;
    }
    if (!editing && !file) {
      toast({ title: 'Product image is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      ['productName', 'description', 'price', 'mrp', 'discount', 'cgst', 'sgst', 'igst', 'category', 'stockQuantity'].forEach((k) => fd.append(k, form[k]));
      fd.append('isFeatured', String(form.isFeatured));
      fd.append('isActive', String(form.isActive));
      if (file) fd.append('productImage', file);

      if (editing) {
        await api.patch(`/api/v1/admin/newstore/products/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast({ title: 'Product updated' });
      } else {
        await api.post('/api/v1/admin/newstore/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast({ title: 'Product created' });
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: NP) => {
    if (!window.confirm(`Delete "${p.productName}"?`)) return;
    try {
      await api.delete(`/api/v1/admin/newstore/products/${p._id}`);
      toast({ title: 'Product deleted' });
      load();
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6" /> Guest Store — Products</h1>
          <p className="text-muted-foreground">Retail products for the public (no-login) store.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Products ({products.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : products.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No products yet. Add your first product.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead><TableHead>Price</TableHead><TableHead>MRP</TableHead>
                    <TableHead>Stock</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {p.productImage?.url ? <img src={p.productImage.url} alt="" className="h-10 w-10 rounded object-cover" /> : null}
                          <div>
                            <div className="font-medium">{p.productName}</div>
                            <div className="text-xs text-muted-foreground">{p.category}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>₹{p.price}</TableCell>
                      <TableCell className="text-muted-foreground line-through">₹{p.mrp}</TableCell>
                      <TableCell>{p.stockQuantity}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={p.isActive ? 'default' : 'secondary'}>{p.isActive ? 'Active' : 'Hidden'}</Badge>
                          {p.isFeatured ? <Badge variant="outline">Featured</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Product name</Label><Input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Price ₹</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>MRP ₹</Label><Input type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} /></div>
              <div><Label>Discount %</Label><Input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div><Label>Stock quantity</Label><Input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>CGST %</Label><Input type="number" value={form.cgst} onChange={(e) => setForm({ ...form, cgst: e.target.value })} /></div>
              <div><Label>SGST %</Label><Input type="number" value={form.sgst} onChange={(e) => setForm({ ...form, sgst: e.target.value })} /></div>
              <div><Label>IGST %</Label><Input type="number" value={form.igst} onChange={(e) => setForm({ ...form, igst: e.target.value })} /></div>
            </div>
            <p className="text-xs text-muted-foreground">Delivery within West Bengal applies CGST + SGST; outside West Bengal applies IGST.</p>
            <div>
              <Label>Product image {editing ? '(leave empty to keep current)' : ''}</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="flex items-center gap-6 pt-1">
              <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /><Label>Active (visible)</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} /><Label>Featured</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewStoreProducts;
