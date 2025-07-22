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

  // SMS patterns for different banks and UPI apps
  const smsPatterns = {
    // HDFC Bank pattern
    hdfc: /INR\s*([\d,]+\.?\d*)\s*has\s*been\s*(debited|credited)\s*from.*?UPI[\/:]*([\w@.-]*)/i,
    
    // SBI pattern
    sbi: /Rs\.?\s*([\d,]+\.?\d*)\s*(debited|credited).*?UPI.*?to\s*([\w\s@.-]*)/i,
    
    // ICICI pattern
    icici: /Rs\s*([\d,]+\.?\d*)\s*(debited|credited).*?UPI.*?([\w@.-]*)/i,
    
    // Google Pay pattern
    gpay: /You\s*(paid|received)\s*₹([\d,]+\.?\d*)\s*(?:to|from)\s*(.*?)\s*using\s*UPI/i,
    
    // PhonePe pattern
    phonepe: /₹([\d,]+\.?\d*)\s*(paid|received).*?(?:to|from)\s*(.*?)\s*via\s*PhonePe/i,
    
    // Paytm pattern
    paytm: /₹([\d,]+\.?\d*)\s*(paid|sent|received).*?(?:to|from)\s*(.*?)\s*via\s*Paytm/i,
    
    // Generic UPI pattern
    generic: /(?:₹|Rs\.?|INR)\s*([\d,]+\.?\d*)\s*.*?(debit|credit|paid|received).*?UPI.*?([\w@.-]*)/i
  };

  const checkSMSPermission = useCallback(async () => {
    try {
      // For web/PWA, we'll simulate permission granted
      // In actual mobile app, you'd use Capacitor Permissions plugin
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Error checking SMS permission:', error);
      return false;
    }
  }, []);

  const requestSMSPermission = useCallback(async () => {
    try {
      // For web/PWA, we'll simulate permission request
      // In actual mobile app, you'd request READ_SMS permission
      toast({
        title: "SMS Permission",
        description: "SMS permission would be requested on mobile device",
      });
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Error requesting SMS permission:', error);
      toast({
        title: "Permission Error",
        description: "Failed to request SMS permission",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const parseSMSMessage = useCallback((message: string, sender: string): SMSTransaction | null => {
    const cleanMessage = message.replace(/\s+/g, ' ').trim();
    
    // Try each pattern
    for (const [bankName, pattern] of Object.entries(smsPatterns)) {
      const match = cleanMessage.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        const type = match[2].toLowerCase().includes('debit') || match[2].toLowerCase().includes('paid') ? 'debit' : 'credit';
        const merchant = match[3] || 'Unknown';
        
        return {
          amount,
          merchant: merchant.trim(),
          date: new Date(),
          type,
          bankName: bankName.toUpperCase(),
          upiId: match[3]?.includes('@') ? match[3] : undefined
        };
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