import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, MessageSquare, Bell, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'granted' | 'denied';
  required: boolean;
}

interface PermissionOnboardingProps {
  onComplete: (hasRequiredPermissions: boolean) => void;
}

export const PermissionOnboarding = ({ onComplete }: PermissionOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'sms',
      name: 'SMS Access',
      description: 'Required to automatically track your transaction messages from banks and UPI apps',
      icon: MessageSquare,
      status: 'pending',
      required: true
    },
    {
      id: 'phone',
      name: 'Phone State',
      description: 'Helps identify device information for better SMS filtering',
      icon: Smartphone,
      status: 'pending',
      required: false
    },
    {
      id: 'notifications',
      name: 'Notifications',
      description: 'Receive alerts about new transactions and spending insights',
      icon: Bell,
      status: 'pending',
      required: false
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeniedWarning, setShowDeniedWarning] = useState(false);

  const { isMobile } = useMobileOptimizations();
  const { toast } = useToast();

  const requestPermission = async (permissionId: string) => {
    setIsProcessing(true);
    
    try {
      if (isMobile && Capacitor.isNativePlatform()) {
        // On mobile, simulate permission request
        // In real implementation, you'd use Capacitor SMS plugin
        const granted = Math.random() > 0.3; // Simulate 70% success rate
        
        setPermissions(prev => prev.map(p => 
          p.id === permissionId 
            ? { ...p, status: granted ? 'granted' : 'denied' }
            : p
        ));

        if (!granted && permissionId === 'sms') {
          setShowDeniedWarning(true);
          return false;
        }

        return granted;
      } else {
        // Web simulation
        setPermissions(prev => prev.map(p => 
          p.id === permissionId 
            ? { ...p, status: 'granted' }
            : p
        ));
        return true;
      }
    } catch (error) {
      console.error('Permission error:', error);
      setPermissions(prev => prev.map(p => 
        p.id === permissionId 
          ? { ...p, status: 'denied' }
          : p
      ));
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = async () => {
    const currentPermission = permissions[currentStep];
    
    if (currentPermission) {
      const granted = await requestPermission(currentPermission.id);
      
      if (!granted && currentPermission.required) {
        // SMS permission denied - show warning
        return;
      }
    }

    if (currentStep < permissions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // All permissions processed
      const smsGranted = permissions.find(p => p.id === 'sms')?.status === 'granted';
      onComplete(smsGranted);
    }
  };

  const handleSkip = () => {
    const currentPermission = permissions[currentStep];
    
    if (currentPermission.required) {
      setShowDeniedWarning(true);
      return;
    }

    setPermissions(prev => prev.map(p => 
      p.id === currentPermission.id 
        ? { ...p, status: 'denied' }
        : p
    ));

    if (currentStep < permissions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const smsGranted = permissions.find(p => p.id === 'sms')?.status === 'granted';
      onComplete(smsGranted);
    }
  };

  const handleCloseApp = () => {
    if (isMobile && Capacitor.isNativePlatform()) {
      App.exitApp();
    } else {
      window.close();
    }
  };

  const currentPermission = permissions[currentStep];
  const IconComponent = currentPermission?.icon;

  if (showDeniedWarning) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              SMS Permission Required
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This app requires SMS access to automatically track your financial transactions. 
              Without this permission, the app cannot function properly.
            </p>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Why SMS Access is Essential:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatically detect bank transaction messages</li>
                <li>• Parse UPI payment confirmations</li>
                <li>• Track spending without manual entry</li>
                <li>• Provide real-time expense insights</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCloseApp}
                variant="destructive"
                className="flex-1"
              >
                Close App
              </Button>
              <Button 
                onClick={() => {
                  setShowDeniedWarning(false);
                  setCurrentStep(0);
                }}
                variant="outline"
                className="flex-1"
              >
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Set Up Permissions
          </CardTitle>
          <CardDescription>
            We need a few permissions to provide the best expense tracking experience
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {permissions.length}</span>
              <span>{Math.round(((currentStep + 1) / permissions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / permissions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Permission Details */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              {IconComponent && <IconComponent className="h-8 w-8 text-primary" />}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-lg font-semibold">{currentPermission?.name}</h3>
                {currentPermission?.required && (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {currentPermission?.description}
              </p>
            </div>
          </div>

          {/* Permission Status Overview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Permissions Overview:</h4>
            <div className="space-y-2">
              {permissions.map((permission, index) => (
                <div key={permission.id} className="flex items-center gap-3 text-sm">
                  <div className={`
                    w-4 h-4 rounded-full flex items-center justify-center
                    ${index < currentStep 
                      ? permission.status === 'granted' 
                        ? 'bg-success text-success-foreground' 
                        : 'bg-destructive text-destructive-foreground'
                      : index === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }
                  `}>
                    {index < currentStep && permission.status === 'granted' && (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                  </div>
                  <span className={index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}>
                    {permission.name}
                  </span>
                  {permission.required && (
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!currentPermission?.required && (
              <Button 
                onClick={handleSkip}
                variant="outline"
                disabled={isProcessing}
                className="flex-1"
              >
                Skip
              </Button>
            )}
            <Button 
              onClick={handleNext}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Grant Permission'}
            </Button>
          </div>

          {/* Privacy Note */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              🔒 Your privacy is protected. We only access transaction-related messages 
              and never store or share personal information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};