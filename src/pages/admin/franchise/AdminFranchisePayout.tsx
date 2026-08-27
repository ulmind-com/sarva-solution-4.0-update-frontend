import { useState, useEffect } from "react";
import { format } from "date-fns";
import { RefreshCw, CheckCircle2, Clock, Store, BarChart3, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
    getAdminFranchisePayoutList,
    getAdminFranchiseLiveBV,
    markFranchisePayoutPaid
} from "@/services/adminService";

export default function AdminFranchisePayout() {
    const [loadingLive, setLoadingLive] = useState(true);
    const [loadingPayouts, setLoadingPayouts] = useState(true);

    const [liveStates, setLiveStates] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

    const [markingId, setMarkingId] = useState<string | null>(null);
    const [txnRef, setTxnRef] = useState<string>("");

    const { toast } = useToast();

    useEffect(() => {
        fetchLiveBV();
        fetchPayouts(1);
    }, []);

    const fetchLiveBV = async () => {
        setLoadingLive(true);
        try {
            const res = await getAdminFranchiseLiveBV(true);
            const states = res.data?.states || [];
            setLiveStates(states);
        } catch (error) {
            console.error("Failed to fetch live BV:", error);
        } finally {
            setLoadingLive(false);
        }
    };

    const fetchPayouts = async (page: number) => {
        setLoadingPayouts(true);
        try {
            const status = statusFilter === "all" ? undefined : statusFilter;
            const res = await getAdminFranchisePayoutList(page, 10, status);
            const payoutList = res.data?.payouts || [];
            setPayouts(payoutList);
            const pag = res.data?.pagination;
            if (pag) {
                setPagination({
                    page: pag.page || page,
                    totalPages: pag.pages || 1
                });
            }
        } catch (error) {
            console.error("Failed to fetch payouts:", error);
        } finally {
            setLoadingPayouts(false);
        }
    };

    const handleFilterChange = (val: string) => {
        setStatusFilter(val);
        setTimeout(() => fetchPayouts(1), 50);
    };

    const handleMarkPaid = async (id: string) => {
        if (!txnRef.trim()) {
            toast({ title: "Transaction Ref Required", description: "Please enter a transaction reference (UTR/NEFT).", variant: "destructive" });
            return;
        }
        setMarkingId(id);
        try {
            await markFranchisePayoutPaid(id, txnRef.trim());
            toast({ title: "Marked as Paid", description: "Payout marked paid successfully." });
            setTxnRef("");
            fetchPayouts(pagination.page);
        } catch (error: any) {
            toast({ title: "Failed", description: error.response?.data?.message || "Could not mark payout as paid.", variant: "destructive" });
        } finally {
            setMarkingId(null);
        }
    };

    // Filter payouts by type AND exclude overridden Master entries (they have ₹0 payout)
    const filteredPayouts = payouts
        .filter(p => p.status !== 'overridden')
        .filter(p => typeFilter === "all" ? true : (p.payoutType || 'BV') === typeFilter);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 p-6 rounded-lg glass premium-shadow">
                <div className="flex items-start gap-4">
                    <div className="bg-teal-500/20 p-3 rounded-xl hidden md:block">
                        <Store className="h-8 w-8 text-teal-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-teal-950 dark:text-teal-50">Franchise Payouts</h1>
                        <p className="text-teal-700 dark:text-teal-400 mt-1">
                            Manage monthly <strong>BV & PV</strong> payouts for all franchises. Normal: <strong>10% BV / ₹40 PV</strong>. Master: <strong>15% BV / ₹50 PV</strong>.
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="live" className="w-full">
                <TabsList className="grid w-full md:w-[360px] grid-cols-2 mb-6">
                    <TabsTrigger value="live">Live BV/PV Tracker</TabsTrigger>
                    <TabsTrigger value="payouts">Payout Records</TabsTrigger>
                </TabsList>

                {/* TAB: Live BV/PV */}
                <TabsContent value="live">
                    <Card className="glass premium-shadow overflow-hidden border-t-4 border-t-teal-500">
                        <CardHeader className="flex flex-row items-center justify-between bg-teal-50/50 dark:bg-teal-950/20 pb-4">
                            <div>
                                <CardTitle>Real-Time Monthly BV & PV Accumulation</CardTitle>
                                <CardDescription>Live BV (repurchase) and PV (1st purchase) processed this calendar month for each franchise.</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={fetchLiveBV}>
                                <RefreshCw className={`h-4 w-4 ${loadingLive ? 'animate-spin text-teal-600' : 'text-teal-600'}`} />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead>Franchise</TableHead>
                                            <TableHead>Vendor ID</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead className="text-right">
                                                <span className="flex items-center justify-end gap-1"><BarChart3 className="h-3 w-3 text-teal-500" /> This Month BV</span>
                                            </TableHead>
                                            <TableHead className="text-right">Lifetime BV</TableHead>
                                            <TableHead className="text-right text-teal-600">BV Payout</TableHead>
                                            <TableHead className="text-right">
                                                <span className="flex items-center justify-end gap-1"><ShoppingBag className="h-3 w-3 text-purple-500" /> This Month PV</span>
                                            </TableHead>
                                            <TableHead className="text-right">Lifetime PV</TableHead>
                                            <TableHead className="text-right text-purple-600">PV Payout</TableHead>
                                            <TableHead>Last Updated</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingLive ? (
                                            <TableRow>
                                                <TableCell colSpan={10} className="h-40 text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
                                                </TableCell>
                                            </TableRow>
                                        ) : liveStates.length > 0 ? (
                                            liveStates.map((s, i) => {
                                                const franchise = s.franchiseId || {};
                                                const isMaster = s.isMaster || false;
                                                const bvRate = isMaster ? 0.15 : 0.10;
                                                const pvRate = isMaster ? 50 : 40;
                                                const monthBv = s.currentMonthRepurchaseBv || 0;
                                                const lifeBv = s.lifetimeRepurchaseBv || 0;
                                                const projectedBv = monthBv * bvRate;
                                                const monthPv = s.currentMonthFirstPurchasePv || 0;
                                                const lifePv = s.lifetimeFirstPurchasePv || 0;
                                                const projectedPv = monthPv * pvRate;
                                                return (
                                                    <TableRow key={i} className="hover:bg-teal-50/50 dark:hover:bg-teal-900/20">
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div>
                                                                    <div className="font-medium">{franchise.shopName || franchise.name}</div>
                                                                    <div className="text-xs text-muted-foreground">{franchise.name}</div>
                                                                </div>
                                                                {isMaster && (
                                                                    <Badge className="bg-amber-500/10 text-amber-700 border-amber-400 text-[10px] px-1.5 py-0">MASTER</Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm font-mono">{franchise.vendorId}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            <div>{franchise.phone}</div>
                                                            <div className="text-xs">{franchise.email}</div>
                                                        </TableCell>
                                                        {/* BV Columns */}
                                                        <TableCell className="text-right font-bold text-lg">{monthBv.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right text-muted-foreground">{lifeBv.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right text-teal-600 font-bold text-base">
                                                            <div>₹{projectedBv.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                                                            <div className="text-[10px] font-normal text-muted-foreground">{isMaster ? '15%' : '10%'}</div>
                                                        </TableCell>
                                                        {/* PV Columns */}
                                                        <TableCell className="text-right font-bold text-lg text-purple-700 dark:text-purple-400">{monthPv.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right text-muted-foreground">{lifePv.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right text-purple-600 font-bold text-base">
                                                            <div>₹{projectedPv.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                                                            <div className="text-[10px] font-normal text-muted-foreground">₹{isMaster ? '50' : '40'}/PV</div>
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                            {s.lastUpdated ? format(new Date(s.lastUpdated), 'dd MMM yyyy, hh:mm a') : '—'}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={10} className="h-40 text-center text-muted-foreground">
                                                    No franchise BV/PV data found for this month.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: Payout Records */}
                <TabsContent value="payouts">
                    <Card className="glass premium-shadow overflow-hidden border-teal-500/10">
                        <CardHeader className="flex flex-row items-center justify-between bg-teal-50/50 dark:bg-teal-950/20 pb-4">
                            <div>
                                <CardTitle>Generated Payout Records</CardTitle>
                                <CardDescription>All monthly payouts generated by the system. Mark pending ones as paid with a transaction reference.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val)}>
                                    <SelectTrigger className="w-[100px] h-9">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="BV">BV</SelectItem>
                                        <SelectItem value="PV">PV</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={handleFilterChange}>
                                    <SelectTrigger className="w-[130px] h-9">
                                        <SelectValue placeholder="Filter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="ghost" size="icon" onClick={() => fetchPayouts(pagination.page)}>
                                    <RefreshCw className={`h-4 w-4 ${loadingPayouts ? 'animate-spin text-teal-600' : 'text-teal-600'}`} />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead>Franchise</TableHead>
                                            <TableHead>Month</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">Volume</TableHead>
                                            <TableHead className="text-right text-teal-600">Gross Payout</TableHead>
                                            <TableHead className="text-right text-orange-500">Deductions</TableHead>
                                            <TableHead className="text-right text-green-600">Net Payout</TableHead>
                                            <TableHead>Txn Ref</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-center">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingPayouts ? (
                                            <TableRow>
                                                <TableCell colSpan={10} className="h-40 text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredPayouts.length > 0 ? (
                                            filteredPayouts.map((p, i) => {
                                                const franchise = p.franchise || {};
                                                const pType = p.payoutType || 'BV';
                                                const volume = pType === 'BV' ? (p.totalBv || 0) : (p.totalPv || 0);
                                                const monthLabel = p.month && p.year
                                                    ? new Date(p.year, p.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })
                                                    : '—';
                                                return (
                                                    <TableRow key={i} className="hover:bg-teal-50/50 dark:hover:bg-teal-900/20">
                                                        <TableCell>
                                                            <div className="font-medium">{franchise.shopName || franchise.name || p.franchiseName}</div>
                                                            <div className="text-xs text-muted-foreground">{franchise.vendorId || ''}</div>
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap text-muted-foreground">{monthLabel}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={pType === 'PV'
                                                                ? 'border-purple-500/30 text-purple-600 bg-purple-500/10'
                                                                : 'border-teal-500/30 text-teal-600 bg-teal-500/10'}>
                                                                {pType === 'PV' ? <ShoppingBag className="h-3 w-3 mr-1" /> : <BarChart3 className="h-3 w-3 mr-1" />}
                                                                {pType}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {volume.toLocaleString()} {pType}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-teal-600">
                                                            ₹{(p.grossPayout || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell className="text-right text-orange-500 text-sm">
                                                            -₹{((p.adminCharge || 0) + (p.tdsCharge || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-green-600">
                                                            ₹{(p.netPayout || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {p.transactionRef || '—'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={p.status === 'paid' ? 'default' : 'secondary'}
                                                                className={p.status === 'paid' ? 'bg-green-500 text-white' : 'bg-orange-400 text-white'}>
                                                                {p.status === 'paid' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                                                                {p.status?.toUpperCase() || 'PENDING'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {p.status !== 'paid' && (
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button size="sm" variant="outline" className="h-7 text-xs border-teal-500/30 text-teal-700 hover:bg-teal-50">
                                                                            Mark Paid
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Mark Payout as Paid</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Enter the UTR / NEFT transaction reference for this franchise {pType} payout.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <div className="my-2">
                                                                            <Input
                                                                                placeholder="e.g. NEFT-12345678"
                                                                                value={txnRef}
                                                                                onChange={(e) => setTxnRef(e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel onClick={() => setTxnRef("")}>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleMarkPaid(p._id || p.id)}
                                                                                disabled={!!markingId}
                                                                                className="bg-teal-600 hover:bg-teal-700 text-white"
                                                                            >
                                                                                {markingId === (p._id || p.id) ? "Processing..." : "Confirm Paid"}
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={10} className="h-40 text-center text-muted-foreground">
                                                    No payout records found{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}{typeFilter !== 'all' ? ` of type "${typeFilter}"` : ''}.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t bg-teal-50/30 dark:bg-teal-950/10">
                                    <div className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchPayouts(pagination.page - 1)}>Previous</Button>
                                        <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchPayouts(pagination.page + 1)}>Next</Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
