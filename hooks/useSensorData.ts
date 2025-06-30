import { useState, useEffect } from 'react';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { Platform } from 'react-native';

interface SensorData {
  x: number;
  y: number;
  z: number;
}

interface WaveformPoint {
  value: number;
  timestamp: number;
}

export function useSensorData() {
  const [accelerometerData, setAccelerometerData] = useState<SensorData>({
    x: 0,
    y: 0,
    z: 0,
  });
  const [gyroscopeData, setGyroscopeData] = useState<SensorData>({
    x: 0,
    y: 0,
    z: 0,
  });
  const [isAccelerometerAvailable, setIsAccelerometerAvailable] = useState(false);
  const [isGyroscopeAvailable, setIsGyroscopeAvailable] = useState(false);
  
  const [waveformData, setWaveformData] = useState<WaveformPoint[]>([]);
  const [accelerometerMagnitude, setAccelerometerMagnitude] = useState(0);
  const [gyroscopeMagnitude, setGyroscopeMagnitude] = useState(0);

  const MAX_WAVEFORM_POINTS = 50; // Reduced from 100 for better performance

  const calculateMagnitude = (data: SensorData) => {
    return Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
  };

  useEffect(() => {
    let accelerometerSubscription: any;
    let gyroscopeSubscription: any;
    let isMounted = true;

    const initializeSensors = async () => {
      try {
        if (Platform.OS === 'web') {
          // Web platform - use simulation only
          if (isMounted) {
            setIsAccelerometerAvailable(true);
            setIsGyroscopeAvailable(true);
          }

          // Simulate accelerometer data for web platform with 2 second intervals
          const simulateAccelerometer = () => {
            if (!isMounted) return;
            
            const baseAccel = 9.81; // Earth's gravity
            const noise = (Math.random() - 0.5) * 0.2;
            const data = {
              x: noise,
              y: noise,
              z: baseAccel + noise,
            };
            setAccelerometerData(data);
            const magnitude = calculateMagnitude(data);
            setAccelerometerMagnitude(magnitude);
            
            setWaveformData(prev => {
              const newPoint: WaveformPoint = {
                value: magnitude,
                timestamp: Date.now(),
              };
              const updated = [...prev, newPoint];
              
              if (updated.length > MAX_WAVEFORM_POINTS) {
                return updated.slice(-MAX_WAVEFORM_POINTS);
              }
              return updated;
            });
          };

          // Simulate gyroscope data for web platform with 2 second intervals
          const simulateGyroscope = () => {
            if (!isMounted) return;
            
            const noise = (Math.random() - 0.5) * 0.1;
            const data = {
              x: noise,
              y: noise,
              z: noise,
            };
            setGyroscopeData(data);
            const magnitude = calculateMagnitude(data);
            setGyroscopeMagnitude(magnitude);
          };

          const accelInterval = setInterval(simulateAccelerometer, 2000); // 2 second intervals
          const gyroInterval = setInterval(simulateGyroscope, 2000); // 2 second intervals
          
          accelerometerSubscription = { remove: () => clearInterval(accelInterval) };
          gyroscopeSubscription = { remove: () => clearInterval(gyroInterval) };
        } else {
          // Native platform - use actual sensors
          // Check accelerometer availability
          const accelAvailable = await Accelerometer.isAvailableAsync();
          if (isMounted) {
            setIsAccelerometerAvailable(accelAvailable);
          }

          // Check gyroscope availability
          const gyroAvailable = await Gyroscope.isAvailableAsync();
          if (isMounted) {
            setIsGyroscopeAvailable(gyroAvailable);
          }

          if (accelAvailable) {
            // Set update interval to 2 seconds (2000ms) for battery efficiency
            Accelerometer.setUpdateInterval(2000);
            
            accelerometerSubscription = Accelerometer.addListener((data) => {
              if (!isMounted) return;
              
              setAccelerometerData(data);
              const magnitude = calculateMagnitude(data);
              setAccelerometerMagnitude(magnitude);
              
              // Update waveform data
              setWaveformData(prev => {
                const newPoint: WaveformPoint = {
                  value: magnitude,
                  timestamp: Date.now(),
                };
                const updated = [...prev, newPoint];
                
                // Keep only the last MAX_WAVEFORM_POINTS
                if (updated.length > MAX_WAVEFORM_POINTS) {
                  return updated.slice(-MAX_WAVEFORM_POINTS);
                }
                return updated;
              });
            });
          }

          if (gyroAvailable) {
            // Set update interval to 2 seconds (2000ms) for battery efficiency
            Gyroscope.setUpdateInterval(2000);
            
            gyroscopeSubscription = Gyroscope.addListener((data) => {
              if (!isMounted) return;
              
              setGyroscopeData(data);
              const magnitude = calculateMagnitude(data);
              setGyroscopeMagnitude(magnitude);
            });
          }
        }
      } catch (error) {
        console.error('Error initializing sensors:', error);
      }
    };

    initializeSensors();

    return () => {
      isMounted = false;
      accelerometerSubscription?.remove();
      gyroscopeSubscription?.remove();
    };
  }, []); // Added empty dependency array to prevent re-initialization

  return {
    accelerometerData,
    gyroscopeData,
    isAccelerometerAvailable,
    isGyroscopeAvailable,
    accelerometerMagnitude,
    gyroscopeMagnitude,
    waveformData,
  };
}