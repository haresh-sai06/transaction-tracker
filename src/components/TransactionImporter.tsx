import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Wifi, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportSource {
  id: string;
  name: string;
  status: 'connected' | 'syncing' | 'error' | 'offline';
  lastSync: Date;
  transactionsFound: number;
}

const TransactionImporter = () => {
  const { toast } = useToast();
  const [sources, setSources] = useState<ImportSource[]>([
    {
      id: 'paypal',
      name: 'PayPal',
      status: 'connected',
      lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      transactionsFound: 3
    },
    {
      id: 'venmo',
      name: 'Venmo SMS',
      status: 'syncing',
      lastSync: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      transactionsFound: 1
    },
    {
      id: 'googlepay',
      name: 'Google Pay',
      status: 'connected',
      lastSync: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      transactionsFound: 0
    },
    {
      id: 'cashapp',
      name: 'Cash App SMS',
      status: 'error',
      lastSync: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      transactionsFound: 0
    }
  ]);

  const [syncProgress, setSyncProgress] = useState(0);

  const getStatusIcon = (status: ImportSource['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'syncing':
        return <Loader2 className="w-4 h-4 text-info animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'offline':
        return <Wifi className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: ImportSource['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-success/10 text-success border-success/20';
      case 'syncing':
        return 'bg-info/10 text-info border-info/20';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'offline':
        return 'bg-muted text-muted-foreground';
    }
  };

  const syncSource = async (sourceId: string) => {
    setSources(prev => 
      prev.map(source => 
        source.id === sourceId 
          ? { ...source, status: 'syncing' as const }
          : source
      )
    );

    // Simulate sync process
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 300);

    await new Promise(resolve => setTimeout(resolve, 1500));

    setSources(prev => 
      prev.map(source => 
        source.id === sourceId 
          ? { 
              ...source, 
              status: 'connected' as const,
              lastSync: new Date(),
              transactionsFound: Math.floor(Math.random() * 5)
            }
          : source
      )
    );

    toast({
      title: 'Sync Complete',
      description: `Successfully synced with ${sources.find(s => s.id === sourceId)?.name}`,
    });
  };

  const syncAll = async () => {
    for (const source of sources.filter(s => s.status !== 'syncing')) {
      await syncSource(source.id);
      // Small delay between syncs
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Transaction Import</CardTitle>
            <Button onClick={syncAll} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sources.map((source) => (
            <div key={source.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">{source.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Last sync: {source.lastSync.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getStatusColor(source.status)}>
                    {getStatusIcon(source.status)}
                    <span className="ml-1 capitalize">{source.status}</span>
                  </Badge>
                  
                  {source.status !== 'syncing' && (
                    <Button 
                      onClick={() => syncSource(source.id)}
                      variant="ghost" 
                      size="sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {source.status === 'syncing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing transactions...</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <Progress value={syncProgress} className="h-2" />
                </div>
              )}

              {source.transactionsFound > 0 && source.status === 'connected' && (
                <div className="text-sm text-muted-foreground">
                  Found {source.transactionsFound} new transaction{source.transactionsFound !== 1 ? 's' : ''}
                </div>
              )}

              {source.status === 'error' && (
                <div className="text-sm text-destructive">
                  Failed to sync. Check your connection and try again.
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-2 border-warning/20 bg-warning/5">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Smartphone className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <h3 className="font-medium text-warning">SMS Permission Required</h3>
              <p className="text-sm text-muted-foreground mt-1">
                For Android devices, grant SMS permission to automatically parse transaction notifications from your payment apps.
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                Grant Permission
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionImporter;