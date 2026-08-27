import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Landmark, Search, IndianRupee, Users, CalendarDays } from 'lucide-react';
import { api } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const monthName = (m: number) => MONTHS[m - 1] || String(m);
const inr = (n: number) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Human labels for the 13 income source types
const SOURCE_LABELS: Record<string, string> = {
  'fast-track-bonus': 'Fast Track Bonus',
  'star-matching-bonus': 'Star Matching Bonus',
  'rank-bonus': 'Rank Bonus',
  'isolated-rank-bonus': 'Rank Bonus (Isolated)',
  'self-repurchase-bonus': 'Self Repurchase Bonus',
  'beginner-bonus': 'Beginner Matching Bonus',
  'startup-bonus': 'Start Up Bonus',
  'leadership-bonus': 'Leadership Bonus',
  'tour-fund': 'Tour Fund',
  'health-education-fund': 'Health & Education Bonus',
  'bike-car-fund': 'Bike & Car Fund',
  'house-fund': 'House Fund',
  'royalty-fund': 'Royalty Fund',
  'ssvpl-super-bonus': 'SSVPL Super Bonus',
};
const sourceLabel = (s: string) => SOURCE_LABELS[s] || s;

// ─── Types ────────────────────────────────────────────────────────────────
interface MonthlySummary {
  year: number;
  month: number;
  totalTds: number;
  totalGross: number;
  userCount?: number;
  entryCount: number;
}
interface MonthlyRow {
  userId: string;
  memberId: string;
  fullName: string | null;
  year: number;
  month: number;
  totalTds: number;
  totalGross: number;
  entryCount: number;
}
interface SourceRow {
  sourceType: string;
  totalTds: number;
  totalGross: number;
  entryCount: number;
}
interface TdsEntry {
  _id: string;
  sourceType: string;
  grossAmount: number;
  tdsAmount: number;
  year: number;
  month: number;
  createdAt_IST?: string;
  createdAt: string;
}
interface UserDetail {
  user: { memberId: string; fullName: string; status: string };
  totalTds: number;
  monthly: MonthlySummary[];
  bySource: SourceRow[];
  entries: TdsEntry[];
}

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const TdsReport = () => {
  const { toast } = useToast();

  // Company summary
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [grandTotal, setGrandTotal] = useState(0);
  const [summary, setSummary] = useState<MonthlySummary[]>([]);

  // Monthly per-user
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [rows, setRows] = useState<MonthlyRow[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  // User detail
  const [memberId, setMemberId] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);

  // ─── Company summary ──────────────────────────────────────────────────
  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const res = await api.get('/api/v1/admin/tds/summary');
      setGrandTotal(res.data.data.grandTotalTds);
      setSummary(res.data.data.monthly);
    } catch (err) {
      console.error('Failed to fetch TDS summary', err);
      toast({ title: 'Error', description: 'Could not load TDS summary.', variant: 'destructive' });
    } finally {
      setSummaryLoading(false);
    }
  };

  // ─── Monthly per-user ─────────────────────────────────────────────────
  const fetchMonthly = async () => {
    try {
      setMonthlyLoading(true);
      const params: Record<string, string> = {};
      if (filterYear !== 'all') params.year = filterYear;
      if (filterMonth !== 'all') params.month = filterMonth;
      const res = await api.get('/api/v1/admin/tds/monthly', { params });
      setRows(res.data.data.rows);
      setMonthlyTotal(res.data.data.grandTotalTds);
    } catch (err) {
      console.error('Failed to fetch monthly TDS', err);
      toast({ title: 'Error', description: 'Could not load monthly TDS.', variant: 'destructive' });
    } finally {
      setMonthlyLoading(false);
    }
  };

  // ─── User detail ──────────────────────────────────────────────────────
  const fetchUser = async () => {
    const id = memberId.trim().toUpperCase();
    if (!id) {
      toast({ title: 'Enter Member ID', description: 'Please enter a member ID to search.' });
      return;
    }
    try {
      setUserLoading(true);
      setUserDetail(null);
      const res = await api.get(`/api/v1/admin/tds/user/${id}`);
      setUserDetail(res.data.data);
    } catch (err: any) {
      console.error('Failed to fetch user TDS', err);
      const msg = err?.response?.status === 404 ? 'No user found with this Member ID.' : 'Could not load user TDS.';
      toast({ title: 'Not found', description: msg, variant: 'destructive' });
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);
  useEffect(() => { fetchMonthly(); /* eslint-disable-next-line */ }, [filterYear, filterMonth]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Landmark className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">TDS Report</h1>
          <p className="text-sm text-muted-foreground">
            2% TDS collected from all member incomes — month-wise, for government remittance.
          </p>
        </div>
      </div>

      {/* Grand total card */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4" /> Total TDS Collected (All Time)
          </CardDescription>
          <CardTitle className="text-3xl">
            {summaryLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : inr(grandTotal)}
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList>
          <TabsTrigger value="summary"><CalendarDays className="h-4 w-4 mr-1" /> Monthly Summary</TabsTrigger>
          <TabsTrigger value="perUser"><Users className="h-4 w-4 mr-1" /> Per-User</TabsTrigger>
          <TabsTrigger value="userDetail"><Search className="h-4 w-4 mr-1" /> User Lookup</TabsTrigger>
        </TabsList>

        {/* ── Company month-wise summary ── */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Company TDS — Month-wise</CardTitle>
              <CardDescription>Total TDS collected across all members, grouped by month.</CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : summary.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No TDS records yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Members</TableHead>
                        <TableHead className="text-right">Gross Income</TableHead>
                        <TableHead className="text-right">TDS (2%)</TableHead>
                        <TableHead className="text-right">Entries</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.map((m) => (
                        <TableRow key={`${m.year}-${m.month}`}>
                          <TableCell className="font-medium">{monthName(m.month)} {m.year}</TableCell>
                          <TableCell className="text-right">{m.userCount ?? '—'}</TableCell>
                          <TableCell className="text-right">{inr(m.totalGross)}</TableCell>
                          <TableCell className="text-right font-semibold text-primary">{inr(m.totalTds)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{m.entryCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Per-user month-wise ── */}
        <TabsContent value="perUser">
          <Card>
            <CardHeader>
              <CardTitle>Per-User TDS — Month-wise</CardTitle>
              <CardDescription>One row per member per month. Filter by year/month below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Year</Label>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {YEAR_OPTIONS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Month</Label>
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {MONTHS.map((label, i) => <SelectItem key={i} value={String(i + 1)}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Badge variant="secondary" className="ml-auto text-sm py-1.5">
                  Filtered TDS: <span className="font-semibold ml-1">{inr(monthlyTotal)}</span>
                </Badge>
              </div>

              {monthlyLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : rows.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No TDS records for this filter.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">TDS (2%)</TableHead>
                        <TableHead className="text-right">Entries</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={`${r.memberId}-${r.year}-${r.month}`}>
                          <TableCell className="font-mono text-sm">{r.memberId}</TableCell>
                          <TableCell>{r.fullName || '—'}</TableCell>
                          <TableCell>{monthName(r.month)} {r.year}</TableCell>
                          <TableCell className="text-right">{inr(r.totalGross)}</TableCell>
                          <TableCell className="text-right font-semibold text-primary">{inr(r.totalTds)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{r.entryCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Single user lookup ── */}
        <TabsContent value="userDetail">
          <Card>
            <CardHeader>
              <CardTitle>User TDS Lookup</CardTitle>
              <CardDescription>Full TDS history for one member — month-wise, income-wise & every entry.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end gap-2">
                <div className="space-y-1 flex-1 max-w-xs">
                  <Label className="text-xs">Member ID</Label>
                  <Input
                    placeholder="e.g. SVS000001"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUser()}
                    className="uppercase"
                  />
                </div>
                <Button onClick={fetchUser} disabled={userLoading}>
                  {userLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="ml-1">Search</span>
                </Button>
              </div>

              {userDetail && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Member</p>
                      <p className="font-semibold">{userDetail.user.fullName}</p>
                      <p className="font-mono text-xs">{userDetail.user.memberId}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-muted-foreground">Total TDS</p>
                      <p className="text-2xl font-bold text-primary">{inr(userDetail.totalTds)}</p>
                    </div>
                  </div>

                  {/* Month-wise */}
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Month-wise</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead className="text-right">Gross</TableHead>
                            <TableHead className="text-right">TDS (2%)</TableHead>
                            <TableHead className="text-right">Entries</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userDetail.monthly.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No records</TableCell></TableRow>
                          ) : userDetail.monthly.map((m) => (
                            <TableRow key={`${m.year}-${m.month}`}>
                              <TableCell className="font-medium">{monthName(m.month)} {m.year}</TableCell>
                              <TableCell className="text-right">{inr(m.totalGross)}</TableCell>
                              <TableCell className="text-right font-semibold text-primary">{inr(m.totalTds)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{m.entryCount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* By income type */}
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">By Income Type</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Income</TableHead>
                            <TableHead className="text-right">Gross</TableHead>
                            <TableHead className="text-right">TDS (2%)</TableHead>
                            <TableHead className="text-right">Entries</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userDetail.bySource.map((s) => (
                            <TableRow key={s.sourceType}>
                              <TableCell>{sourceLabel(s.sourceType)}</TableCell>
                              <TableCell className="text-right">{inr(s.totalGross)}</TableCell>
                              <TableCell className="text-right font-semibold text-primary">{inr(s.totalTds)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{s.entryCount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Raw entries */}
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">All Entries</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date (IST)</TableHead>
                            <TableHead>Income</TableHead>
                            <TableHead className="text-right">Gross</TableHead>
                            <TableHead className="text-right">TDS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userDetail.entries.map((e) => (
                            <TableRow key={e._id}>
                              <TableCell className="text-sm">{e.createdAt_IST || new Date(e.createdAt).toLocaleString()}</TableCell>
                              <TableCell>{sourceLabel(e.sourceType)}</TableCell>
                              <TableCell className="text-right">{inr(e.grossAmount)}</TableCell>
                              <TableCell className="text-right font-semibold text-primary">{inr(e.tdsAmount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TdsReport;
