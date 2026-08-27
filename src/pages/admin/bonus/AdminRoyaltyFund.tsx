import { useState, useEffect } from "react";
import { RefreshCw, Zap, CheckCircle2, Calendar, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
    getRoyaltyFundLivePool,
    getRoyaltyFundPools,
    getActiveRoyaltyFundUsers,
    triggerRoyaltyFund,
    applyRoyaltyFundCredits
} from "@/services/adminService";
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

export default function AdminRoyaltyFund() {
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingPools, setLoadingPools] = useState(true);
    const [triggering, setTriggering] = useState(false);
    const [applying, setApplying] = useState(false);

    const today = new Date();
    // Default to the current financial year cycle (e.g. 2026 implies up to Mar 2026)
    const [actionYear, setActionYear] = useState<string>(today.getFullYear().toString());

    const [livePoolData, setLivePoolData] = useState<any>(null);
    const [activeUsers, setActiveUsers] = useState<any[]>([]);
    const [pools, setPools] = useState<any[]>([]);
    const [poolPagination, setPoolPagination] = useState({ page: 1, totalPages: 1 });

    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
        fetchPools(1);
    }, []);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            // Priority: get live pool from specific endpoint
            try {
                const res = await getRoyaltyFundLivePool();
                if (res.success && res.data) {
                     setLivePoolData(res.data.pool);
                     setActiveUsers(res.data.users || []);
                     setLoadingUsers(false);
                     return;
                }
            } catch (e) {
                console.log("Live pool endpoint failed, using fallback...");
            }

            // Fallback: /users endpoint
            const res = await getActiveRoyaltyFundUsers();
            if (res.success || res.length >= 0 || res.data) {
                const usersList = Array.isArray(res) ? res : (res.data?.users || res.data || []);
                setActiveUsers(usersList);
                if (res.data?.pool) setLivePoolData(res.data.pool);
            }
        } catch (error) {
            console.error("Failed to fetch live royalty data:", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchPools = async (page: number) => {
        setLoadingPools(true);
        try {
            const res = await getRoyaltyFundPools(page, 12);
            if (res.data && Array.isArray(res.data.pools)) {
                setPools(res.data.pools);
                setPoolPagination({
                    page: res.data.page || page,
                    totalPages: Math.ceil((res.data.total || 1) / 12)
                });
            } else if (Array.isArray(res.data)) {
                setPools(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch royalty pools:", error);
        } finally {
            setLoadingPools(false);
        }
    };

    const handleTrigger = async () => {
        setTriggering(true);
        try {
            const y = parseInt(actionYear);
            const res = await triggerRoyaltyFund(y);
            if (res) {
                toast({ title: "Trigger Successful", description: "Royalty Fund annual computation staged." });
                fetchPools(1);
            }
        } catch (error: any) {
            toast({ title: "Trigger Failed", description: error.response?.data?.error || error.response?.data?.message || "Failed to trigger.", variant: "destructive" });
        } finally {
            setTriggering(false);
        }
    };

    const handleApplyCredits = async () => {
        setApplying(true);
        try {
            const y = parseInt(actionYear);
            const res = await applyRoyaltyFundCredits(y);
            if (res) {
                toast({ title: "Credits Applied", description: "Royalty Fund wallet credits applied successfully." });
                fetchPools(1);
            }
        } catch (error: any) {
            toast({ title: "Apply Failed", description: error.response?.data?.error || error.response?.data?.message || "Failed to apply credits.", variant: "destructive" });
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 p-6 rounded-lg glass premium-shadow">
                <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-xl hidden md:block">
                        <Crown className="h-8 w-8 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-amber-950 dark:text-amber-50">Royalty Fund Admin (Yearly)</h1>
                        <p className="text-amber-700 dark:text-amber-400 mt-1">
                            Monitor live eligible users, manage 12-month pools — <strong>7,50,000 BV = 1 Unit, No Capping, 3% Pool</strong>
                        </p>
                    </div>
                </div>

                {/* Management Actions */}
                <div className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border/50 shadow-sm">
                    <span className="text-sm font-medium text-muted-foreground mr-2">Target Cycle Year:</span>
                    <Select value={actionYear} onValueChange={setActionYear}>
                        <SelectTrigger className="w-[110px] h-9">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1, today.getFullYear() + 2].map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="mx-2 w-px h-6 bg-border"></div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" disabled={triggering} className="gap-1 border-amber-500/30 text-amber-600 hover:bg-amber-500/10">
                                <Zap className="h-4 w-4" /> {triggering ? "..." : "Stage"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass border-amber-500/30">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Stage Annual Pool Distribution?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will compute Royalty Fund pool amounts and unit values for <strong>Year {actionYear}</strong>.
                                    It creates wallet credit records but does <strong>NOT</strong> apply the money to wallets yet.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleTrigger} className="bg-amber-600 text-white hover:bg-amber-700">Confirm Stage</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" disabled={applying} className="gap-1 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20">
                                <CheckCircle2 className="h-4 w-4" /> {applying ? "..." : "Apply"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass border-green-500/30">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-green-600">Apply Royalty Fund Credits?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will irrevocably apply the staged annual bonus to user wallets for <strong>Year {actionYear}</strong>.
                                    This action is <strong>final</strong>. Normally runs April 1st.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleApplyCredits} className="bg-green-600 hover:bg-green-700 text-white">Execute Final Payout</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <Tabs defaultValue="estimates" className="w-full">
                <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6">
                    <TabsTrigger value="estimates">Live Global Estimates</TabsTrigger>
                    <TabsTrigger value="pools">Annual Pools History</TabsTrigger>
                </TabsList>

                {/* TAB: Live Estimates */}
                <TabsContent value="estimates">
                    <div className="space-y-6">
                        {/* Live Pool Metrics */}
                        {livePoolData && livePoolData.companyTotalBV !== undefined && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card className="glass premium-shadow border-amber-500/10">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Company 12M BV</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{livePoolData.companyTotalBV?.toLocaleString() || 0}</div>
                                    </CardContent>
                                </Card>
                                <Card className="glass premium-shadow border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-amber-500/10">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-amber-700">3% Annual Pool Cash</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-amber-700">₹{livePoolData.poolAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0}</div>
                                    </CardContent>
                                </Card>
                                <Card className="glass premium-shadow border-amber-500/10">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Units Generated</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{livePoolData.totalUnits || 0}</div>
                                        <p className="text-xs text-muted-foreground mt-1">{livePoolData.eligibleUserCount || 0} Eligible · 7.5L BV/Unit</p>
                                    </CardContent>
                                </Card>
                                <Card className="glass premium-shadow border-green-500/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-green-600">Per Unit Value</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-600">₹{livePoolData.perUnitValue?.toFixed(2) || '0.00'}</div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        <Card className="glass premium-shadow overflow-hidden border-t-4 border-t-amber-500">
                            <CardHeader className="flex flex-row items-center justify-between bg-amber-50/50 dark:bg-amber-950/20 pb-4">
                                <div>
                                    <CardTitle>Active 12-Month Cycle Tracker</CardTitle>
                                    <CardDescription>Real-time Royalty Fund unit estimates for top performers.</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={fetchUsers}>
                                    <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin text-amber-600' : 'text-amber-600'}`} />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Total Left BV</TableHead>
                                                <TableHead>Total Right BV</TableHead>
                                                <TableHead className="text-blue-600 text-xs">Self BV (Add-on)</TableHead>
                                                <TableHead>Adjusted Weaker Leg</TableHead>
                                                <TableHead>Projected Units</TableHead>
                                                <TableHead className="text-right">Est. Net Final (₹)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loadingUsers ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-40 text-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : activeUsers.length > 0 ? (
                                                activeUsers.map((u, i) => (
                                                    <TableRow key={i} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/20">
                                                        <TableCell>
                                                            <div className="font-medium text-amber-950 dark:text-amber-100 flex items-center gap-2">
                                                                {u.fullName || u.memberId}
                                                                {(u.finalUnits || u.projectedUnits || 0) >= 5 && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">{u.memberId}</div>
                                                        </TableCell>
                                                        <TableCell>{(u.leftBV || u.adjustedLeft || 0).toLocaleString()}</TableCell>
                                                        <TableCell>{(u.rightBV || u.adjustedRight || 0).toLocaleString()}</TableCell>
                                                        <TableCell className="text-blue-500 font-medium">+{(u.personalBV || 0).toLocaleString()}</TableCell>
                                                        <TableCell className="font-semibold text-amber-700/80 dark:text-amber-400">
                                                            {(u.adjustedWeakerLeg || Math.min(u.adjustedLeft || u.leftBV || 0, u.adjustedRight || u.rightBV || 0)).toLocaleString()} BV
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 shadow-sm text-white">
                                                                {u.finalUnits || u.projectedUnits || 0}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="text-green-600 font-bold text-lg">₹{u.estimatedNet?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}</div>
                                                            {u.estimatedGross && <div className="text-[10px] text-muted-foreground mt-0">Gross: ₹{u.estimatedGross?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                                                        No members currently qualifying for the annual Royalty Fund pool.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB: Monthly Pools */}
                <TabsContent value="pools">
                    <Card className="glass premium-shadow overflow-hidden border-amber-500/10">
                        <CardHeader className="flex flex-row items-center justify-between bg-amber-50/50 dark:bg-amber-950/20 pb-4">
                            <div>
                                <CardTitle>Pool Distributions</CardTitle>
                                <CardDescription>History of annual Royalty Fund pool computations and payouts.</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => fetchPools(1)}>
                                <RefreshCw className={`h-4 w-4 ${loadingPools ? 'animate-spin text-amber-600' : 'text-amber-600'}`} />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead>Financial Year</TableHead>
                                            <TableHead>Company 12m BV</TableHead>
                                            <TableHead className="text-amber-700">3% Pool Cash</TableHead>
                                            <TableHead>Total Units</TableHead>
                                            <TableHead className="text-green-600">Per Unit Value</TableHead>
                                            <TableHead>Qualifiers</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingPools ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-40 text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
                                                </TableCell>
                                            </TableRow>
                                        ) : pools.length > 0 ? (
                                            pools.map((p, i) => (
                                                <TableRow key={i} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/20">
                                                    <TableCell className="font-bold text-amber-900 dark:text-amber-100 whitespace-nowrap flex items-center gap-2">
                                                        <Crown className="h-4 w-4 text-amber-500" />
                                                        Year {p.cycleYear || p.year}
                                                    </TableCell>
                                                    <TableCell>{(p.companyTotalBV || 0).toLocaleString()}</TableCell>
                                                    <TableCell className="font-bold text-amber-700">₹{(p.poolAmount || 0).toLocaleString('en-IN')}</TableCell>
                                                    <TableCell>{p.totalUnits}</TableCell>
                                                    <TableCell className="font-bold text-green-600">₹{(p.perUnitValue || 0).toFixed(2)}</TableCell>
                                                    <TableCell>{p.eligibleUserCount}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={p.status === 'distributed' ? 'default' : 'secondary'} className={p.status === 'distributed' ? 'bg-green-500' : 'bg-orange-500'}>
                                                            {p.status ? p.status.toUpperCase() : 'PENDING'}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                                                    No annual royalty fund pools have been staged yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {poolPagination.totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t bg-amber-50/30 dark:bg-amber-950/10">
                                    <div className="text-sm text-muted-foreground">
                                        Page {poolPagination.page} of {poolPagination.totalPages}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" disabled={poolPagination.page <= 1} onClick={() => fetchPools(poolPagination.page - 1)}>Previous</Button>
                                        <Button variant="outline" size="sm" disabled={poolPagination.page >= poolPagination.totalPages} onClick={() => fetchPools(poolPagination.page + 1)}>Next</Button>
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
