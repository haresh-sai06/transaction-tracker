import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, CreditCard, Wallet, Check, Shield, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentApp {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  connected: boolean;
  type: 'api' | 'sms';
}

interface AccountLinkingProps {
  onComplete: () => void;
}

const AccountLinking = ({ onComplete }: AccountLinkingProps) => {
  const { toast } = useToast();
  const [paymentApps, setPaymentApps] = useState<PaymentApp[]>([
    { id: 'paypal', name: 'PayPal', icon: Wallet, connected: false, type: 'api' },
    { id: 'venmo', name: 'Venmo', icon: Smartphone, connected: false, type: 'sms' },
    { id: 'googlepay', name: 'Google Pay', icon: CreditCard, connected: false, type: 'sms' },
    { id: 'applepay', name: 'Apple Pay', icon: CreditCard, connected: false, type: 'api' },
    { id: 'cashapp', name: 'Cash App', icon: Wallet, connected: false, type: 'sms' },
  ]);

  const connectApp = async (appId: string) => {
    // Simulate connection process
    const app = paymentApps.find(app => app.id === appId);
    if (!app) return;

    try {
      // Mock connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setPaymentApps(prev => 
        prev.map(app => 
          app.id === appId ? { ...app, connected: true } : app
        )
      );

      toast({
        title: 'Connected Successfully',
        description: `${app.name} has been linked to your account.`,
      });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: `Failed to connect ${app.name}. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const hasConnectedApps = paymentApps.some(app => app.connected);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Connect Your Accounts</h1>
          <p className="text-muted-foreground">
            Link your payment apps to automatically track your expenses
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {paymentApps.map((app) => {
            const IconComponent = app.icon;
            return (
              <Card key={app.id} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{app.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {app.type === 'api' ? 'API Integration' : 'SMS Parsing'}
                        </p>
                      </div>
                    </div>
                    
                    {app.connected ? (
                      <div className="flex items-center space-x-2">
                        <Check className="w-5 h-5 text-success" />
                        <span className="text-sm text-success font-medium">Connected</span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => connectApp(app.id)}
                        variant="outline"
                        size="sm"
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-2 border-info/20 bg-info/5 mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-info" />
              <CardTitle className="text-lg">Security & Privacy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Bank-level encryption for all data</span>
              </li>
              <li className="flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Only transaction amounts are stored</span>
              </li>
              <li className="flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>No merchant or personal details saved</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Button 
          onClick={onComplete}
          className="w-full"
          disabled={!hasConnectedApps}
          size="lg"
        >
          {hasConnectedApps ? 'Continue to Dashboard' : 'Connect at least one account'}
        </Button>
      </div>
    </div>
  );
};

export default AccountLinking;