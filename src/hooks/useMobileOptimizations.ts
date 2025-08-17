import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface MobileCapabilities {
  isMobile: boolean;
  hasPermissions: boolean;
  canReadSMS: boolean;
  platform: 'ios' | 'android' | 'web';
}

export const useMobileOptimizations = () => {
  const [capabilities, setCapabilities] = useState<MobileCapabilities>({
    isMobile: false,
    hasPermissions: false,
    canReadSMS: false,
    platform: 'web'
  });
  const { toast } = useToast();

  useEffect(() => {
    const initializeMobile = async () => {
      try {
        // Check if we're running in Capacitor
        const isCapacitor = !!(window as any).Capacitor;
        
        if (isCapacitor) {
          const { Capacitor } = await import('@capacitor/core');
          const platform = Capacitor.getPlatform() as 'ios' | 'android';
          
          // Initialize status bar
          if (platform === 'android' || platform === 'ios') {
            try {
              const { StatusBar } = await import('@capacitor/status-bar');
              await StatusBar.setStyle({ style: 'DEFAULT' as any });
              
              if (platform === 'android') {
                await StatusBar.setBackgroundColor({ color: '#ffffff' });
              }
            } catch (error) {
              console.warn('StatusBar plugin not available:', error);
            }
          }

          // Initialize keyboard handling
          try {
            const { Keyboard } = await import('@capacitor/keyboard');
            
            // Handle keyboard events
            Keyboard.addListener('keyboardWillShow', () => {
              document.body.classList.add('keyboard-open');
            });

            Keyboard.addListener('keyboardWillHide', () => {
              document.body.classList.remove('keyboard-open');
            });
          } catch (error) {
            console.warn('Keyboard plugin not available:', error);
          }

          setCapabilities({
            isMobile: true,
            hasPermissions: false, // Will be checked separately
            canReadSMS: platform === 'android',
            platform
          });

          // Remove toast on initialization to prevent crashes
          console.log(`Mobile mode detected: ${platform}`);
        } else {
          // Web mode
          setCapabilities({
            isMobile: false,
            hasPermissions: true, // Simulated for web
            canReadSMS: false,
            platform: 'web'
          });
        }
      } catch (error) {
        console.error('Error initializing mobile capabilities:', error);
      }
    };

    initializeMobile();
  }, []); // Remove toast dependency to prevent re-initialization

  const requestNotificationPermission = async () => {
    try {
      if (capabilities.isMobile && (window as any).Capacitor) {
        // Request notification permission for transaction alerts
        toast({
          title: "Notification Permission",
          description: "Enable notifications to get alerts for new transactions",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const optimizeForMobile = () => {
    if (capabilities.isMobile) {
      // Add mobile-specific CSS classes
      document.body.classList.add('mobile-app');
      
      // Disable text selection for better mobile UX
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      
      // Disable zoom
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
      }
    }
  };

  useEffect(() => {
    optimizeForMobile();
  }, [capabilities.isMobile]);

  return {
    capabilities,
    requestNotificationPermission,
    isMobile: capabilities.isMobile,
    platform: capabilities.platform,
    canReadSMS: capabilities.canReadSMS
  };
};