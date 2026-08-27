import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import { getAdminTreeBVSummary } from '@/services/adminService';
import { getUserTreeBVSummary } from '@/services/userService';

interface TreeBVSummaryCardProps {
  memberId?: string;
  isAdmin?: boolean;
}

const TreeBVSummaryCard: React.FC<TreeBVSummaryCardProps> = ({ memberId, isAdmin = false }) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['treeBvSummary', isAdmin, memberId],
    queryFn: async () => {
      // Admin requires memberId
      if (isAdmin) {
        if (!memberId) throw new Error("Member ID is required for Admin view");
        return await getAdminTreeBVSummary(memberId);
      }
      // User uses their own token, but if they drill down, they can view downline member's summary
      return await getUserTreeBVSummary(memberId);
    },
    staleTime: 60000, // 1 minute
  });

  if (isLoading) {
    return (
      <Card className="mb-6 border-border">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-28 w-full rounded-md" />
            <Skeleton className="h-28 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data?.data) {
    if (isError && (error as any)?.response?.status === 404) {
      // Don't show anything if summary is not found for this user (e.g. backend error or not generated)
      return null;
    }
    return (
      <Card className="mb-6 border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-center gap-2 py-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>Failed to load Tree BV Summary. {(error as any)?.message}</p>
        </CardContent>
      </Card>
    );
  }

  const { user, timeframes, bvSummary } = data.data;

  const BvRow = ({ label, leftValue, rightValue, period }: { label: string, leftValue: number, rightValue: number, period?: string }) => (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0 hover:bg-muted/40 px-2 rounded-sm transition-colors">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {period && <span className="text-[10px] text-muted-foreground">{period}</span>}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 w-20 justify-end">
          <span className="text-sm font-semibold">{leftValue.toLocaleString()}</span>
          <span className="text-[10px] text-muted-foreground">BV</span>
        </div>
        <div className="w-px h-4 bg-border"></div>
        <div className="flex items-center gap-1 w-20 justify-start">
          <span className="text-sm font-semibold">{rightValue.toLocaleString()}</span>
          <span className="text-[10px] text-muted-foreground">BV</span>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="mb-6 border-border overflow-hidden shadow-sm">
      <CardHeader className="pb-3 bg-muted/30 border-b border-border">
        <div className="flex justify-between items-center max-sm:flex-col max-sm:items-start gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Tree Business Volume (BV) Summary</CardTitle>
            <Badge variant="outline" className="bg-background">
              {user.username} ({user.memberId})
            </Badge>
          </div>
          <div className="flex items-center text-xs text-muted-foreground gap-1 bg-background px-2 py-1 rounded-md border border-border">
            <Calendar className="h-3 w-3" /> Updated Snapshot
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 p-0 sm:p-4">
        {/* Mobile View: Two separate cards */}
        <div className="grid grid-cols-1 md:hidden gap-4 px-4 pb-4">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-primary border-b border-border pb-2">
              <ArrowLeft className="h-4 w-4" />
              <h4 className="font-semibold">Left Branch BV</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Month</span>
                <span className="font-semibold">{bvSummary.left.currentMonth.toLocaleString()} BV</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Half-Yearly</span>
                <span className="font-semibold">{bvSummary.left.halfYearly.toLocaleString()} BV</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Annually</span>
                <span className="font-semibold">{bvSummary.left.annually.toLocaleString()} BV</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-primary border-b border-border pb-2">
              <h4 className="font-semibold">Right Branch BV</h4>
              <ArrowRight className="h-4 w-4" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Month</span>
                <span className="font-semibold">{bvSummary.right.currentMonth.toLocaleString()} BV</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Half-Yearly</span>
                <span className="font-semibold">{bvSummary.right.halfYearly.toLocaleString()} BV</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Annually</span>
                <span className="font-semibold">{bvSummary.right.annually.toLocaleString()} BV</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop View: Unified Table */}
        <div className="hidden md:block">
          <div className="rounded-md border border-border bg-card">
            {/* Header */}
            <div className="grid grid-cols-[1fr_200px] border-b border-border bg-muted/40 p-3">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Timeframe</div>
              <div className="grid grid-cols-[1fr_1px_1fr] items-center text-center text-sm font-semibold">
                <div className="flex items-center justify-center gap-1 text-primary">
                  <ArrowLeft className="h-3.5 w-3.5" /> Left Leg
                </div>
                <div className="h-4 bg-border"></div>
                <div className="flex items-center justify-center gap-1 text-primary">
                  Right Leg <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
            
            {/* Body */}
            <div className="p-1">
              <BvRow 
                label="Current Month" 
                period={timeframes.currentMonth ? `${new Date(timeframes.currentMonth.start).toLocaleDateString('en-GB', {day:'numeric', month:'short'})} - ${new Date(timeframes.currentMonth.end).toLocaleDateString('en-GB', {day:'numeric', month:'short'})}` : undefined}
                leftValue={bvSummary.left.currentMonth} 
                rightValue={bvSummary.right.currentMonth} 
              />
              <BvRow 
                label="Half-Yearly" 
                period={timeframes.halfYearly ? `${new Date(timeframes.halfYearly.start).toLocaleDateString('en-GB', {month:'short', year:'2-digit'})} - ${new Date(timeframes.halfYearly.end).toLocaleDateString('en-GB', {month:'short', year:'2-digit'})}` : undefined}
                leftValue={bvSummary.left.halfYearly} 
                rightValue={bvSummary.right.halfYearly} 
              />
              <BvRow 
                label="Annually" 
                period={timeframes.annually ? `${new Date(timeframes.annually.start).getFullYear()} - ${new Date(timeframes.annually.end).getFullYear()}` : undefined}
                leftValue={bvSummary.left.annually} 
                rightValue={bvSummary.right.annually} 
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreeBVSummaryCard;
