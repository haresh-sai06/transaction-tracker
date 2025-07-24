import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Calendar, 
  CreditCard,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Plus,
  BarChart2
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRupeeSign } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';

interface TransactionImporterProps {
  // Add any props if your TransactionImporter expects them
}

const TransactionImporter = () => {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground leading-6 tracking-normal">
          Import your transactions to get started.
        </p>
        <Button variant="outline" size="sm">
          Import Now
        </Button>
      </CardContent>
    </Card>
  );
};

interface DashboardProps {
  onSettingsClick: () => void;
  userName?: string;
}

const Dashboard = ({ onSettingsClick, userName = "User" }: DashboardProps) => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [budgetProgress, setBudgetProgress] = useState(0);
  const { isPulling, pullDistance, pullState, refresh } = usePullToRefresh();

  // Mock budget progress
  useEffect(() => {
    setBudgetProgress(65);
  }, []);

  const refreshTransactions = async () => {
    setIsRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTransactions([
        { id: 1, date: '2025-07-24', amount: '₹500.00', category: 'Food' },
        { id: 2, date: '2025-07-24', amount: '₹1500.00', category: 'Shopping' },
      ]);
      toast({
        title: 'Transactions Updated',
        description: 'Your latest transactions have been fetched.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch transactions.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isPulling) {
      refreshTransactions();
    }
  }, [isPulling]);

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
      <header className="sticky top-0 z-10 bg-background border-b border-border pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">Finance Dashboard</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            refresh();
            onSettingsClick();
          }}
          disabled={isRefreshing || pullState === 'refreshing'}
          className="rounded-full"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing || pullState === 'refreshing' ? 'animate-spin' : ''}`} />
        </Button>
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
                Welcome, {userName}!
              </h2>
              <p className="text-sm text-muted-foreground leading-6">
                Take control of your finances today.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Budget Progress */}
        <section>
          <h2 className="text-base font-semibold mb-2">Monthly Budget</h2>
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground leading-6">
                  Spending Progress
                </p>
                <p className="text-base font-bold">₹1,500 / ₹2,500</p>
              </div>
              <motion.div
                className="relative w-16 h-16"
                animate={{ scale: pullState === 'refreshing' ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              >
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray={`${budgetProgress}, 100`}
                  />
                </svg>
                <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-bold">
                  {budgetProgress}%
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Stats Section */}
        <motion.section
          initial={{ height: 'auto' }}
          animate={{ height: isStatsExpanded ? 'auto' : '56px' }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
          >
            <h2 className="text-base font-semibold">Quick Stats</h2>
            {isStatsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
          <AnimatePresence>
            {isStatsExpanded && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="flex overflow-x-auto space-x-3 mt-2 snap-x snap-mandatory"
              >
                <Card className="shadow-sm min-w-[120px] snap-start hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <FontAwesomeIcon icon={faRupeeSign} className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground leading-5">Today's Spending</p>
                        <p className="text-sm font-bold">₹0.00</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm min-w-[120px] snap-start hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-info" />
                      <div>
                        <p className="text-xs text-muted-foreground leading-5">This Month</p>
                        <p className="text-sm font-bold">₹0.00</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm min-w-[120px] snap-start hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-warning" />
                      <div>
                        <p className="text-xs text-muted-foreground leading-5">Transactions</p>
                        <p className="text-sm font-bold">0</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-base font-semibold mb-2">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex items-center justify-center space-x-2 h-12"
              onClick={() => toast({ title: "Action", description: "Add Transaction clicked!" })}
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-center space-x-2 h-12"
              onClick={() => toast({ title: "Action", description: "View Reports clicked!" })}
            >
              <BarChart2 className="w-4 h-4" />
              <span>View Reports</span>
            </Button>
          </div>
        </section>

        {/* Transaction Importer */}
        <section>
          <h2 className="text-base font-semibold mb-2">Import Transactions</h2>
          <TransactionImporter />
        </section>

        {/* Recent Transactions */}
        <section>
          <h2 className="text-base font-semibold mb-2">Recent Transactions</h2>
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 leading-6">
                No transactions yet. Import or add some to get started!
              </p>
            ) : (
              transactions.map(transaction => (
                <Card key={transaction.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{transaction.category}</p>
                      <p className="text-xs text-muted-foreground leading-5">{transaction.date}</p>
                    </div>
                    <p className="text-sm font-bold">{transaction.amount}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;