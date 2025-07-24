import { useState, useMemo, useEffect } from 'react';
import { format, isToday, isThisWeek, isThisMonth, subMonths, isAfter } from 'date-fns';
import { Calendar, Filter, Plus, Tag, IndianRupee, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';

type FilterPeriod = 'today' | 'week' | 'month' | '3months' | '6months' | 'year' | 'total';

const filterPeriods: { value: FilterPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last month' },
  { value: '3months', label: 'Last 3 months' },
  { value: '6months', label: 'Last 6 months' },
  { value: 'year', label: 'Last year' },
  { value: 'total', label: 'All time' },
];

const categoryColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#84cc16'
];

export function TransactionHistory() {
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(categoryColors[0]);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const { transactions, updateTransaction } = useTransactions();
  const { categories, createCategory } = useCategories();
  const { toast } = useToast();
  const { isPulling, pullDistance, pullState, refresh } = usePullToRefresh();

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      switch (filterPeriod) {
        case 'today':
          return isToday(transactionDate);
        case 'week':
          return isThisWeek(transactionDate);
        case 'month':
          return isThisMonth(transactionDate);
        case '3months':
          return isAfter(transactionDate, subMonths(now, 3));
        case '6months':
          return isAfter(transactionDate, subMonths(now, 6));
        case 'year':
          return isAfter(transactionDate, subMonths(now, 12));
        case 'total':
        default:
          return true;
      }
    });
  }, [transactions, filterPeriod]);

  const uncategorizedTransactions = useMemo(() => {
    return filteredTransactions.filter(t => !t.category_id);
  }, [filteredTransactions]);

  const uncategorizedTotal = useMemo(() => {
    return uncategorizedTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  }, [uncategorizedTransactions]);

  const totalSpending = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  }, [filteredTransactions]);

  const uncategorizedProgress = useMemo(() => {
    return totalSpending > 0 ? (uncategorizedTotal / totalSpending) * 100 : 0;
  }, [uncategorizedTotal, totalSpending]);

  const categorizedSummary = useMemo(() => {
    const summary = new Map<string, { category: typeof categories[0], total: number }>();
    filteredTransactions
      .filter(t => t.category_id)
      .forEach(transaction => {
        const category = categories.find(c => c.id === transaction.category_id);
        if (category) {
          const existing = summary.get(category.id);
          summary.set(category.id, {
            category,
            total: (existing?.total || 0) + Number(transaction.amount)
          });
        }
      });
    return Array.from(summary.values());
  }, [filteredTransactions, categories]);

  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, typeof filteredTransactions>();
    filteredTransactions.forEach(transaction => {
      const date = format(new Date(transaction.date), 'yyyy-MM-dd');
      const existing = groups.get(date) || [];
      groups.set(date, [...existing, transaction]);
    });
    return Array.from(groups.entries())
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  }, [filteredTransactions]);

  const handleAssignCategory = async (transactionId: string, categoryId: string) => {
    try {
      const { error } = await updateTransaction(transactionId, { category_id: categoryId });
      if (!error) {
        toast({
          title: 'Transaction categorized',
          description: 'Transaction has been assigned to category',
        });
        setSelectedTransaction(null);
      }
    } catch (error) {
      console.error('Error assigning category:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { error } = await createCategory(newCategoryName.trim(), selectedColor);
    if (!error) {
      setNewCategoryName('');
      setIsCreateCategoryOpen(false);
    }
  };

  const getTransactionColor = (transaction: any) => {
    if (transaction.category_id) {
      const category = categories.find(c => c.id === transaction.category_id);
      return category?.color || '#94a3b8';
    }
    return '#94a3b8';
  };

  useEffect(() => {
    if (isPulling) {
      refresh();
    }
  }, [isPulling, refresh]);

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

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Transaction History</h2>
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
        <div className="flex items-center gap-4">
          <Select value={filterPeriod} onValueChange={(value: FilterPeriod) => setFilterPeriod(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filterPeriods.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            disabled={pullState === 'refreshing'}
            className="rounded-full hidden sm:flex"
          >
            <RefreshCw className={`w-5 h-5 ${pullState === 'refreshing' ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Welcome Message */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-sm bg-background/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold text-primary">
                Track Your Spending
              </h2>
              <p className="text-sm text-muted-foreground leading-6">
                Organize your transactions with ease.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Uncategorized Total with Progress */}
        <section>
          <h2 className="text-base font-semibold mb-2">Uncategorized Expenses</h2>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <span className="text-base font-medium">Uncategorized</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.div
                  className="relative w-12 h-12"
                  animate={{ scale: pullState === 'refreshing' ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="3"
                      strokeDasharray={`${uncategorizedProgress}, 100`}
                    />
                  </svg>
                  <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold">
                    {Math.round(uncategorizedProgress)}%
                  </p>
                </motion.div>
                <div className="flex items-center gap-1 text-xl font-bold text-destructive">
                  <IndianRupee className="h-5 w-5" />
                  {uncategorizedTotal.toFixed(2)}
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
              onClick={() => toast({ title: 'Action', description: 'Add Transaction clicked!' })}
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-center space-x-2 h-12 hover:shadow-md transition-shadow"
              onClick={() => setFilterPeriod('total')}
            >
              <Filter className="w-4 h-4" />
              <span>Clear Filters</span>
            </Button>
          </div>
        </section>

        {/* Categories Summary */}
        {categorizedSummary.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-2">Category Summary</h2>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Category Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categorizedSummary.map(({ category, total }, index) => (
                      <motion.div
                        key={category.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:shadow-md transition-shadow"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-1 font-bold">
                          <IndianRupee className="h-4 w-4" />
                          {total.toFixed(2)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </section>
        )}

        {/* Transaction Groups by Date */}
        <section className="space-y-4">
          {groupedTransactions.map(([date, dayTransactions], index) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5" />
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dayTransactions.map(transaction => {
                      const category = categories.find(c => c.id === transaction.category_id);
                      return (
                        <motion.div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                          style={{ borderLeft: `4px solid ${getTransactionColor(transaction)}` }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 font-bold text-lg">
                              <IndianRupee className="h-5 w-5" />
                              {Number(transaction.amount).toFixed(2)}
                            </div>
                            {category && (
                              <Badge
                                variant="secondary"
                                style={{ backgroundColor: `${category.color}20`, color: category.color }}
                              >
                                {category.name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(transaction.date), 'HH:mm')}
                            </span>
                            {!transaction.category_id && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Tag className="h-4 w-4 mr-1" />
                                    Categorize
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Assign Category</DialogTitle>
                                  </DialogHeader>
                                  <motion.div
                                    className="space-y-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <div className="grid grid-cols-1 gap-2">
                                      {categories.map(category => (
                                        <motion.div
                                          key={category.id}
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        >
                                          <Button
                                            variant="outline"
                                            className="justify-start h-auto p-3 w-full"
                                            onClick={() => handleAssignCategory(transaction.id, category.id)}
                                          >
                                            <div
                                              className="w-4 h-4 rounded-full mr-2"
                                              style={{ backgroundColor: category.color }}
                                            />
                                            {category.name}
                                          </Button>
                                        </motion.div>
                                      ))}
                                    </div>
                                    <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full">
                                          <Plus className="h-4 w-4 mr-2" />
                                          Create New Category
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Create New Category</DialogTitle>
                                        </DialogHeader>
                                        <motion.div
                                          className="space-y-4"
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{ duration: 0.3 }}
                                        >
                                          <div>
                                            <Label htmlFor="category-name">Category Name</Label>
                                            <Input
                                              id="category-name"
                                              value={newCategoryName}
                                              onChange={(e) => setNewCategoryName(e.target.value)}
                                              placeholder="e.g., Food, Travel, Education"
                                            />
                                          </div>
                                          <div>
                                            <Label>Color</Label>
                                            <div className="grid grid-cols-5 gap-2 mt-2">
                                              {categoryColors.map(color => (
                                                <motion.button
                                                  key={color}
                                                  className={`w-8 h-8 rounded-full border-2 ${
                                                    selectedColor === color ? 'border-primary' : 'border-transparent'
                                                  }`}
                                                  style={{ backgroundColor: color }}
                                                  onClick={() => setSelectedColor(color)}
                                                  whileHover={{ scale: 1.1 }}
                                                  whileTap={{ scale: 0.9 }}
                                                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                                />
                                              ))}
                                            </div>
                                          </div>
                                          <Button onClick={handleCreateCategory} className="w-full">
                                            Create Category
                                          </Button>
                                        </motion.div>
                                      </DialogContent>
                                    </Dialog>
                                  </motion.div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        {filteredTransactions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-sm">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground leading-6">
                  No transactions found for the selected period.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}