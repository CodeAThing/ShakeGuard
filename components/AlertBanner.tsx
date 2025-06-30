import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { TriangleAlert as AlertTriangle, X } from 'lucide-react-native';

interface AlertBannerProps {
  visible: boolean;
  intensity: number;
  onDismiss: () => void;
}

export function AlertBanner({ visible, intensity, onDismiss }: AlertBannerProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Slide in animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Pulsing animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    } else {
      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim, pulseAnim]);

  const getAlertLevel = (intensity: number) => {
    if (intensity < 2) return { level: 'Low', color: '#F59E0B' };
    if (intensity < 4) return { level: 'Moderate', color: '#EF4444' };
    if (intensity < 6) return { level: 'High', color: '#DC2626' };
    return { level: 'Severe', color: '#B91C1C' };
  };

  const alert = getAlertLevel(intensity);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: pulseAnim },
          ],
        },
      ]}
    >
      <View style={[styles.banner, { borderLeftColor: alert.color }]}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <AlertTriangle size={24} color={alert.color} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>EARTHQUAKE DETECTED</Text>
            <Text style={styles.subtitle}>
              {alert.level} intensity • {intensity.toFixed(2)}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <X size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
        
        {/* Animated progress bar */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: alert.color,
                width: `${Math.min((intensity / 6) * 100, 100)}%`,
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  banner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderLeftWidth: 6,
    overflow: 'hidden',
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
    color: '#F8FAFC',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#FBBF24',
  },
  dismissButton: {
    padding: 4,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1.5,
  },
});