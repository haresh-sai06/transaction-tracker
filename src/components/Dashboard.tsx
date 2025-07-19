import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  Settings,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Download
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRupeeSign } from '@fortawesome/free-solid-svg-icons';
import TransactionImporter from './TransactionImporter';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  amount: number;
  date: Date;
  source: string;
}

interface DashboardProps {
  onSettingsClick: () => void;
}

const Dashboard = ({ onSettingsClick }: DashboardProps) => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock transaction data
  const allTransactions: Transaction[] = useMemo(() => {
    const transactions: Transaction[] = [];
    const now = new Date();
    const sources = ['PayPal', 'Venmo', 'Google Pay', 'Cash App', 'Apple Pay'];

    // Generate transactions for the last year
    for (let i = 0; i < 200; i++) {
      const daysBack = Math.floor(Math.random() * 365);
      const date = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      
      transactions.push({
        id: `txn-${i}`,
        amount: parseFloat((Math.random() * 200 + 5).toFixed(2)),
        date,
        source: sources[Math.floor(Math.random() * sources.length)]
      });
    }

    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, []);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (selectedPeriod) {
      case 'today':
        return allTransactions.filter(t => t.date >= today);
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return allTransactions.filter(t => t.date >= weekAgo);
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return allTransactions.filter(t => t.date >= monthAgo);
      case 'year':
        const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        return allTransactions.filter(t => t.date >= yearAgo);
      default:
        return allTransactions;
    }
  }, [allTransactions, selectedPeriod]);

  const totalSpent = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const transactionCount = filteredTransactions.length;
  const averageTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;

  // Chart data
  const chartData = useMemo(() => {
    if (selectedPeriod === 'today') {
      // Hourly data for today
      const hourlyData = Array.from({ length: 24 }, (_, hour) => {
        const hourTransactions = filteredTransactions.filter(t => t.date.getHours() === hour);
        const total = hourTransactions.reduce((sum, t) => sum + t.amount, 0);
        return {
          name: `${hour}:00`,
          amount: total
        };
      });
      return hourlyData.filter(d => d.amount > 0);
    } else if (selectedPeriod === 'week') {
      // Daily data for this week
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days.map((day, index) => {
        const dayTransactions = filteredTransactions.filter(t => t.date.getDay() === index);
        const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
        return { name: day, amount: total };
      });
    } else {
      // Default aggregation
      const grouped = filteredTransactions.reduce((acc, t) => {
        const key = t.date.toISOString().split('T')[0];
        acc[key] = (acc[key] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(grouped)
        .slice(0, 10)
        .map(([date, amount]) => ({
          name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount
        }));
    }
  }, [filteredTransactions, selectedPeriod]);

  const pieData = useMemo(() => {
    const sourceGroups = filteredTransactions.reduce((acc, t) => {
      acc[t.source] = (acc[t.source] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sourceGroups).map(([source, amount]) => ({
      name: source,
      value: amount
    }));
  }, [filteredTransactions]);

  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const refreshTransactions = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    toast({
      title: 'Transactions Updated',
      description: 'Your latest transactions have been fetched.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Expense Tracker</h1>
              <p className="text-sm text-muted-foreground">Track your spending</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={refreshTransactions}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onSettingsClick}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Period Selector */}
        <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faRupeeSign} className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-lg font-bold">₹{totalSpent.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-info" />
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-lg font-bold">{transactionCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Average per Transaction</p>
                <p className="text-lg font-bold">₹{averageTransaction.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Spending Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Source Distribution */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Spending by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-sm">{entry.name}</span>
                    <span className="text-sm font-medium">₹{entry.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction Import Status */}
        <TransactionImporter />

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Transactions</CardTitle>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {filteredTransactions.slice(0, 20).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                      <ArrowUp className="w-4 h-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">₹{transaction.amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.date.toLocaleDateString()} • {transaction.source}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {transaction.date.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {filteredTransactions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No transactions found</h3>
              <p className="text-sm text-muted-foreground">
                No transactions were found for the selected period.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;