import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, RefreshCw, Store, Boxes, IndianRupee, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";
import { toast } from "sonner";

interface InventoryItem {
    _id: string;
    productName: string;
    productId: string;
    category: string;
    price: number;
    mrp: number;
    bv: number;
    pv: number;
    stockQuantity: number;
    purchasePrice: number;
    stockValue: number;
    batchNo: string;
    lastUpdated: string;
}

interface FranchiseInfo {
    _id: string;
    name: string;
    shopName: string;
    vendorId: string;
    city: string;
    phone: string;
    email: string;
}

export default function FranchiseInventoryView() {
    const { franchiseId } = useParams<{ franchiseId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [franchise, setFranchise] = useState<FranchiseInfo | null>(null);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [summary, setSummary] = useState({ totalProducts: 0, totalStock: 0, totalValue: 0 });
    const [searchTerm, setSearchTerm] = useState("");

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/v1/admin/franchise-inventory/${franchiseId}`);
            const data = response.data?.data || response.data;
            setFranchise(data.franchise || null);
            setInventory(data.inventory || []);
            setSummary(data.summary || { totalProducts: 0, totalStock: 0, totalValue: 0 });
        } catch (error: any) {
            console.error("Failed to fetch franchise inventory:", error);
            toast.error(error.response?.data?.message || "Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (franchiseId) fetchInventory();
    }, [franchiseId]);

    const filteredInventory = inventory.filter(item => {
        const s = searchTerm.toLowerCase();
        return (
            item.productName.toLowerCase().includes(s) ||
            item.productId.toLowerCase().includes(s) ||
            item.category.toLowerCase().includes(s)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header with Back */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/admin/franchise/list")} className="shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Franchise Inventory</h1>
                        {franchise && (
                            <p className="text-muted-foreground text-sm mt-0.5">
                                <span className="font-medium text-foreground">{franchise.shopName}</span>
                                <span className="mx-1.5">·</span>
                                <span className="font-mono text-xs">{franchise.vendorId}</span>
                                <span className="mx-1.5">·</span>
                                {franchise.city}
                            </p>
                        )}
                    </div>
                </div>
                <Button variant="outline" onClick={fetchInventory} disabled={loading} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Franchise Quick Info */}
            {franchise && (
                <div className="flex flex-wrap gap-3">
                    <Badge variant="outline" className="text-sm px-3 py-1.5 gap-1.5 border-teal-500/30 bg-teal-500/5">
                        <Store className="h-3.5 w-3.5 text-teal-500" /> {franchise.name}
                    </Badge>
                    <Badge variant="outline" className="text-sm px-3 py-1.5 gap-1.5">
                        📞 {franchise.phone}
                    </Badge>
                    <Badge variant="outline" className="text-sm px-3 py-1.5 gap-1.5">
                        ✉️ {franchise.email}
                    </Badge>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="glass premium-shadow border-t-4 border-t-teal-500">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="bg-teal-500/10 p-3 rounded-xl">
                            <Package className="h-6 w-6 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Products</p>
                            <p className="text-2xl font-bold">{loading ? "..." : summary.totalProducts}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass premium-shadow border-t-4 border-t-purple-500">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="bg-purple-500/10 p-3 rounded-xl">
                            <Boxes className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Stock Units</p>
                            <p className="text-2xl font-bold">{loading ? "..." : summary.totalStock.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass premium-shadow border-t-4 border-t-amber-500">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="bg-amber-500/10 p-3 rounded-xl">
                            <IndianRupee className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Stock Value</p>
                            <p className="text-2xl font-bold">{loading ? "..." : `₹${summary.totalValue.toLocaleString("en-IN")}`}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Inventory Table */}
            <Card className="glass premium-shadow overflow-hidden">
                <CardHeader className="bg-teal-50/50 dark:bg-teal-950/20 border-b border-border/50 pb-4">
                    <CardTitle className="text-teal-900 dark:text-teal-100">Product Inventory</CardTitle>
                    <CardDescription>Current stock held by this franchise.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="w-[40px]">#</TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Product ID</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">MRP</TableHead>
                                    <TableHead className="text-right">DP Price</TableHead>
                                    <TableHead className="text-right">BV</TableHead>
                                    <TableHead className="text-right">PV</TableHead>
                                    <TableHead className="text-center">
                                        <span className="text-teal-600 font-bold">Stock Qty</span>
                                    </TableHead>
                                    <TableHead className="text-right">Stock Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-40 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredInventory.length > 0 ? (
                                    filteredInventory.map((item, i) => (
                                        <TableRow key={item._id} className="hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-colors">
                                            <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                                            <TableCell className="font-medium">{item.productName}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{item.productId}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">{item.category}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">₹{item.mrp.toLocaleString("en-IN")}</TableCell>
                                            <TableCell className="text-right">₹{item.price.toLocaleString("en-IN")}</TableCell>
                                            <TableCell className="text-right">{item.bv}</TableCell>
                                            <TableCell className="text-right">{item.pv}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    className={
                                                        item.stockQuantity > 10
                                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-base font-bold px-3"
                                                            : item.stockQuantity > 0
                                                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-base font-bold px-3"
                                                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-base font-bold px-3"
                                                    }
                                                >
                                                    {item.stockQuantity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                ₹{item.stockValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-40 text-center text-muted-foreground">
                                            {searchTerm ? "No products match your search." : "No inventory items found for this franchise."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
