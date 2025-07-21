import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRazorpaySync = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const syncRazorpayTransactions = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('razorpay-sync', {
        body: { action: 'sync' }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Sync Successful",
        description: `Synced ${data.synced} new transactions from Razorpay`,
      });

      return data;
    } catch (error) {
      console.error('Razorpay sync error:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync Razorpay transactions",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setupRazorpayAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if Razorpay account already exists
      const { data: existingAccount } = await supabase
        .from('payment_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'razorpay')
        .single();

      if (existingAccount) {
        return existingAccount;
      }

      // Create new Razorpay account entry
      const { data, error } = await supabase
        .from('payment_accounts')
        .insert({
          user_id: user.id,
          provider: 'razorpay',
          account_name: 'Razorpay Account',
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Account Added",
        description: "Razorpay account connected successfully",
      });

      return data;
    } catch (error) {
      console.error('Error setting up Razorpay account:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup Razorpay account",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    isLoading,
    syncRazorpayTransactions,
    setupRazorpayAccount,
  };
};