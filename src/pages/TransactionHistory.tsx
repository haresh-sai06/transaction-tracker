import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Download,
  Search,
  ArrowUp,
  ArrowDown,
  CreditCard,
  Filter,
  Calendar
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';

interface Transaction {
  id: string;
  amount: number;
  date: Date;
  source: string;
  category?: string;
  description?: string;
}

export const TransactionHistory = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'source'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mock transaction data with more details
  const allTransactions: Transaction[] = useMemo(() => {
    const transactions: Transaction[] = [];
    const now = new Date();
    const sources = ['HDFC Bank SMS', 'SBI Bank SMS', 'Google Pay SMS', 'PhonePe SMS', 'Paytm SMS', 'ICICI Bank SMS'];
    const categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare'];
    const descriptions = [
      'Swiggy Order', 'Uber Ride', 'Amazon Purchase', 'Movie Tickets', 'Electricity Bill',
      'Medicine', 'Grocery Shopping', 'Cafe Coffee', 'Bus Ticket', 'Online Shopping'
    ];

    // Generate transactions for the last year
    for (let i = 0; i < 500; i++) {
      const daysBack = Math.floor(Math.random() * 365);
      const date = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      
      transactions.push({
        id: `txn-${i}`,
        amount: parseFloat((Math.random() * 1000 + 10).toFixed(2)),
        date,
        source: sources[Math.floor(Math.random() * sources.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)]
      });
    }

    return transactions;
  }, []);

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = allTransactions;

    // Filter by period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (selectedPeriod) {
      case 'today':
        filtered = filtered.filter(t => t.date >= today);
        break;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(t => t.date >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(t => t.date >= monthAgo);
        break;
      case 'year':
        const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(t => t.date >= yearAgo);
        break;
      case 'all':
      default:
        // Show all transactions
        break;
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.amount.toString().includes(searchTerm)
      );
    }

    // Sort transactions
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'source':
          comparison = a.source.localeCompare(b.source);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allTransactions, selectedPeriod, searchTerm, sortBy, sortOrder]);

  const totalAmount = filteredAndSortedTransactions.reduce((sum, t) => sum + t.amount, 0);
  const transactionCount = filteredAndSortedTransactions.length;

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Amount', 'Source', 'Category', 'Description'],
      ...filteredAndSortedTransactions.map(t => [
        t.date.toLocaleDateString(),
        t.amount.toString(),
        t.source,
        t.category || '',
        t.description || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground">View and manage all your transactions</p>
          </div>
          <Button onClick={exportTransactions} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-lg font-bold">{transactionCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ArrowUp className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-bold">₹{totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-info" />
                <div>
                  <p className="text-sm text-muted-foreground">Average Transaction</p>
                  <p className="text-lg font-bold">
                    ₹{transactionCount > 0 ? (totalAmount / transactionCount).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Period Filter */}
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="source">Source</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transactions ({transactionCount})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {filteredAndSortedTransactions.length > 0 ? (
                filteredAndSortedTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                        <ArrowUp className="w-5 h-5 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">₹{transaction.amount.toFixed(2)}</p>
                          {transaction.category && (
                            <Badge variant="outline" className="text-xs">
                              {transaction.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {transaction.description || 'No description'}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                          <span>{transaction.date.toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{transaction.source}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {transaction.date.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No transactions found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or search term.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};