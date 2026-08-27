import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Store, ChevronDown, ChevronRight, Clock, ChevronLeft, ChevronRight as ChevronRightIcon,
    Search, RefreshCw, ShoppingBag, Package, IndianRupee, CalendarDays, Filter
} from "lucide-react";
import api from "@/lib/api";

interface SaleItem {
    productName: string;
    productId: string;
    quantity: number;
    price: number;
    amount: number;
    bv: number;
    pv: number;
    totalBV: number;
    totalPV: number;
}

interface SaleLog {
    _id: string;
    saleNo: string;
    time: string;
    franchiseName: string;
    franchiseVendorId: string;
    franchiseCity: string;
    userName: string;
    memberId: string;
    items: SaleItem[];
    itemCount: number;
    totalQuantity: number;
    subTotal: number;
    gstAmount: number;
    grandTotal: number;
    totalBV: number;
    totalPV: number;
    isFirstPurchase: boolean;
    paymentMethod: string;
    paymentStatus: string;
}

interface GroupedSale {
    date: string;
    sales: SaleLog[];
    count: number;
    dayTotal: number;
}

const FranchiseSaleLogs = () => {
    const [groupedLogs, setGroupedLogs] = useState<GroupedSale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
    const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const limit = 50;

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const fetchLogs = async () => {
        try {
            setIsLoading(true);
            setError(null);

            let url = `/api/v1/admin/franchise-sale-logs?page=${page}&limit=${limit}`;
            if (startDate) url += `&startDate=${startDate}`;
            if (endDate) url += `&endDate=${endDate}`;

            const response = await api.get(url);
            const data = response.data?.data || response.data;

            if (response.data.success !== false) {
                setGroupedLogs(data.groupedLogs || []);
                setTotalPages(data.pagination?.pages || 1);
                setTotalRecords(data.pagination?.total || 0);

                // Auto-expand first date on page 1
                if (page === 1 && data.groupedLogs?.length > 0) {
                    setExpandedDates(new Set([data.groupedLogs[0].date]));
                }
            } else {
                setError("Failed to fetch franchise sale logs");
            }
        } catch (err: any) {
            console.error("Error fetching franchise sale logs:", err);
            setError(err.response?.data?.message || "Failed to fetch franchise sale logs");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const handleApplyFilters = () => {
        setPage(1);
        fetchLogs();
    };

    const handleClearFilters = () => {
        setStartDate("");
        setEndDate("");
        setPage(1);
        setTimeout(() => fetchLogs(), 50);
    };

    const toggleDate = (date: string) => {
        const newExpanded = new Set(expandedDates);
        if (newExpanded.has(date)) {
            newExpanded.delete(date);
        } else {
            newExpanded.add(date);
        }
        setExpandedDates(newExpanded);
    };

    const toggleSaleItems = (saleId: string) => {
        const newExpanded = new Set(expandedSales);
        if (newExpanded.has(saleId)) {
            newExpanded.delete(saleId);
        } else {
            newExpanded.add(saleId);
        }
        setExpandedSales(newExpanded);
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount || 0);

    const formatDateHeading = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(date);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Franchise Sale Logs</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        All franchise billing transactions — date-wise timeline
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {totalRecords > 0 && (
                        <div className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                            Total Records: {totalRecords.toLocaleString()}
                        </div>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
                        <Filter className="h-3.5 w-3.5" />
                        Filters
                    </Button>
                    <Button variant="outline" size="icon" onClick={fetchLogs} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <Card className="glass premium-shadow border-teal-500/20">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-[160px]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">End Date</label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-[160px]"
                                />
                            </div>
                            <Button onClick={handleApplyFilters} size="sm" className="gap-1.5">
                                <Search className="h-3.5 w-3.5" /> Apply
                            </Button>
                            <Button onClick={handleClearFilters} variant="ghost" size="sm">
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Timeline Card */}
            <Card className="glass premium-shadow overflow-hidden">
                <CardHeader className="border-b space-y-4 pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Clock className="h-5 w-5 text-teal-600" />
                            Sale Timeline
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium">
                                Page {page} of {totalPages || 1}
                            </span>
                            <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isLoading}>
                                <ChevronRightIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {error ? (
                        <div className="p-8 text-center text-destructive bg-destructive/5 rounded-b-lg">
                            <p>{error}</p>
                            <Button variant="outline" className="mt-4" onClick={fetchLogs}>Try Again</Button>
                        </div>
                    ) : isLoading ? (
                        <div className="p-4 space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : groupedLogs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-lg font-medium text-foreground">No sales found</p>
                            <p>There are no franchise sale logs to display.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {groupedLogs.map((group) => {
                                const isExpanded = expandedDates.has(group.date);
                                return (
                                    <div key={group.date}>
                                        {/* Date Header */}
                                        <button
                                            onClick={() => toggleDate(group.date)}
                                            className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors focus:outline-none"
                                        >
                                            <div className="flex items-center gap-2">
                                                {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                                                <CalendarDays className="h-4 w-4 text-teal-500" />
                                                <h3 className="font-semibold text-foreground">
                                                    {formatDateHeading(group.date)}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-teal-600">
                                                    {formatCurrency(group.dayTotal)}
                                                </span>
                                                <span className="text-sm font-medium text-muted-foreground bg-background px-2.5 py-1 rounded-full border">
                                                    {group.count} sale{group.count !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                        </button>

                                        {/* Sales Table */}
                                        {isExpanded && (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-background hover:bg-background border-none">
                                                            <TableHead className="font-semibold w-[80px]">Time</TableHead>
                                                            <TableHead className="font-semibold">Sale No</TableHead>
                                                            <TableHead className="font-semibold">Franchise</TableHead>
                                                            <TableHead className="font-semibold">Customer</TableHead>
                                                            <TableHead className="font-semibold text-center">Items</TableHead>
                                                            <TableHead className="font-semibold text-right">Grand Total</TableHead>
                                                            <TableHead className="font-semibold text-center">Type</TableHead>
                                                            <TableHead className="font-semibold text-center">Details</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {group.sales.map((sale) => (
                                                            <>
                                                                <TableRow key={sale._id} className="hover:bg-teal-50/50 dark:hover:bg-teal-900/10">
                                                                    <TableCell className="text-sm text-muted-foreground font-medium whitespace-nowrap">
                                                                        {sale.time}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{sale.saleNo}</span>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium text-foreground whitespace-nowrap">{sale.franchiseName}</span>
                                                                            <span className="text-xs text-muted-foreground">{sale.franchiseVendorId} · {sale.franchiseCity}</span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium text-foreground whitespace-nowrap">{sale.userName}</span>
                                                                            <span className="text-xs text-muted-foreground">{sale.memberId}</span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {sale.totalQuantity} pcs ({sale.itemCount} products)
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <span className="font-bold text-teal-600 text-base">
                                                                            {formatCurrency(sale.grandTotal)}
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        {sale.isFirstPurchase ? (
                                                                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-xs">
                                                                                1st Purchase
                                                                            </Badge>
                                                                        ) : (
                                                                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                                                                                Repurchase
                                                                            </Badge>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 text-xs gap-1"
                                                                            onClick={() => toggleSaleItems(sale._id)}
                                                                        >
                                                                            <Package className="h-3 w-3" />
                                                                            {expandedSales.has(sale._id) ? "Hide" : "View"}
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>

                                                                {/* Expanded Item Details */}
                                                                {expandedSales.has(sale._id) && (
                                                                    <TableRow key={`${sale._id}-items`}>
                                                                        <TableCell colSpan={8} className="bg-muted/20 px-6 py-3">
                                                                            <div className="rounded-lg border overflow-hidden">
                                                                                <Table>
                                                                                    <TableHeader>
                                                                                        <TableRow className="bg-muted/50 hover:bg-muted/50 text-xs">
                                                                                            <TableHead className="text-xs">Product</TableHead>
                                                                                            <TableHead className="text-xs">Product ID</TableHead>
                                                                                            <TableHead className="text-xs text-center">Qty</TableHead>
                                                                                            <TableHead className="text-xs text-right">Price</TableHead>
                                                                                            <TableHead className="text-xs text-right">BV</TableHead>
                                                                                            <TableHead className="text-xs text-right">PV</TableHead>
                                                                                            <TableHead className="text-xs text-right">Amount</TableHead>
                                                                                        </TableRow>
                                                                                    </TableHeader>
                                                                                    <TableBody>
                                                                                        {sale.items.map((item, idx) => (
                                                                                            <TableRow key={idx} className="text-sm">
                                                                                                <TableCell className="font-medium">{item.productName}</TableCell>
                                                                                                <TableCell className="font-mono text-xs text-muted-foreground">{item.productId}</TableCell>
                                                                                                <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                                                                                                <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                                                                                <TableCell className="text-right">{item.totalBV}</TableCell>
                                                                                                <TableCell className="text-right">{item.totalPV}</TableCell>
                                                                                                <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                                                                                            </TableRow>
                                                                                        ))}
                                                                                        {/* Summary row */}
                                                                                        <TableRow className="bg-teal-50/80 dark:bg-teal-950/20 font-bold text-sm">
                                                                                            <TableCell colSpan={2}>Totals</TableCell>
                                                                                            <TableCell className="text-center">{sale.totalQuantity}</TableCell>
                                                                                            <TableCell className="text-right">Sub: {formatCurrency(sale.subTotal)}</TableCell>
                                                                                            <TableCell className="text-right">{sale.totalBV}</TableCell>
                                                                                            <TableCell className="text-right">{sale.totalPV}</TableCell>
                                                                                            <TableCell className="text-right text-teal-600">{formatCurrency(sale.grandTotal)}</TableCell>
                                                                                        </TableRow>
                                                                                    </TableBody>
                                                                                </Table>
                                                                            </div>
                                                                            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                                                                                <span>GST: {formatCurrency(sale.gstAmount)}</span>
                                                                                <span>·</span>
                                                                                <span>Payment: <span className="capitalize">{sale.paymentMethod}</span></span>
                                                                                <span>·</span>
                                                                                <span className={sale.paymentStatus === "paid" ? "text-green-600" : "text-orange-500"}>
                                                                                    {sale.paymentStatus?.toUpperCase()}
                                                                                </span>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default FranchiseSaleLogs;
