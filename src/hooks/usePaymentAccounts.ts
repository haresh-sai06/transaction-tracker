import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useToast } from '@/hooks/use-toast'

type PaymentAccount = {
  id: string
  user_id: string
  provider: string
  account_name: string
  is_active: boolean
  last_sync: string
  created_at: string
  updated_at: string
}

export const usePaymentAccounts = () => {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchAccounts()
    }
  }, [user])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('payment_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
      toast({
        title: "Error",
        description: "Failed to fetch payment accounts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addAccount = async (provider: string, accountName: string) => {
    try {
      const { data, error } = await supabase
        .from('payment_accounts')
        .insert([
          {
            user_id: user?.id,
            provider,
            account_name: accountName,
            is_active: true,
            last_sync: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error

      setAccounts(prev => [data, ...prev])
      toast({
        title: "Account linked",
        description: `${provider} account has been linked successfully`,
      })

      return { data, error: null }
    } catch (error) {
      console.error('Error adding account:', error)
      toast({
        title: "Error",
        description: "Failed to link payment account",
        variant: "destructive",
      })
      return { data: null, error }
    }
  }

  const toggleAccount = async (id: string, isActive: boolean) => {
    try {
      const { data, error } = await supabase
        .from('payment_accounts')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setAccounts(prev => prev.map(acc => acc.id === id ? data : acc))
      toast({
        title: isActive ? "Account activated" : "Account deactivated",
        description: `Account has been ${isActive ? 'activated' : 'deactivated'}`,
      })

      return { data, error: null }
    } catch (error) {
      console.error('Error toggling account:', error)
      toast({
        title: "Error",
        description: "Failed to update account status",
        variant: "destructive",
      })
      return { data: null, error }
    }
  }

  const removeAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_accounts')
        .delete()
        .eq('id', id)

      if (error) throw error

      setAccounts(prev => prev.filter(acc => acc.id !== id))
      toast({
        title: "Account removed",
        description: "Payment account has been unlinked",
      })

      return { error: null }
    } catch (error) {
      console.error('Error removing account:', error)
      toast({
        title: "Error",
        description: "Failed to remove payment account",
        variant: "destructive",
      })
      return { error }
    }
  }

  return {
    accounts,
    loading,
    addAccount,
    toggleAccount,
    removeAccount,
    refreshAccounts: fetchAccounts,
  }
}