import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, Clock, Store, BarChart3, ShoppingBag, Trophy, Filter, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import api from "@/lib/api";

interface PayoutRecord {
    _id: string;
    franchiseId: string;
    franchise?: {
        _id: string;
        vendorId: string;
        name: string;
        shopName: string;
    };
    month: number;
    year: number;
    payoutType: 'BV' | 'PV';
    totalBv: number;
    totalPv: number;
    grossPayout: number;
    adminCharge: number;
    tdsCharge: number;
    netPayout: number;
    status: 'pending' | 'paid' | 'overridden';
    paidAt?: string;
    transactionRef?: string;
    createdAt: string;
}

interface MasterPayoutRecord {
    _id: string;
    masterId: { shopName: string; vendorId: string; name: string };
    sourceFranchiseId: { shopName: string; vendorId: string } | null;
    earningType: 'OWN_DIFFERENTIAL' | 'SUB_OVERRIDE';
    month: number;
    year: number;
    baseBv: number;
    basePv: number;
    grossPayout: number;
    adminCharge: number;
    tdsCharge: number;
    netPayout: number;
    status: 'pending' | 'paid';
    paidAt?: string;
    transactionId?: string;
}

const getMonthName = (month: number) =>
    new Date(2000, month - 1, 1).toLocaleString('default', { month: 'short' });

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount || 0);

export default function FranchisePayoutRequests() {
    const [normalPayouts, setNormalPayouts] = useState<PayoutRecord[]>([]);
    const [masterPayouts, setMasterPayouts] = useState<MasterPayoutRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const currentDate = new Date();
    const [month, setMonth] = useState(currentDate.getMonth() === 0 ? 12 : currentDate.getMonth());
    const [year, setYear] = useState(currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear());
    const [statusFilter, setStatusFilter] = useState("All");

    // Payment form
    const [payingId, setPayingId] = useState<string | null>(null);
    const [payingType, setPayingType] = useState<'normal' | 'master'>('normal');
    const [txnRef, setTxnRef] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchAllPayouts = async () => {
        setIsLoading(true);
        try {
            const statusParam = statusFilter !== 'All' ? `&status=${statusFilter.toLowerCase()}` : '';

            const [normalRes, masterRes] = await Promise.all([
                api.get(`/api/v1/admin/franchise-payout/list?page=1&limit=200&month=${month}&year=${year}${statusParam}`),
                api.get(`/api/v1/admin/master-payouts?month=${month}&year=${year}${statusParam}`)
            ]);

            const npList = normalRes.data?.data?.payouts || [];
            // Filter out overridden payouts (Masters get their real payout via MasterFranchisePayout)
            setNormalPayouts(npList.filter((p: PayoutRecord) => p.status !== 'overridden'));
            setMasterPayouts(masterRes.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch payouts:", error);
            toast.error("Failed to load payout data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllPayouts();
    }, [month, year, statusFilter]);

    const handleMarkNormalPaid = async () => {
        if (!payingId || !txnRef.trim()) return;
        setIsSubmitting(true);
        try {
            await api.patch(`/api/v1/admin/franchise-payout/${payingId}/mark-paid`, { transactionRef: txnRef.trim() });
            toast.success("Franchise Payout marked as Paid!");
            setPayingId(null);
            setTxnRef("");
            fetchAllPayouts();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to mark paid");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkMasterPaid = async () => {
        if (!payingId || !txnRef.trim()) return;
        setIsSubmitting(true);
        try {
            await api.patch(`/api/v1/admin/master-payouts/${payingId}/mark-paid`, {
                transactionId: txnRef.trim(),
                paymentNotes: ""
            });
            toast.success("Master Payout marked as Paid!");
            setPayingId(null);
            setTxnRef("");
            fetchAllPayouts();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to mark paid");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Stats
    const normalPendingTotal = normalPayouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.netPayout, 0);
    const normalPaidTotal = normalPayouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.netPayout, 0);
    const masterPendingTotal = masterPayouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.netPayout, 0);
    const masterPaidTotal = masterPayouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.netPayout, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Banknote className="h-6 w-6 text-emerald-500" />
                        Franchise Payout Ledger
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        All franchise payouts generated after month-end — Normal (10% BV / ₹40 PV) + Master (15% BV / ₹50 PV + Overrides)
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAllPayouts} disabled={isLoading} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-orange-500/20">
                    <CardHeader className="p-4 pb-1">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Normal Pending</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xl font-bold text-orange-600">{formatCurrency(normalPendingTotal)}</div>
                        <div className="text-[10px] text-muted-foreground">{normalPayouts.filter(p => p.status === 'pending').length} records</div>
                    </CardContent>
                </Card>
                <Card className="border-green-500/20">
                    <CardHeader className="p-4 pb-1">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Normal Paid</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xl font-bold text-green-600">{formatCurrency(normalPaidTotal)}</div>
                        <div className="text-[10px] text-muted-foreground">{normalPayouts.filter(p => p.status === 'paid').length} records</div>
                    </CardContent>
                </Card>
                <Card className="border-amber-500/20">
                    <CardHeader className="p-4 pb-1">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Master Pending</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xl font-bold text-amber-600">{formatCurrency(masterPendingTotal)}</div>
                        <div className="text-[10px] text-muted-foreground">{masterPayouts.filter(p => p.status === 'pending').length} records</div>
                    </CardContent>
                </Card>
                <Card className="border-emerald-500/20">
                    <CardHeader className="p-4 pb-1">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Master Paid</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xl font-bold text-emerald-600">{formatCurrency(masterPaidTotal)}</div>
                        <div className="text-[10px] text-muted-foreground">{masterPayouts.filter(p => p.status === 'paid').length} records</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border">
                    <Filter className="h-4 w-4 text-muted-foreground ml-2" />
                    <select
                        className="bg-transparent border-none text-sm font-medium focus:ring-0 outline-none pr-3"
                        value={month.toString()}
                        onChange={(e) => setMonth(Number(e.target.value))}
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{getMonthName(m)}</option>
                        ))}
                    </select>
                    <span className="text-muted-foreground">/</span>
                    <select
                        className="bg-transparent border-none text-sm font-medium focus:ring-0 outline-none pr-3"
                        value={year.toString()}
                        onChange={(e) => setYear(Number(e.target.value))}
                    >
                        {[2025, 2026, 2027, 2028].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <select
                    className="h-9 px-3 rounded-lg border bg-background text-sm font-medium"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                </select>
            </div>

            {/* SECTION 1: Normal Franchise Payouts */}
            <Card className="border-teal-500/10">
                <CardHeader className="border-b bg-teal-50/50 dark:bg-teal-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Store className="h-5 w-5 text-teal-500" />
                        Normal Franchise Payouts
                        <Badge variant="secondary" className="ml-2">{normalPayouts.length}</Badge>
                    </CardTitle>
                    <CardDescription>Standard 10% BV / ₹40 PV payouts for non-master franchises</CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    {isLoading ? (
                        <div className="p-6 space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : normalPayouts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Store className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                            <p>No normal franchise payouts for {getMonthName(month)} {year}.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead>Franchise</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Volume</TableHead>
                                    <TableHead className="text-right text-teal-600">Gross</TableHead>
                                    <TableHead className="text-right text-orange-500">Deductions</TableHead>
                                    <TableHead className="text-right text-green-600">Net Payout</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {normalPayouts.map(p => {
                                    const f = p.franchise || {} as any;
                                    const volume = p.payoutType === 'BV' ? p.totalBv : p.totalPv;
                                    return (
                                        <TableRow key={p._id} className="hover:bg-teal-50/50 dark:hover:bg-teal-900/10">
                                            <TableCell>
                                                <div className="font-medium">{f.shopName || f.name || '—'}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{f.vendorId || ''}</div>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                                {getMonthName(p.month)} {p.year}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={p.payoutType === 'PV'
                                                    ? 'border-purple-500/30 text-purple-600 bg-purple-500/10'
                                                    : 'border-teal-500/30 text-teal-600 bg-teal-500/10'}>
                                                    {p.payoutType === 'PV' ? <ShoppingBag className="h-3 w-3 mr-1" /> : <BarChart3 className="h-3 w-3 mr-1" />}
                                                    {p.payoutType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {volume.toLocaleString()} {p.payoutType}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-teal-600">
                                                {formatCurrency(p.grossPayout)}
                                            </TableCell>
                                            <TableCell className="text-right text-orange-500 text-sm">
                                                <div>Admin: {formatCurrency(p.adminCharge)}</div>
                                                <div>TDS: {formatCurrency(p.tdsCharge)}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-green-600">
                                                {formatCurrency(p.netPayout)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {p.status === 'paid' ? (
                                                    <Badge className="bg-green-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {p.status !== 'paid' && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="sm" variant="outline" className="h-7 text-xs border-teal-500/30 text-teal-700 hover:bg-teal-50"
                                                                onClick={() => { setPayingId(p._id); setPayingType('normal'); }}>
                                                                Mark Paid
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Mark Franchise Payout as Paid</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Enter UTR/NEFT ref for {f.shopName} — {p.payoutType} payout of {formatCurrency(p.netPayout)}
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
                                                                <AlertDialogCancel onClick={() => { setTxnRef(""); setPayingId(null); }}>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={handleMarkNormalPaid}
                                                                    disabled={isSubmitting || !txnRef.trim()}
                                                                    className="bg-teal-600 hover:bg-teal-700 text-white"
                                                                >
                                                                    {isSubmitting ? "Processing..." : "Confirm Paid"}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* SECTION 2: Master Franchise Payouts */}
            <Card className="border-amber-500/10">
                <CardHeader className="border-b bg-amber-50/50 dark:bg-amber-950/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        Master Franchise Payouts
                        <Badge variant="secondary" className="ml-2">{masterPayouts.length}</Badge>
                    </CardTitle>
                    <CardDescription>Isolated 15% BV / ₹50 PV differentials + 5% BV / ₹10 PV sub-network overrides</CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    {isLoading ? (
                        <div className="p-6 space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : masterPayouts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Trophy className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                            <p>No master franchise payouts for {getMonthName(month)} {year}.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead>Master Franchise</TableHead>
                                    <TableHead>Type / Source</TableHead>
                                    <TableHead className="text-right">Base BV/PV</TableHead>
                                    <TableHead className="text-right text-amber-600">Gross</TableHead>
                                    <TableHead className="text-right text-orange-500">Deductions</TableHead>
                                    <TableHead className="text-right text-green-600">Net Payout</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {masterPayouts.map(p => {
                                    const isSelf = p.earningType === 'OWN_DIFFERENTIAL';
                                    return (
                                        <TableRow key={p._id} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10">
                                            <TableCell>
                                                <div className="font-bold">{p.masterId.shopName}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{p.masterId.vendorId}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={isSelf ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-purple-100 text-purple-800 border-purple-200"}>
                                                    {isSelf ? "Own Differential" : "Sub Override"}
                                                </Badge>
                                                {!isSelf && p.sourceFranchiseId && (
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        from: <b>{p.sourceFranchiseId.shopName}</b>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="text-xs text-muted-foreground">BV: <b>{p.baseBv}</b></div>
                                                <div className="text-xs text-muted-foreground">PV: <b>{p.basePv}</b></div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-amber-600">
                                                {formatCurrency(p.grossPayout)}
                                            </TableCell>
                                            <TableCell className="text-right text-orange-500 text-sm">
                                                <div>Admin: {formatCurrency(p.adminCharge)}</div>
                                                <div>TDS: {formatCurrency(p.tdsCharge)}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-lg text-emerald-600">
                                                {formatCurrency(p.netPayout)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {p.status === 'paid' ? (
                                                    <Badge className="bg-green-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {p.status !== 'paid' && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="sm" variant="outline" className="h-7 text-xs border-amber-500/30 text-amber-700 hover:bg-amber-50"
                                                                onClick={() => { setPayingId(p._id); setPayingType('master'); }}>
                                                                Mark Paid
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Mark Master Payout as Paid</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Enter UTR/NEFT ref for {p.masterId.shopName} — {isSelf ? "Own Differential" : "Sub Override"} payout of {formatCurrency(p.netPayout)}
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
                                                                <AlertDialogCancel onClick={() => { setTxnRef(""); setPayingId(null); }}>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={handleMarkMasterPaid}
                                                                    disabled={isSubmitting || !txnRef.trim()}
                                                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                                                >
                                                                    {isSubmitting ? "Processing..." : "Confirm Paid"}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
