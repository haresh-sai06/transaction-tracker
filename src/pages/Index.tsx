import { useState, useEffect } from 'react';
import AccountLinking from '@/components/AccountLinking';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Check if user has completed setup
  useEffect(() => {
    const setupComplete = localStorage.getItem('expense-tracker-setup-complete');
    setIsSetupComplete(setupComplete === 'true');
  }, []);

  const handleSetupComplete = () => {
    localStorage.setItem('expense-tracker-setup-complete', 'true');
    setIsSetupComplete(true);
  };

  const handleShowSettings = () => {
    setShowSettings(true);
  };

  const handleBackToDashboard = () => {
    setShowSettings(false);
  };

  if (showSettings) {
    return (
      <AccountLinking 
        onComplete={handleBackToDashboard}
      />
    );
  }

  if (!isSetupComplete) {
    return (
      <AccountLinking 
        onComplete={handleSetupComplete}
      />
    );
  }

  return (
    <Dashboard 
      onSettingsClick={handleShowSettings}
    />
  );
};

export default Index;
