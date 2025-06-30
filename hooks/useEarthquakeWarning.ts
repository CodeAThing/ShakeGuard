import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { 
  initializeEarthquakeWarningSystem,
  configurePushNotifications,
  formatArrivalTime,
  getIntensityDescription 
} from '../lib/earthquakeWarning';

interface NotificationData {
  type: string;
  earthquake_id: string;
  distance_km: number;
  arrival_time_seconds: number;
  is_urgent: boolean;
  epicenter: {
    latitude: number;
    longitude: number;
  };
}

interface EarthquakeWarning {
  id: string;
  title: string;
  message: string;
  distance: number;
  arrivalTime: number;
  isUrgent: boolean;
  timestamp: Date;
  epicenter: {
    latitude: number;
    longitude: number;
  };
}

export function useEarthquakeWarning() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [recentWarnings, setRecentWarnings] = useState<EarthquakeWarning[]>([]);
  const [lastWarning, setLastWarning] = useState<EarthquakeWarning | null>(null);

  // Initialize the warning system
  useEffect(() => {
    const initialize = async () => {
      try {
        const success = await initializeEarthquakeWarningSystem();
        setIsInitialized(success);

        if (Platform.OS !== 'web') {
          const notifReady = await configurePushNotifications();
          setNotificationsEnabled(notifReady);
        }
      } catch (error) {
        console.error('Error initializing earthquake warning system:', error);
      }
    };

    initialize();
  }, []);

  // Set up notification listeners
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let notificationListener: any;
    let responseListener: any;

    const setupListeners = async () => {
      // Listen for notifications while app is running
      notificationListener = Notifications.addNotificationReceivedListener(notification => {
        const data = notification.request.content.data as NotificationData;
        
        if (data?.type === 'earthquake_warning') {
          const warning: EarthquakeWarning = {
            id: data.earthquake_id,
            title: notification.request.content.title || 'Earthquake Warning',
            message: notification.request.content.body || 'Earthquake detected',
            distance: data.distance_km,
            arrivalTime: data.arrival_time_seconds,
            isUrgent: data.is_urgent,
            timestamp: new Date(),
            epicenter: data.epicenter,
          };

          setLastWarning(warning);
          setRecentWarnings(prev => [warning, ...prev.slice(0, 9)]); // Keep last 10 warnings
        }
      });

      // Listen for notification responses (when user taps notification)
      responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data as NotificationData;
        
        if (data?.type === 'earthquake_warning') {
          console.log('User tapped earthquake warning notification:', data);
          // Could navigate to map or show detailed warning here
        }
      });
    };

    setupListeners();

    return () => {
      if (notificationListener) {
        Notifications.removeNotificationSubscription(notificationListener);
      }
      if (responseListener) {
        Notifications.removeNotificationSubscription(responseListener);
      }
    };
  }, []);

  const clearWarnings = () => {
    setRecentWarnings([]);
    setLastWarning(null);
  };

  const dismissWarning = (warningId: string) => {
    setRecentWarnings(prev => prev.filter(w => w.id !== warningId));
    if (lastWarning?.id === warningId) {
      setLastWarning(null);
    }
  };

  const getWarningStats = () => {
    const urgentCount = recentWarnings.filter(w => w.isUrgent).length;
    const averageDistance = recentWarnings.length > 0 
      ? recentWarnings.reduce((sum, w) => sum + w.distance, 0) / recentWarnings.length 
      : 0;
    
    return {
      totalWarnings: recentWarnings.length,
      urgentWarnings: urgentCount,
      averageDistance: averageDistance,
    };
  };

  return {
    isInitialized,
    notificationsEnabled,
    recentWarnings,
    lastWarning,
    clearWarnings,
    dismissWarning,
    getWarningStats,
    formatArrivalTime,
    getIntensityDescription,
  };
}