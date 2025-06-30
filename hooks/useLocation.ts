import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform } from 'react-native';
import { supabase, UserLocation } from '@/lib/supabase';

const LOCATION_TASK_NAME = 'background-location-task';
const BACKGROUND_FETCH_TASK = 'background-fetch-location';

// Define the background task for location updates
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    console.log('Received new locations', locations);
    
    // Send location to Supabase
    if (locations && locations.length > 0) {
      const location = locations[0];
      await sendLocationToSupabase(location.coords.latitude, location.coords.longitude, false);
    }
  }
});

// Define background fetch task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // Get current location with high accuracy for background updates
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      maximumAge: 30000, // 30 seconds
      timeout: 15000, // 15 seconds timeout
    });
    
    await sendLocationToSupabase(
      location.coords.latitude,
      location.coords.longitude,
      false
    );
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background fetch error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Helper function to send location to Supabase with proper timezone handling
async function sendLocationToSupabase(latitude: number, longitude: number, emergency: boolean) {
  try {
    // Create timestamp in local timezone (GMT+3)
    const now = new Date();
    const localTimestamp = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // Add 3 hours for GMT+3
    
    const locationData: Omit<UserLocation, 'id'> = {
      user_id: 'anonymous-user', // In a real app, this would be the authenticated user ID
      latitude,
      longitude,
      timestamp: localTimestamp.toISOString(), // This will be stored as GMT+3 time
      emergency,
    };

    const { error } = await supabase
      .from('user_locations')
      .insert([locationData]);

    if (error) {
      console.error('Error saving location to Supabase:', error);
    } else {
      console.log('Location saved successfully with GMT+3 timestamp');
    }
  } catch (error) {
    console.error('Error sending location to Supabase:', error);
  }
}

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [isBackgroundLocationEnabled, setIsBackgroundLocationEnabled] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const [isLocationStale, setIsLocationStale] = useState(false);
  const [hasBackgroundPermission, setHasBackgroundPermission] = useState(false);

  const setupBackgroundLocation = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        console.log('Background location not available on web platform');
        return false;
      }

      // Check if background location is already running
      const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (isTaskRegistered) {
        console.log('Background location task already registered');
        setIsBackgroundLocationEnabled(true);
        return true;
      }

      // Check if we have background permissions
      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.log('Background location permission not granted');
        setIsBackgroundLocationEnabled(false);
        return false;
      }

      // Register background fetch task
      try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 30 * 60 * 1000, // 30 minutes
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log('Background fetch task registered');
      } catch (fetchError) {
        console.warn('Background fetch registration failed:', fetchError);
      }

      // Start location updates with optimized settings for iOS
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced, // Use balanced for better battery life
        timeInterval: 5 * 60 * 1000, // 5 minutes
        distanceInterval: 100, // 100 meters
        deferredUpdatesInterval: 10 * 60 * 1000, // 10 minutes
        showsBackgroundLocationIndicator: true, // Show blue bar on iOS
        foregroundService: {
          notificationTitle: 'ShakeGuard',
          notificationBody: 'Monitoring location for earthquake detection and early warnings',
          notificationColor: '#3B82F6',
        },
      });

      setIsBackgroundLocationEnabled(true);
      console.log('✅ Background location tracking started successfully');
      return true;
    } catch (error) {
      console.error('❌ Error setting up background location:', error);
      setErrorMsg('Failed to setup background location tracking.');
      setIsBackgroundLocationEnabled(false);
      return false;
    }
  }, []);

  const initializeLocation = useCallback(async () => {
    try {
      setErrorMsg(null);
      
      console.log('🔄 Initializing ShakeGuard location services...');
      
      // Request foreground permissions first
      let { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== 'granted') {
        setErrorMsg('Location permission denied. Please enable location access in device settings for ShakeGuard to work properly.');
        return;
      }

      console.log('✅ Foreground location permission granted');

      // Get current location with high accuracy
      const locationOptions: Location.LocationOptions = {
        accuracy: Location.Accuracy.BestForNavigation,
        maximumAge: 10000, // 10 seconds
        timeout: 20000, // 20 seconds timeout
      };

      try {
        const currentLocation = await Location.getCurrentPositionAsync(locationOptions);
        setLocation(currentLocation);
        setLocationAccuracy(currentLocation.coords.accuracy || null);
        setLastLocationUpdate(new Date());
        setIsLocationStale(false);
        console.log('📍 Current location obtained successfully');
      } catch (locationError) {
        console.warn('High accuracy location failed, trying balanced accuracy:', locationError);
        
        // Fallback to balanced accuracy if high accuracy fails
        const fallbackLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          maximumAge: 30000,
          timeout: 15000,
        });
        
        setLocation(fallbackLocation);
        setLocationAccuracy(fallbackLocation.coords.accuracy || null);
        setLastLocationUpdate(new Date());
        setIsLocationStale(false);
        console.log('📍 Fallback location obtained successfully');
      }

      // Request background permissions (only on native platforms)
      if (Platform.OS !== 'web') {
        console.log('🔄 Requesting background location permissions...');
        
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        
        if (backgroundStatus === 'granted') {
          setHasBackgroundPermission(true);
          console.log('✅ Background location permission granted');
          
          // Set up background location immediately
          const backgroundSetupSuccess = await setupBackgroundLocation();
          if (backgroundSetupSuccess) {
            console.log('✅ ShakeGuard background location setup completed');
          } else {
            console.warn('⚠️ ShakeGuard background location setup failed');
          }
        } else {
          setHasBackgroundPermission(false);
          setIsBackgroundLocationEnabled(false);
          console.warn('⚠️ Background location permission denied');
          setErrorMsg('Background location permission denied. ShakeGuard location tracking will be limited when app is in background.');
        }
      } else {
        console.log('ℹ️ Web platform - background location not available');
      }
    } catch (error) {
      setErrorMsg('Failed to initialize ShakeGuard location services. Please check your device settings.');
      console.error('❌ ShakeGuard location initialization error:', error);
    }
  }, [setupBackgroundLocation]);

  // Initialize location only once on mount
  useEffect(() => {
    initializeLocation();
  }, []);

  // Handle stale location checking and app state changes
  useEffect(() => {
    // Check for stale location every 30 seconds
    const staleCheckInterval = setInterval(() => {
      if (lastLocationUpdate) {
        const timeSinceUpdate = Date.now() - lastLocationUpdate.getTime();
        const isStale = timeSinceUpdate > 5 * 60 * 1000; // 5 minutes
        setIsLocationStale(isStale);
      }
    }, 30000);

    // Set up AppState listener to manage background location services
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed to:', nextAppState);
      
      // Re-check background location status when app becomes active
      if (nextAppState === 'active' && hasBackgroundPermission) {
        // Check if background location is still running
        TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME).then((isRegistered) => {
          setIsBackgroundLocationEnabled(isRegistered);
          if (!isRegistered && hasBackgroundPermission) {
            console.log('🔄 Background location not running, attempting to restart...');
            setupBackgroundLocation();
          }
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearInterval(staleCheckInterval);
      subscription?.remove();
    };
  }, [lastLocationUpdate, hasBackgroundPermission, setupBackgroundLocation]);

  const getCurrentLocation = useCallback(async (highAccuracy: boolean = false): Promise<Location.LocationObject | null> => {
    try {
      if (permissionStatus !== 'granted') {
        setErrorMsg('Location permission not granted');
        return null;
      }

      setErrorMsg(null);

      const locationOptions: Location.LocationOptions = highAccuracy ? {
        accuracy: Location.Accuracy.BestForNavigation,
        maximumAge: 5000, // 5 seconds for emergency situations
        timeout: 30000, // 30 seconds timeout for high accuracy
      } : {
        accuracy: Location.Accuracy.High,
        maximumAge: 15000, // 15 seconds
        timeout: 20000, // 20 seconds timeout
      };

      const currentLocation = await Location.getCurrentPositionAsync(locationOptions);
      
      setLocation(currentLocation);
      setLocationAccuracy(currentLocation.coords.accuracy || null);
      setLastLocationUpdate(new Date());
      setIsLocationStale(false);
      
      return currentLocation;
    } catch (error) {
      const errorMessage = 'Unable to get current location. Please check GPS settings.';
      setErrorMsg(errorMessage);
      console.error('Get current location error:', error);
      return null;
    }
  }, [permissionStatus]);

  const reportEmergencyLocation = useCallback(async (): Promise<boolean> => {
    try {
      setErrorMsg(null);
      
      // Use highest accuracy for emergency reports
      const currentLocation = await getCurrentLocation(true);
      
      if (!currentLocation) {
        return false;
      }

      await sendLocationToSupabase(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        true // This is an emergency report
      );

      return true;
    } catch (error) {
      console.error('Error reporting emergency location:', error);
      setErrorMsg('Failed to report emergency location. Please try again.');
      return false;
    }
  }, [getCurrentLocation]);

  const refreshLocation = useCallback(async (): Promise<boolean> => {
    try {
      const refreshedLocation = await getCurrentLocation(true);
      return refreshedLocation !== null;
    } catch (error) {
      console.error('Error refreshing location:', error);
      return false;
    }
  }, [getCurrentLocation]);

  const stopBackgroundLocation = useCallback(async () => {
    try {
      const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (isTaskRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
      
      const isFetchTaskRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
      if (isFetchTaskRegistered) {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      }
      
      setIsBackgroundLocationEnabled(false);
      console.log('ShakeGuard background location tracking stopped');
    } catch (error) {
      console.error('Error stopping background location:', error);
    }
  }, []);

  const getLocationQualityStatus = useCallback(() => {
    if (!location || !locationAccuracy) {
      return { quality: 'unknown', color: '#64748B', description: 'Location unavailable' };
    }

    if (locationAccuracy <= 5) {
      return { quality: 'excellent', color: '#10B981', description: 'Excellent accuracy' };
    } else if (locationAccuracy <= 15) {
      return { quality: 'good', color: '#10B981', description: 'Good accuracy' };
    } else if (locationAccuracy <= 50) {
      return { quality: 'fair', color: '#F59E0B', description: 'Fair accuracy' };
    } else {
      return { quality: 'poor', color: '#EF4444', description: 'Poor accuracy' };
    }
  }, [location, locationAccuracy]);

  return {
    location,
    errorMsg,
    permissionStatus,
    isBackgroundLocationEnabled,
    locationAccuracy,
    lastLocationUpdate,
    isLocationStale,
    getCurrentLocation,
    reportEmergencyLocation,
    refreshLocation,
    stopBackgroundLocation,
    initializeLocation,
    getLocationQualityStatus,
  };
}