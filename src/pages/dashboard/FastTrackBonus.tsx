import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getFastTrackStatus } from '@/services/userService';
import { IndianRupee, TrendingUp, Clock, BarChart3, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface HistoryItem {
  _id: string;
  payoutType: string;
  grossAmount: number;
  netAmount: number;
  status: string;
  createdAt: string;
}

interface FastTrackData {
  dailyClosings: number;
  lastClosingTime: string;
  pendingLeft: number;
  pendingRight: number;
  carryForwardLeft: number;
  carryForwardRight: number;
  overallTotalEarnings: number;
  history: HistoryItem[];
}

const formatPayoutType = (type: string) => {
  switch (type) {
    case 'fast-track-bonus': return 'Payout';
    case 'fast-track-flashout': return 'Flashout (Capped)';
    case 'fast-track-deduction': return 'Rank Upgrade Deduction';
    default: return type;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">Paid</Badge>;
    case 'flushed':
      return <Badge variant="destructive">Missed</Badge>;
    case 'deducted':
      return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">Upgrade</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const FastTrackBonus = () => {
  const [data, setData] = useState<FastTrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getFastTrackStatus();
        setData(response.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const sortedHistory = [...data.history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fast Track Bonus</h1>
        <p className="text-muted-foreground">Your fast track earnings and transaction history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <IndianRupee className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold text-foreground">₹{data.overallTotalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-chart-2/10">
                <BarChart3 className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Business (PV)</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-sm font-medium text-foreground">L: {data.pendingLeft}</span>
                  <span className="text-sm font-medium text-foreground">R: {data.pendingRight}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-chart-4/10">
                <Clock className="h-6 w-6 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Stats</p>
                <p className="text-sm font-medium text-foreground">Closings: {data.dailyClosings} / 6</p>
                <p className="text-xs text-muted-foreground">
                  Last: {data.lastClosingTime ? format(new Date(data.lastClosingTime), 'hh:mm a') : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>{format(new Date(item.createdAt), 'dd MMM, hh:mm a')}</TableCell>
                    <TableCell>{formatPayoutType(item.payoutType)}</TableCell>
                    <TableCell className="text-right font-medium">₹{item.grossAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">₹{item.netAmount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <IndianRupee className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Records Found</h3>
              <p className="text-muted-foreground">No fast track bonus records found yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FastTrackBonus;
