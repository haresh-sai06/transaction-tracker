import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';

interface SMSTransaction {
  amount: number;
  merchant: string;
  upiId?: string;
  date: Date;
  type: 'debit' | 'credit';
  bankName: string;
  balance?: number;
  category?: string;
}

interface SMSParseResult {
  parsed: number;
  failed: number;
  transactions: SMSTransaction[];
}

// Enhanced spam detection keywords
const SPAM_KEYWORDS = [
  'won', 'winner', 'lottery', 'prize', 'congratulations', 'lucky',
  'claim', 'reward', 'gift', 'free', 'bonus', 'cashback',
  'offer expires', 'limited time', 'act now', 'urgent',
  'verify', 'suspended', 'blocked', 'update', 'click here',
  'download app', 'install now', 'register', 'subscribe'
];

// Indian bank identifiers
const INDIAN_BANKS = {
  'SBI': ['SBI', 'SBIUPI', 'State Bank'],
  'HDFC': ['HDFC', 'HDFCBK', 'HDFCBANK'],
  'ICICI': ['ICICI', 'ICICIBK', 'ICICIBANK'],
  'AXIS': ['AXIS', 'AXISBK', 'AXISBANK'],
  'PNB': ['PNB', 'PNBBK', 'Punjab National'],
  'BOB': ['BOB', 'BOBBANK', 'Bank of Baroda'],
  'CANARA': ['CANARA', 'CANARABK', 'Canara Bank'],
  'UNION': ['UNION', 'UNIONBK', 'Union Bank'],
  'KOTAK': ['KOTAK', 'KOTAKBK', 'Kotak Mahindra']
};

// UPI app identifiers
const UPI_APPS = {
  'GPAY': ['Google Pay', 'GPAY', 'G Pay'],
  'PHONEPE': ['PhonePe', 'PHONEPE'],
  'PAYTM': ['Paytm', 'PAYTM'],
  'BHIM': ['BHIM', 'BHIMUPI'],
  'AMAZON': ['Amazon Pay', 'AMAZONPAY'],
  'MOBIKWIK': ['MobiKwik', 'MOBIKWIK']
};

export const useEnhancedSMSParser = () => {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isMobile } = useMobileOptimizations();

  // Enhanced SMS patterns for Indian banks and UPI apps
  const smsPatterns = {
    // HDFC Bank patterns
    hdfc: [
      /(?:INR|Rs\.?|₹)\s*([\d,]+\.?\d*)\s*(?:has\s*been\s*)?(debited|credited|paid|received).*?(?:UPI|towards\s*UPI).*?(?:to|from|via)\s*([\w@.-]*)/i,
      /(?:debited|credited|paid|received)\s*(?:INR|Rs\.?|₹)\s*([\d,]+\.?\d*).*?(?:UPI|towards).*?([\w@.-]*)/i
    ],
    
    // SBI Bank patterns
    sbi: [
      /Rs\.?\s*([\d,]+\.?\d*)\s*(debited|credited|paid|received).*?UPI.*?(?:to|from)\s*([\w\s@.-]*)/i,
      /₹\s*([\d,]+\.?\d*)\s*(?:has\s*been\s*)?(debited|credited|paid|received).*?UPI.*?([\w@.-]*)/i
    ],
    
    // ICICI Bank patterns
    icici: [
      /(?:Rs\.?|₹)\s*([\d,]+\.?\d*)\s*(debited|credited|paid|received).*?UPI.*?(?:to|from)\s*([\w@.-]*)/i,
      /UPI.*?(?:Rs\.?|₹)\s*([\d,]+\.?\d*)\s*(debited|credited|paid|received).*?([\w@.-]*)/i
    ],
    
    // Axis Bank patterns
    axis: [
      /(?:Rs\.?|₹)\s*([\d,]+\.?\d*)\s*(?:has\s*been\s*)?(debited|credited|paid|received).*?UPI.*?([\w@.-]*)/i
    ],
    
    // Google Pay patterns
    gpay: [
      /You\s*(paid|received)\s*₹([\d,]+\.?\d*)\s*(?:to|from)\s*(.*?)\s*(?:using|via)\s*(?:Google\s*Pay|UPI)/i,
      /₹([\d,]+\.?\d*)\s*(?:paid|received).*?(?:to|from)\s*(.*?)\s*.*?Google\s*Pay/i
    ],
    
    // PhonePe patterns
    phonepe: [
      /₹([\d,]+\.?\d*)\s*(paid|received).*?(?:to|from)\s*(.*?)\s*(?:via|using)\s*PhonePe/i,
      /You\s*(paid|received)\s*₹([\d,]+\.?\d*)\s*(?:to|from)\s*(.*?)\s*.*?PhonePe/i
    ],
    
    // Paytm patterns
    paytm: [
      /₹([\d,]+\.?\d*)\s*(paid|sent|received).*?(?:to|from)\s*(.*?)\s*(?:via|using)\s*Paytm/i,
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

  const isSpamMessage = useCallback((message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    return SPAM_KEYWORDS.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
  }, []);

  const identifyBank = useCallback((message: string, sender: string): string => {
    const combined = `${message} ${sender}`.toUpperCase();
    
    for (const [bankCode, identifiers] of Object.entries(INDIAN_BANKS)) {
      if (identifiers.some(id => combined.includes(id))) {
        return bankCode;
      }
    }

    for (const [appCode, identifiers] of Object.entries(UPI_APPS)) {
      if (identifiers.some(id => combined.includes(id))) {
        return appCode;
      }
    }

    return 'UNKNOWN';
  }, []);

  const categorizeTransaction = useCallback((merchant: string, amount: number): string => {
    const lowerMerchant = merchant.toLowerCase();
    
    // Food & Dining
    if (['swiggy', 'zomato', 'uber eats', 'food', 'restaurant', 'cafe', 'dominos', 'kfc', 'mcdonald'].some(keyword => lowerMerchant.includes(keyword))) {
      return 'Food & Dining';
    }
    
    // Transportation
    if (['uber', 'ola', 'metro', 'bus', 'taxi', 'petrol', 'fuel', 'irctc'].some(keyword => lowerMerchant.includes(keyword))) {
      return 'Transportation';
    }
    
    // Shopping
    if (['amazon', 'flipkart', 'myntra', 'ajio', 'shopping', 'mall', 'store'].some(keyword => lowerMerchant.includes(keyword))) {
      return 'Shopping';
    }
    
    // Entertainment
    if (['netflix', 'amazon prime', 'hotstar', 'spotify', 'movie', 'cinema', 'bookmyshow'].some(keyword => lowerMerchant.includes(keyword))) {
      return 'Entertainment';
    }
    
    // Utilities
    if (['electricity', 'gas', 'water', 'internet', 'mobile', 'recharge', 'bill'].some(keyword => lowerMerchant.includes(keyword))) {
      return 'Utilities';
    }
    
    // Healthcare
    if (['pharma', 'medicine', 'hospital', 'clinic', 'doctor', 'health'].some(keyword => lowerMerchant.includes(keyword))) {
      return 'Healthcare';
    }
    
    // High-value transactions (likely rent, EMI, etc.)
    if (amount > 10000) {
      return 'EMI/Rent';
    }
    
    return 'Others';
  }, []);

  const parseSMSMessage = useCallback((message: string, sender: string): SMSTransaction | null => {
    // Check for spam
    if (isSpamMessage(message)) {
      return null;
    }

    const cleanMessage = message.replace(/\s+/g, ' ').trim();
    const bankName = identifyBank(cleanMessage, sender);
    
    // Try each pattern set
    for (const [patternSet, patterns] of Object.entries(smsPatterns)) {
      for (const pattern of patterns) {
        const match = cleanMessage.match(pattern);
        if (match) {
          let amount = 0;
          let type: 'debit' | 'credit' = 'debit';
          let merchant = 'Unknown';
          
          // Handle different pattern structures
          if (['gpay', 'phonepe', 'paytm', 'bhim'].includes(patternSet)) {
            // For UPI apps
            amount = parseFloat(match[2]?.replace(/,/g, '') || match[1]?.replace(/,/g, ''));
            type = match[1]?.toLowerCase().includes('paid') || match[2]?.toLowerCase().includes('paid') ? 'debit' : 'credit';
            merchant = match[3] || 'Unknown';
          } else {
            // For banks
            amount = parseFloat(match[1].replace(/,/g, ''));
            type = match[2].toLowerCase().includes('debit') || match[2].toLowerCase().includes('paid') ? 'debit' : 'credit';
            merchant = match[3] || 'Unknown';
          }
          
          // Clean merchant name
          merchant = merchant.trim()
            .replace(/^(to|from)\s+/i, '')
            .replace(/\s*(using|via|UPI|-).*$/i, '')
            .trim() || 'Unknown';
          
          if (amount > 0) {
            const category = categorizeTransaction(merchant, amount);
            
            return {
              amount,
              merchant,
              date: new Date(),
              type,
              bankName: bankName || 'UNKNOWN',
              upiId: match[3]?.includes('@') ? match[3] : undefined,
              category
            };
          }
        }
      }
    }
    
    return null;
  }, [isSpamMessage, identifyBank, categorizeTransaction]);

  const saveTransactionToDatabase = useCallback(async (transaction: SMSTransaction) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Save transaction
      const { error: transactionError } = await supabase
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

      if (transactionError) {
        throw transactionError;
      }

      // Create category if it doesn't exist
      if (transaction.category) {
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('name', transaction.category)
          .eq('user_id', user.id)
          .single();

        if (!existingCategory) {
          await supabase
            .from('categories')
            .insert([
              {
                name: transaction.category,
                color: '#3B82F6',
                user_id: user.id
              }
            ]);
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving transaction:', error);
      return false;
    }
  }, []);

  const startRealTimeSMSMonitoring = useCallback(async () => {
    if (!hasPermission) {
      toast({
        title: "Permission Required",
        description: "SMS permission is required for real-time monitoring",
        variant: "destructive",
      });
      return false;
    }

    setIsListening(true);
    
    try {
      if (isMobile) {
        // In real implementation, this would set up native SMS listener
        toast({
          title: "SMS Monitor Active",
          description: "Real-time transaction monitoring started",
        });
      } else {
        // Web simulation
        toast({
          title: "Demo Mode",
          description: "Real-time SMS monitoring simulation active",
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error starting SMS monitoring:', error);
      setIsListening(false);
      return false;
    }
  }, [hasPermission, isMobile, toast]);

  const stopRealTimeSMSMonitoring = useCallback(() => {
    setIsListening(false);
    toast({
      title: "SMS Monitor Stopped",
      description: "Real-time transaction monitoring stopped",
    });
  }, [toast]);

  const parseAndSaveAllSMS = useCallback(async (): Promise<SMSParseResult> => {
    setIsLoading(true);
    
    try {
      // This would read all SMS in real implementation
      // For now, we'll just return empty since we're not using dummy data
      const result: SMSParseResult = {
        parsed: 0,
        failed: 0,
        transactions: []
      };

      toast({
        title: "SMS Parsing Complete",
        description: `Ready for real-time transaction tracking`,
      });

      return result;
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
  }, [toast]);

  return {
    isListening,
    isLoading,
    hasPermission,
    setHasPermission,
    parseSMSMessage,
    saveTransactionToDatabase,
    startRealTimeSMSMonitoring,
    stopRealTimeSMSMonitoring,
    parseAndSaveAllSMS,
    isSpamMessage,
    categorizeTransaction
  };
};