import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapPin, Wifi, WifiOff, Settings, RefreshCw, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useLocation } from '@/hooks/useLocation';
import { useState } from 'react';

export function LocationStatus() {
  const { 
    location, 
    errorMsg, 
    permissionStatus, 
    isBackgroundLocationEnabled,
    locationAccuracy,
    lastLocationUpdate,
    isLocationStale,
    refreshLocation,
    initializeLocation,
    getLocationQualityStatus
  } = useLocation();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatusColor = () => {
    if (errorMsg) return '#EF4444';
    if (permissionStatus !== 'granted') return '#EF4444';
    if (isLocationStale) return '#F59E0B';
    if (permissionStatus === 'granted' && isBackgroundLocationEnabled) return '#10B981';
    return '#F59E0B';
  };

  const getStatusText = () => {
    if (errorMsg) return errorMsg;
    if (permissionStatus !== 'granted') return 'Location permission required';
    if (isLocationStale) return 'Location data is stale';
    if (!isBackgroundLocationEnabled) return 'Background location disabled';
    return 'Location tracking active';
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // Helper function to convert UTC timestamp to GMT+3 and format
  const formatLastUpdate = (date: Date) => {
    const localDate = new Date(date.getTime() + (3 * 60 * 60 * 1000)); // Add 3 hours for GMT+3
    const now = new Date();
    const localNow = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // Current time in GMT+3
    const diffMs = localNow.getTime() - localDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now (GMT+3)';
    if (diffMins < 60) return `${diffMins}m ago (GMT+3)`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago (GMT+3)`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago (GMT+3)`;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshLocation();
    setIsRefreshing(false);
  };

  const locationQuality = getLocationQualityStatus();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MapPin size={20} color={getStatusColor()} />
        <Text style={styles.title}>Location Status</Text>
        <View style={styles.headerRight}>
          {isBackgroundLocationEnabled ? (
            <Wifi size={16} color="#10B981" />
          ) : (
            <WifiOff size={16} color="#EF4444" />
          )}
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#60A5FA" />
            ) : (
              <RefreshCw size={16} color="#60A5FA" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>

      {location && (
        <>
          {/* Location Quality Indicator */}
          <View style={styles.qualityContainer}>
            <View style={styles.qualityRow}>
              {locationQuality.quality === 'excellent' || locationQuality.quality === 'good' ? (
                <CheckCircle size={16} color={locationQuality.color} />
              ) : (
                <AlertTriangle size={16} color={locationQuality.color} />
              )}
              <Text style={[styles.qualityText, { color: locationQuality.color }]}>
                {locationQuality.description}
              </Text>
              {locationAccuracy && (
                <Text style={styles.accuracyBadge}>
                  ±{locationAccuracy.toFixed(0)}m
                </Text>
              )}
            </View>
          </View>

          {/* Coordinates Display */}
          <View style={styles.coordinatesContainer}>
            <Text style={styles.coordinatesLabel}>Current Location:</Text>
            <Text style={styles.coordinatesText}>
              {formatCoordinates(location.coords.latitude, location.coords.longitude)}
            </Text>

            {lastLocationUpdate && (
              <Text style={[styles.lastUpdateText, isLocationStale && styles.staleText]}>
                Last updated: {formatLastUpdate(lastLocationUpdate)}
              </Text>
            )}
          </View>
        </>
      )}

      {permissionStatus !== 'granted' && (
        <TouchableOpacity style={styles.enableButton} onPress={initializeLocation}>
          <Settings size={16} color="#60A5FA" />
          <Text style={styles.enableButtonText}>Enable Location</Text>
        </TouchableOpacity>
      )}

      {/* Location Tips */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Location Accuracy Tips:</Text>
        <Text style={styles.infoText}>• Enable high accuracy mode in device settings</Text>
        <Text style={styles.infoText}>• Ensure clear view of the sky for GPS</Text>
        <Text style={styles.infoText}>• Keep Wi-Fi enabled for assisted GPS</Text>
        <Text style={styles.infoText}>• Emergency reports use highest accuracy</Text>
        <Text style={styles.infoText}>• All timestamps shown in GMT+3 timezone</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginLeft: 8,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    padding: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  qualityContainer: {
    marginBottom: 12,
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  accuracyBadge: {
    fontSize: 12,
    color: '#94A3B8',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: '500',
  },
  coordinatesContainer: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  coordinatesLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F8FAFC',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  staleText: {
    color: '#F59E0B',
    fontWeight: '500',
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  enableButtonText: {
    color: '#60A5FA',
    fontWeight: '500',
    marginLeft: 8,
  },
  infoContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(71, 85, 105, 0.3)',
    paddingTop: 12,
  },
  infoTitle: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '500',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 2,
  },
});