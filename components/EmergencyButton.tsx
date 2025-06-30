import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { TriangleAlert as AlertTriangle, MapPin, Shield } from 'lucide-react-native';
import { useLocation } from '@/hooks/useLocation';
import { supabase, EarthquakeReport } from '@/lib/supabase';

interface EmergencyButtonProps {
  onEmergencyReport?: (success: boolean) => void;
}

export function EmergencyButton({ onEmergencyReport }: EmergencyButtonProps) {
  const [isReporting, setIsReporting] = useState(false);
  const { reportEmergencyLocation, permissionStatus, getCurrentLocation } = useLocation();

  const handleEmergencyReport = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'Please enable location permissions for ShakeGuard to report your emergency location.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Report Earthquake',
      'Did you feel an earthquake? ShakeGuard will:\n\n• Send your current location for emergency response\n• Add a report to the live earthquake map\n• Alert other users in the area',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Report',
          style: 'destructive',
          onPress: async () => {
            setIsReporting(true);
            try {
              // Report emergency location (existing functionality)
              const locationSuccess = await reportEmergencyLocation();
              
              // Also add to earthquake reports for the map
              let reportSuccess = false;
              try {
                const currentLocation = await getCurrentLocation(true);
                
                if (currentLocation) {
                  // Create timestamp in local timezone (GMT+3)
                  const now = new Date();
                  const localTimestamp = new Date(now.getTime() + (3 * 60 * 60 * 1000));

                  const report: Omit<EarthquakeReport, 'id'> = {
                    user_id: 'anonymous-user',
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                    intensity: 5, // Default intensity for emergency reports
                    description: 'Emergency report - earthquake felt',
                    timestamp: localTimestamp.toISOString(),
                  };

                  const { error } = await supabase
                    .from('earthquake_reports')
                    .insert([report]);

                  if (!error) {
                    reportSuccess = true;
                  }
                }
              } catch (error) {
                console.error('Error adding earthquake report:', error);
              }
              
              const overallSuccess = locationSuccess || reportSuccess;
              
              if (overallSuccess) {
                Alert.alert(
                  'Report Submitted',
                  'Your emergency location has been reported and added to the earthquake map. Emergency services have been notified.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  'Report Failed',
                  'Failed to report your location. Please try again or contact emergency services directly.',
                  [{ text: 'OK' }]
                );
              }
              
              onEmergencyReport?.(overallSuccess);
            } catch (error) {
              Alert.alert(
                'Error',
                'An error occurred while reporting your location.',
                [{ text: 'OK' }]
              );
              onEmergencyReport?.(false);
            } finally {
              setIsReporting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.emergencyButton, isReporting && styles.emergencyButtonDisabled]}
        onPress={handleEmergencyReport}
        disabled={isReporting}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          {isReporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Shield size={24} color="#FFFFFF" />
          )}
          <Text style={styles.buttonText}>
            {isReporting ? 'Reporting...' : 'I Felt an Earthquake'}
          </Text>
          <MapPin size={16} color="#FFFFFF" style={styles.locationIcon} />
        </View>
      </TouchableOpacity>
      
      <Text style={styles.description}>
        Tap to immediately report your location and add to the ShakeGuard network
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  emergencyButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 250,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emergencyButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    marginRight: 8,
  },
  locationIcon: {
    opacity: 0.8,
  },
  description: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
});