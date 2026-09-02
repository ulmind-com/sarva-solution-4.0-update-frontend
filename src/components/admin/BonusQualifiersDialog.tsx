import { useEffect, useState } from "react";
import { Users, Loader2, AlertTriangle, Search, Download } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    getBonusQualifiers,
    type BonusType,
    type BonusPeriodQuery,
    type BonusQualifiersResponse,
} from "@/services/bonusQualifiersService";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bonusType: BonusType;
    /** Period of the pool row that was clicked. */
    period: BonusPeriodQuery | null;
}

const money = (n: number) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Shows exactly which members were credited from one bonus pool, with their
 * units and the gross / admin / TDS / net breakdown. Read-only.
 */
const BonusQualifiersDialog = ({ open, onOpenChange, bonusType, period }: Props) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<BonusQualifiersResponse | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!open || !period) return;

        let cancelled = false;
        setLoading(true);
        setError(null);
        setSearch("");

        getBonusQualifiers(bonusType, period, { limit: 2000 })
            .then((res) => { if (!cancelled) setData(res); })
            .catch((err) => {
                if (!cancelled) setError(err?.response?.data?.message || "Could not load the qualifier list.");
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [open, bonusType, period]);

    const rows = (data?.qualifiers || []).filter((q) => {
        const s = search.trim().toLowerCase();
        if (!s) return true;
        return (q.memberId || '').toLowerCase().includes(s)
            || (q.fullName || '').toLowerCase().includes(s);
    });

    const exportCsv = () => {
        if (!data) return;
        const head = ['Member ID', 'Name', 'Phone', 'Units', 'Per Unit', 'Gross', 'Admin', 'TDS', 'Net'];
        const body = rows.map((q) => [
            q.memberId ?? '', q.fullName ?? '', q.phone ?? '',
            q.finalUnits, q.perUnitValue, q.grossCredit, q.adminCharge, q.tds, q.netCredit,
        ]);
        const csv = [head, ...body]
            .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${bonusType}-qualifiers-${data.periodLabel.replace(/\s+/g, '-')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[88vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        {data ? `${data.label} — Qualifiers` : 'Qualifiers'}
                    </DialogTitle>
                    <DialogDescription>
                        {data
                            ? `Members credited from the ${data.periodLabel} pool.`
                            : 'Loading the credited members for this pool.'}
                    </DialogDescription>
                </DialogHeader>

                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </div>
                )}

                {!loading && error && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                {!loading && !error && !data && (
                    <div className="py-16 text-center text-sm text-muted-foreground">
                        No pool has been recorded for this period yet.
                    </div>
                )}

                {!loading && !error && data && (
                    <>
                        {/* Pool summary */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-lg bg-muted/40 p-3">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pool Amount</p>
                                <p className="text-lg font-bold text-primary">{money(data.pool.poolAmount)}</p>
                            </div>
                            <div className="rounded-lg bg-muted/40 p-3">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Units</p>
                                <p className="text-lg font-bold">{data.pool.totalUnits}</p>
                            </div>
                            <div className="rounded-lg bg-muted/40 p-3">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Per Unit</p>
                                <p className="text-lg font-bold text-green-600">{money(data.pool.perUnitValue)}</p>
                            </div>
                            <div className="rounded-lg bg-muted/40 p-3">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Qualifiers</p>
                                <p className="text-lg font-bold">{data.totals.qualifierCount}</p>
                            </div>
                        </div>

                        {/* Only shown when the pool's stored count disagrees with the rows found */}
                        {!data.check.matches && (
                            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-500">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>
                                    The pool records <b>{data.check.poolEligibleUserCount}</b> qualifiers but{' '}
                                    <b>{data.check.creditRowsFound}</b> credit rows exist. The list below shows the
                                    rows that are actually present.
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by member ID or name"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
                                <Download className="mr-2 h-4 w-4" /> CSV
                            </Button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
                            <Table>
                                <TableHeader className="sticky top-0 z-10 bg-muted">
                                    <TableRow>
                                        <TableHead>Member ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="text-right">Units</TableHead>
                                        <TableHead className="text-right">Gross</TableHead>
                                        <TableHead className="text-right">Admin</TableHead>
                                        <TableHead className="text-right">TDS</TableHead>
                                        <TableHead className="text-right">Net Credit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.length > 0 ? rows.map((q) => (
                                        <TableRow key={q.userId} className="hover:bg-accent/40">
                                            <TableCell className="whitespace-nowrap font-mono text-xs">{q.memberId || '—'}</TableCell>
                                            <TableCell className="whitespace-nowrap font-medium">{q.fullName || '—'}</TableCell>
                                            <TableCell className="text-right">{q.finalUnits}</TableCell>
                                            <TableCell className="text-right">{money(q.grossCredit)}</TableCell>
                                            <TableCell className="text-right text-destructive">-{money(q.adminCharge)}</TableCell>
                                            <TableCell className="text-right text-destructive">-{money(q.tds)}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">{money(q.netCredit)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-28 text-center text-sm text-muted-foreground">
                                                {data.totals.qualifierCount === 0
                                                    ? 'This pool has not been distributed, so no member has been credited yet.'
                                                    : 'No member matches that search.'}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                            <span>
                                Showing <b>{rows.length}</b> of <b>{data.totals.qualifierCount}</b> qualifiers
                            </span>
                            <span className="flex items-center gap-3">
                                <span>Total gross <b className="text-foreground">{money(data.totals.totalGross)}</b></span>
                                <span>Total net <b className="text-green-600">{money(data.totals.totalNet)}</b></span>
                                <Badge variant="secondary" className="uppercase">{data.pool.status}</Badge>
                            </span>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default BonusQualifiersDialog;
