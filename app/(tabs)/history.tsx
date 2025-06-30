import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { History, Calendar, Clock, Activity, Trash2 } from 'lucide-react-native';
import { useEarthquakeHistory } from '@/hooks/useEarthquakeHistory';

export default function HistoryScreen() {
  const { earthquakeHistory, clearHistory, removeEvent } = useEarthquakeHistory();

  // Helper function to convert UTC timestamp to GMT+3
  const convertToLocalTime = (date: Date) => {
    return new Date(date.getTime() + (3 * 60 * 60 * 1000));
  };

  const formatDate = (date: Date) => {
    const localDate = convertToLocalTime(date);
    return localDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC', // Use UTC since we already adjusted the time
    });
  };

  const formatTime = (date: Date) => {
    const localDate = convertToLocalTime(date);
    return localDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC', // Use UTC since we already adjusted the time
    });
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity < 2) return '#10B981';
    if (intensity < 4) return '#F59E0B';
    if (intensity < 6) return '#EF4444';
    return '#DC2626';
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity < 2) return 'Light';
    if (intensity < 4) return 'Moderate';
    if (intensity < 6) return 'Strong';
    return 'Severe';
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#334155']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <History size={32} color="#60A5FA" />
          </View>
          <Text style={styles.title}>Event History</Text>
          <Text style={styles.subtitle}>
            {earthquakeHistory.length} recorded events (GMT+3)
          </Text>
        </View>

        {/* Clear History Button */}
        {earthquakeHistory.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearHistory}
          >
            <Trash2 size={16} color="#EF4444" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}

        {/* History List */}
        {earthquakeHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Activity size={48} color="#64748B" />
            <Text style={styles.emptyTitle}>No Events Recorded</Text>
            <Text style={styles.emptySubtitle}>
              Earthquake events will appear here when detected
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {earthquakeHistory.map((event, index) => (
              <View key={index} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventDate}>
                      {formatDate(event.timestamp)}
                    </Text>
                    <View style={styles.eventTimeRow}>
                      <Clock size={14} color="#94A3B8" />
                      <Text style={styles.eventTime}>
                        {formatTime(event.timestamp)} GMT+3
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeEvent(index)}
                  >
                    <Trash2 size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.eventDetails}>
                  <View style={styles.intensityBadge}>
                    <View
                      style={[
                        styles.intensityDot,
                        { backgroundColor: getIntensityColor(event.intensity) },
                      ]}
                    />
                    <Text style={styles.intensityText}>
                      {getIntensityLabel(event.intensity)}
                    </Text>
                    <Text style={styles.intensityValue}>
                      {event.intensity.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.sensorData}>
                    <Text style={styles.sensorLabel}>Peak Acceleration:</Text>
                    <Text style={styles.sensorValue}>
                      {event.peakAcceleration.toFixed(3)} m/s²
                    </Text>
                  </View>

                  <View style={styles.sensorData}>
                    <Text style={styles.sensorLabel}>Duration:</Text>
                    <Text style={styles.sensorValue}>
                      {event.duration.toFixed(1)}s
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearButtonText: {
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  historyList: {
    gap: 16,
  },
  eventCard: {
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  eventTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 6,
  },
  deleteButton: {
    padding: 4,
  },
  eventDetails: {
    gap: 8,
  },
  intensityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  intensityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  intensityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F8FAFC',
    marginRight: 8,
  },
  intensityValue: {
    fontSize: 14,
    color: '#94A3B8',
  },
  sensorData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sensorLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  sensorValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F8FAFC',
  },
});