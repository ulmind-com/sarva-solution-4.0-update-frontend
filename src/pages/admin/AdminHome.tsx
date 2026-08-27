import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  CreditCard,
  TrendingUp,
  DollarSign,
  ArrowUpRight
} from 'lucide-react';
import api from '@/lib/api';
import { formatDateIST } from '@/lib/dateUtils';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingPayoutAmount: number;
  totalPaidAmount: number;
  currentMonthBV: number;
}

interface RecentTransaction {
  _id: string;
  memberId: string;
  userName: string;
  netAmount: number;
  status: string;
  createdAt: string;
  createdAt_IST?: string;
}

const formatCurrency = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const AdminHome = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingPayoutAmount: 0,
    totalPaidAmount: 0,
    currentMonthBV: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [usersRes, pendingRes, completedRes, bvRes] = await Promise.all([
          api.get('/api/v1/admin/users').catch(() => null),
          api.get('/api/v1/admin/payouts', { params: { status: 'pending' } }).catch(() => null),
          api.get('/api/v1/admin/payouts', { params: { status: 'completed' } }).catch(() => null),
          api.get('/api/v1/admin/company-bv').catch(() => null),
        ]);

        // Users
        let totalUsers = 0;
        let activeUsers = 0;
        if (usersRes) {
          const usersData = usersRes.data?.data || usersRes.data || [];
          const usersList = Array.isArray(usersData) ? usersData : [];
          totalUsers = usersRes.data?.pagination?.total || usersList.length;
          activeUsers = usersList.filter((u: any) => u.status === 'active').length;
        }

        // Pending payouts
        let pendingPayoutAmount = 0;
        if (pendingRes) {
          const pendingData = pendingRes.data?.data || pendingRes.data;
          const pendingList = Array.isArray(pendingData) ? pendingData : pendingData?.payouts || [];
          pendingPayoutAmount = pendingList.reduce((sum: number, p: any) => sum + (p.netAmount || 0), 0);
        }

        // Completed payouts
        let totalPaidAmount = 0;
        let recent: RecentTransaction[] = [];
        if (completedRes) {
          const completedData = completedRes.data?.data || completedRes.data;
          const completedList = Array.isArray(completedData) ? completedData : completedData?.payouts || [];
          totalPaidAmount = completedList.reduce((sum: number, p: any) => sum + (p.netAmount || 0), 0);

          // Recent transactions from completed
          recent = completedList.slice(0, 5).map((p: any) => ({
            _id: p._id,
            memberId: p.userId?.memberId || p.memberId || '—',
            userName: p.userId?.fullName || p.userId?.name || '—',
            netAmount: p.netAmount || 0,
            status: p.status,
            createdAt: p.createdAt,
            createdAt_IST: p.createdAt_IST,
          }));
        }

        let currentMonthBV = 0;
        if (bvRes && bvRes.data?.data) {
          currentMonthBV = bvRes.data.data.currentMonthBV || 0;
        }

        setStats({ totalUsers, activeUsers, pendingPayoutAmount, totalPaidAmount, currentMonthBV });
        setRecentTransactions(recent);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers.toLocaleString('en-IN'), icon: Users, color: 'text-primary' },
    { title: 'Active Users', value: stats.activeUsers.toLocaleString('en-IN'), icon: TrendingUp, color: 'text-chart-1' },
    { title: 'Pending Payouts', value: formatCurrency(stats.pendingPayoutAmount), icon: CreditCard, color: 'text-chart-4' },
    { title: 'Total Paid Out', value: formatCurrency(stats.totalPaidAmount), icon: DollarSign, color: 'text-chart-2' },
    { title: 'Current Month BV', value: stats.currentMonthBV.toLocaleString('en-IN') + ' BV', icon: TrendingUp, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your MLM network</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-primary" />
                    Live data
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transactions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent transactions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">User</TableHead>
                    <TableHead className="text-muted-foreground">Member ID</TableHead>
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx) => (
                    <TableRow key={tx._id} className="border-border">
                      <TableCell className="font-medium text-foreground">{tx.userName}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{tx.memberId}</TableCell>
                      <TableCell className="text-muted-foreground">Withdrawal</TableCell>
                      <TableCell className="font-medium text-foreground">{formatCurrency(tx.netAmount)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            tx.status === 'completed'
                              ? 'bg-primary/20 text-primary border-primary/30'
                              : tx.status === 'pending'
                                ? 'bg-chart-4/20 text-chart-4 border-chart-4/30'
                                : 'bg-destructive/20 text-destructive border-destructive/30'
                          }
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateIST(tx.createdAt, tx.createdAt_IST)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHome;
