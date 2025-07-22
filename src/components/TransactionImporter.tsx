import { useState, useEffect } from 'react';
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
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSMSParser } from '@/hooks/useSMSParser';

interface ImportSource {
  id: string;
  name: string;
  status: 'connected' | 'syncing' | 'error' | 'offline' | 'permission_needed';
  lastSync: Date;
  transactionsFound: number;
  description: string;
}

const TransactionImporter = () => {
  const { toast } = useToast();
  const { 
    isLoading: smsLoading, 
    hasPermission, 
    checkSMSPermission, 
    requestSMSPermission, 
    parseStoredSMS, 
    setupSMSListener 
  } = useSMSParser();
  
  const [sources, setSources] = useState<ImportSource[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    const initializeSources = async () => {
      await checkSMSPermission();
      
      const initialSources: ImportSource[] = [
        {
          id: 'hdfc_sms',
          name: 'HDFC Bank SMS',
          status: hasPermission ? 'connected' : 'permission_needed',
          lastSync: new Date(Date.now() - 30 * 60 * 1000),
          transactionsFound: 0,
          description: 'Parse UPI transactions from HDFC Bank SMS alerts'
        },
        {
          id: 'sbi_sms',
          name: 'SBI Bank SMS',
          status: hasPermission ? 'connected' : 'permission_needed',
          lastSync: new Date(Date.now() - 45 * 60 * 1000),
          transactionsFound: 0,
          description: 'Parse UPI transactions from SBI Bank SMS alerts'
        },
        {
          id: 'icici_sms',
          name: 'ICICI Bank SMS',
          status: hasPermission ? 'connected' : 'permission_needed',
          lastSync: new Date(Date.now() - 20 * 60 * 1000),
          transactionsFound: 0,
          description: 'Parse UPI transactions from ICICI Bank SMS alerts'
        },
        {
          id: 'gpay_sms',
          name: 'Google Pay SMS',
          status: hasPermission ? 'connected' : 'permission_needed',
          lastSync: new Date(Date.now() - 15 * 60 * 1000),
          transactionsFound: 0,
          description: 'Parse UPI transactions from Google Pay SMS notifications'
        },
        {
          id: 'phonepe_sms',
          name: 'PhonePe SMS',
          status: hasPermission ? 'connected' : 'permission_needed',
          lastSync: new Date(Date.now() - 25 * 60 * 1000),
          transactionsFound: 0,
          description: 'Parse UPI transactions from PhonePe SMS notifications'
        },
        {
          id: 'paytm_sms',
          name: 'Paytm SMS',
          status: hasPermission ? 'connected' : 'permission_needed',
          lastSync: new Date(Date.now() - 35 * 60 * 1000),
          transactionsFound: 0,
          description: 'Parse UPI transactions from Paytm SMS notifications'
        }
      ];
      
      setSources(initialSources);
    };

    initializeSources();
  }, [checkSMSPermission, hasPermission]);

  const getStatusIcon = (status: ImportSource['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'syncing':
        return <Loader2 className="w-4 h-4 text-info animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'permission_needed':
        return <Smartphone className="w-4 h-4 text-warning" />;
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
      case 'permission_needed':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'offline':
        return 'bg-muted text-muted-foreground';
    }
  };

  const syncSource = async (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;

    // Check if permission is needed
    if (source.status === 'permission_needed') {
      const granted = await requestSMSPermission();
      if (!granted) return;
      
      setSources(prev => 
        prev.map(s => 
          s.id === sourceId 
            ? { ...s, status: 'connected' as const }
            : s
        )
      );
    }

    // Start syncing
    setSources(prev => 
      prev.map(s => 
        s.id === sourceId 
          ? { ...s, status: 'syncing' as const }
          : s
      )
    );

    // Simulate sync progress
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 200);

    try {
      const result = await parseStoredSMS();
      
      setSources(prev => 
        prev.map(s => 
          s.id === sourceId 
            ? { 
                ...s, 
                status: 'connected' as const,
                lastSync: new Date(),
                transactionsFound: result.parsed
              }
            : s
        )
      );
    } catch (error) {
      setSources(prev => 
        prev.map(s => 
          s.id === sourceId 
            ? { ...s, status: 'error' as const }
            : s
        )
      );
    }
  };

  const syncAll = async () => {
    // First request permission if needed
    if (!hasPermission) {
      const granted = await requestSMSPermission();
      if (!granted) return;
    }

    // Then sync all sources
    for (const source of sources.filter(s => s.status !== 'syncing')) {
      await syncSource(source.id);
      // Small delay between syncs
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">SMS Transaction Tracking</CardTitle>
            <Button onClick={syncAll} variant="outline" size="sm" disabled={smsLoading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Parse All SMS
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
                      {source.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
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
                      disabled={smsLoading}
                    >
                      {source.status === 'permission_needed' ? 'Allow SMS' : <RefreshCw className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>

              {source.status === 'syncing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Parsing SMS messages...</span>
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
                  Failed to parse SMS. Check permissions and try again.
                </div>
              )}

              {source.status === 'permission_needed' && (
                <div className="text-sm text-warning">
                  SMS permission required to parse transaction messages.
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-2 border-info/20 bg-info/5">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Smartphone className="w-5 h-5 text-info mt-0.5" />
            <div>
              <h3 className="font-medium text-info">How SMS Parsing Works</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This app automatically parses transaction alerts from banks and UPI apps like HDFC, SBI, ICICI, Google Pay, PhonePe, and Paytm. 
                It extracts amount, merchant, and UPI details from SMS notifications.
              </p>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>✅ Works with all major banks and UPI apps</p>
                <p>✅ No API setup required</p>
                <p>✅ Works offline once SMS is received</p>
                <p>✅ Lightweight and secure</p>
              </div>
              {!hasPermission && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={requestSMSPermission}
                >
                  Grant SMS Permission
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionImporter;