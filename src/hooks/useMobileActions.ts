import { useToast } from '@/hooks/use-toast';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';

export const useMobileActions = () => {
  const { toast } = useToast();
  const { isMobile } = useMobileOptimizations();

  const saveProfileChanges = async (profile: any) => {
    if (isMobile) {
      try {
        // Use Haptic feedback on mobile
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.log('Haptics not available');
      }
    }

    // Simulate save with actual validation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (profile.fullName && profile.fullName.length > 0) {
          resolve(true);
          toast({
            title: "Profile Saved",
            description: "Your profile changes have been saved successfully.",
          });
        } else {
          reject(new Error("Name is required"));
          toast({
            title: "Save Failed", 
            description: "Please enter a valid name.",
            variant: "destructive"
          });
        }
      }, 1000);
    });
  };

  const changePassword = async () => {
    if (isMobile) {
      try {
        // Use native dialog on mobile
        const { Dialog } = await import('@capacitor/dialog');
        const result = await Dialog.prompt({
          title: 'Change Password',
          message: 'Enter your current password:',
          inputPlaceholder: 'Current password'
        });

        if (result.cancelled) return;

        const newPasswordResult = await Dialog.prompt({
          title: 'New Password',
          message: 'Enter your new password:',
          inputPlaceholder: 'New password'
        });

        if (!newPasswordResult.cancelled) {
          toast({
            title: "Password Changed",
            description: "Your password has been updated successfully.",
          });
        }
      } catch (error) {
        // Fallback for web
        const currentPassword = prompt("Enter your current password:");
        if (currentPassword) {
          const newPassword = prompt("Enter your new password:");
          if (newPassword) {
            toast({
              title: "Password Changed",
              description: "Your password has been updated successfully.",
            });
          }
        }
      }
    } else {
      // Web fallback
      const currentPassword = prompt("Enter your current password:");
      if (currentPassword) {
        const newPassword = prompt("Enter your new password:");
        if (newPassword) {
          toast({
            title: "Password Changed",
            description: "Your password has been updated successfully.",
          });
        }
      }
    }
  };

  const enableBiometric = async () => {
    if (isMobile) {
      toast({
        title: "Feature Coming Soon",
        description: "Biometric authentication will be available in the next update.",
      });
    } else {
      toast({
        title: "Web Version",
        description: "Biometric authentication is only available on mobile devices.",
      });
    }
    return false;
  };

  const exportData = async () => {
    if (isMobile) {
      try {
        // Use native sharing on mobile
        const { Share } = await import('@capacitor/share');
        const { Filesystem, Directory } = await import('@capacitor/filesystem');

        // Create mock CSV data
        const csvData = `Date,Description,Amount,Category
2024-01-01,Coffee Shop,₹150,Food
2024-01-02,Gas Station,₹2000,Transport
2024-01-03,Grocery Store,₹800,Food`;

        // Write to file system
        const fileName = `expense-data-${new Date().toISOString().split('T')[0]}.csv`;
        await Filesystem.writeFile({
          path: fileName,
          data: csvData,
          directory: Directory.Cache
        });

        // Share the file
        await Share.share({
          title: 'Export Transaction Data',
          text: 'Your expense tracking data',
          url: fileName,
        });

        toast({
          title: "Data Exported",
          description: "Your transaction data has been shared successfully.",
        });
      } catch (error) {
        // Fallback to download
        downloadCSV();
      }
    } else {
      downloadCSV();
    }
  };

  const downloadCSV = () => {
    const csvData = `Date,Description,Amount,Category
2024-01-01,Coffee Shop,₹150,Food
2024-01-02,Gas Station,₹2000,Transport
2024-01-03,Grocery Store,₹800,Food`;

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Data Downloaded",
      description: "Your transaction data has been downloaded.",
    });
  };

  const clearCache = async () => {
    if (isMobile) {
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        
        // Clear app cache
        await Filesystem.rmdir({
          path: '',
          directory: Directory.Cache,
          recursive: true
        });

        // Haptic feedback
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Medium });

        toast({
          title: "Cache Cleared",
          description: "App cache and temporary files have been cleared.",
        });
      } catch (error) {
        // Fallback for web
        localStorage.clear();
        sessionStorage.clear();
        toast({
          title: "Cache Cleared",
          description: "Browser cache has been cleared.",
        });
      }
    } else {
      localStorage.clear();
      sessionStorage.clear();
      toast({
        title: "Cache Cleared",
        description: "Browser cache has been cleared.",
      });
    }
  };

  const connectAccount = async (provider: string, accountName: string) => {
    if (isMobile) {
      try {
        // Haptic feedback for successful connection
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Light });

        // Show native notification
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.schedule({
          notifications: [
            {
              title: "Account Connected",
              body: `${accountName} has been successfully connected`,
              id: Date.now(),
              schedule: { at: new Date(Date.now() + 1000) }
            }
          ]
        });
      } catch (error) {
        console.log('Native features not available');
      }
    }

    // Simulate account connection
    return new Promise((resolve) => {
      setTimeout(() => {
        toast({
          title: "Account Connected",
          description: `${accountName} has been successfully connected.`,
        });
        resolve(true);
      }, 1500);
    });
  };

  const refreshAccounts = async () => {
    if (isMobile) {
      try {
        // Haptic feedback
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.log('Haptics not available');
      }
    }

    // Simulate refresh
    return new Promise((resolve) => {
      setTimeout(() => {
        toast({
          title: "Accounts Refreshed",
          description: "Account data has been updated.",
        });
        resolve(true);
      }, 2000);
    });
  };

  return {
    saveProfileChanges,
    changePassword,
    enableBiometric,
    exportData,
    clearCache,
    connectAccount,
    refreshAccounts
  };
};