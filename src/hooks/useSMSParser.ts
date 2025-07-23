import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SMSTransaction {
  amount: number;
  merchant: string;
  upiId?: string;
  date: Date;
  type: 'debit' | 'credit';
  bankName: string;
  balance?: number;
}

interface SMSParseResult {
  parsed: number;
  failed: number;
  transactions: SMSTransaction[];
}

export const useSMSParser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const { toast } = useToast();

  // Enhanced SMS patterns for different banks and UPI apps with better regex
  const smsPatterns = {
    // HDFC Bank patterns
    hdfc: [
      /INR\s*([\d,]+\.?\d*)\s*(?:has\s*been\s*)?(debited|credited)\s*(?:from|to).*?(?:UPI[\/:]?|towards\s+UPI[\/:]?)\s*([\w@.-]*)/i,
      /Rs\.?\s*([\d,]+\.?\d*)\s*(?:has\s*been\s*)?(debited|credited).*?(?:UPI|towards).*?([\w@.-]*)/i
    ],
    
    // SBI Bank patterns
    sbi: [
      /Rs\.?\s*([\d,]+\.?\d*)\s*(debited|credited).*?UPI.*?(?:to|from)\s*([\w\s@.-]*)/i,
      /₹\s*([\d,]+\.?\d*)\s*(?:has\s*been\s*)?(debited|credited).*?UPI.*?([\w@.-]*)/i
    ],
    
    // ICICI Bank patterns
    icici: [
      /Rs\.?\s*([\d,]+\.?\d*)\s*(debited|credited).*?UPI.*?([\w@.-]*)/i,
      /INR\s*([\d,]+\.?\d*)\s*(debited|credited).*?UPI.*?([\w@.-]*)/i
    ],
    
    // Axis Bank patterns
    axis: [
      /Rs\.?\s*([\d,]+\.?\d*)\s*(?:has\s*been\s*)?(debited|credited).*?UPI.*?([\w@.-]*)/i
    ],
    
    // Google Pay patterns
    gpay: [
      /You\s*(paid|received)\s*₹([\d,]+\.?\d*)\s*(?:to|from)\s*(.*?)\s*(?:using\s*UPI|via\s*UPI)/i,
      /₹([\d,]+\.?\d*)\s*(?:paid|received).*?(?:to|from)\s*(.*?)\s*.*?Google\s*Pay/i
    ],
    
    // PhonePe patterns
    phonepe: [
      /₹([\d,]+\.?\d*)\s*(paid|received).*?(?:to|from)\s*(.*?)\s*(?:via\s*PhonePe|using\s*PhonePe)/i,
      /You\s*(paid|received)\s*₹([\d,]+\.?\d*)\s*(?:to|from)\s*(.*?)\s*.*?PhonePe/i
    ],
    
    // Paytm patterns
    paytm: [
      /₹([\d,]+\.?\d*)\s*(paid|sent|received).*?(?:to|from)\s*(.*?)\s*(?:via\s*Paytm|using\s*Paytm)/i,
      /You\s*(paid|received)\s*₹([\d,]+\.?\d*)\s*(?:to|from)\s*(.*?)\s*.*?Paytm/i
    ],
    
    // BHIM UPI patterns
    bhim: [
      /₹([\d,]+\.?\d*)\s*(paid|received).*?(?:to|from)\s*(.*?)\s*.*?BHIM/i
    ],
    
    // Generic UPI patterns (fallback)
    generic: [
      /(?:₹|Rs\.?|INR)\s*([\d,]+\.?\d*)\s*.*?(debit|credit|paid|received).*?UPI.*?([\w@.-]*)/i,
      /UPI.*?(?:₹|Rs\.?|INR)\s*([\d,]+\.?\d*)\s*.*?(debit|credit|paid|received).*?([\w@.-]*)/i
    ]
  };

  const checkSMSPermission = useCallback(async () => {
    try {
      // Check if running on mobile (Capacitor)
      if ((window as any).Capacitor) {
        // On mobile, assume permission needs to be granted manually
        setHasPermission(false);
        return false;
      } else {
        // For web/PWA, simulate permission check
        setHasPermission(true);
        return true;
      }
    } catch (error) {
      console.error('Error checking SMS permission:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  const requestSMSPermission = useCallback(async () => {
    try {
      // Check if running on mobile (Capacitor)
      if ((window as any).Capacitor) {
        toast({
          title: "SMS Permission Required",
          description: "Please enable SMS permission manually in your Android device settings under App Permissions > SMS",
          variant: "destructive",
        });
        
        // For now, simulate permission granted for demo
        setHasPermission(true);
        
        toast({
          title: "SMS Permission Setup",
          description: "Manual SMS permission setup required on mobile devices",
        });
        
        return true;
      } else {
        // For web/PWA, simulate permission request
        toast({
          title: "SMS Permission (Demo Mode)",
          description: "On Android devices, this would request READ_SMS permission for automatic transaction tracking",
        });
        setHasPermission(true);
        return true;
      }
    } catch (error) {
      console.error('Error requesting SMS permission:', error);
      toast({
        title: "Permission Error",
        description: "Failed to request SMS permission. Please enable manually in device settings.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const parseSMSMessage = useCallback((message: string, sender: string): SMSTransaction | null => {
    const cleanMessage = message.replace(/\s+/g, ' ').trim();
    
    // Try each bank's patterns
    for (const [bankName, patterns] of Object.entries(smsPatterns)) {
      for (const pattern of patterns) {
        const match = cleanMessage.match(pattern);
        if (match) {
          // Extract amount (first capture group for most patterns)
          let amount = 0;
          let type: 'debit' | 'credit' = 'debit';
          let merchant = 'Unknown';
          
          // Handle different pattern structures
          if (bankName === 'gpay' || bankName === 'phonepe' || bankName === 'paytm' || bankName === 'bhim') {
            // For UPI apps: ₹amount action merchant
            amount = parseFloat(match[2]?.replace(/,/g, '') || match[1]?.replace(/,/g, ''));
            type = match[1]?.toLowerCase().includes('paid') || match[2]?.toLowerCase().includes('paid') ? 'debit' : 'credit';
            merchant = match[3] || 'Unknown';
          } else {
            // For banks: amount action UPI/merchant
            amount = parseFloat(match[1].replace(/,/g, ''));
            type = match[2].toLowerCase().includes('debit') || match[2].toLowerCase().includes('paid') ? 'debit' : 'credit';
            merchant = match[3] || 'Unknown';
          }
          
          // Clean merchant name
          merchant = merchant.trim()
            .replace(/^(to|from)\s+/i, '')
            .replace(/\s*(using|via|UPI|-).*$/i, '')
            .trim();
          
          if (amount > 0) {
            return {
              amount,
              merchant,
              date: new Date(),
              type,
              bankName: bankName.toUpperCase(),
              upiId: match[3]?.includes('@') ? match[3] : undefined
            };
          }
        }
      }
    }
    
    return null;
  }, []);

  const parseStoredSMS = useCallback(async (): Promise<SMSParseResult> => {
    setIsLoading(true);
    
    try {
      // For web/PWA, we'll simulate SMS parsing with demo data
      // In actual mobile app, you'd read SMS messages using Capacitor SMS plugin
      
      const demoSMSMessages = [
        {
          body: "INR 250.00 has been debited from your A/c XXXX1234 on 21-Jul-25 towards UPI/merchant@okaxis. Bal: INR 5,320.00",
          sender: "HDFC"
        },
        {
          body: "You paid ₹200 to Swiggy using UPI. UPI Ref no 2525XXXX. - Google Pay",
          sender: "GPAY"
        },
        {
          body: "₹150 paid to Zomato via PhonePe UPI",
          sender: "PHONEPE"
        },
        {
          body: "Rs. 89.00 debited from A/c **1234 on 23-Jul-25 to UPI/zomato@paytm. Available Balance: Rs. 4,567.89",
          sender: "SBI"
        },
        {
          body: "₹300 received from John Doe via Paytm UPI. Ref: PTM123456789",
          sender: "PAYTM"
        },
        {
          body: "ICICI Bank: Rs 125.50 debited for UPI/swiggy@icici on 23-Jul-25. Available Bal: Rs 2,345.67",
          sender: "ICICI"
        }
      ];

      const transactions: SMSTransaction[] = [];
      let parsed = 0;
      let failed = 0;

      for (const sms of demoSMSMessages) {
        const transaction = parseSMSMessage(sms.body, sms.sender);
        if (transaction) {
          transactions.push(transaction);
          parsed++;
        } else {
          failed++;
        }
      }

      // Save transactions to database
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        for (const transaction of transactions) {
          const { error } = await supabase
            .from('transactions')
            .insert([
              {
                amount: transaction.amount,
                date: transaction.date.toISOString(),
                source: `sms_${transaction.bankName.toLowerCase()}`,
                currency: 'INR',
                user_id: user.id
              }
            ]);

          if (error) {
            console.error('Error saving transaction:', error);
          }
        }
      }


      toast({
        title: "SMS Parsing Complete",
        description: `Parsed ${parsed} transactions, ${failed} failed`,
      });

      return { parsed, failed, transactions };
    } catch (error) {
      console.error('Error parsing SMS:', error);
      toast({
        title: "SMS Parsing Error",
        description: "Failed to parse SMS messages",
        variant: "destructive",
      });
      return { parsed: 0, failed: 0, transactions: [] };
    } finally {
      setIsLoading(false);
    }
  }, [parseSMSMessage, toast]);

  const setupSMSListener = useCallback(async () => {
    // For web/PWA, this is a placeholder
    // In actual mobile app, you'd set up a background service to listen for new SMS
    toast({
      title: "SMS Listener Setup",
      description: "Real-time SMS monitoring would be active on mobile device",
    });
  }, [toast]);

  return {
    isLoading,
    hasPermission,
    checkSMSPermission,
    requestSMSPermission,
    parseStoredSMS,
    setupSMSListener,
    parseSMSMessage
  };
};