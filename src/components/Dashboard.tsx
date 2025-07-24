import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  Settings,
  RefreshCw
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRupeeSign } from '@fortawesome/free-solid-svg-icons';
import TransactionImporter from './TransactionImporter';
import { useToast } from '@/hooks/use-toast';

interface DashboardProps {
  onSettingsClick: () => void;
}

const Dashboard = ({ onSettingsClick }: DashboardProps) => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faRupeeSign} className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Today's Spending</p>
                  <p className="text-sm font-bold">₹0.00</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-info" />
                <div>
                  <p className="text-xs text-muted-foreground">This Month</p>
                  <p className="text-sm font-bold">₹0.00</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-warning" />
                <div>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                  <p className="text-sm font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Import Status */}
        <TransactionImporter />

      </div>
    </div>
  );
};

export default Dashboard;