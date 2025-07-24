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
  Calendar,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';

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
  const { isPulling, pullDistance, pullState, refresh } = usePullToRefresh();

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
        break;
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t => 
        (t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        t.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.category?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
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
  const averageTransaction = transactionCount > 0 ? totalAmount / transactionCount : 0;

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

  const pullMessages = {
    idle: '',
    pulling: 'Pull to Refresh',
    ready: 'Release to Refresh',
    refreshing: 'Refreshing...',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Pull-to-Refresh Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-20 flex justify-center items-center bg-gradient-to-r from-primary/80 to-blue-500/80 text-white text-sm font-medium shadow-lg"
        style={{ height: '48px' }}
        initial={{ y: -48 }}
        animate={{ y: pullState === 'idle' ? -48 : Math.min(pullDistance / 2, 48) }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <motion.div
          animate={{ rotate: pullState === 'refreshing' ? 360 : 0 }}
          transition={{ duration: 1, repeat: pullState === 'refreshing' ? Infinity : 0 }}
        >
          <RefreshCw className="w-5 h-5 mr-2" />
        </motion.div>
        {pullMessages[pullState]}
      </motion.div>

      <Navigation />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div>
            <h1 className="text-xl font-bold text-foreground">Transaction History</h1>
            <p className="text-sm text-muted-foreground leading-6">View and manage all your transactions</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            disabled={pullState === 'refreshing'}
            className="rounded-full sm:hidden"
          >
            <RefreshCw className={`w-5 h-5 ${pullState === 'refreshing' ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={exportTransactions}
          className="w-full sm:w-auto"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </header>

      <main className="flex-1 max-w-full md:max-w-4xl mx-auto p-4 space-y-6">
        {/* Welcome Message */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-sm bg-background/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold text-primary">Track Your Spending</h2>
              <p className="text-sm text-muted-foreground leading-6">
                Stay on top of your transactions with ease.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Summary Stats (Single Row) */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-base font-semibold mb-2">Quick Stats</h2>
          <div className="flex overflow-x-auto space-x-3 snap-x snap-mandatory">
            <Card className="shadow-sm min-w-[140px] snap-start hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground leading-5">Total Transactions</p>
                    <p className="text-sm font-bold">{transactionCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm min-w-[140px] snap-start hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <ArrowUp className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="text-xs text-muted-foreground leading-5">Total Amount</p>
                    <p className="text-sm font-bold">₹{totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm min-w-[140px] snap-start hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-info" />
                  <div>
                    <p className="text-xs text-muted-foreground leading-5">Average Transaction</p>
                    <p className="text-sm font-bold">₹{averageTransaction.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Filters */}
        <section>
          <h2 className="text-base font-semibold mb-2">Filters</h2>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Dropdowns in a single row */}
                <div className="flex flex-row gap-3">
                  <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                    <SelectTrigger className="w-40">
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
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="source">Source</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Search bar in the next row */}
                <div className="flex w-full">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-base font-semibold mb-2">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex items-center justify-center space-x-2 h-12 hover:shadow-md transition-shadow"
              onClick={() => alert('Add Transaction clicked!')}
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-center space-x-2 h-12 hover:shadow-md transition-shadow"
              onClick={() => setSearchTerm('')}
            >
              <Filter className="w-4 h-4" />
              <span>Clear Filters</span>
            </Button>
          </div>
        </section>

        {/* Transactions List */}
        <section>
          <h2 className="text-base font-semibold mb-2">Transactions ({transactionCount})</h2>
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                  {filteredAndSortedTransactions.length > 0 ? (
                    filteredAndSortedTransactions.map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
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
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      className="p-8 text-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium mb-2">No transactions found</h3>
                      <p className="text-sm text-muted-foreground leading-6">
                        Try adjusting your filters or search term.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};