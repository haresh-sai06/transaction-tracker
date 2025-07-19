import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useToast } from '@/hooks/use-toast'

interface Transaction {
  id: string
  user_id: string
  amount: number
  currency: string
  date: string
  source: string
  created_at: string
  updated_at: string
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchTransactions()
      subscribeToTransactions()
    }
  }, [user])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const subscribeToTransactions = () => {
    const channel = supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTransactions(prev => [payload.new as Transaction, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setTransactions(prev => 
              prev.map(t => t.id === payload.new.id ? payload.new as Transaction : t)
            )
          } else if (payload.eventType === 'DELETE') {
            setTransactions(prev => prev.filter(t => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const addTransaction = async (amount: number, currency: string = 'USD', source: string = 'manual') => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user?.id,
            amount,
            currency,
            source,
            date: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Transaction added",
        description: `$${amount.toFixed(2)} expense recorded`,
      })

      return { data, error: null }
    } catch (error) {
      console.error('Error adding transaction:', error)
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      })
      return { data: null, error }
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Transaction deleted",
        description: "Transaction has been removed",
      })

      return { error: null }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      })
      return { error }
    }
  }

  const getTransactionsByPeriod = (period: 'today' | 'week' | 'month' | 'year') => {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
    }

    return transactions.filter(t => new Date(t.date) >= startDate)
  }

  return {
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    getTransactionsByPeriod,
    refreshTransactions: fetchTransactions,
  }
}