import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, PackageCheck, History, ArrowLeft, Store, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useFranchiseAuthStore } from "@/stores/useFranchiseAuthStore";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const MasterStockTransfer = () => {
    const [isMaster, setIsMaster] = useState<boolean | null>(null);
    const [subFranchises, setSubFranchises] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form
    const [selectedSub, setSelectedSub] = useState("");
    const [selectedProduct, setSelectedProduct] = useState("");
    const [quantity, setQuantity] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { franchise, franchiseToken, isAuthenticated } = useFranchiseAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) navigate('/franchise/login');
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!franchiseToken) return;
            const config = { headers: { Authorization: `Bearer ${franchiseToken}` } };
            try {
                // Check master status and get subs
                const netRes = await api.get('/api/v1/franchise/master-portal/network', config);
                setIsMaster(netRes.data?.data?.isMaster);

                if (netRes.data?.data?.isMaster) {
                    setSubFranchises(netRes.data?.data?.subFranchises || []);
                    
                    // Parallel load inventory and history
                    const [invRes, histRes] = await Promise.all([
                        api.get('/api/v1/franchise/inventory/list', config),
                        api.get('/api/v1/franchise/master-portal/transfer-history', config)
                    ]);
                    
                    const inventoryData = invRes.data?.data?.inventory || invRes.data?.inventory || invRes.data?.data || invRes.data || [];
                    setInventory(Array.isArray(inventoryData) ? inventoryData : []);
                    setHistory(histRes.data?.data || []);
                }
            } catch (error) {
                console.error("Failed to load transfer data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const fetchHistory = async () => {
        if (!franchiseToken) return;
        const res = await api.get('/api/v1/franchise/master-portal/transfer-history', {
            headers: { Authorization: `Bearer ${franchiseToken}` }
        });
        setHistory(res.data?.data || []);
    };

    const handleTransfer = async () => {
        if (!selectedSub || !selectedProduct || !quantity || Number(quantity) <= 0) {
            toast.error("Please fill all fields with valid amounts");
            return;
        }

        const selectedInvItem = inventory.find(i => i.product._id === selectedProduct);
        if (!selectedInvItem || selectedInvItem.stockQuantity < Number(quantity)) {
            toast.error("Insufficient stock in your inventory for this product");
            return;
        }

        try {
            setIsSubmitting(true);
            const config = { headers: { Authorization: `Bearer ${franchiseToken}` } };
            
            await api.post('/api/v1/franchise/master-portal/transfer-stock', {
                subFranchiseId: selectedSub,
                productId: selectedProduct,
                quantity: Number(quantity)
            }, config);

            toast.success("Stock transferred safely to Sub-Franchise");
            
            // Refresh inventory and history
            const invRes = await api.get('/api/v1/franchise/inventory/list', config);
            const inventoryData = invRes.data?.data?.inventory || invRes.data?.inventory || invRes.data?.data || invRes.data || [];
            setInventory(Array.isArray(inventoryData) ? inventoryData : []);
            fetchHistory();
            
            // Reset form partly
            setSelectedProduct("");
            setQuantity("");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Transfer failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !franchise) return <div className="text-center py-10">Loading...</div>;

    const HeaderLayout = () => (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/franchise/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold">{franchise.shopName}</p>
                        <p className="text-xs text-muted-foreground">{franchise.vendorId}</p>
                    </div>
                </div>
            </div>
        </header>
    );

    if (isMaster === false) {
        return (
            <div className="min-h-screen bg-background">
                <HeaderLayout />
                <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
                    <Card className="max-w-md w-full glass border-dashed shadow-none bg-muted/20">
                        <CardContent className="pt-8 text-center flex flex-col items-center">
                            <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="h-8 w-8" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                            <p className="text-muted-foreground text-sm">
                                Stock Distribution is reserved for Master Franchises. Standard franchises must request stock via Admin.
                            </p>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <HeaderLayout />
            <main className="container mx-auto px-4 py-8">
                <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Truck className="h-6 w-6 text-indigo-600" />
                    Distribute Stock
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Transfer products directly from your inventory to your subordinate franchises
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Transfer Form */}
                <Card className="glass premium-shadow border-indigo-500/20 lg:col-span-1 border-t-4 border-t-indigo-500">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <PackageCheck className="h-5 w-5 text-indigo-500" />
                            New Transfer
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Recipient</label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background"
                                value={selectedSub}
                                onChange={e => setSelectedSub(e.target.value)}
                            >
                                <option value="">-- Select Sub-Franchise --</option>
                                {subFranchises.map(sub => (
                                    <option key={sub._id} value={sub._id}>{sub.shopName} ({sub.vendorId})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Product</label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background"
                                value={selectedProduct}
                                onChange={e => setSelectedProduct(e.target.value)}
                            >
                                <option value="">-- Choose from Your Inventory --</option>
                                {inventory.filter(i => i.stockQuantity > 0).map(inv => (
                                    <option key={inv.product._id} value={inv.product._id}>
                                        {inv.product.productName} (Avail: {inv.stockQuantity})
                                    </option>
                                ))}
                            </select>
                            {inventory.filter(i => i.stockQuantity > 0).length === 0 && (
                                <p className="text-xs text-red-500 mt-1">Your inventory is empty.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantity to Transfer</label>
                            <Input 
                                type="number" 
                                min="1" 
                                placeholder="e.g., 10" 
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                className="bg-background/50"
                            />
                        </div>

                        <Button 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
                            disabled={isSubmitting || !selectedSub || !selectedProduct || !quantity}
                            onClick={handleTransfer}
                        >
                            {isSubmitting ? "Processing..." : "Confirm & Transfer"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Transfer History Log */}
                <Card className="glass premium-shadow lg:col-span-2">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <History className="h-5 w-5 text-muted-foreground" />
                            Recent Transfers
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        {history.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No stock transfers made yet.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="font-semibold lg:pl-6">Date</TableHead>
                                        <TableHead className="font-semibold">Recipient</TableHead>
                                        <TableHead className="font-semibold">Product</TableHead>
                                        <TableHead className="font-semibold text-right lg:pr-6">Qty</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((h, i) => (
                                        <TableRow key={h._id || i} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10">
                                            <TableCell className="lg:pl-6 text-sm text-muted-foreground">
                                                {new Date(h.transferDate).toLocaleDateString()}
                                                <span className="text-[10px] ml-1 block">{new Date(h.transferDate).toLocaleTimeString()}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{h.toSubFranchiseId?.shopName}</span>
                                                    <span className="text-xs text-muted-foreground">{h.toSubFranchiseId?.vendorId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{h.product?.productName}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{h.product?.productId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="lg:pr-6 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                                {h.quantityTransferred} pcs
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
            </div>
            </main>
        </div>
    );
};

export default MasterStockTransfer;
