import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SensorData {
  x: number;
  y: number;
  z: number;
}

interface SensorCardProps {
  title: string;
  icon: React.ReactNode;
  data: SensorData;
  magnitude: number;
  unit: string;
  isAvailable: boolean;
  color: string;
}

export function SensorCard({
  title,
  icon,
  data,
  magnitude,
  unit,
  isAvailable,
  color,
}: SensorCardProps) {
  const formatValue = (value: number) => {
    return value.toFixed(3);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {icon}
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#10B981' : '#EF4444' }]} />
      </View>

      {isAvailable ? (
        <>
          {/* Magnitude Display */}
          <View style={styles.magnitudeContainer}>
            <Text style={styles.magnitudeLabel}>Magnitude</Text>
            <Text style={[styles.magnitudeValue, { color }]}>
              {formatValue(magnitude)} {unit}
            </Text>
          </View>

          {/* Individual Axis Values */}
          <View style={styles.axisContainer}>
            <View style={styles.axisRow}>
              <View style={styles.axisItem}>
                <Text style={styles.axisLabel}>X</Text>
                <Text style={styles.axisValue}>{formatValue(data.x)}</Text>
              </View>
              <View style={styles.axisItem}>
                <Text style={styles.axisLabel}>Y</Text>
                <Text style={styles.axisValue}>{formatValue(data.y)}</Text>
              </View>
              <View style={styles.axisItem}>
                <Text style={styles.axisLabel}>Z</Text>
                <Text style={styles.axisValue}>{formatValue(data.z)}</Text>
              </View>
            </View>
          </View>

          {/* Visual Magnitude Bar */}
          <View style={styles.barContainer}>
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: color,
                    width: `${Math.min((magnitude / 15) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
        </>
      ) : (
        <View style={styles.unavailableContainer}>
          <Text style={styles.unavailableText}>Sensor unavailable</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginLeft: 12,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  magnitudeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  magnitudeLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  magnitudeValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  axisContainer: {
    marginBottom: 16,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  axisItem: {
    alignItems: 'center',
    flex: 1,
  },
  axisLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '600',
  },
  axisValue: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  barContainer: {
    marginTop: 8,
  },
  barBackground: {
    height: 6,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 2,
  },
  unavailableContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  unavailableText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
});