import { useState, useMemo } from 'react'
import { format, isToday, isThisWeek, isThisMonth, subMonths, isAfter } from 'date-fns'
import { Calendar, Filter, Plus, Tag, IndianRupee } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useToast } from '@/hooks/use-toast'

type FilterPeriod = 'today' | 'week' | 'month' | '3months' | '6months' | 'year' | 'total'

const filterPeriods: { value: FilterPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last month' },
  { value: '3months', label: 'Last 3 months' },
  { value: '6months', label: 'Last 6 months' },
  { value: 'year', label: 'Last year' },
  { value: 'total', label: 'All time' },
]

const categoryColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', 
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#84cc16'
]

export function TransactionHistory() {
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month')
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedColor, setSelectedColor] = useState(categoryColors[0])
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false)
  
  const { transactions, updateTransaction } = useTransactions()
  const { categories, createCategory } = useCategories()
  const { toast } = useToast()

  const filteredTransactions = useMemo(() => {
    const now = new Date()
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date)
      
      switch (filterPeriod) {
        case 'today':
          return isToday(transactionDate)
        case 'week':
          return isThisWeek(transactionDate)
        case 'month':
          return isThisMonth(transactionDate)
        case '3months':
          return isAfter(transactionDate, subMonths(now, 3))
        case '6months':
          return isAfter(transactionDate, subMonths(now, 6))
        case 'year':
          return isAfter(transactionDate, subMonths(now, 12))
        case 'total':
        default:
          return true
      }
    })
  }, [transactions, filterPeriod])

  const uncategorizedTransactions = useMemo(() => {
    return filteredTransactions.filter(t => !t.category_id)
  }, [filteredTransactions])

  const uncategorizedTotal = useMemo(() => {
    return uncategorizedTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
  }, [uncategorizedTransactions])

  const categorizedSummary = useMemo(() => {
    const summary = new Map<string, { category: typeof categories[0], total: number }>()
    
    filteredTransactions
      .filter(t => t.category_id)
      .forEach(transaction => {
        const category = categories.find(c => c.id === transaction.category_id)
        if (category) {
          const existing = summary.get(category.id)
          summary.set(category.id, {
            category,
            total: (existing?.total || 0) + Number(transaction.amount)
          })
        }
      })
    
    return Array.from(summary.values())
  }, [filteredTransactions, categories])

  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, typeof filteredTransactions>()
    
    filteredTransactions.forEach(transaction => {
      const date = format(new Date(transaction.date), 'yyyy-MM-dd')
      const existing = groups.get(date) || []
      groups.set(date, [...existing, transaction])
    })
    
    return Array.from(groups.entries())
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
  }, [filteredTransactions])

  const handleAssignCategory = async (transactionId: string, categoryId: string) => {
    try {
      const { error } = await updateTransaction(transactionId, { category_id: categoryId })
      if (!error) {
        toast({
          title: "Transaction categorized",
          description: "Transaction has been assigned to category",
        })
        setSelectedTransaction(null)
      }
    } catch (error) {
      console.error('Error assigning category:', error)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    
    const { error } = await createCategory(newCategoryName.trim(), selectedColor)
    if (!error) {
      setNewCategoryName('')
      setIsCreateCategoryOpen(false)
    }
  }

  const getTransactionColor = (transaction: any) => {
    if (transaction.category_id) {
      const category = categories.find(c => c.id === transaction.category_id)
      return category?.color || '#94a3b8'
    }
    return '#94a3b8'
  }

  return (
    <div className="space-y-6">
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Transaction History</h2>
        <div className="flex items-center gap-4">
          <Select value={filterPeriod} onValueChange={(value: FilterPeriod) => setFilterPeriod(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filterPeriods.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Uncategorized total */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-medium">Uncategorized Expenses</span>
            </div>
            <div className="flex items-center gap-1 text-2xl font-bold text-destructive">
              <IndianRupee className="h-6 w-6" />
              {uncategorizedTotal.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories summary */}
      {categorizedSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Category Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorizedSummary.map(({ category, total }) => (
                <div key={category.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold">
                    <IndianRupee className="h-4 w-4" />
                    {total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction groups by date */}
      <div className="space-y-4">
        {groupedTransactions.map(([date, dayTransactions]) => (
          <Card key={date}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dayTransactions.map(transaction => {
                  const category = categories.find(c => c.id === transaction.category_id)
                  return (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      style={{ 
                        borderLeft: `4px solid ${getTransactionColor(transaction)}` 
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 font-bold text-lg">
                          <IndianRupee className="h-5 w-5" />
                          {Number(transaction.amount).toFixed(2)}
                        </div>
                        {category && (
                          <Badge 
                            variant="secondary" 
                            style={{ backgroundColor: `${category.color}20`, color: category.color }}
                          >
                            {category.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(transaction.date), 'HH:mm')}
                        </span>
                        {!transaction.category_id && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Tag className="h-4 w-4 mr-1" />
                                Categorize
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign Category</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-2">
                                  {categories.map(category => (
                                    <Button
                                      key={category.id}
                                      variant="outline"
                                      className="justify-start h-auto p-3"
                                      onClick={() => handleAssignCategory(transaction.id, category.id)}
                                    >
                                      <div 
                                        className="w-4 h-4 rounded-full mr-2" 
                                        style={{ backgroundColor: category.color }}
                                      />
                                      {category.name}
                                    </Button>
                                  ))}
                                </div>
                                
                                <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                      <Plus className="h-4 w-4 mr-2" />
                                      Create New Category
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Create New Category</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="category-name">Category Name</Label>
                                        <Input
                                          id="category-name"
                                          value={newCategoryName}
                                          onChange={(e) => setNewCategoryName(e.target.value)}
                                          placeholder="e.g., Food, Travel, Education"
                                        />
                                      </div>
                                      <div>
                                        <Label>Color</Label>
                                        <div className="grid grid-cols-5 gap-2 mt-2">
                                          {categoryColors.map(color => (
                                            <button
                                              key={color}
                                              className={`w-8 h-8 rounded-full border-2 ${
                                                selectedColor === color ? 'border-primary' : 'border-transparent'
                                              }`}
                                              style={{ backgroundColor: color }}
                                              onClick={() => setSelectedColor(color)}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                      <Button onClick={handleCreateCategory} className="w-full">
                                        Create Category
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No transactions found for the selected period.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}