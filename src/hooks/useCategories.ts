import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/integrations/supabase/types'
import { useAuth } from './useAuth'
import { useToast } from '@/hooks/use-toast'

type Category = Tables<'categories'>

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchCategories()
      subscribeToCategories()
    }
  }, [user])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const subscribeToCategories = () => {
    const channel = supabase
      .channel('categories')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCategories(prev => [...prev, payload.new as Category])
          } else if (payload.eventType === 'UPDATE') {
            setCategories(prev => 
              prev.map(c => c.id === payload.new.id ? payload.new as Category : c)
            )
          } else if (payload.eventType === 'DELETE') {
            setCategories(prev => prev.filter(c => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const createCategory = async (name: string, color: string = '#3B82F6') => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            user_id: user?.id,
            name,
            color,
          },
        ])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Category created",
        description: `Category "${name}" has been created`,
      })

      return { data, error: null }
    } catch (error) {
      console.error('Error creating category:', error)
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      })
      return { data: null, error }
    }
  }

  const updateCategory = async (id: string, updates: Partial<Pick<Category, 'name' | 'color'>>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Category updated",
        description: "Category has been updated successfully",
      })

      return { data, error: null }
    } catch (error) {
      console.error('Error updating category:', error)
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      })
      return { data: null, error }
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Category deleted",
        description: "Category has been deleted successfully",
      })

      return { error: null }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      })
      return { error }
    }
  }

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories: fetchCategories,
  }
}