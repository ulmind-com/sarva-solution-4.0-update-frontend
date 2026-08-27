import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, Loader2, Eye, Check, X, MessageSquare, Wallet } from 'lucide-react';

interface MOrder {
  _id: string;
  orderId: string;
  memberId: string;
  customerName?: string;
  customerPhone?: string;
  address?: any;
  items: { productName: string; price: number; quantity: number }[];
  itemsTotal: number;
  totalAmount: number;
  paymentMethod: 'cod' | 'razorpay' | 'wallet';
  paymentStatus: 'pending' | 'paid' | 'failed';
  walletDebited?: number;
  message?: string;
  adminStatus: 'pending' | 'accepted' | 'rejected';
  adminNote?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

const payTone: Record<string, any> = { paid: 'default', pending: 'secondary', failed: 'destructive' };
const adminTone: Record<string, any> = { accepted: 'default', pending: 'secondary', rejected: 'destructive' };

const MemberOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<MOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<MOrder | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/admin/member-store/orders', { params: { limit: 100 } });
      setOrders(res.data?.data?.orders || []);
    } catch {
      toast({ title: 'Failed to load member orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const decide = async (decision: 'accepted' | 'rejected') => {
    if (!sel) return;
    setSaving(true);
    try {
      const res = await api.patch(`/api/v1/admin/member-store/orders/${sel._id}/decide`, { decision, adminNote: note });
      const updated = res.data?.data;
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      setSel(null);
      setNote('');
      toast({ title: `Order ${decision}` });
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || 'Action failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const dt = (d?: string) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> Member Store — Orders</h1>
        <p className="text-muted-foreground">Orders placed by logged-in members. Accept or reject each request.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Orders ({orders.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No member orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead><TableHead>Date &amp; Time</TableHead><TableHead>Member</TableHead>
                    <TableHead>Total</TableHead><TableHead>Payment</TableHead><TableHead>Decision</TableHead><TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o._id}>
                      <TableCell className="font-mono text-xs">{o.orderId}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{dt(o.createdAt)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{o.customerName || o.memberId}</div>
                        <div className="text-xs text-muted-foreground">{o.memberId}</div>
                      </TableCell>
                      <TableCell>₹{o.totalAmount}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit uppercase text-[10px]">{o.paymentMethod}</Badge>
                          <Badge variant={payTone[o.paymentStatus]} className="w-fit text-[10px]">{o.paymentStatus}</Badge>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={adminTone[o.adminStatus]} className="capitalize">{o.adminStatus}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setSel(o); setNote(o.adminNote || ''); }}><Eye className="h-4 w-4" /></Button>
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
                <span>Placed on {dt(sel.createdAt)}</span>
                <Badge variant={adminTone[sel.adminStatus]} className="capitalize">{sel.adminStatus}</Badge>
              </div>

              <div>
                <p className="font-semibold">{sel.customerName} <span className="font-mono text-xs text-muted-foreground">({sel.memberId})</span></p>
                <p className="text-muted-foreground">{sel.customerPhone}</p>
                {sel.address && (sel.address.street || sel.address.city) ? (
                  <p className="text-muted-foreground mt-1">
                    {[sel.address.street, sel.address.city, sel.address.state, sel.address.pinCode || sel.address.pincode].filter(Boolean).join(', ')}
                  </p>
                ) : null}
              </div>

              {sel.message ? (
                <div className="rounded-lg border bg-muted/30 p-3 flex gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm">{sel.message}</p>
                </div>
              ) : null}

              <div className="border rounded-lg divide-y">
                {sel.items.map((it, i) => (
                  <div key={i} className="flex justify-between p-2"><span>{it.productName} × {it.quantity}</span><span>₹{it.price * it.quantity}</span></div>
                ))}
                <div className="flex justify-between p-2 font-bold"><span>Total</span><span>₹{sel.totalAmount}</span></div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="uppercase">{sel.paymentMethod}</Badge>
                <Badge variant={payTone[sel.paymentStatus]}>{sel.paymentStatus}</Badge>
                {sel.paymentMethod === 'wallet' && sel.walletDebited ? (
                  <span className="flex items-center gap-1 text-muted-foreground"><Wallet className="h-3 w-3" /> ₹{sel.walletDebited} from wallet</span>
                ) : null}
                {sel.razorpayPaymentId ? <span className="font-mono text-muted-foreground">{sel.razorpayPaymentId}</span> : null}
              </div>

              {sel.adminStatus === 'pending' ? (
                <Textarea placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              ) : sel.adminNote ? (
                <p className="text-xs text-muted-foreground">Note: {sel.adminNote}</p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            {sel?.adminStatus === 'pending' ? (
              <>
                <Button variant="outline" className="gap-2 text-destructive" disabled={saving} onClick={() => decide('rejected')}>
                  <X className="h-4 w-4" /> Reject
                </Button>
                <Button className="gap-2" disabled={saving} onClick={() => decide('accepted')}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Accept
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setSel(null)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberOrders;
