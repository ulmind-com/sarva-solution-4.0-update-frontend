import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, Loader2, Eye } from 'lucide-react';

interface Order {
  _id: string;
  orderId: string;
  customer: { name: string; phone: string; email?: string };
  address: { line1: string; line2?: string; city: string; state: string; pincode: string };
  items: { productName: string; price: number; quantity: number }[];
  itemsTotal: number;
  taxType?: 'intra' | 'inter';
  cgstTotal?: number;
  sgstTotal?: number;
  igstTotal?: number;
  taxTotal?: number;
  sellerState?: string;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: 'cod' | 'razorpay';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: string;
}

const ORDER_STATUSES = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const payTone: Record<string, any> = { paid: 'default', pending: 'secondary', failed: 'destructive' };

const GuestOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/admin/newstore/orders', { params: { limit: 100 } });
      setOrders(res.data?.data?.orders || []);
    } catch {
      toast({ title: 'Failed to load orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const update = async (patch: Partial<Order>) => {
    if (!sel) return;
    setSaving(true);
    try {
      const res = await api.patch(`/api/v1/admin/newstore/orders/${sel._id}`, patch);
      const updated = res.data?.data;
      setSel(updated);
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      toast({ title: 'Order updated' });
    } catch {
      toast({ title: 'Update failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingBag className="h-6 w-6" /> Guest Store — Orders</h1>
        <p className="text-muted-foreground">Orders placed by non-members in the public store.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Orders ({orders.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead><TableHead>Date &amp; Time</TableHead><TableHead>Customer</TableHead><TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o._id}>
                      <TableCell className="font-mono text-xs">{o.orderId}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{o.customer.name}</div>
                        <div className="text-xs text-muted-foreground">{o.customer.phone}</div>
                      </TableCell>
                      <TableCell>₹{o.totalAmount}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit uppercase text-[10px]">{o.paymentMethod}</Badge>
                          <Badge variant={payTone[o.paymentStatus]} className="w-fit text-[10px]">{o.paymentStatus}</Badge>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{o.orderStatus}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setSel(o)}><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!sel} onOpenChange={(v) => !v && setSel(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Order {sel?.orderId}</DialogTitle></DialogHeader>
          {sel ? (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-2">
                <span>Placed on {sel.createdAt ? new Date(sel.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
              </div>
              <div>
                <p className="font-semibold">{sel.customer.name}</p>
                <p className="text-muted-foreground">{sel.customer.phone}{sel.customer.email ? ` · ${sel.customer.email}` : ''}</p>
                <p className="text-muted-foreground mt-1">
                  {sel.address.line1}{sel.address.line2 ? `, ${sel.address.line2}` : ''}, {sel.address.city}, {sel.address.state} - {sel.address.pincode}
                </p>
              </div>

              <div className="border rounded-lg divide-y">
                {sel.items.map((it, i) => (
                  <div key={i} className="flex justify-between p-2">
                    <span>{it.productName} × {it.quantity}</span>
                    <span>₹{it.price * it.quantity}</span>
                  </div>
                ))}
                <div className="flex justify-between p-2 text-muted-foreground"><span>Subtotal</span><span>₹{sel.itemsTotal}</span></div>
                {sel.taxType === 'intra' ? (
                  <>
                    {sel.cgstTotal ? <div className="flex justify-between p-2 text-muted-foreground"><span>CGST</span><span>₹{sel.cgstTotal}</span></div> : null}
                    {sel.sgstTotal ? <div className="flex justify-between p-2 text-muted-foreground"><span>SGST</span><span>₹{sel.sgstTotal}</span></div> : null}
                  </>
                ) : sel.igstTotal ? (
                  <div className="flex justify-between p-2 text-muted-foreground"><span>IGST</span><span>₹{sel.igstTotal}</span></div>
                ) : null}
                <div className="flex justify-between p-2 text-muted-foreground"><span>Shipping</span><span>₹{sel.shippingFee}</span></div>
                <div className="flex justify-between p-2 font-bold"><span>Total</span><span>₹{sel.totalAmount}</span></div>
              </div>
              {sel.taxType ? (
                <p className="text-xs text-muted-foreground -mt-2">
                  {sel.taxType === 'intra' ? `Intra-state (within ${sel.sellerState || 'seller state'}) — CGST + SGST` : `Inter-state (outside ${sel.sellerState || 'seller state'}) — IGST`}
                </p>
              ) : null}

              {/* Razorpay payment details (A–Z) */}
              {sel.paymentMethod === 'razorpay' ? (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                  <p className="font-semibold flex items-center gap-2">Razorpay Payment
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${sel.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'}`}>{sel.paymentStatus}</span>
                  </p>
                  <KV label="Razorpay Order ID" value={sel.razorpayOrderId} />
                  <KV label="Payment ID" value={sel.razorpayPaymentId} />
                  <KV label="Signature" value={sel.razorpaySignature} />
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Order status</label>
                  <Select value={sel.orderStatus} onValueChange={(v) => update({ orderStatus: v as Order['orderStatus'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ORDER_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Payment status</label>
                  <Select value={sel.paymentStatus} onValueChange={(v) => update({ paymentStatus: v as Order['paymentStatus'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['pending', 'paid', 'failed'].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSel(null)} disabled={saving}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const KV = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex items-start justify-between gap-3 text-xs">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="font-mono break-all text-right">{value || '—'}</span>
  </div>
);

export default GuestOrders;
