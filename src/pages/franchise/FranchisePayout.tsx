import { useState, useEffect } from "react";
import { format } from "date-fns";
import { TrendingUp, IndianRupee, CheckCircle2, Clock, RefreshCw, Wallet, BarChart3, ShoppingBag, Zap, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { getFranchisePayoutHistory, getFranchiseLiveBV } from "@/services/franchiseService";

export default function FranchisePayout() {
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [loadingLive, setLoadingLive] = useState(true);
    const [history, setHistory] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [liveData, setLiveData] = useState<any>(null);

    useEffect(() => {
        fetchHistory();
        fetchLive();
    }, []);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await getFranchisePayoutHistory();
            const payouts = res.data?.payouts || [];
            const pag = res.data?.pagination;
            setHistory(payouts);
            if (pag) {
                setPagination({
                    page: pag.page || 1,
                    totalPages: pag.pages || 1
                });
            }
        } catch (error) {
            console.error("Failed to fetch payout history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const fetchLive = async () => {
        setLoadingLive(true);
        try {
            const res = await getFranchiseLiveBV();
            setLiveData(res.data);
        } catch (error) {
            console.error("Failed to fetch live BV:", error);
        } finally {
            setLoadingLive(false);
        }
    };

    // --- Master/Normal detection ---
    const isMaster = liveData?.isMaster || false;
    const bvRatePercent = liveData?.bvRatePercent || 10;
    const pvRateAmount = liveData?.pvRateAmount || 40;

    // --- BV Data ---
    const currentMonthBv = liveData?.currentMonthBv || 0;
    const lifetimeBv = liveData?.lifetimeBv || 0;
    const bvEstimates = liveData?.liveEstimates || {};
    const bvEstGross = bvEstimates.estimatedGrossPayout || 0;
    const bvEstAdmin = bvEstimates.estimatedAdminCharge || 0;
    const bvEstTds = bvEstimates.estimatedTdsCharge || 0;
    const bvEstNet = bvEstimates.estimatedNetPayout || 0;

    // --- PV Data ---
    const currentMonthPv = liveData?.currentMonthPv || 0;
    const lifetimePv = liveData?.lifetimePv || 0;
    const pvEstimates = liveData?.pvEstimates || {};
    const pvEstGross = pvEstimates.estimatedGrossPayout || 0;
    const pvEstAdmin = pvEstimates.estimatedAdminCharge || 0;
    const pvEstTds = pvEstimates.estimatedTdsCharge || 0;
    const pvEstNet = pvEstimates.estimatedNetPayout || 0;

    // Filter history by type AND exclude overridden records (Masters)
    const visibleHistory = history.filter(p => p.status !== 'overridden');
    const bvHistory = visibleHistory.filter(p => (p.payoutType || 'BV') === 'BV');
    const pvHistory = visibleHistory.filter(p => p.payoutType === 'PV');

    const renderMetricCard = (
        label: string,
        value: string | number,
        loading: boolean,
        className: string = "",
        textClassName: string = "",
        icon?: React.ReactNode
    ) => (
        <Card className={`glass premium-shadow ${className}`}>
            <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    {icon} {label}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                {loading ? <div className="animate-pulse h-7 w-16 bg-muted rounded" /> : (
                    <div className={`text-2xl font-bold ${textClassName}`}>{value}</div>
                )}
            </CardContent>
        </Card>
    );

    const renderPayoutTable = (data: any[], type: 'BV' | 'PV') => (
        <div className="overflow-x-auto min-h-[250px]">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">{type === 'BV' ? 'Total BV' : 'Total PV'}</TableHead>
                        <TableHead className="text-right text-teal-600">Gross Payout</TableHead>
                        <TableHead className="text-right text-orange-500">Deductions</TableHead>
                        <TableHead className="text-right text-green-600">Net Payout</TableHead>
                        <TableHead>Transaction Ref</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Paid At</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loadingHistory ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-32 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
                            </TableCell>
                        </TableRow>
                    ) : data.length > 0 ? (
                        data.map((p, i) => {
                            const monthLabel = p.month && p.year
                                ? new Date(p.year, p.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
                                : '—';
                            return (
                                <TableRow key={i} className="hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-colors">
                                    <TableCell className="font-medium whitespace-nowrap">{monthLabel}</TableCell>
                                    <TableCell className="text-right">
                                        {type === 'BV'
                                            ? (p.totalBv || p.totalBV || 0).toLocaleString()
                                            : (p.totalPv || p.totalPV || 0).toLocaleString()
                                        }
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-teal-600">
                                        ₹{(p.grossPayout || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right text-orange-500 text-sm">
                                        -₹{((p.adminCharge || 0) + (p.tdsCharge || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-green-600 text-base">
                                        ₹{(p.netPayout || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{p.transactionRef || '—'}</TableCell>
                                    <TableCell>
                                        <Badge className={p.status === 'paid' ? 'bg-green-500 text-white' : 'bg-orange-400 text-white'}>
                                            {p.status === 'paid' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                                            {p.status?.toUpperCase() || 'PENDING'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {p.paidAt ? format(new Date(p.paidAt), 'dd MMM yyyy') : '—'}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                No {type} payout history yet. Your first payout will appear after month-end.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-teal-950 dark:text-teal-50">Franchise Payouts</h1>
                    <p className="text-muted-foreground mt-1">
                        Your monthly <strong>BV & PV</strong> earnings — paid at <strong>Month-End</strong>.
                    </p>
                </div>
                <div className="flex gap-2 self-start">
                    <Badge variant="outline" className="text-sm border-teal-500/30 text-teal-600 bg-teal-500/10 px-3 py-1.5 shadow-sm">
                        <IndianRupee className="h-3.5 w-3.5 mr-1" /> {bvRatePercent}% of BV
                    </Badge>
                    <Badge variant="outline" className="text-sm border-purple-500/30 text-purple-600 bg-purple-500/10 px-3 py-1.5 shadow-sm">
                        <Zap className="h-3.5 w-3.5 mr-1" /> ₹{pvRateAmount}/PV
                    </Badge>
                    {isMaster && (
                        <Badge className="text-sm bg-amber-500/10 text-amber-700 border-amber-400 px-3 py-1.5 shadow-sm">
                            MASTER
                        </Badge>
                    )}
                </div>
            </div>

            {/* ─────────────── LIVE METRICS SECTION ─────────────── */}
            <div className="space-y-5">
                <h2 className="text-base font-semibold text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-teal-500" /> Live This Month
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={fetchLive}>
                        <RefreshCw className={`h-3.5 w-3.5 ${loadingLive ? 'animate-spin text-teal-500' : 'text-muted-foreground'}`} />
                    </Button>
                </h2>

                {/* ── BV Repurchase Metrics ── */}
                <div>
                    <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5" /> Repurchase BV ({bvRatePercent}% Payout)
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {renderMetricCard("This Month BV", currentMonthBv.toLocaleString(), loadingLive, "border-teal-500/20")}
                        {renderMetricCard("Lifetime BV", lifetimeBv.toLocaleString(), loadingLive, "border-teal-500/10", "text-slate-600 dark:text-slate-300", <BarChart3 className="h-3 w-3" />)}
                        {renderMetricCard("Est. Gross", `₹${bvEstGross.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, loadingLive, "border-teal-500/30 bg-gradient-to-br from-teal-500/5 to-teal-500/10", "text-teal-600")}
                        {renderMetricCard("Admin Charge", `-₹${bvEstAdmin.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, loadingLive, "border-orange-400/20", "text-orange-500")}
                        {renderMetricCard("TDS", `-₹${bvEstTds.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, loadingLive, "border-orange-400/20", "text-orange-400")}
                        {renderMetricCard("Est. Net", `₹${bvEstNet.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, loadingLive, "border-green-500/30 bg-green-500/10", "text-green-600 font-black", <Wallet className="h-3 w-3" />)}
                    </div>
                </div>

                {/* ── PV 1st Purchase Metrics ── */}
                <div>
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5" /> 1st Purchase PV (₹{pvRateAmount}/PV)
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {renderMetricCard("This Month PV", currentMonthPv.toLocaleString(), loadingLive, "border-purple-500/20")}
                        {renderMetricCard("Lifetime PV", lifetimePv.toLocaleString(), loadingLive, "border-purple-500/10", "text-slate-600 dark:text-slate-300", <BarChart3 className="h-3 w-3" />)}
                        {renderMetricCard("Est. Gross", `₹${pvEstGross.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, loadingLive, "border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-purple-500/10", "text-purple-600")}
                        {renderMetricCard("Admin Charge", `-₹${pvEstAdmin.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, loadingLive, "border-orange-400/20", "text-orange-500")}
                        {renderMetricCard("TDS", `-₹${pvEstTds.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, loadingLive, "border-orange-400/20", "text-orange-400")}
                        {renderMetricCard("Est. Net", `₹${pvEstNet.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, loadingLive, "border-green-500/30 bg-green-500/10", "text-green-600 font-black", <Wallet className="h-3 w-3" />)}
                    </div>
                </div>
            </div>

            {/* ─────────────── PAYOUT HISTORY SECTION ─────────────── */}
            <Card className="glass premium-shadow overflow-hidden border-teal-500/10">
                <CardHeader className="border-b border-border/50 bg-teal-50/50 dark:bg-teal-950/20 pb-4 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-teal-900 dark:text-teal-100">Payout History</CardTitle>
                        <CardDescription>All monthly payouts generated for your franchise.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { fetchHistory(); fetchLive(); }}>
                        <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin text-teal-600' : 'text-teal-600'}`} />
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {isMaster && (
                        <div className="mx-4 mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                            <div className="flex items-start gap-3">
                                <Trophy className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">You're a Master Franchise!</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                                        Your payouts are calculated at enhanced rates (<strong>15% BV / ₹50 PV</strong>) and processed through the Master Bonus Ledger. Standard 10% records do not apply to you.
                                    </p>
                                    <Link to="/franchise/master-payouts" className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 underline underline-offset-2">
                                        <Trophy className="h-3.5 w-3.5" /> View Master Bonus Ledger →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                    <Tabs defaultValue="bv" className="w-full">
                        <div className="px-4 pt-4">
                            <TabsList className="grid w-full md:w-[360px] grid-cols-2">
                                <TabsTrigger value="bv" className="gap-1.5">
                                    <BarChart3 className="h-3.5 w-3.5" /> BV Payouts
                                </TabsTrigger>
                                <TabsTrigger value="pv" className="gap-1.5">
                                    <ShoppingBag className="h-3.5 w-3.5" /> PV Payouts
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="bv" className="mt-0">
                            {renderPayoutTable(bvHistory, 'BV')}
                        </TabsContent>
                        <TabsContent value="pv" className="mt-0">
                            {renderPayoutTable(pvHistory, 'PV')}
                        </TabsContent>
                    </Tabs>
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t bg-teal-50/30 dark:bg-teal-950/10">
                            <div className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchHistory()}>Previous</Button>
                                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchHistory()}>Next</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
