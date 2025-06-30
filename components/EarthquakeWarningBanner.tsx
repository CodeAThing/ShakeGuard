import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { TriangleAlert as AlertTriangle, X, MapPin, Clock } from 'lucide-react-native';
import { formatArrivalTime } from '../lib/earthquakeWarning';

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

interface EarthquakeWarningBannerProps {
  warning: EarthquakeWarning | null;
  onDismiss: (warningId: string) => void;
  onViewDetails?: (warning: EarthquakeWarning) => void;
}

const { width } = Dimensions.get('window');

export function EarthquakeWarningBanner({ 
  warning, 
  onDismiss, 
  onViewDetails 
}: EarthquakeWarningBannerProps) {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (warning) {
      // Slide in animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Pulsing animation for urgent warnings
      if (warning.isUrgent) {
        const pulseAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
        pulseAnimation.start();

        return () => {
          pulseAnimation.stop();
        };
      }

      // Progress animation for arrival countdown
      if (warning.arrivalTime > 0) {
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: warning.arrivalTime * 1000, // Convert to milliseconds
          useNativeDriver: false,
        }).start();
      }
    } else {
      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [warning, slideAnim, pulseAnim, progressAnim]);

  if (!warning) return null;

  const getBannerColor = () => {
    if (warning.isUrgent) return '#DC2626'; // Red for urgent
    if (warning.arrivalTime < 30) return '#EA580C'; // Orange for very soon
    if (warning.arrivalTime < 60) return '#D97706'; // Amber for soon
    return '#F59E0B'; // Yellow for normal warning
  };

  const getBackgroundColor = () => {
    if (warning.isUrgent) return 'rgba(220, 38, 38, 0.15)';
    return 'rgba(245, 158, 11, 0.15)';
  };

  const getBorderColor = () => {
    if (warning.isUrgent) return 'rgba(220, 38, 38, 0.4)';
    return 'rgba(245, 158, 11, 0.4)';
  };

  const handleDismiss = () => {
    onDismiss(warning.id);
  };

  const handleViewDetails = () => {
    onViewDetails?.(warning);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          transform: [
            { translateY: slideAnim },
            { scale: warning.isUrgent ? pulseAnim : 1 },
          ],
        },
      ]}
    >
      {/* Progress bar for countdown */}
      {warning.arrivalTime > 0 && (
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: getBannerColor(),
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <AlertTriangle 
            size={warning.isUrgent ? 28 : 24} 
            color={getBannerColor()} 
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: getBannerColor() }]}>
            {warning.isUrgent ? '🚨 URGENT ALERT' : '⚠️ EARTHQUAKE WARNING'}
          </Text>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <MapPin size={14} color="#F8FAFC" />
              <Text style={styles.detailText}>
                {warning.distance.toFixed(1)}km away
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Clock size={14} color="#F8FAFC" />
              <Text style={styles.detailText}>
                {formatArrivalTime(warning.arrivalTime)}
              </Text>
            </View>
          </View>

          {warning.isUrgent && (
            <Text style={styles.urgentMessage}>
              TAKE COVER IMMEDIATELY!
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          {onViewDetails && (
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={handleViewDetails}
            >
              <Text style={styles.detailsButtonText}>Details</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
          >
            <X size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Urgent warning overlay effect */}
      {warning.isUrgent && (
        <View style={styles.urgentOverlay} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderLeftWidth: 6,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 1000,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  urgentMessage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FBBF24',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.5)',
  },
  detailsButtonText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
  urgentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    pointerEvents: 'none',
  },
});