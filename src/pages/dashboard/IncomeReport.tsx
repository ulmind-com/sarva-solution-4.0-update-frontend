import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { incomeData, incomeTypes } from '@/data/mockData';
import { IndianRupee, TrendingUp } from 'lucide-react';

const IncomeReport = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(type || 'retail-profits');

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    navigate(`/dashboard/incomes/${value}`);
  };

  const currentIncomeType = incomeTypes.find(t => t.slug === selectedType);
  const filteredData = incomeData.filter(item => item.type === selectedType);

  const totalIncome = filteredData.reduce((sum, item) => sum + item.netPayable, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Income Reports</h1>
          <p className="text-muted-foreground">View your earnings from various income sources</p>
        </div>

        <div className="w-full md:w-64">
          <Select value={selectedType} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select income type" />
            </SelectTrigger>
            <SelectContent>
              {incomeTypes.map(incomeType => (
                <SelectItem key={incomeType.slug} value={incomeType.slug}>
                  {incomeType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{currentIncomeType?.name || 'Total'} Earnings</p>
              <p className="text-3xl font-bold text-foreground">₹{totalIncome.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-full bg-primary/10">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            {currentIncomeType?.name || 'Income'} Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From User (ID)</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">TDS</TableHead>
                  <TableHead className="text-right">Net Payable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.fromUser}</p>
                        <p className="text-xs text-muted-foreground">{item.fromUserId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Level {item.level}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-chart-2 font-medium">
                      +₹{item.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      -₹{item.tds.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ₹{item.netPayable.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <IndianRupee className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Income Records</h3>
              <p className="text-muted-foreground">
                No {currentIncomeType?.name.toLowerCase() || 'income'} records found yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncomeReport;
