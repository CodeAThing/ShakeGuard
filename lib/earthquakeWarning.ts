/**
 * Earthquake Early Warning System
 * Calculates seismic wave arrival times and sends push notifications
 */

import { supabase } from './supabase';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Seismic wave speeds (km/s)
const WAVE_SPEEDS = {
  P_WAVE: 6.0,    // Primary waves (faster, less destructive)
  S_WAVE: 3.5,    // Secondary waves (slower, more destructive)
  SURFACE: 3.0,   // Surface waves (slowest, most destructive)
};

// Use S-wave speed as it's more destructive and gives reasonable warning time
const DEFAULT_WAVE_SPEED = WAVE_SPEEDS.S_WAVE; // 3.5 km/s

interface UserLocation {
  user_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface EarthquakeReport {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  intensity: number;
  description?: string;
  timestamp: string;
}

interface WarningCalculation {
  user_id: string;
  distance_km: number;
  arrival_time_seconds: number;
  is_urgent: boolean;
  user_location: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Calculate the Haversine distance between two points on Earth
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate seismic wave arrival time
 * @param distance_km Distance from epicenter in kilometers
 * @param wave_speed Wave speed in km/s (default: 3.5 km/s for S-waves)
 * @returns Arrival time in seconds
 */
export function calculateArrivalTime(
  distance_km: number,
  wave_speed: number = DEFAULT_WAVE_SPEED
): number {
  return distance_km / wave_speed;
}

/**
 * Get recent user locations for warning calculations
 * @param maxAge Maximum age of location data in hours (default: 24)
 * @returns Array of recent user locations
 */
export async function getRecentUserLocations(maxAge: number = 24): Promise<UserLocation[]> {
  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - maxAge);

    const { data, error } = await supabase
      .from('user_locations')
      .select('user_id, latitude, longitude, timestamp')
      .gte('timestamp', cutoffTime.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching user locations:', error);
      return [];
    }

    // Get the most recent location for each user
    const userLocationMap = new Map<string, UserLocation>();
    
    data.forEach((location) => {
      if (!userLocationMap.has(location.user_id)) {
        userLocationMap.set(location.user_id, location);
      }
    });

    return Array.from(userLocationMap.values());
  } catch (error) {
    console.error('Error in getRecentUserLocations:', error);
    return [];
  }
}

/**
 * Calculate warning data for all users based on earthquake epicenter
 * @param epicenterLat Earthquake epicenter latitude
 * @param epicenterLon Earthquake epicenter longitude
 * @param magnitude Earthquake magnitude/intensity
 * @returns Array of warning calculations for each user
 */
export async function calculateWarningsForUsers(
  epicenterLat: number,
  epicenterLon: number,
  magnitude: number
): Promise<WarningCalculation[]> {
  try {
    const userLocations = await getRecentUserLocations();
    const warnings: WarningCalculation[] = [];

    userLocations.forEach((userLocation) => {
      const distance = calculateHaversineDistance(
        epicenterLat,
        epicenterLon,
        userLocation.latitude,
        userLocation.longitude
      );

      // Skip users too close to epicenter (likely the reporter or in immediate area)
      if (distance < 1) {
        return;
      }

      const arrivalTime = calculateArrivalTime(distance);
      const isUrgent = arrivalTime < 10; // Less than 10 seconds is urgent

      warnings.push({
        user_id: userLocation.user_id,
        distance_km: distance,
        arrival_time_seconds: arrivalTime,
        is_urgent: isUrgent,
        user_location: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
      });
    });

    // Sort by arrival time (closest/most urgent first)
    warnings.sort((a, b) => a.arrival_time_seconds - b.arrival_time_seconds);

    return warnings;
  } catch (error) {
    console.error('Error calculating warnings:', error);
    return [];
  }
}

/**
 * Format arrival time for display
 * @param seconds Arrival time in seconds
 * @returns Formatted time string
 */
export function formatArrivalTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    const hours = Math.round(seconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
}

/**
 * Get intensity description for notifications
 * @param intensity Earthquake intensity (1-10)
 * @returns Human-readable intensity description
 */
export function getIntensityDescription(intensity: number): string {
  if (intensity <= 2) return 'Light';
  if (intensity <= 4) return 'Moderate';
  if (intensity <= 6) return 'Strong';
  if (intensity <= 8) return 'Severe';
  return 'Extreme';
}

/**
 * Configure push notifications
 */
export async function configurePushNotifications(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      console.log('Push notifications not available on web platform');
      return false;
    }

    // Configure notification behavior
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      }),
    });

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permissions not granted');
      return false;
    }

    console.log('Push notifications configured successfully');
    return true;
  } catch (error) {
    console.error('Error configuring push notifications:', error);
    return false;
  }
}

/**
 * Send earthquake warning notification
 * @param warning Warning calculation data
 * @param earthquakeData Earthquake report data
 */
export async function sendEarthquakeWarning(
  warning: WarningCalculation,
  earthquakeData: EarthquakeReport
): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      // Web fallback - could implement browser notifications here
      console.log(`Web notification: Earthquake ${warning.distance_km.toFixed(1)}km away, arriving in ${formatArrivalTime(warning.arrival_time_seconds)}`);
      return true;
    }

    const intensityDesc = getIntensityDescription(earthquakeData.intensity);
    const arrivalTimeFormatted = formatArrivalTime(warning.arrival_time_seconds);
    
    const title = warning.is_urgent 
      ? '🚨 URGENT EARTHQUAKE ALERT' 
      : '⚠️ Earthquake Warning';
    
    const body = warning.is_urgent
      ? `${intensityDesc} earthquake ${warning.distance_km.toFixed(1)}km away. TAKE COVER NOW! Estimated arrival: ${arrivalTimeFormatted}`
      : `${intensityDesc} earthquake reported ${warning.distance_km.toFixed(1)}km away. Estimated arrival in ${arrivalTimeFormatted}. Prepare for shaking.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: warning.is_urgent ? 'default' : true,
        priority: warning.is_urgent 
          ? Notifications.AndroidNotificationPriority.MAX 
          : Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: 'earthquake_warning',
          earthquake_id: earthquakeData.id,
          distance_km: warning.distance_km,
          arrival_time_seconds: warning.arrival_time_seconds,
          is_urgent: warning.is_urgent,
          epicenter: {
            latitude: earthquakeData.latitude,
            longitude: earthquakeData.longitude,
          },
        },
      },
      trigger: null, // Send immediately
    });

    console.log(`Earthquake warning sent to user ${warning.user_id}: ${warning.distance_km.toFixed(1)}km, ${arrivalTimeFormatted}`);
    return true;
  } catch (error) {
    console.error('Error sending earthquake warning:', error);
    return false;
  }
}

/**
 * Process earthquake report and send warnings to all users
 * @param earthquakeReport The earthquake report that triggered the warning
 * @returns Number of warnings sent successfully
 */
export async function processEarthquakeWarning(
  earthquakeReport: EarthquakeReport
): Promise<number> {
  try {
    console.log('🚨 Processing earthquake warning system...');
    console.log(`Epicenter: ${earthquakeReport.latitude}, ${earthquakeReport.longitude}`);
    console.log(`Intensity: ${earthquakeReport.intensity}`);

    // Calculate warnings for all users
    const warnings = await calculateWarningsForUsers(
      earthquakeReport.latitude,
      earthquakeReport.longitude,
      earthquakeReport.intensity
    );

    console.log(`Calculated warnings for ${warnings.length} users`);

    if (warnings.length === 0) {
      console.log('No users found for earthquake warnings');
      return 0;
    }

    // Send warnings to all users
    let successCount = 0;
    const warningPromises = warnings.map(async (warning) => {
      try {
        const success = await sendEarthquakeWarning(warning, earthquakeReport);
        if (success) {
          successCount++;
        }
        return success;
      } catch (error) {
        console.error(`Failed to send warning to user ${warning.user_id}:`, error);
        return false;
      }
    });

    await Promise.all(warningPromises);

    // Log summary
    const urgentWarnings = warnings.filter(w => w.is_urgent).length;
    const averageDistance = warnings.reduce((sum, w) => sum + w.distance_km, 0) / warnings.length;
    const averageArrival = warnings.reduce((sum, w) => sum + w.arrival_time_seconds, 0) / warnings.length;

    console.log('📊 Earthquake Warning Summary:');
    console.log(`- Total warnings sent: ${successCount}/${warnings.length}`);
    console.log(`- Urgent warnings (< 10s): ${urgentWarnings}`);
    console.log(`- Average distance: ${averageDistance.toFixed(1)}km`);
    console.log(`- Average arrival time: ${formatArrivalTime(averageArrival)}`);

    return successCount;
  } catch (error) {
    console.error('Error processing earthquake warning:', error);
    return 0;
  }
}

/**
 * Initialize the earthquake warning system
 * Call this when the app starts
 */
export async function initializeEarthquakeWarningSystem(): Promise<boolean> {
  try {
    console.log('🔧 Initializing Earthquake Warning System...');
    
    // Configure push notifications
    const notificationsReady = await configurePushNotifications();
    
    if (!notificationsReady && Platform.OS !== 'web') {
      console.warn('Push notifications not available - warnings will be limited');
    }

    // Set up real-time subscription for new earthquake reports
    const subscription = supabase
      .channel('earthquake_warnings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'earthquake_reports',
        },
        async (payload) => {
          console.log('🚨 New earthquake report detected:', payload.new);
          
          // Process the new earthquake report
          const earthquakeReport = payload.new as EarthquakeReport;
          
          // Add a small delay to ensure the report is fully committed
          setTimeout(async () => {
            await processEarthquakeWarning(earthquakeReport);
          }, 1000);
        }
      )
      .subscribe();

    console.log('✅ Earthquake Warning System initialized successfully');
    console.log('📡 Real-time monitoring active for new earthquake reports');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Earthquake Warning System:', error);
    return false;
  }
}