import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, ShoppingBag, Eye, Store, Info } from 'lucide-react';
import { getMyPurchases } from '@/services/userService';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PurchaseHistory() {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const res = await getMyPurchases(1, 100); // Fetch up to 100 for now
            if (res.success) {
                setPurchases(res.data.purchases);
            }
        } catch (error: any) {
            console.error('Error fetching purchases:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch purchase history');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Purchase History</h1>
                <p className="text-muted-foreground">View all your product purchases from franchise stores.</p>
            </div>

            <Card className="glass border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                        My Invoices
                    </CardTitle>
                    <CardDescription>A complete record of your first purchase and repurchases.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-border/50 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Date</TableHead>
                                    <TableHead>Franchise</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Total PV</TableHead>
                                    <TableHead>Total BV</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                                Loading purchases...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : purchases.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No purchases found yet. Visit a franchise to buy products.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    purchases.map((purchase) => (
                                        <TableRow key={purchase._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                                    <span>{format(new Date(purchase.saleDate), 'dd MMM yyyy, hh:mm a')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Store className="w-4 h-4 text-emerald-500" />
                                                    <span className="font-medium">{purchase.franchise?.shopName || purchase.franchise?.name || 'Unknown Store'}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    ID: {purchase.franchise?.vendorId || "N/A"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={purchase.isFirstPurchase ? 'default' : 'secondary'} className={purchase.isFirstPurchase ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}>
                                                    {purchase.isFirstPurchase ? '1st Purchase' : 'Repurchase'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                                                {purchase.totalPV?.toFixed(2) || 0}
                                            </TableCell>
                                            <TableCell className="font-medium text-indigo-600 dark:text-indigo-400">
                                                {purchase.totalBV?.toFixed(2) || 0}
                                            </TableCell>
                                            <TableCell className="font-medium text-foreground">
                                                ₹{purchase.grandTotal?.toFixed(2) || 0}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="hover:bg-primary/10 text-primary"
                                                    onClick={() => setSelectedPurchase(purchase)}
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Products
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Product Items Dialog */}
            <Dialog open={!!selectedPurchase} onOpenChange={(open) => !open && setSelectedPurchase(null)}>
                <DialogContent className="max-w-2xl glass" aria-describedby="dialog-description">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <ShoppingBag className="w-5 h-5 text-primary" />
                            Purchase Details
                        </DialogTitle>
                    </DialogHeader>

                    <p id="dialog-description" className="sr-only">Detailed breakdown of the selected purchase invoice showing individual products, prices, and quantities.</p>

                    {selectedPurchase && (
                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Date</p>
                                    <p className="font-medium">{format(new Date(selectedPurchase.saleDate), 'dd MMM yyyy')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Franchise</p>
                                    <p className="font-medium">{selectedPurchase.franchise?.shopName || selectedPurchase.franchise?.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Type</p>
                                    <Badge variant="outline" className={selectedPurchase.isFirstPurchase ? 'border-primary text-primary' : 'border-orange-500 text-orange-500'}>
                                        {selectedPurchase.isFirstPurchase ? '1st Purchase' : 'Repurchase'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                                    <p className="font-medium text-primary">₹{selectedPurchase.grandTotal?.toFixed(2) || 0}</p>
                                </div>
                            </div>

                            <h4 className="font-medium mt-4 mb-2 flex items-center gap-2">
                                <Info className="w-4 h-4" /> Purchased Products
                            </h4>

                            <div className="rounded-md border border-border/50 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">PV</TableHead>
                                            <TableHead className="text-right">BV</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedPurchase.items?.map((item: any, idx: number) => (
                                            <TableRow key={idx}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                                                            {item.product?.productImage?.url ? (
                                                                <img src={item.product?.productImage?.url} alt="" className="w-full h-full object-cover rounded-md" />
                                                            ) : (
                                                                <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <span className="font-medium line-clamp-2">
                                                            {item.product?.productName || 'Unknown Product'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right">₹{item.price?.toFixed(2) || 0}</TableCell>
                                                <TableCell className="text-right text-emerald-500">{item.pv || 0}</TableCell>
                                                <TableCell className="text-right text-indigo-500">{item.bv || 0}</TableCell>
                                                <TableCell className="text-right font-medium">₹{item.amount?.toFixed(2) || 0}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
