import { useState, useEffect, useRef } from 'react';
import { useSettings } from './useSettings';
import { useEarthquakeHistory } from './useEarthquakeHistory';
import { useLocation } from './useLocation';
import { supabase } from '@/lib/supabase';

interface SensorData {
  x: number;
  y: number;
  z: number;
}

interface EarthquakeEventData {
  user_id: string;
  intensity: number;
  duration: number;
  peak_acceleration: number;
  latitude?: number;
  longitude?: number;
  timestamp: string;
}

export function useEarthquakeDetection(
  accelerometerData: SensorData,
  gyroscopeData: SensorData,
  activateEmergencyDefense?: () => Promise<boolean>
) {
  const { sensitivity, enableNotifications } = useSettings();
  const { addEarthquakeEvent } = useEarthquakeHistory();
  const { getCurrentLocation, location } = useLocation();
  
  const [earthquakeDetected, setEarthquakeDetected] = useState(false);
  const [earthquakeIntensity, setEarthquakeIntensity] = useState(0);
  const [lastEarthquakeTime, setLastEarthquakeTime] = useState<Date | null>(null);
  const [currentEventLocation, setCurrentEventLocation] = useState<{lat: number, lng: number} | null>(null);
  const [emergencyDefenseActivated, setEmergencyDefenseActivated] = useState(false);
  
  const detectionBuffer = useRef<number[]>([]);
  const lastDetectionTime = useRef<number>(0);
  const eventStartTime = useRef<number>(0);
  const isInEvent = useRef<boolean>(false);
  const peakAcceleration = useRef<number>(0);
  const eventIntensityBuffer = useRef<number[]>([]);
  const eventLocationCaptured = useRef<boolean>(false);
  const defenseActivationAttempted = useRef<boolean>(false);

  const DETECTION_COOLDOWN = 10000; // 10 seconds between detections
  const BUFFER_SIZE = 10;
  const MIN_EVENT_DURATION = 2000; // Minimum 2 seconds for valid earthquake
  const INTENSITY_BUFFER_SIZE = 20; // Buffer for calculating average intensity
  const EMERGENCY_DEFENSE_THRESHOLD = 2.5; // Activate defense mode for intensity > 2.5

  const calculateMagnitude = (data: SensorData) => {
    return Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
  };

  const captureEarthquakeLocation = async () => {
    try {
      // Try to get high-accuracy location for earthquake event
      const earthquakeLocation = await getCurrentLocation(true);
      
      if (earthquakeLocation) {
        const eventLocation = {
          lat: earthquakeLocation.coords.latitude,
          lng: earthquakeLocation.coords.longitude
        };
        setCurrentEventLocation(eventLocation);
        eventLocationCaptured.current = true;
        console.log('Earthquake location captured:', eventLocation);
        return eventLocation;
      } else if (location) {
        // Fallback to last known location
        const fallbackLocation = {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        };
        setCurrentEventLocation(fallbackLocation);
        eventLocationCaptured.current = true;
        console.log('Using last known location for earthquake:', fallbackLocation);
        return fallbackLocation;
      }
    } catch (error) {
      console.error('Error capturing earthquake location:', error);
    }
    
    return null;
  };

  const activateEmergencyDefenseIfNeeded = async (intensity: number) => {
    // Only activate once per event and if intensity is high enough
    if (
      !defenseActivationAttempted.current && 
      intensity > EMERGENCY_DEFENSE_THRESHOLD && 
      activateEmergencyDefense
    ) {
      defenseActivationAttempted.current = true;
      
      try {
        console.log(`🚨 High intensity earthquake detected (${intensity.toFixed(2)}), activating Emergency Defense Mode`);
        const success = await activateEmergencyDefense();
        
        if (success) {
          setEmergencyDefenseActivated(true);
          console.log('✅ Emergency Defense Mode activated successfully');
        } else {
          console.warn('⚠️ Emergency Defense Mode activation failed');
        }
      } catch (error) {
        console.error('❌ Error activating Emergency Defense Mode:', error);
      }
    }
  };

  const saveEarthquakeToDatabase = async (eventData: {
    timestamp: Date;
    intensity: number;
    duration: number;
    peakAcceleration: number;
  }) => {
    try {
      // Create timestamp in local timezone (GMT+3)
      const localTimestamp = new Date(eventData.timestamp.getTime() + (3 * 60 * 60 * 1000));
      
      const earthquakeData: EarthquakeEventData = {
        user_id: 'anonymous-user',
        intensity: eventData.intensity,
        duration: eventData.duration,
        peak_acceleration: eventData.peakAcceleration,
        timestamp: localTimestamp.toISOString(),
      };

      // Add location data if available
      if (currentEventLocation) {
        earthquakeData.latitude = currentEventLocation.lat;
        earthquakeData.longitude = currentEventLocation.lng;
      }

      const { error } = await supabase
        .from('earthquake_events')
        .insert([earthquakeData]);

      if (error) {
        console.error('Error saving earthquake event to database:', error);
      } else {
        console.log('Earthquake event saved to database:', {
          intensity: eventData.intensity,
          duration: eventData.duration,
          location: currentEventLocation ? `${currentEventLocation.lat}, ${currentEventLocation.lng}` : 'No location',
          timestamp: localTimestamp.toISOString()
        });
      }
    } catch (error) {
      console.error('Error saving earthquake event:', error);
    }
  };

  const detectEarthquake = async (accelMagnitude: number, gyroMagnitude: number) => {
    const now = Date.now();
    
    // Calculate combined intensity with improved algorithm
    const accelDeviation = Math.abs(accelMagnitude - 9.81); // Deviation from Earth's gravity
    const gyroIntensity = gyroMagnitude * 15; // Amplify gyroscope contribution
    const combinedIntensity = accelDeviation + gyroIntensity;
    
    // Update intensity state
    setEarthquakeIntensity(combinedIntensity);
    
    // Add to detection buffer
    detectionBuffer.current.push(combinedIntensity);
    if (detectionBuffer.current.length > BUFFER_SIZE) {
      detectionBuffer.current.shift();
    }
    
    // Add to event intensity buffer during active event
    if (isInEvent.current) {
      eventIntensityBuffer.current.push(combinedIntensity);
      if (eventIntensityBuffer.current.length > INTENSITY_BUFFER_SIZE) {
        eventIntensityBuffer.current.shift();
      }
    }
    
    // Calculate detection threshold based on sensitivity
    const baseThreshold = 1.2;
    const threshold = baseThreshold * sensitivity;
    
    // Check if we should detect an earthquake
    const isAboveThreshold = combinedIntensity > threshold;
    const averageIntensity = 
      detectionBuffer.current.reduce((sum, val) => sum + val, 0) / 
      detectionBuffer.current.length;
    
    const shouldDetect = 
      isAboveThreshold && 
      averageIntensity > threshold * 0.8 && 
      now - lastDetectionTime.current > DETECTION_COOLDOWN;

    if (shouldDetect && !isInEvent.current) {
      // Start of earthquake event
      console.log('🚨 EARTHQUAKE DETECTED - Event Started');
      console.log(`Intensity: ${combinedIntensity.toFixed(2)}, Threshold: ${threshold.toFixed(2)}`);
      
      isInEvent.current = true;
      eventStartTime.current = now;
      peakAcceleration.current = accelMagnitude;
      eventIntensityBuffer.current = [combinedIntensity];
      eventLocationCaptured.current = false;
      defenseActivationAttempted.current = false;
      setEmergencyDefenseActivated(false);
      
      // Immediately capture location when earthquake starts
      await captureEarthquakeLocation();
      
      // Check if Emergency Defense Mode should be activated
      await activateEmergencyDefenseIfNeeded(combinedIntensity);
      
      setEarthquakeDetected(true);
      setLastEarthquakeTime(new Date());
      lastDetectionTime.current = now;
      
      // Auto-reset detection after 5 seconds
      setTimeout(() => {
        setEarthquakeDetected(false);
      }, 5000);
      
    } else if (isInEvent.current) {
      // During earthquake event - check if Emergency Defense should be activated
      await activateEmergencyDefenseIfNeeded(combinedIntensity);
      
      if (!isAboveThreshold) {
        // End of earthquake event
        const eventDuration = (now - eventStartTime.current) / 1000;
        
        if (eventDuration >= MIN_EVENT_DURATION / 1000) {
          // Calculate average intensity during the event
          const avgEventIntensity = eventIntensityBuffer.current.length > 0 
            ? eventIntensityBuffer.current.reduce((sum, val) => sum + val, 0) / eventIntensityBuffer.current.length
            : combinedIntensity;
          
          console.log('📊 EARTHQUAKE EVENT COMPLETED');
          console.log(`Duration: ${eventDuration.toFixed(1)}s`);
          console.log(`Average Intensity: ${avgEventIntensity.toFixed(2)}`);
          console.log(`Peak Acceleration: ${peakAcceleration.current.toFixed(3)} m/s²`);
          console.log(`Location: ${currentEventLocation ? `${currentEventLocation.lat}, ${currentEventLocation.lng}` : 'Not captured'}`);
          console.log(`Emergency Defense Activated: ${emergencyDefenseActivated ? 'Yes' : 'No'}`);
          
          // Valid earthquake event - add to history and database
          const eventData = {
            timestamp: new Date(eventStartTime.current),
            intensity: avgEventIntensity,
            duration: eventDuration,
            peakAcceleration: peakAcceleration.current,
          };
          
          addEarthquakeEvent(eventData);
          await saveEarthquakeToDatabase(eventData);
        } else {
          console.log('⚠️ Event too short, not recording:', eventDuration.toFixed(1), 's');
        }
        
        // Reset event state
        isInEvent.current = false;
        peakAcceleration.current = 0;
        eventIntensityBuffer.current = [];
        defenseActivationAttempted.current = false;
        setCurrentEventLocation(null);
        setEmergencyDefenseActivated(false);
        eventLocationCaptured.current = false;
      }
    }
    
    // Update peak acceleration during event
    if (isInEvent.current && accelMagnitude > peakAcceleration.current) {
      peakAcceleration.current = accelMagnitude;
    }
  };

  useEffect(() => {
    const accelMagnitude = calculateMagnitude(accelerometerData);
    const gyroMagnitude = calculateMagnitude(gyroscopeData);
    
    detectEarthquake(accelMagnitude, gyroMagnitude);
  }, [accelerometerData, gyroscopeData, sensitivity]);

  return {
    earthquakeDetected,
    earthquakeIntensity,
    lastEarthquakeTime,
    currentEventLocation,
    isInEvent: isInEvent.current,
    emergencyDefenseActivated,
  };
}