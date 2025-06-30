import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { TriangleAlert as AlertTriangle, Activity, Compass, TrendingUp, MapPin, History, Shield } from 'lucide-react-native';
import { WaveDisplay } from '../../components/WaveDisplay';
import { SensorCard } from '../../components/SensorCard';
import { AlertBanner } from '../../components/AlertBanner';
import { EmergencyButton } from '../../components/EmergencyButton';
import { EmergencyDefenseButton } from '../../components/EmergencyDefenseButton';
import { LocationStatus } from '../../components/LocationStatus';
import { EarthquakeWarningBanner } from '../../components/EarthquakeWarningBanner';
import { WarningHistoryModal } from '../../components/WarningHistoryModal';
import { useSensorData } from '../../hooks/useSensorData';
import { useEarthquakeDetection } from '../../hooks/useEarthquakeDetection';
import { useEarthquakeWarning } from '../../hooks/useEarthquakeWarning';
import { useEmergencyDefense } from '../../hooks/useEmergencyDefense';

const { width } = Dimensions.get('window');

export default function MonitorScreen() {
  const {
    accelerometerData,
    gyroscopeData,
    isAccelerometerAvailable,
    isGyroscopeAvailable,
    accelerometerMagnitude,
    gyroscopeMagnitude,
    waveformData,
  } = useSensorData();

  const { activateEmergencyDefense } = useEmergencyDefense();

  const { 
    earthquakeDetected, 
    earthquakeIntensity, 
    lastEarthquakeTime,
    currentEventLocation,
    isInEvent,
    emergencyDefenseActivated
  } = useEarthquakeDetection(accelerometerData, gyroscopeData, activateEmergencyDefense);

  const {
    isInitialized: warningSystemReady,
    notificationsEnabled,
    recentWarnings,
    lastWarning,
    clearWarnings,
    dismissWarning,
    getWarningStats,
  } = useEarthquakeWarning();

  const [alertVisible, setAlertVisible] = useState(false);
  const [showWarningHistory, setShowWarningHistory] = useState(false);

  useEffect(() => {
    if (earthquakeDetected) {
      setAlertVisible(true);
      
      // Trigger haptic feedback on mobile
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      // Auto-hide alert after 5 seconds
      setTimeout(() => setAlertVisible(false), 5000);
    }
  }, [earthquakeDetected, earthquakeIntensity]);

  const handleEmergencyReport = (success: boolean) => {
    if (success) {
      console.log('Emergency location reported successfully');
    }
  };

  const handleEmergencyDefenseActivate = (success: boolean) => {
    if (success) {
      console.log('Emergency Defense Mode activated successfully');
    }
  };

  const handleEmergencyDefenseDeactivate = (success: boolean) => {
    if (success) {
      console.log('Emergency Defense Mode deactivated successfully');
    }
  };

  const handleViewWarningDetails = (warning: any) => {
    // Could navigate to map or show detailed warning
    console.log('View warning details:', warning);
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const warningStats = getWarningStats();

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#334155']}
      style={styles.container}
    >
      {/* Earthquake Warning Banner */}
      <EarthquakeWarningBanner
        warning={lastWarning}
        onDismiss={dismissWarning}
        onViewDetails={handleViewWarningDetails}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Shield size={32} color="#60A5FA" />
          </View>
          <Text style={styles.title}>ShakeGuard</Text>
          <Text style={styles.subtitle}>Real-time earthquake detection & early warning</Text>
        </View>

        {/* Warning System Status */}
        <View style={styles.warningSystemStatus}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { 
              backgroundColor: warningSystemReady ? '#10B981' : '#EF4444' 
            }]} />
            <Text style={styles.statusText}>
              Early Warning System: {warningSystemReady ? 'Active' : 'Initializing...'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { 
              backgroundColor: notificationsEnabled ? '#10B981' : '#F59E0B' 
            }]} />
            <Text style={styles.statusText}>
              Push Notifications: {notificationsEnabled ? 'Enabled' : Platform.OS === 'web' ? 'Web Platform' : 'Disabled'}
            </Text>
          </View>

          {/* Emergency Defense Status */}
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { 
              backgroundColor: emergencyDefenseActivated ? '#059669' : '#64748B' 
            }]} />
            <Text style={styles.statusText}>
              Emergency Defense: {emergencyDefenseActivated ? 'ACTIVE' : 'Standby'}
            </Text>
          </View>

          {warningStats.totalWarnings > 0 && (
            <TouchableOpacity 
              style={styles.warningHistoryButton}
              onPress={() => setShowWarningHistory(true)}
            >
              <History size={16} color="#60A5FA" />
              <Text style={styles.warningHistoryText}>
                {warningStats.totalWarnings} warnings received
                {warningStats.urgentWarnings > 0 && ` (${warningStats.urgentWarnings} urgent)`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Alert Banner */}
        {alertVisible && (
          <AlertBanner
            visible={alertVisible}
            intensity={earthquakeIntensity}
            onDismiss={() => setAlertVisible(false)}
          />
        )}

        {/* Emergency Defense Auto-Activation Notice */}
        {emergencyDefenseActivated && (
          <View style={styles.autoDefenseNotice}>
            <Shield size={20} color="#059669" />
            <Text style={styles.autoDefenseText}>
              🛡️ Emergency Defense Mode auto-activated due to earthquake detection
            </Text>
          </View>
        )}

        {/* Emergency Defense Button */}
        <EmergencyDefenseButton 
          onActivate={handleEmergencyDefenseActivate}
          onDeactivate={handleEmergencyDefenseDeactivate}
        />

        {/* Emergency Button */}
        <EmergencyButton onEmergencyReport={handleEmergencyReport} />

        {/* Status Cards */}
        <View style={styles.statusGrid}>
          <View style={styles.statusCard}>
            <Activity size={20} color={earthquakeDetected ? '#EF4444' : '#10B981'} />
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={[styles.statusValue, { color: earthquakeDetected ? '#EF4444' : '#10B981' }]}>
              {earthquakeDetected ? 'ALERT' : isInEvent ? 'MONITORING' : 'NORMAL'}
            </Text>
          </View>
          
          <View style={styles.statusCard}>
            <TrendingUp size={20} color="#F59E0B" />
            <Text style={styles.statusLabel}>Intensity</Text>
            <Text style={[styles.statusValue, { color: '#F59E0B' }]}>
              {earthquakeIntensity.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Current Event Location */}
        {currentEventLocation && (
          <View style={styles.eventLocationCard}>
            <View style={styles.eventLocationHeader}>
              <MapPin size={20} color="#EF4444" />
              <Text style={styles.eventLocationTitle}>Active Event Location</Text>
            </View>
            <Text style={styles.eventLocationCoords}>
              {formatCoordinates(currentEventLocation.lat, currentEventLocation.lng)}
            </Text>
            <Text style={styles.eventLocationNote}>
              Location captured at earthquake detection
            </Text>
          </View>
        )}

        {/* Location Status */}
        <LocationStatus />

        {/* Waveform Display */}
        <View style={styles.waveformContainer}>
          <Text style={styles.sectionTitle}>Seismic Activity</Text>
          <WaveDisplay 
            data={waveformData} 
            isActive={earthquakeDetected || isInEvent}
            width={width - 32}
            height={120}
          />
        </View>

        {/* Sensor Data Cards */}
        <View style={styles.sensorsContainer}>
          <Text style={styles.sectionTitle}>Sensor Readings</Text>
          
          <SensorCard
            title="Accelerometer"
            icon={<Activity size={24} color="#60A5FA" />}
            data={accelerometerData}
            magnitude={accelerometerMagnitude}
            unit="m/s²"
            isAvailable={isAccelerometerAvailable}
            color="#60A5FA"
          />

          <SensorCard
            title="Gyroscope"
            icon={<Compass size={24} color="#F59E0B" />}
            data={gyroscopeData}
            magnitude={gyroscopeMagnitude}
            unit="rad/s"
            isAvailable={isGyroscopeAvailable}
            color="#F59E0B"
          />
        </View>

        {/* Last Event Info */}
        {lastEarthquakeTime && (
          <View style={styles.lastEventContainer}>
            <Text style={styles.sectionTitle}>Last Detection</Text>
            <View style={styles.lastEventCard}>
              <AlertTriangle size={20} color="#EF4444" />
              <View style={styles.lastEventInfo}>
                <Text style={styles.lastEventTime}>
                  {lastEarthquakeTime.toLocaleTimeString()} GMT+3
                </Text>
                <Text style={styles.lastEventDate}>
                  {lastEarthquakeTime.toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Detection Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>ShakeGuard Protection</Text>
          <Text style={styles.infoText}>
            • Monitors accelerometer and gyroscope data continuously
          </Text>
          <Text style={styles.infoText}>
            • Calculates earthquake intensity from sensor deviations
          </Text>
          <Text style={styles.infoText}>
            • Captures precise location when earthquake starts
          </Text>
          <Text style={styles.infoText}>
            • Estimates seismic wave arrival times (3.5 km/s S-wave speed)
          </Text>
          <Text style={styles.infoText}>
            • Sends push notifications to users within affected radius
          </Text>
          <Text style={styles.infoText}>
            • Urgent alerts for arrivals under 10 seconds
          </Text>
          <Text style={styles.infoText}>
            • Auto-activates Emergency Defense Mode for intensity > 2.5
          </Text>
          <Text style={styles.infoText}>
            • Emergency Defense reduces brightness and optimizes battery
          </Text>
        </View>
      </ScrollView>

      {/* Warning History Modal */}
      <WarningHistoryModal
        visible={showWarningHistory}
        warnings={recentWarnings}
        onClose={() => setShowWarningHistory(false)}
        onClearAll={clearWarnings}
        onDismissWarning={dismissWarning}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 50,
  },
  headerIcon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  warningSystemStatus: {
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  warningHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  warningHistoryText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  autoDefenseNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.4)',
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  autoDefenseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 8,
    flex: 1,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statusCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  statusLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventLocationCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  eventLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginLeft: 8,
  },
  eventLocationCoords: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FBBF24',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  eventLocationNote: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  waveformContainer: {
    marginBottom: 24,
  },
  sensorsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  lastEventContainer: {
    marginBottom: 24,
  },
  lastEventCard: {
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  lastEventInfo: {
    marginLeft: 12,
  },
  lastEventTime: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  lastEventDate: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  infoContainer: {
    backgroundColor: 'rgba(30, 58, 138, 0.2)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 4,
  },
});