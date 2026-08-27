import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings2, Loader2, ShieldCheck } from 'lucide-react';

const NewStoreConfig = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [secretSet, setSecretSet] = useState(false);
  const [cfg, setCfg] = useState<any>({
    storeEnabled: true, codEnabled: true, onlineEnabled: true,
    memberCodEnabled: true, memberOnlineEnabled: true,
    razorpayKeyId: '', razorpayKeySecret: '', shippingFee: 0, memberShippingFee: 0, storeName: 'Sarva Store', sellerState: 'West Bengal',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/admin/newstore/config');
      const d = res.data?.data || {};
      setSecretSet(!!d.razorpayKeySecretSet);
      setCfg({
        storeEnabled: d.storeEnabled ?? true, codEnabled: d.codEnabled ?? true, onlineEnabled: d.onlineEnabled ?? true,
        memberCodEnabled: d.memberCodEnabled ?? true, memberOnlineEnabled: d.memberOnlineEnabled ?? true,
        razorpayKeyId: d.razorpayKeyId || '', razorpayKeySecret: '', shippingFee: d.shippingFee || 0, memberShippingFee: d.memberShippingFee || 0, storeName: d.storeName || 'Sarva Store', sellerState: d.sellerState || 'West Bengal',
      });
    } catch {
      toast({ title: 'Failed to load config', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = {
        storeEnabled: cfg.storeEnabled, codEnabled: cfg.codEnabled, onlineEnabled: cfg.onlineEnabled,
        memberCodEnabled: cfg.memberCodEnabled, memberOnlineEnabled: cfg.memberOnlineEnabled,
        razorpayKeyId: cfg.razorpayKeyId, shippingFee: Number(cfg.shippingFee) || 0, memberShippingFee: Number(cfg.memberShippingFee) || 0, storeName: cfg.storeName, sellerState: cfg.sellerState,
      };
      // Only send the secret if the admin typed a new one (blank keeps the existing).
      if (cfg.razorpayKeySecret) payload.razorpayKeySecret = cfg.razorpayKeySecret;
      const res = await api.put('/api/v1/admin/newstore/config', payload);
      setSecretSet(!!res.data?.data?.razorpayKeySecretSet);
      setCfg((c: any) => ({ ...c, razorpayKeySecret: '' }));
      toast({ title: 'Store config saved' });
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings2 className="h-6 w-6" /> Guest Store — Settings</h1>
        <p className="text-muted-foreground">Payment methods, Razorpay credentials and shipping for the public store.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Guest store (no login)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Row label="Store open" desc="When off, guests cannot place orders.">
            <Switch checked={cfg.storeEnabled} onCheckedChange={(v) => setCfg({ ...cfg, storeEnabled: v })} />
          </Row>
          <Row label="Cash on Delivery (COD)" desc="Allow guests to pay in cash on delivery.">
            <Switch checked={cfg.codEnabled} onCheckedChange={(v) => setCfg({ ...cfg, codEnabled: v })} />
          </Row>
          <Row label="Online payment (Razorpay)" desc="Requires Razorpay credentials below.">
            <Switch checked={cfg.onlineEnabled} onCheckedChange={(v) => setCfg({ ...cfg, onlineEnabled: v })} />
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Member store (logged-in app)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Row label="Cash on Delivery (COD)" desc="Members can place COD orders.">
            <Switch checked={cfg.memberCodEnabled} onCheckedChange={(v) => setCfg({ ...cfg, memberCodEnabled: v })} />
          </Row>
          <Row label="Online payment (Razorpay)" desc="Members can pay online (uses the same Razorpay creds).">
            <Switch checked={cfg.memberOnlineEnabled} onCheckedChange={(v) => setCfg({ ...cfg, memberOnlineEnabled: v })} />
          </Row>
          <p className="text-xs text-muted-foreground">Wallet payment is always available to members with a balance.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Razorpay Credentials</CardTitle>
          <CardDescription>The secret is stored securely on the server and never shown again.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Key ID</Label>
            <Input placeholder="rzp_test_..." value={cfg.razorpayKeyId} onChange={(e) => setCfg({ ...cfg, razorpayKeyId: e.target.value })} />
          </div>
          <div>
            <Label>Key Secret {secretSet ? <span className="text-xs text-green-600">(set — leave blank to keep)</span> : null}</Label>
            <Input type="password" placeholder={secretSet ? '••••••••••••' : 'Enter secret'} value={cfg.razorpayKeySecret} onChange={(e) => setCfg({ ...cfg, razorpayKeySecret: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Store</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Store name</Label><Input value={cfg.storeName} onChange={(e) => setCfg({ ...cfg, storeName: e.target.value })} /></div>
          <div>
            <Label>Seller state (place of supply)</Label>
            <Input value={cfg.sellerState} onChange={(e) => setCfg({ ...cfg, sellerState: e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">Orders within this state charge CGST+SGST; outside charge IGST.</p>
          </div>
          <div>
            <Label>Shipping fee (₹)</Label>
            <Input type="number" value={cfg.shippingFee} onChange={(e) => setCfg({ ...cfg, shippingFee: e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">Applies to guest (without-login) store orders.</p>
          </div>
          <div>
            <Label>Member Shipping fee (₹)</Label>
            <Input type="number" value={cfg.memberShippingFee} onChange={(e) => setCfg({ ...cfg, memberShippingFee: e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">Applies to logged-in members ordering from the app.</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Settings
      </Button>
    </div>
  );
};

const Row = ({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
    {children}
  </div>
);

export default NewStoreConfig;
