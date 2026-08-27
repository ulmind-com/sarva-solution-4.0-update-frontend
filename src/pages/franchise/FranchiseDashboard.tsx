import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Package, ShoppingCart, LogOut, User, FileText, IndianRupee, Trophy, Network, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFranchiseAuthStore } from '@/stores/useFranchiseAuthStore';
import { toast } from 'sonner';
import api from '@/lib/api';

const FranchiseDashboard = () => {
  const navigate = useNavigate();
  const { franchise, franchiseToken, isAuthenticated, logout } = useFranchiseAuthStore();
  const [isMaster, setIsMaster] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/franchise/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/franchise/login');
  };

  useEffect(() => {
    const fetchMasterStatus = async () => {
      if (!isAuthenticated || !franchiseToken) return;
      try {
        const res = await api.get('/api/v1/franchise/master-portal/network', {
          headers: { Authorization: `Bearer ${franchiseToken}` }
        });
        setIsMaster(res.data?.data?.isMaster || false);
      } catch (error) {
        console.log("Not a master franchise");
      }
    };
    fetchMasterStatus();
  }, [isAuthenticated, franchiseToken]);

  if (!isAuthenticated || !franchise) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{franchise.shopName}</p>
              <p className="text-xs text-muted-foreground">{franchise.vendorId}</p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Welcome, {franchise.name}!</h1>
          <p className="text-muted-foreground">Manage your franchise operations from here</p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shop</p>
                  <p className="font-semibold">{franchise.shopName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold capitalize">{franchise.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-semibold">{franchise.city}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendor ID</p>
                  <p className="font-semibold">{franchise.vendorId}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/franchise/inventory">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>View Products</CardTitle>
                <CardDescription>Browse available products in inventory</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/franchise/sale/create">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
                  <ShoppingCart className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle>Create Bill</CardTitle>
                <CardDescription>Sell products to members</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/franchise/request-stock">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
                  <Package className="h-6 w-6 text-orange-500" />
                </div>
                <CardTitle>Request Stock</CardTitle>
                <CardDescription>Submit a product request to admin</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/franchise/order-history">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle>Order History</CardTitle>
                <CardDescription>View your past orders and invoices</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/franchise/payout">
            <Card className="hover:border-teal-500/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-2">
                  <IndianRupee className="h-6 w-6 text-teal-500" />
                </div>
                <CardTitle>Repurchase Payouts</CardTitle>
                <CardDescription>View your monthly 10% BV payout history</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          
          {/* Master Franchise Features  */}
          {isMaster && (
            <>
              <Link to="/franchise/master-network">
                <Card className="hover:border-yellow-500/50 transition-colors cursor-pointer h-full border border-yellow-500/20 bg-yellow-500/5">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-2">
                      <Network className="h-6 w-6 text-yellow-500" />
                    </div>
                    <CardTitle>Sub-Network</CardTitle>
                    <CardDescription>Manage your subordinate franchises (Master Only)</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              
              <Link to="/franchise/master-stock-transfer">
                <Card className="hover:border-indigo-500/50 transition-colors cursor-pointer h-full border border-indigo-500/20 bg-indigo-500/5">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-2">
                      <Truck className="h-6 w-6 text-indigo-500" />
                    </div>
                    <CardTitle>Distribute Stock</CardTitle>
                    <CardDescription>Transfer products to sub-franchises (Master Only)</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/franchise/master-payouts">
                <Card className="hover:border-emerald-500/50 transition-colors cursor-pointer h-full border border-emerald-500/20 bg-emerald-500/5">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
                      <Trophy className="h-6 w-6 text-emerald-500" />
                    </div>
                    <CardTitle>Master Earnings</CardTitle>
                    <CardDescription>View +5% differentials and overrides (Master Only)</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </>
          )}
        </div>

        {/* Placeholder Notice */}
        <div className="mt-8 p-4 bg-muted rounded-lg text-center">
          <p className="text-muted-foreground">
            🚧 This is a placeholder dashboard. More features will be added as backend APIs become available.
          </p>
        </div>
      </main>
    </div>
  );
};

export default FranchiseDashboard;
