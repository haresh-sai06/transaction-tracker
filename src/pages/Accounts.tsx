import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Navigation } from '@/components/Navigation'
import { usePaymentAccounts } from '@/hooks/usePaymentAccounts'
import { Plus, CreditCard, Trash2, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const paymentProviders = [
  { value: 'paypal', label: 'PayPal', icon: '💳' },
  { value: 'venmo', label: 'Venmo', icon: '💰' },
  { value: 'cashapp', label: 'Cash App', icon: '💵' },
  { value: 'googlepay', label: 'Google Pay', icon: '🔄' },
  { value: 'applepay', label: 'Apple Pay', icon: '🍎' },
  { value: 'zelle', label: 'Zelle', icon: '⚡' },
  { value: 'bank', label: 'Bank Account', icon: '🏦' },
]

export const Accounts = () => {
  const { accounts, loading, addAccount, toggleAccount, removeAccount } = usePaymentAccounts()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newAccount, setNewAccount] = useState({
    provider: '',
    accountName: '',
  })

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccount.provider || !newAccount.accountName) return

    const { error } = await addAccount(newAccount.provider, newAccount.accountName)
    if (!error) {
      setNewAccount({ provider: '', accountName: '' })
      setIsDialogOpen(false)
    }
  }

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
            <h1 className="text-3xl font-bold text-foreground">Payment Accounts</h1>
            <p className="text-muted-foreground">Manage your connected payment sources</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Payment Account</DialogTitle>
                <DialogDescription>
                  Add a new payment source to automatically track your expenses
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Payment Provider</Label>
                  <Select value={newAccount.provider} onValueChange={(value) => setNewAccount(prev => ({ ...prev, provider: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentProviders.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          <div className="flex items-center space-x-2">
                            <span>{provider.icon}</span>
                            <span>{provider.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    placeholder="e.g., My PayPal Account"
                    value={newAccount.accountName}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, accountName: e.target.value }))}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Connect Account
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Account Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accounts.length}</div>
              <p className="text-xs text-muted-foreground">Connected payment sources</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accounts.filter(acc => acc.is_active).length}</div>
              <p className="text-xs text-muted-foreground">Currently syncing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accounts.filter(acc => !acc.is_active).length}</div>
              <p className="text-xs text-muted-foreground">Paused or disconnected</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Accounts List */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Manage your payment sources and sync settings</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                      <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No accounts connected</h3>
                  <p className="text-muted-foreground mb-4">Connect your first payment account to start tracking expenses automatically</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {accounts.map((account, index) => {
                    const provider = paymentProviders.find(p => p.value === account.provider)
                    
                    return (
                      <motion.div
                        key={account.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-xl">
                          {provider?.icon || '💳'}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-medium">{account.account_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {provider?.label || account.provider} • 
                            Last sync: {new Date(account.last_sync).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={account.is_active}
                              onCheckedChange={(checked) => toggleAccount(account.id, checked)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {account.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <Button variant="ghost" size="sm">
                            <RefreshCw className="h-4 w-4" />
                          </Button>

                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeAccount(account.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Notice */}
        <motion.div variants={itemVariants}>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Your data is secure</h3>
                  <p className="text-sm text-muted-foreground">
                    We use bank-level encryption to protect your financial information. 
                    Only transaction amounts are stored - no personal payment details are saved.
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