import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { UsersRound, ChevronLeft, ChevronRight, UserX, Search, FileSpreadsheet, FileText } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getDownlineTeam } from '@/services/userService';
import { cn } from '@/lib/utils';

interface TeamMember {
  _id: string;
  memberId: string;
  fullName: string;
  email: string;
  currentRank: string;
  sponsorId: string;
  totalBV: number;
  status: string;
  joiningDate?: string;
  profilePicture?: {
    url: string;
  };
}

interface PaginationData {
  page: number;
  pages: number;
  total: number;
  limit: number;
}

interface CompleteTeamResponse {
  success: boolean;
  data: {
    members: TeamMember[];
    pagination: PaginationData;
  };
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

const CompleteTeam = () => {
  const [activeLeg, setActiveLeg] = useState<'left' | 'right'>('left');
  const [data, setData] = useState<TeamMember[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCompleteTeam = async (page: number, leg: 'left' | 'right') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDownlineTeam(leg, page, 10);
      
      if (response.success) {
        // Map 'rank' field to 'currentRank' for consistent UI rendering
        const members = (response.data?.members || []).map((m: any) => ({
          ...m,
          currentRank: m.rank || m.currentRank || 'Starter',
        }));
        setData(members);
        setPagination(response.data?.pagination || null);
      }
    } catch (err: any) {
      console.error('Failed to fetch complete team:', err);
      setError(err.response?.data?.message || 'Failed to load team data');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(member =>
      member.fullName.toLowerCase().includes(query) ||
      member.memberId.toLowerCase().includes(query) ||
      member.sponsorId?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Complete Downline Report - ${activeLeg.toUpperCase()} Leg`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 14, 22);

    const tableColumn = ['Member ID', 'Name', 'Sponsor ID', 'Rank', 'Status', 'Joined'];
    const tableRows = filteredData.map(member => [
      member.memberId,
      member.fullName,
      member.sponsorId || '—',
      member.currentRank || 'Starter',
      member.status || 'Inactive',
      member.joiningDate ? format(new Date(member.joiningDate), 'dd MMM yyyy') : '—'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`CompleteTeam_${activeLeg}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = 'Member ID,Name,Sponsor ID,Rank,Status,Joined\n';
    const rows = filteredData.map(m =>
      `${m.memberId},"${m.fullName}",${m.sponsorId || ''},${m.currentRank || 'Starter'},${m.status || 'Inactive'},${m.joiningDate ? format(new Date(m.joiningDate), 'dd MMM yyyy') : ''}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CompleteTeam_${activeLeg}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    fetchCompleteTeam(1, activeLeg);
  }, [activeLeg]);

  useEffect(() => {
    fetchCompleteTeam(currentPage, activeLeg);
  }, [currentPage]);

  const handleTabChange = (value: string) => {
    setActiveLeg(value as 'left' | 'right');
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (pagination && currentPage < pagination.pages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankBadgeClass = (rank: string) => {
    const normalizedRank = rank?.toLowerCase() || 'starter';
    return rankColors[normalizedRank] || rankColors.starter;
  };

  const renderTableContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        </TableRow>
      ));
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center py-10">
            <p className="text-destructive">{error}</p>
          </TableCell>
        </TableRow>
      );
    }

    if (data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-muted">
                <UserX className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">No members found</p>
                <p className="text-sm text-muted-foreground">
                  No members in your {activeLeg === 'left' ? 'Left' : 'Right'} Leg downline yet
                </p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return filteredData.map((member) => (
      <TableRow key={member._id} className="hover:bg-muted/50">
        {/* Member Profile */}
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-border">
              <AvatarImage 
                src={member.profilePicture?.url} 
                alt={member.fullName} 
                className="object-cover"
              />
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

        {/* Sponsor ID */}
        <TableCell>
          <span className="font-mono text-sm text-muted-foreground">
            {member.sponsorId || '—'}
          </span>
        </TableCell>

        {/* Rank */}
        <TableCell>
          <Badge className={cn('capitalize', getRankBadgeClass(member.currentRank))}>
            {member.currentRank || 'Starter'}
          </Badge>
        </TableCell>

        {/* Status */}
        <TableCell>
          <div className="flex items-center gap-2">
            <span 
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                member.status?.toLowerCase() === 'active' 
                  ? 'bg-chart-2' 
                  : 'bg-destructive'
              )} 
            />
            <span className={cn(
              'text-sm font-medium capitalize',
              member.status?.toLowerCase() === 'active' 
                ? 'text-chart-2' 
                : 'text-destructive'
            )}>
              {member.status || 'Inactive'}
            </span>
          </div>
        </TableCell>

        {/* Joining Date */}
        <TableCell>
          <span className="text-muted-foreground">
            {member.joiningDate 
              ? format(new Date(member.joiningDate), 'dd MMM yyyy')
              : '—'
            }
          </span>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UsersRound className="h-6 w-6 text-primary" />
            My Downline
          </h1>
          <p className="text-muted-foreground mt-1">
            Total Team: <span className="font-semibold text-foreground">{pagination?.total || 0}</span> members (including indirect)
          </p>
        </div>
      </div>

      {/* Tabs & Table Card */}
      <Card className="border-border/50">
        <CardHeader className="pb-3 space-y-4">
          {/* Control Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Left: Tabs */}
            <Tabs value={activeLeg} onValueChange={handleTabChange} className="w-full sm:w-auto">
              <TabsList className="grid w-full sm:w-auto grid-cols-2 bg-muted">
                <TabsTrigger 
                  value="left" 
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Left Leg
                </TabsTrigger>
                <TabsTrigger 
                  value="right"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Right Leg
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Right: Search & Export */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Member..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[200px]"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={filteredData.length === 0}
                className="shrink-0"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={filteredData.length === 0}
                className="shrink-0"
              >
                <FileText className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Member</TableHead>
                  <TableHead className="font-semibold">Sponsor ID</TableHead>
                  <TableHead className="font-semibold">Rank</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderTableContent()}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleNext}
                  disabled={currentPage >= pagination.pages || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteTeam;
