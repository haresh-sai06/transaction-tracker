import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Navigation } from '@/components/Navigation'
import { useTransactions } from '@/hooks/useTransactions'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, TrendingDown, Calendar, Target, AlertTriangle } from 'lucide-react'
import { addDays, startOfWeek, startOfMonth, format, subDays, subWeeks, subMonths } from 'date-fns'

export const Trends = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month')
  const { getTransactionsByPeriod } = useTransactions()

  const currentTransactions = getTransactionsByPeriod(selectedPeriod === 'quarter' ? 'year' : selectedPeriod)
  
  // Get previous period data for comparison
  const getPreviousPeriodTransactions = () => {
    const now = new Date()
    let previousStart: Date
    let previousEnd: Date

    switch (selectedPeriod) {
      case 'week':
        previousStart = subWeeks(startOfWeek(now), 1)
        previousEnd = subDays(startOfWeek(now), 1)
        break
      case 'month':
        previousStart = subMonths(startOfMonth(now), 1)
        previousEnd = subDays(startOfMonth(now), 1)
        break
      case 'quarter':
        previousStart = subMonths(now, 3)
        previousEnd = subMonths(now, 0)
        break
    }

    return currentTransactions.filter(t => {
      const date = new Date(t.date)
      return date >= previousStart && date <= previousEnd
    })
  }

  const previousTransactions = getPreviousPeriodTransactions()
  const currentTotal = currentTransactions.reduce((sum, t) => sum + t.amount, 0)
  const previousTotal = previousTransactions.reduce((sum, t) => sum + t.amount, 0)
  const percentageChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0

  // Prepare trend data
  const trendData = currentTransactions.reduce((acc, transaction) => {
    const date = format(new Date(transaction.date), 'MMM dd')
    const existing = acc.find(item => item.date === date)
    if (existing) {
      existing.amount += transaction.amount
      existing.count += 1
    } else {
      acc.push({ 
        date, 
        amount: transaction.amount, 
        count: 1,
        average: transaction.amount 
      })
    }
    return acc
  }, [] as { date: string; amount: number; count: number; average: number }[])

  // Calculate rolling averages
  trendData.forEach((item, index) => {
    if (index >= 6) { // 7-day rolling average
      const recentData = trendData.slice(index - 6, index + 1)
      item.average = recentData.reduce((sum, d) => sum + d.amount, 0) / recentData.length
    }
  })

  // Weekly spending pattern
  const weeklyPattern = currentTransactions.reduce((acc, transaction) => {
    const dayOfWeek = format(new Date(transaction.date), 'EEEE')
    const existing = acc.find(item => item.day === dayOfWeek)
    if (existing) {
      existing.amount += transaction.amount
    } else {
      acc.push({ day: dayOfWeek, amount: transaction.amount })
    }
    return acc
  }, [] as { day: string; amount: number }[])

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const orderedWeeklyPattern = daysOrder.map(day => 
    weeklyPattern.find(p => p.day === day) || { day, amount: 0 }
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  }

  const isIncreasing = percentageChange > 0
  const significantChange = Math.abs(percentageChange) > 10

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Navigation />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 py-6 space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Spending Trends</h1>
            <p className="text-muted-foreground">Analyze your spending patterns and forecasts</p>
          </div>
          
          <Select value={selectedPeriod} onValueChange={(value: 'week' | 'month' | 'quarter') => setSelectedPeriod(value)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Trend Summary */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Period</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${currentTotal.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {currentTransactions.length} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Change</CardTitle>
              {isIncreasing ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isIncreasing ? 'text-red-500' : 'text-green-500'}`}>
                {isIncreasing ? '+' : ''}{percentageChange.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                vs previous {selectedPeriod}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(currentTotal / Math.max(trendData.length, 1)).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per active day
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forecast</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${significantChange ? 'text-orange-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(currentTotal * 1.1).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Next {selectedPeriod} estimate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trend Alert */}
        {significantChange && (
          <motion.div variants={itemVariants}>
            <Card className={`border-${isIncreasing ? 'red' : 'green'}-200 bg-${isIncreasing ? 'red' : 'green'}-50/50`}>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className={`h-5 w-5 ${isIncreasing ? 'text-red-500' : 'text-green-500'} flex-shrink-0 mt-0.5`} />
                  <div>
                    <h3 className="font-medium mb-1">
                      {isIncreasing ? 'Spending Increase Detected' : 'Spending Decrease Detected'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your spending has {isIncreasing ? 'increased' : 'decreased'} by {Math.abs(percentageChange).toFixed(1)}% 
                      compared to last {selectedPeriod}. 
                      {isIncreasing 
                        ? ' Consider reviewing your recent transactions to identify any unusual patterns.'
                        : ' Great job on reducing your expenses!'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending Trend */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Spending Trend</CardTitle>
                <CardDescription>Daily spending with 7-day moving average</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'amount' ? `$${value}` : `$${Number(value).toFixed(2)}`,
                          name === 'amount' ? 'Daily Spending' : '7-Day Average'
                        ]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stackId="1"
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="average" 
                        stackId="2"
                        stroke="hsl(var(--secondary))" 
                        fill="hsl(var(--secondary))"
                        fillOpacity={0.1}
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Weekly Pattern */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Weekly Pattern</CardTitle>
                <CardDescription>Average spending by day of the week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orderedWeeklyPattern}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="day" 
                        className="text-xs"
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        formatter={(value) => [`$${value}`, 'Amount']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Insights */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Spending Insights</CardTitle>
              <CardDescription>AI-powered insights from your spending patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">🔍 Pattern Detection</h4>
                  <p className="text-sm text-muted-foreground">
                    Your highest spending day is typically{' '}
                    <span className="font-medium text-foreground">
                      {orderedWeeklyPattern.reduce((max, current) => 
                        current.amount > max.amount ? current : max
                      ).day}
                    </span>
                    {' '}with an average of $
                    {Math.max(...orderedWeeklyPattern.map(p => p.amount)).toFixed(2)} per transaction.
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">📊 Trend Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    {isIncreasing 
                      ? `Your spending has increased by ${percentageChange.toFixed(1)}% this ${selectedPeriod}. Consider setting a spending limit to stay on track.`
                      : `Great news! Your spending decreased by ${Math.abs(percentageChange).toFixed(1)}% this ${selectedPeriod}. Keep up the good work!`
                    }
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">🎯 Recommendations</h4>
                  <p className="text-sm text-muted-foreground">
                    Based on your patterns, consider setting a daily spending limit of $
                    {(currentTotal / Math.max(trendData.length, 1) * 0.9).toFixed(2)} to reduce monthly expenses by 10%.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}