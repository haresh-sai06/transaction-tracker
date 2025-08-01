import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/hooks/useTransactions';
import { Navigation } from '@/components/Navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Download, RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';

export const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { getTransactionsByPeriod } = useTransactions();
  const { isPulling, pullDistance, pullState, refresh } = usePullToRefresh(); // Added pull-to-refresh hook
  const maxPull = 150;

  const transactions = getTransactionsByPeriod(selectedPeriod);
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const averageTransaction = totalAmount / (transactions.length || 1);

  const dailyData = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.amount += transaction.amount;
    } else {
      acc.push({ date, amount: transaction.amount });
    }
    return acc;
  }, [] as { date: string; amount: number }[]);

  const sourceData = transactions.reduce((acc, transaction) => {
    const existing = acc.find(item => item.source === transaction.source);
    if (existing) {
      existing.amount += transaction.amount;
    } else {
      acc.push({ source: transaction.source, amount: transaction.amount });
    }
    return acc;
  }, [] as { source: string; amount: number }[]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
      },
    },
  };

  const pullMessages = {
    idle: '',
    pulling: 'Pull to Refresh',
    ready: 'Release to Refresh',
    refreshing: 'Refreshing...',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Added Pull-to-Refresh Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-20 flex justify-center items-center bg-gradient-to-r from-primary/80 to-blue-500/80 text-white text-sm font-medium shadow-lg"
        style={{ height: pullDistance > 0 ? `${Math.min(pullDistance, maxPull)}px` : '48px' }}
        initial={{ y: -48 }}
        animate={{ y: pullState === 'idle' ? -48 : -pullDistance }}
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

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-3 sm:px-4 py-4 space-y-4" // Optimized spacing: py-4, space-y-4
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"> {/* Optimized gap-3 */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">Deep insights into your spending patterns</p>
          </div>
          
          <div className="flex items-center space-x-2"> {/* Optimized space-x-2 */}
            <Select value={selectedPeriod} onValueChange={(value: 'week' | 'month' | 'year') => setSelectedPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards - Reorganized into 2 rows */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3"> {/* Optimized gap-3, 2x2 layout */}
          <div className="flex flex-col gap-3"> {/* First row */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3"> {/* Optimized p-3 */}
                <div className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +2.1% from last {selectedPeriod}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3"> {/* Optimized p-3 */}
                <div className="text-2xl font-bold">{transactions.length}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingDown className="inline h-3 w-3 mr-1" />
                  -1.2% from last {selectedPeriod}
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col gap-3"> {/* Second row */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3"> {/* Optimized p-3 */}
                <div className="text-2xl font-bold">₹{averageTransaction.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Per transaction
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3"> {/* Optimized p-3 */}
                <div className="text-2xl font-bold">
                  ₹{Math.max(...transactions.map(t => t.amount), 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Single transaction
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Spending Chart */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Daily Spending</CardTitle>
                <CardDescription>Your spending pattern over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        formatter={(value) => [`₹${value}`, 'Amount']}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Source Distribution */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Payment Sources</CardTitle>
                <CardDescription>Breakdown by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {sourceData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`₹${value}`, 'Amount']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Weekly Comparison */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Spending Comparison</CardTitle>
              <CardDescription>Compare your spending across different periods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value) => [`₹${value}`, 'Amount']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};