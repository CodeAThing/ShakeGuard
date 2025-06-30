import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MapPin } from 'lucide-react-native';

interface Location {
  coords: {
    latitude: number;
    longitude: number;
  };
}

interface EarthquakeReport {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  intensity: number;
  description?: string;
  timestamp: string;
  created_at?: string;
}

interface MapViewProps {
  reports: EarthquakeReport[];
  userLocation: Location | null;
  onReportPress: (report: EarthquakeReport) => void;
  loading: boolean;
}

export function MapView({ reports, userLocation, onReportPress, loading }: MapViewProps) {
  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return '#10B981';
    if (intensity <= 5) return '#F59E0B';
    if (intensity <= 7) return '#EF4444';
    return '#DC2626';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text style={styles.loadingText}>Loading earthquake data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <MapPin size={48} color="#60A5FA" />
        <Text style={styles.mapTitle}>Earthquake Reports Map</Text>
        <Text style={styles.mapSubtitle}>
          {reports.length} reports • Interactive map coming soon
        </Text>
        
        {userLocation && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              Your location: {userLocation.coords.latitude.toFixed(4)}, {userLocation.coords.longitude.toFixed(4)}
            </Text>
          </View>
        )}

        <View style={styles.reportsContainer}>
          <Text style={styles.reportsTitle}>Recent Reports:</Text>
          {reports.slice(0, 5).map((report) => (
            <View key={report.id} style={styles.reportItem}>
              <View 
                style={[
                  styles.intensityIndicator, 
                  { backgroundColor: getIntensityColor(report.intensity) }
                ]} 
              />
              <View style={styles.reportDetails}>
                <Text style={styles.reportIntensity}>
                  Intensity {report.intensity}
                </Text>
                <Text style={styles.reportLocation}>
                  {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                </Text>
                <Text style={styles.reportTime}>
                  {new Date(report.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 16,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginTop: 16,
    textAlign: 'center',
  },
  mapSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  locationInfo: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  locationText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  reportsContainer: {
    marginTop: 24,
    width: '100%',
    maxWidth: 400,
  },
  reportsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.5)',
  },
  intensityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  reportDetails: {
    flex: 1,
  },
  reportIntensity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  reportLocation: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  reportTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
});