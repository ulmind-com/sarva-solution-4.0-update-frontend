import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ChevronLeft, ChevronRight, UserX, Search, FileSpreadsheet, FileText } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getDirectTeam } from '@/services/userService';
import { cn } from '@/lib/utils';

interface TeamMember {
  _id: string;
  memberId: string;
  fullName: string;
  sponsorLeg: string;
  totalBV: number;
  currentRank: string;
  status: string;
  profilePicture?: {
    url?: string;
    publicId?: string | null;
  };
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
}

const rankColors: Record<string, string> = {
  starter: 'bg-muted text-muted-foreground',
  associate: 'bg-chart-2/20 text-chart-2',
  bronze: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  silver: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  gold: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  platinum: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  diamond: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const DirectTeam = () => {
  const activeLeg = 'all';
  const [data, setData] = useState<TeamMember[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDirectTeam = async (page: number, leg: 'all' | 'left' | 'right') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDirectTeam(page, 10, leg);

      if (response.success) {
        setData(response.data?.team || []);
        setPagination(response.data?.pagination || null);
      }
    } catch (err: any) {
      console.error('Failed to fetch direct team:', err);
      setError(err.response?.data?.message || 'Failed to load team data');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(member =>
      member.fullName.toLowerCase().includes(query) ||
      member.memberId.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const totalPages = pagination ? Math.ceil(pagination.total / (pagination.limit || 10)) : 1;

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Direct Team Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 14, 22);

    const tableColumn = ['Member ID', 'Name', 'Leg', 'Rank', 'BV', 'Status'];
    const tableRows = filteredData.map(member => [
      member.memberId,
      member.fullName,
      member.sponsorLeg || 'none',
      member.currentRank || 'Starter',
      (member.totalBV || 0).toLocaleString(),
      member.status || 'Inactive'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`DirectTeam_${activeLeg}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = 'Member ID,Name,Leg,Rank,BV,Status\n';
    const rows = filteredData.map(m =>
      `${m.memberId},"${m.fullName}",${m.sponsorLeg || 'none'},${m.currentRank || 'Starter'},${m.totalBV || 0},${m.status || 'Inactive'}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DirectTeam_${activeLeg}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchDirectTeam(1, 'all');
  }, []);

  useEffect(() => {
    if (currentPage > 1) fetchDirectTeam(currentPage, 'all');
  }, [currentPage]);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRankBadgeClass = (rank: string) => {
    const normalizedRank = rank?.toLowerCase() || 'starter';
    return rankColors[normalizedRank] || rankColors.starter;
  };

  const renderTableContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div></div></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
        </TableRow>
      ));
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-10">
            <p className="text-destructive">{error}</p>
          </TableCell>
        </TableRow>
      );
    }

    if (data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-muted">
                <UserX className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">No direct members found</p>
                <p className="text-sm text-muted-foreground">
                  {activeLeg === 'all'
                    ? 'You have no direct team members yet'
                    : `No members in your ${activeLeg === 'left' ? 'Left' : 'Right'} Leg yet`}
                </p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return filteredData.map((member) => (
      <TableRow key={member._id} className="hover:bg-muted/50">
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-border">
              <AvatarImage src={member.profilePicture?.url} alt={member.fullName} className="object-cover" />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {getInitials(member.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{member.fullName}</p>
              <p className="text-xs text-muted-foreground font-mono">{member.memberId}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <span className="capitalize text-sm text-muted-foreground">{member.sponsorLeg || 'none'}</span>
        </TableCell>
        <TableCell>
          <Badge className={cn('capitalize', getRankBadgeClass(member.currentRank))}>
            {member.currentRank || 'Starter'}
          </Badge>
        </TableCell>
        <TableCell>
          <span className="font-semibold text-foreground">{(member.totalBV || 0).toLocaleString()} BV</span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-full', member.status?.toLowerCase() === 'active' ? 'bg-chart-2' : 'bg-destructive')} />
            <span className={cn('text-sm font-medium capitalize', member.status?.toLowerCase() === 'active' ? 'text-chart-2' : 'text-destructive')}>
              {member.status || 'Inactive'}
            </span>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            My Direct Team
          </h1>
          <p className="text-muted-foreground mt-1">
            Total Directs: <span className="font-semibold text-foreground">{pagination?.total || 0}</span>
          </p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by Name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-full sm:w-[200px]" />
              </div>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filteredData.length === 0} className="shrink-0">
                <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={filteredData.length === 0} className="shrink-0">
                <FileText className="h-4 w-4 mr-1" /> PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Member</TableHead>
                  <TableHead className="font-semibold">Leg</TableHead>
                  <TableHead className="font-semibold">Rank</TableHead>
                  <TableHead className="font-semibold">Business Volume</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderTableContent()}
              </TableBody>
            </Table>
          </div>

          {pagination && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevious} disabled={currentPage === 1 || isLoading}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button variant="outline" size="sm" onClick={handleNext} disabled={currentPage >= totalPages || isLoading}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectTeam;
