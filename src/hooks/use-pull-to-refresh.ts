import { useState, useEffect } from 'react';

export const usePullToRefresh = () => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [pullState, setPullState] = useState<'idle' | 'pulling' | 'ready' | 'refreshing'>('idle');

  const threshold = 100; // Distance in pixels to trigger refresh
  const maxPull = 150; // Max pull distance for elastic effect

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStartY(e.touches[0].clientY);
      setPullState('pulling');
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      const touchY = e.touches[0].clientY;
      const distance = touchY - touchStartY;
      if (distance > 0) {
        // Apply elastic resistance: reduce distance as it approaches maxPull
        const dampedDistance = Math.min(distance, maxPull) * (1 - Math.min(distance, maxPull) / (maxPull * 2));
        setPullDistance(dampedDistance);
        setPullState(dampedDistance > threshold ? 'ready' : 'pulling');
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > threshold) {
      setIsPulling(true);
      setPullState('refreshing');
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50); // Short vibration
      }
    }
    setPullDistance(0);
    setPullState('idle');
  };

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStartY, pullDistance]);

  useEffect(() => {
    if (isPulling) {
      const timer = setTimeout(() => {
        setIsPulling(false);
        setPullState('idle');
      }, 1500); // Extended duration for animation
      return () => clearTimeout(timer);
    }
  }, [isPulling]);

  return { isPulling, pullDistance, pullState, refresh: () => {
    setIsPulling(true);
    setPullState('refreshing');
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }};
};