import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Navigation } from '@/components/Navigation'
import { useToast } from '@/hooks/use-toast'
import { 
  Bell, 
  Smartphone, 
  Shield, 
  Palette, 
  Download, 
  Trash2,
  Sun,
  Moon,
  Monitor,
  Volume2,
  VolumeX
} from 'lucide-react'

export const Settings = () => {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    notifications: {
      pushEnabled: true,
      emailEnabled: false,
      smsEnabled: false,
      transactionAlerts: true,
      weeklyReports: true,
      spendingLimits: false,
    },
    privacy: {
      analyticsEnabled: true,
      crashReportsEnabled: true,
      locationTracking: false,
      biometricAuth: false,
    },
    app: {
      theme: 'system',
      soundEnabled: true,
      hapticFeedback: true,
      autoSync: true,
      offlineMode: false,
    },
    limits: {
      dailyLimit: 100,
      weeklyLimit: 500,
      monthlyLimit: 2000,
    }
  })

  const handleSaveSettings = () => {
    // Save settings to localStorage or backend
    localStorage.setItem('expense-tracker-settings', JSON.stringify(settings))
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    })
  }

  const handleExportData = () => {
    toast({
      title: "Export started",
      description: "Your data export will be ready shortly.",
    })
  }

  const handleClearCache = () => {
    toast({
      title: "Cache cleared",
      description: "App cache has been cleared successfully.",
    })
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
        type: 'spring' as const,
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
        className="container mx-auto px-4 py-6 space-y-6 max-w-2xl"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Customize your app experience and preferences</p>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>
                Manage how you receive notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Push Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications directly on your device
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.pushEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, pushEnabled: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.emailEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, emailEnabled: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Transaction Alerts</h4>
                  <p className="text-sm text-muted-foreground">
                    Get notified for new transactions
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.transactionAlerts}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, transactionAlerts: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Weekly Reports</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly spending summaries
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.weeklyReports}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, weeklyReports: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* App Preferences */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>App Preferences</span>
              </CardTitle>
              <CardDescription>
                Customize app behavior and appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">Theme</Label>
                <Select 
                  value={settings.app.theme} 
                  onValueChange={(value) => 
                    setSettings(prev => ({
                      ...prev,
                      app: { ...prev.app, theme: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center space-x-2">
                        <Sun className="h-4 w-4" />
                        <span>Light</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center space-x-2">
                        <Moon className="h-4 w-4" />
                        <span>Dark</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center space-x-2">
                        <Monitor className="h-4 w-4" />
                        <span>System</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {settings.app.soundEnabled ? (
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <h4 className="font-medium">Sound Effects</h4>
                    <p className="text-sm text-muted-foreground">
                      Play sounds for app interactions
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.app.soundEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      app: { ...prev.app, soundEnabled: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Haptic Feedback</h4>
                  <p className="text-sm text-muted-foreground">
                    Vibration feedback for interactions
                  </p>
                </div>
                <Switch
                  checked={settings.app.hapticFeedback}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      app: { ...prev.app, hapticFeedback: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Auto Sync</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync transactions
                  </p>
                </div>
                <Switch
                  checked={settings.app.autoSync}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      app: { ...prev.app, autoSync: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Spending Limits */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Spending Limits</CardTitle>
              <CardDescription>
                Set automatic spending limits and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="font-medium">Daily Limit</Label>
                  <span className="text-sm text-muted-foreground">
                    ${settings.limits.dailyLimit}
                  </span>
                </div>
                <Slider
                  value={[settings.limits.dailyLimit]}
                  onValueChange={([value]) => 
                    setSettings(prev => ({
                      ...prev,
                      limits: { ...prev.limits, dailyLimit: value }
                    }))
                  }
                  max={500}
                  step={10}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="font-medium">Weekly Limit</Label>
                  <span className="text-sm text-muted-foreground">
                    ${settings.limits.weeklyLimit}
                  </span>
                </div>
                <Slider
                  value={[settings.limits.weeklyLimit]}
                  onValueChange={([value]) => 
                    setSettings(prev => ({
                      ...prev,
                      limits: { ...prev.limits, weeklyLimit: value }
                    }))
                  }
                  max={2000}
                  step={50}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="font-medium">Monthly Limit</Label>
                  <span className="text-sm text-muted-foreground">
                    ${settings.limits.monthlyLimit}
                  </span>
                </div>
                <Slider
                  value={[settings.limits.monthlyLimit]}
                  onValueChange={([value]) => 
                    setSettings(prev => ({
                      ...prev,
                      limits: { ...prev.limits, monthlyLimit: value }
                    }))
                  }
                  max={10000}
                  step={100}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Privacy & Security */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Privacy & Security</span>
              </CardTitle>
              <CardDescription>
                Control your privacy and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    Help improve the app with usage analytics
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.analyticsEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, analyticsEnabled: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Crash Reports</h4>
                  <p className="text-sm text-muted-foreground">
                    Send crash reports to help fix bugs
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.crashReportsEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, crashReportsEnabled: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Biometric Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Use fingerprint or face ID to unlock
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.biometricAuth}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, biometricAuth: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Management */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Manage your app data and storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <h4 className="font-medium">Export Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Download all your transaction data
                  </p>
                </div>
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <h4 className="font-medium">Clear Cache</h4>
                  <p className="text-sm text-muted-foreground">
                    Clear app cache and temporary files
                  </p>
                </div>
                <Button variant="outline" onClick={handleClearCache}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div variants={itemVariants}>
          <Button onClick={handleSaveSettings} className="w-full" size="lg">
            Save All Settings
          </Button>
        </motion.div>

        {/* App Info */}
        <motion.div variants={itemVariants}>
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">ExpenseTracker v1.0.0</p>
                <p className="text-xs text-muted-foreground">
                  Built with ❤️ for better expense tracking
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

// Label component (if not already defined)
const Label = ({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
    {children}
  </label>
)