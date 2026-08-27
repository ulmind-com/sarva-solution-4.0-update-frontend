import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ShoppingBag } from 'lucide-react';
import { getAdminPersonalBVSummary } from '@/services/adminService';
import { getUserPersonalBVSummary } from '@/services/userService';

interface PersonalBVSummaryCardProps {
  memberId?: string;
  isAdmin?: boolean;
}

/**
 * ISOLATED FEATURE: shows the personal (own-purchase) BV of the currently viewed
 * tree node, bucketed into Current Month / Half-Yearly / Annual. Sits next to the
 * Tree BV Summary card. Uses its own dedicated endpoints — no existing data flow
 * is affected.
 */
const PersonalBVSummaryCard: React.FC<PersonalBVSummaryCardProps> = ({ memberId, isAdmin = false }) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['personalBvSummary', isAdmin, memberId],
    queryFn: async () => {
      if (isAdmin) {
        if (!memberId) throw new Error('Member ID is required for Admin view');
        return await getAdminPersonalBVSummary(memberId);
      }
      return await getUserPersonalBVSummary(memberId);
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
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="h-14 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data?.data) {
    if (isError && (error as any)?.response?.status === 404) {
      // Stay quiet if this user has no personal BV record.
      return null;
    }
    return (
      <Card className="mb-6 border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-center gap-2 py-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>Failed to load Personal BV Summary. {(error as any)?.message}</p>
        </CardContent>
      </Card>
    );
  }

  const { user, timeframes, personalBV } = data.data;

  const rows = [
    {
      label: 'Current Month',
      value: personalBV.currentMonth,
      period: timeframes.currentMonth
        ? `${new Date(timeframes.currentMonth.start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${new Date(timeframes.currentMonth.end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
        : undefined,
    },
    {
      label: 'Half-Yearly',
      value: personalBV.halfYearly,
      period: timeframes.halfYearly
        ? `${new Date(timeframes.halfYearly.start).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })} - ${new Date(timeframes.halfYearly.end).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}`
        : undefined,
    },
    {
      label: 'Annually',
      value: personalBV.annually,
      period: timeframes.annually
        ? `${new Date(timeframes.annually.start).getFullYear()} - ${new Date(timeframes.annually.end).getFullYear()}`
        : undefined,
    },
  ];

  return (
    <Card className="mb-6 border-border overflow-hidden shadow-sm">
      <CardHeader className="pb-3 bg-muted/30 border-b border-border">
        <div className="flex justify-between items-center max-sm:flex-col max-sm:items-start gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Personal Business Volume (BV)</CardTitle>
            <Badge variant="outline" className="bg-background">
              {user.username} ({user.memberId})
            </Badge>
          </div>
          <div className="flex items-center text-xs text-muted-foreground gap-1 bg-background px-2 py-1 rounded-md border border-border">
            <ShoppingBag className="h-3 w-3" /> Self Purchases
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 p-0 sm:p-4">
        <div className="rounded-md border border-border bg-card divide-y divide-border">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex justify-between items-center py-3 px-3 hover:bg-muted/40 transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{row.label}</span>
                {row.period && <span className="text-[10px] text-muted-foreground">{row.period}</span>}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-base font-bold text-primary">{(row.value || 0).toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground">BV</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalBVSummaryCard;
