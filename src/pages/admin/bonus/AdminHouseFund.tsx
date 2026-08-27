import { useState, useEffect } from "react";
import { RefreshCw, Zap, CheckCircle2, Calendar } from "lucide-react";
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
    getHouseFundLivePool, // might or might not exist, but we will use getActiveHouseFundUsers as fallback if needed
    getHouseFundPools,
    getActiveHouseFundUsers,
    triggerHouseFund,
    applyHouseFundCredits
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

export default function AdminHouseFund() {
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingPools, setLoadingPools] = useState(true);
    const [triggering, setTriggering] = useState(false);
    const [applying, setApplying] = useState(false);

    const today = new Date();
    // Default to Cycle 1 (Apr-Sep) if month is 4-9, else Cycle 2
    const currentM = today.getMonth() + 1;
    const defaultCycle = (currentM >= 4 && currentM <= 9) ? "1" : "2";
    // If Cycle 2 (Oct-Mar) and we are in Jan-Mar, the cycle year is the previous year
    const defaultCycleYear = (defaultCycle === "2" && currentM <= 3) ? (today.getFullYear() - 1).toString() : today.getFullYear().toString();

    const [actionCycle, setActionCycle] = useState<string>(defaultCycle);
    const [actionYear, setActionYear] = useState<string>(defaultCycleYear);

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
            // First try to fetch standard live pool if it exists
            try {
                const res = await getHouseFundLivePool();
                if (res.success && res.data) {
                    setLivePoolData(res.data.pool);
                    setActiveUsers(res.data.users || []);
                    setLoadingUsers(false);
                    return;
                }
            } catch (e) {
                console.log("Live pool generic endpoint failed, falling back to /users endpoint");
            }

            // Fallback to /users endpoint as documented
            const res = await getActiveHouseFundUsers();
            if (res.success || res.length >= 0 || res.data) {
                const usersList = Array.isArray(res) ? res : (res.data?.users || res.data || []);
                setActiveUsers(usersList);
                
                // Construct fake pool data since /users might only return the array
                if (res.data?.pool) {
                     setLivePoolData(res.data.pool);
                } else if (res.data?.companyTotalBV) {
                     setLivePoolData(res.data);
                }
            }
        } catch (error) {
            console.error("Failed to fetch live users data:", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchPools = async (page: number) => {
        setLoadingPools(true);
        try {
            const res = await getHouseFundPools(page, 12);
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
            console.error("Failed to fetch pools:", error);
        } finally {
            setLoadingPools(false);
        }
    };

    const handleTrigger = async () => {
        setTriggering(true);
        try {
            const y = parseInt(actionYear);
            const c = parseInt(actionCycle);
            const res = await triggerHouseFund(y, c);
            if (res) {
                toast({ title: "Trigger Successful", description: "House Fund half-yearly computation staged." });
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
            const c = parseInt(actionCycle);
            const res = await applyHouseFundCredits(y, c);
            if (res) {
                toast({ title: "Credits Applied", description: "House Fund wallet credits applied successfully." });
                fetchPools(1);
            }
        } catch (error: any) {
            toast({ title: "Apply Failed", description: error.response?.data?.error || error.response?.data?.message || "Failed to apply credits.", variant: "destructive" });
        } finally {
            setApplying(false);
        }
    };

    const getCycleName = (cycleNum: string | number) => {
        return cycleNum.toString() === "1" ? "Cycle 1 (Apr - Sep)" : "Cycle 2 (Oct - Mar)";
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-950/5 border border-emerald-500/20 p-6 rounded-lg glass premium-shadow">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100">House Fund Admin (Half-Yearly)</h1>
                    <p className="text-emerald-700 dark:text-emerald-400 mt-1">
                        Monitor live eligible users, manage 6-month pools — <strong>2,50,000 BV = 1 Unit, No Capping, 3% Pool</strong>
                    </p>
                </div>

                {/* Management Actions */}
                <div className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border/50 shadow-sm">
                    <span className="text-sm font-medium text-muted-foreground mr-2">Target Cycle:</span>
                    <Select value={actionCycle} onValueChange={setActionCycle}>
                        <SelectTrigger className="w-[160px] h-9">
                            <SelectValue placeholder="Cycle" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Cycle 1 (Apr-Sep)</SelectItem>
                            <SelectItem value="2">Cycle 2 (Oct-Mar)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={actionYear} onValueChange={setActionYear}>
                        <SelectTrigger className="w-[90px] h-9">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="mx-2 w-px h-6 bg-border"></div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" disabled={triggering} className="gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
                                <Zap className="h-4 w-4" /> {triggering ? "..." : "Stage"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass border-emerald-500/30">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Stage Half-Yearly Pool Distribution?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will compute House Fund pool amounts and unit values for <strong>{getCycleName(actionCycle)} {actionYear}</strong>.
                                    It creates wallet credit records but does <strong>NOT</strong> apply the money to wallets yet.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleTrigger} className="bg-emerald-600 text-white hover:bg-emerald-700">Confirm Stage</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" disabled={applying} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
                                <CheckCircle2 className="h-4 w-4" /> {applying ? "..." : "Apply"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass border-green-500/30">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-green-600">Apply House Fund Credits?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will irrevocably apply the staged half-yearly bonus to user wallets for <strong>{getCycleName(actionCycle)} {actionYear}</strong>.
                                    This action is <strong>final</strong>.
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
                    <TabsTrigger value="estimates">Live Cycle Estimates</TabsTrigger>
                    <TabsTrigger value="pools">Half-Yearly Pools History</TabsTrigger>
                </TabsList>

                {/* TAB: Live Estimates */}
                <TabsContent value="estimates">
                    <div className="space-y-6">
                        {/* Live Pool Metrics */}
                        {livePoolData && livePoolData.companyTotalBV !== undefined && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card className="glass premium-shadow border-emerald-500/10">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Company 6M BV</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{livePoolData.companyTotalBV?.toLocaleString() || 0}</div>
                                    </CardContent>
                                </Card>
                                <Card className="glass premium-shadow border-emerald-500/20 bg-emerald-500/5">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-emerald-700">3% Pool Amount</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-700">₹{livePoolData.poolAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0}</div>
                                    </CardContent>
                                </Card>
                                <Card className="glass premium-shadow border-emerald-500/10">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Units Generated</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{livePoolData.totalUnits || 0}</div>
                                        <p className="text-xs text-muted-foreground mt-1">{livePoolData.eligibleUserCount || 0} Eligible · 2,50,000 BV/Unit</p>
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

                        <Card className="glass premium-shadow overflow-hidden border-t-4 border-t-emerald-500">
                            <CardHeader className="flex flex-row items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20 pb-4">
                                <div>
                                    <CardTitle>Active 6-Month Cycle Tracker</CardTitle>
                                    <CardDescription>Real-time House Fund unit estimates — no capping applied.</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={fetchUsers}>
                                    <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`} />
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
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : activeUsers.length > 0 ? (
                                                activeUsers.map((u, i) => (
                                                    <TableRow key={i} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20">
                                                        <TableCell>
                                                            <div className="font-medium text-emerald-900 dark:text-emerald-100">{u.fullName || u.memberId}</div>
                                                            <div className="text-xs text-muted-foreground">{u.memberId}</div>
                                                        </TableCell>
                                                        <TableCell>{(u.leftBV || u.adjustedLeft || 0).toLocaleString()}</TableCell>
                                                        <TableCell>{(u.rightBV || u.adjustedRight || 0).toLocaleString()}</TableCell>
                                                        <TableCell className="text-blue-500 font-medium">+{(u.personalBV || 0).toLocaleString()}</TableCell>
                                                        <TableCell className="font-semibold text-emerald-700/80 dark:text-emerald-400">
                                                            {(u.adjustedWeakerLeg || Math.min(u.adjustedLeft || u.leftBV || 0, u.adjustedRight || u.rightBV || 0)).toLocaleString()} BV
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 bg-emerald-500/5">
                                                                {u.finalUnits || u.projectedUnits || 0}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="text-green-600 font-bold">₹{u.estimatedNet?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}</div>
                                                            {u.estimatedGross && <div className="text-[10px] text-muted-foreground mt-0.5">Gross: ₹{u.estimatedGross?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                                                        No active members currently qualifying for the House Fund 6-month pool.
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
                    <Card className="glass premium-shadow overflow-hidden border-emerald-500/10">
                        <CardHeader className="flex flex-row items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20 pb-4">
                            <div>
                                <CardTitle>Pool Distributions</CardTitle>
                                <CardDescription>History of half-yearly House Fund pool computations and payouts.</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => fetchPools(1)}>
                                <RefreshCw className={`h-4 w-4 ${loadingPools ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`} />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead>Target Cycle</TableHead>
                                            <TableHead>Company 6m BV</TableHead>
                                            <TableHead className="text-emerald-700">3% Pool Cash</TableHead>
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
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                                                </TableCell>
                                            </TableRow>
                                        ) : pools.length > 0 ? (
                                            pools.map((p, i) => (
                                                <TableRow key={i} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20">
                                                    <TableCell className="font-medium whitespace-nowrap flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-emerald-600/60" />
                                                        {getCycleName(p.cycleNumber || p.cycle || 1)} {p.cycleYear || p.year}
                                                    </TableCell>
                                                    <TableCell>{(p.companyTotalBV || 0).toLocaleString()}</TableCell>
                                                    <TableCell className="font-bold text-emerald-700">₹{(p.poolAmount || 0).toLocaleString('en-IN')}</TableCell>
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
                                                    No half-yearly house fund pools have been staged yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {poolPagination.totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t bg-emerald-50/30 dark:bg-emerald-950/10">
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
