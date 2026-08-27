import { useState } from 'react';
import { Store, CheckCircle, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface VerifiedFranchise {
  _id: string;
  vendorId: string;
  shopName: string;
  name: string;
  city: string;
  phone: string;
  email: string;
  status: string;
}

interface FranchiseVerificationProps {
  onVerified: (franchise: VerifiedFranchise) => void;
  onClear: () => void;
  verifiedFranchise: VerifiedFranchise | null;
}

const FranchiseVerification = ({ onVerified, onClear, verifiedFranchise }: FranchiseVerificationProps) => {
  const [vendorId, setVendorId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!vendorId.trim()) {
      toast.error('Please enter a Vendor ID');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await api.get(`/api/v1/admin/franchise/search?vendorId=${vendorId.trim()}`);
      const franchiseData = response.data?.data || response.data;
      
      if (!franchiseData || franchiseData.status !== 'active') {
        toast.error('Franchise not found or inactive');
        return;
      }

      onVerified(franchiseData);
      toast.success('Franchise verified successfully!');
    } catch (error: any) {
      console.error('Error verifying franchise:', error);
      toast.error(error.response?.data?.message || 'Failed to verify franchise');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClear = () => {
    setVendorId('');
    onClear();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Store className="h-5 w-5" />
          Franchise Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!verifiedFranchise ? (
          <>
            <div className="flex gap-2">
              <Input
                placeholder="Enter Vendor ID (e.g., FS000004)"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
              <Button onClick={handleVerify} disabled={isVerifying}>
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the franchise vendor ID to verify before processing sale
            </p>
          </>
        ) : (
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-bold text-foreground">{verifiedFranchise.shopName}</p>
                  <p className="text-sm text-muted-foreground">
                    Owner: {verifiedFranchise.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {verifiedFranchise.city} • {verifiedFranchise.phone}
                  </p>
                  <Badge variant="outline" className="mt-2 text-primary border-primary">
                    {verifiedFranchise.vendorId}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClear}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FranchiseVerification;
