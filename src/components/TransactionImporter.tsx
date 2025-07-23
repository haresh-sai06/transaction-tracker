import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { useSMSParser } from '@/hooks/useSMSParser';
import { useNativeSMS } from '@/hooks/useNativeSMS';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';

interface ImportSource {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync: Date | null;
  transactionCount: number;
  icon: any;
}

const TransactionImporter = () => {
  const { 
    isLoading: smsLoading, 
    hasPermission: smsPermission, 
    requestSMSPermission, 
    parseStoredSMS 
  } = useSMSParser();
  
  const {
    hasPermission: nativePermission,
    isListening,
    capabilities,
    requestSMSPermission: requestNativePermission,
    readStoredSMS,
    startSMSListener
  } = useNativeSMS();
  
  const { isMobile, platform } = useMobileOptimizations();

  const [importSources, setImportSources] = useState<ImportSource[]>([
    {
      id: 'sms',
      name: isMobile ? 'Native SMS Parsing' : 'SMS Parsing (Demo)',
      description: isMobile 
        ? 'Read transaction SMS directly from your device' 
        : 'Demo of SMS transaction parsing',
      status: 'disconnected',
      lastSync: null,
      transactionCount: 0,
      icon: isMobile ? Smartphone : MessageSquare
    }
  ]);

  const [syncProgress, setSyncProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    // Update SMS source status based on permissions
    setImportSources(prev => prev.map(source => {
      if (source.id === 'sms') {
        const hasAnyPermission = isMobile ? nativePermission : smsPermission;
        return {
          ...source,
          status: hasAnyPermission ? 'connected' : 'disconnected',
          name: isMobile ? 'Native SMS Parsing' : 'SMS Parsing (Demo)',
          description: isMobile 
            ? hasAnyPermission 
              ? 'Reading transaction SMS directly from your device'
              : 'Requires SMS permission to read transaction messages'
            : 'Demo of SMS transaction parsing with sample data'
        };
      }
      return source;
    }));
  }, [smsPermission, nativePermission, isMobile]);

  const getStatusIcon = (status: ImportSource['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-info animate-spin" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'disconnected':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Shield className="w-4 h-4 text-muted-foreground" />;
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
      case 'disconnected':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const syncSource = async (sourceId: string) => {
    if (sourceId === 'sms') {
      setSyncProgress(prev => ({ ...prev, [sourceId]: 0 }));
      
      // Update source status to syncing
      setImportSources(prev => prev.map(source => 
        source.id === sourceId ? { ...source, status: 'syncing' } : source
      ));

      try {
        let hasPermission = isMobile ? nativePermission : smsPermission;
        
        if (!hasPermission) {
          // Request permission
          hasPermission = isMobile 
            ? await requestNativePermission()
            : await requestSMSPermission();
          
          if (!hasPermission) {
            setImportSources(prev => prev.map(source => 
              source.id === sourceId ? { ...source, status: 'error' } : source
            ));
            return;
          }
        }

        // Simulate progress
        for (let i = 0; i <= 100; i += 20) {
          setSyncProgress(prev => ({ ...prev, [sourceId]: i }));
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Parse SMS messages
        let result;
        if (isMobile && capabilities.canReadSMS) {
          // Use native SMS reading
          const messages = await readStoredSMS();
          result = { parsed: messages.length };
        } else {
          // Use web SMS parser
          result = await parseStoredSMS();
        }

        // Update source with results
        setImportSources(prev => prev.map(source => 
          source.id === sourceId ? {
            ...source,
            status: 'connected',
            lastSync: new Date(),
            transactionCount: result.parsed
          } : source
        ));

        // Start real-time listening if on mobile
        if (isMobile && capabilities.canReadSMS && !isListening) {
          await startSMSListener();
        }

      } catch (error) {
        console.error('Sync error:', error);
        setImportSources(prev => prev.map(source => 
          source.id === sourceId ? { ...source, status: 'error' } : source
        ));
      } finally {
        setSyncProgress(prev => ({ ...prev, [sourceId]: 100 }));
      }
    }
  };

  const syncAll = async () => {
    for (const source of importSources) {
      if (source.status !== 'syncing') {
        await syncSource(source.id);
        // Small delay between syncs
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Transaction Import
            {isMobile && (
              <Badge variant="outline" className="ml-2">
                {platform.toUpperCase()}
              </Badge>
            )}
          </CardTitle>
          <Button onClick={syncAll} variant="outline" size="sm" disabled={smsLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {importSources.map((source) => {
          const IconComponent = source.icon;
          const progress = syncProgress[source.id] || 0;
          
          return (
            <div key={source.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <IconComponent className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium flex items-center">
                      {source.name}
                      {isListening && source.id === 'sms' && isMobile && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Live Monitoring
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {source.description}
                    </p>
                    {source.lastSync && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last sync: {source.lastSync.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getStatusColor(source.status)}>
                    {getStatusIcon(source.status)}
                    <span className="ml-1 capitalize">
                      {source.status === 'disconnected' ? 'Setup Required' : source.status}
                    </span>
                  </Badge>
                  
                  {source.status !== 'syncing' && (
                    <Button 
                      onClick={() => syncSource(source.id)}
                      variant="ghost" 
                      size="sm"
                      disabled={smsLoading}
                    >
                      {source.status === 'disconnected' 
                        ? isMobile ? 'Enable SMS' : 'Demo Parse'
                        : <RefreshCw className="w-4 h-4" />
                      }
                    </Button>
                  )}
                </div>
              </div>

              {source.status === 'syncing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {isMobile ? 'Reading device SMS...' : 'Parsing demo messages...'}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {source.transactionCount > 0 && source.status === 'connected' && (
                <div className="text-sm text-success">
                  ✅ Found {source.transactionCount} transaction{source.transactionCount !== 1 ? 's' : ''}
                </div>
              )}

              {source.status === 'error' && (
                <div className="text-sm text-destructive">
                  ❌ {isMobile 
                    ? 'Failed to access SMS. Check permissions in device settings.'
                    : 'Error parsing messages. Please try again.'
                  }
                </div>
              )}
            </div>
          );
        })}

        {/* Mobile-specific information */}
        {isMobile && (
          <div className="mt-4 p-4 bg-info/5 border border-info/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <Smartphone className="w-5 h-5 text-info mt-0.5" />
              <div>
                <h3 className="font-medium text-info">Mobile SMS Parsing</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Running on {platform} with native SMS capabilities. The app can read transaction 
                  alerts directly from your device and automatically track expenses.
                </p>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>✅ Real-time transaction monitoring</p>
                  <p>✅ Works with all major banks & UPI apps</p>
                  <p>✅ Automatic categorization</p>
                  <p>✅ Secure local processing</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Web demo information */}
        {!isMobile && (
          <div className="mt-4 p-4 bg-warning/5 border border-warning/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <MessageSquare className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <h3 className="font-medium text-warning">Demo Mode</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You're viewing a demo of SMS parsing. On Android devices, this app can read 
                  real SMS messages to automatically track your UPI transactions.
                </p>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>📱 Export as Android APK for full functionality</p>
                  <p>🔒 Requires SMS permission on mobile</p>
                  <p>⚡ Real-time expense tracking</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionImporter;