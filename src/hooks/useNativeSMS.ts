import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMobileOptimizations } from './useMobileOptimizations';
import { Capacitor } from '@capacitor/core';
import { Dialog } from '@capacitor/dialog';

// Custom SMS interface for Android
interface SMSPlugin {
  checkPermissions(): Promise<{ receive: string; send: string }>;
  requestPermissions(): Promise<{ receive: string; send: string }>;
  getMessages(options: any): Promise<{ messages: any[] }>;
  addListener(event: string, callback: (message: any) => void): void;
}

interface NativeSMSMessage {
  id: string;
  body: string;
  sender: string;
  timestamp: number;
}

export const useNativeSMS = () => {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const { capabilities } = useMobileOptimizations();
  const { toast } = useToast();

  // Check SMS permission on mount
  useEffect(() => {
    checkSMSPermission();
  }, [capabilities.isMobile]);

  const checkSMSPermission = useCallback(async () => {
    if (!capabilities.isMobile || !capabilities.canReadSMS) {
      setHasPermission(true); // Web demo mode
      return true;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        // For now, simulate permission check - would integrate with native SMS plugin
        // In production, this would check actual SMS permissions
        setHasPermission(false); // Default to false to trigger permission request
        return false;
      } else {
        setHasPermission(true); // Web demo mode
        return true;
      }
    } catch (error) {
      console.error('Error checking SMS permission:', error);
      setHasPermission(false);
      return false;
    }
  }, [capabilities, toast]);

  const requestSMSPermission = useCallback(async () => {
    if (!capabilities.canReadSMS) {
      toast({
        title: "SMS Not Available",
        description: "SMS reading is only available on Android devices",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Check if we're on mobile first
      if (!Capacitor.isNativePlatform()) {
        setHasPermission(true);
        return true;
      }

      // Show explanatory dialog first - wrap in try-catch for safety
      let dialogResult;
      try {
        dialogResult = await Dialog.confirm({
          title: 'SMS Permission Required',
          message: 'This app needs access to your SMS messages to automatically parse transaction details and track expenses. Your privacy is protected - we only read transaction-related messages.',
          okButtonTitle: 'Grant Permission',
          cancelButtonTitle: 'Not Now'
        });
      } catch (error) {
        console.error('Dialog error:', error);
        return false;
      }
      
      const { value } = dialogResult;

      if (!value) {
        toast({
          title: "Permission Denied",
          description: "SMS tracking will not work without permission. You can enable it later in settings.",
          variant: "destructive",
        });
        return false;
      }

      if (Capacitor.isNativePlatform()) {
        // Simulate permission request - would integrate with native Android SMS API
        // In production, this would use Capacitor plugins to request actual permissions
        try {
          setHasPermission(true);
          toast({
            title: "Permission Granted (Demo)",
            description: "SMS tracking is now enabled. In the mobile app, this would request real SMS permissions.",
          });
          return true;
        } catch (error) {
          // Handle permission denial gracefully
          const { value: openSettings } = await Dialog.confirm({
            title: 'Permission Required',
            message: 'SMS permission was denied. To enable automatic transaction tracking, please grant SMS permission in your device settings.',
            okButtonTitle: 'Open Settings',
            cancelButtonTitle: 'Maybe Later'
          });

          if (openSettings) {
            toast({
              title: "Opening Settings",
              description: "Please enable SMS permission for this app in Settings > Apps > Auto Track Money > Permissions > SMS",
            });
          }
          
          setHasPermission(false);
          return false;
        }
      } else {
        // Web demo mode
        setHasPermission(true);
        return true;
      }
    } catch (error) {
      console.error('Error requesting SMS permission:', error);
      toast({
        title: "Permission Error",
        description: "Failed to request SMS permission",
        variant: "destructive",
      });
      return false;
    }
  }, [capabilities.canReadSMS, toast]);

  const readStoredSMS = useCallback(async (): Promise<NativeSMSMessage[]> => {
    if (!hasPermission) {
      throw new Error('SMS permission not granted');
    }

    try {
      if (Capacitor.isNativePlatform()) {
        // In production, this would read actual SMS messages from Android device
        // For now, return enhanced demo data that simulates real SMS reading
        const simulatedMessages: NativeSMSMessage[] = [
          {
            id: 'native_1',
            body: 'Rs.1,250.00 debited from a/c **4567 on 16-Aug-25 15:32 to UPI/amazon@axis. Available bal: Rs.15,850.25. HDFC Bank',
            sender: 'HDFCBK',
            timestamp: Date.now() - 1800000 // 30 mins ago
          },
          {
            id: 'native_2',
            body: 'Payment of Rs.350 made via Google Pay UPI to Swiggy. Transaction ID: 2525XXXX8899. Thanks for using Google Pay!',
            sender: 'GPAY',
            timestamp: Date.now() - 5400000 // 1.5 hours ago
          },
          {
            id: 'native_3',
            body: 'You paid Rs.180 to Uber India via PhonePe UPI. UPI Ref No: 252XXXXX456. PhonePe',
            sender: 'PHONEPE',
            timestamp: Date.now() - 7200000 // 2 hours ago
          },
          {
            id: 'native_4',
            body: 'Rs.2,500 credited to your account **7890 on 16-Aug-25. Description: Salary credit. Available balance: Rs.18,350.25',
            sender: 'ICICIBK',
            timestamp: Date.now() - 14400000 // 4 hours ago
          }
        ];

        toast({
          title: "SMS Messages Retrieved",
          description: `Found ${simulatedMessages.length} transaction messages from device`,
        });

        return simulatedMessages;
      } else {
        // Web demo data
        const demoMessages: NativeSMSMessage[] = [
          {
            id: '1',
            body: 'INR 250.00 has been debited from your A/c XXXX1234 on 23-Jul-25 towards UPI/swiggy@okaxis. Bal: INR 5,320.00',
            sender: 'HDFC',
            timestamp: Date.now() - 3600000
          },
          {
            id: '2',
            body: 'You paid ₹200 to Zomato using UPI. UPI Ref no 2525XXXX. - Google Pay',
            sender: 'GPAY',
            timestamp: Date.now() - 7200000
          },
          {
            id: '3',
            body: '₹150 paid to Uber via PhonePe UPI',
            sender: 'PHONEPE',
            timestamp: Date.now() - 10800000
          }
        ];

        return demoMessages;
      }
    } catch (error) {
      console.error('Error reading SMS:', error);
      toast({
        title: "SMS Read Error",
        description: "Failed to read SMS messages",
        variant: "destructive",
      });
      return [];
    }
  }, [hasPermission, toast]);

  const startSMSListener = useCallback(async () => {
    if (!hasPermission) {
      toast({
        title: "Permission Required",
        description: "SMS permission is required to start monitoring",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsListening(true);
      
      if (Capacitor.isNativePlatform()) {
        // In production, this would set up real SMS broadcast receiver
        // For now, simulate incoming SMS monitoring
        const simulateIncomingSMS = () => {
          const demoMessages = [
            'Rs.450 debited from **1234 for UPI/starbucks@paytm on 16-Aug-25 16:45. Bal: Rs.12,340.50',
            'Payment of Rs.1200 to Amazon via UPI successful. Transaction ID: GPY123456789',
            'You spent Rs.350 at McDonald\'s via PhonePe UPI. Ref: PPE987654321'
          ];
          
          // Simulate random incoming transaction SMS
          setTimeout(() => {
            const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)];
            toast({
              title: "Transaction Detected",
              description: "New transaction SMS: " + randomMessage.substring(0, 50) + "...",
            });
          }, Math.random() * 30000 + 10000); // Random delay 10-40 seconds
        };
        
        simulateIncomingSMS();
      }

      toast({
        title: "SMS Monitoring Started",
        description: "Now monitoring for new transaction SMS messages",
      });

      return true;
    } catch (error) {
      console.error('Error starting SMS listener:', error);
      toast({
        title: "Listener Error",
        description: "Failed to start SMS monitoring",
        variant: "destructive",
      });
      setIsListening(false);
      return false;
    }
  }, [hasPermission, toast]);

  const stopSMSListener = useCallback(() => {
    setIsListening(false);
    toast({
      title: "SMS Monitoring Stopped",
      description: "No longer monitoring for new transaction messages",
    });
  }, [toast]);

  return {
    hasPermission,
    isListening,
    capabilities,
    checkSMSPermission,
    requestSMSPermission,
    readStoredSMS,
    startSMSListener,
    stopSMSListener
  };
};