import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AccountLinking from '@/components/AccountLinking';
import Dashboard from '@/components/Dashboard';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useAuth();

  // Check if user has completed setup
  useEffect(() => {
    if (user) {
      const setupComplete = localStorage.getItem(`expense-tracker-setup-complete-${user.id}`);
      setIsSetupComplete(setupComplete === 'true');
    }
  }, [user]);

  const handleSetupComplete = () => {
    if (user) {
      localStorage.setItem(`expense-tracker-setup-complete-${user.id}`, 'true');
      setIsSetupComplete(true);
    }
  };

  const handleShowSettings = () => {
    setShowSettings(true);
  };

  const handleBackToDashboard = () => {
    setShowSettings(false);
  };

  if (showSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <Navigation />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pt-16"
        >
          <AccountLinking onComplete={handleBackToDashboard} />
        </motion.div>
      </div>
    );
  }

  if (!isSetupComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background"
      >
        <AccountLinking onComplete={handleSetupComplete} />
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Navigation />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="pt-16 p-6"
      >
        <div className="space-y-8">
          <Dashboard onSettingsClick={handleShowSettings} />
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
