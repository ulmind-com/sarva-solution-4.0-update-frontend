import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cappingData } from '@/data/mockData';
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const CappingReport = () => {
  const currentLimit = 5000;
  const todaysEarnings = 1200;
  const flushedAmount = 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Capping & Limit Report</h1>
        <p className="text-muted-foreground">Track your daily earning limits and capping details</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Limit</p>
                <p className="text-2xl font-bold text-foreground">₹{currentLimit.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-chart-2/10">
                <CheckCircle className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Earnings</p>
                <p className="text-2xl font-bold text-chart-2">₹{todaysEarnings.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Flushed Amount</p>
                <p className="text-2xl font-bold text-destructive">₹{flushedAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capping Table */}
      <Card>
        <CardHeader>
          <CardTitle>Capping Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Sr No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Allowed Limit</TableHead>
                <TableHead className="text-right">Total Earned</TableHead>
                <TableHead className="text-right">Flushed Income</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cappingData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell className="text-right">₹{item.allowedLimit.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-chart-2 font-medium">
                    ₹{item.totalEarned.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.flushedIncome > 0 ? (
                      <span className="text-destructive font-medium">
                        ₹{item.flushedIncome.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">₹0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.description}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CappingReport;
