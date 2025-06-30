import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  X, 
  TriangleAlert as AlertTriangle, 
  Clock, 
  MapPin, 
  History,
  Trash2 
} from 'lucide-react-native';
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

interface WarningHistoryModalProps {
  visible: boolean;
  warnings: EarthquakeWarning[];
  onClose: () => void;
  onClearAll: () => void;
  onDismissWarning: (warningId: string) => void;
}

const { height } = Dimensions.get('window');

export function WarningHistoryModal({
  visible,
  warnings,
  onClose,
  onClearAll,
  onDismissWarning,
}: WarningHistoryModalProps) {
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getWarningColor = (warning: EarthquakeWarning) => {
    if (warning.isUrgent) return '#DC2626';
    if (warning.arrivalTime < 30) return '#EA580C';
    if (warning.arrivalTime < 60) return '#D97706';
    return '#F59E0B';
  };

  const getWarningStats = () => {
    const urgentCount = warnings.filter(w => w.isUrgent).length;
    const averageDistance = warnings.length > 0 
      ? warnings.reduce((sum, w) => sum + w.distance, 0) / warnings.length 
      : 0;
    
    return {
      total: warnings.length,
      urgent: urgentCount,
      averageDistance,
    };
  };

  const stats = getWarningStats();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#334155']}
          style={styles.modalContainer}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <History size={24} color="#60A5FA" />
              <Text style={styles.title}>Warning History</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Warnings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#DC2626' }]}>
                {stats.urgent}
              </Text>
              <Text style={styles.statLabel}>Urgent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stats.averageDistance.toFixed(1)}km
              </Text>
              <Text style={styles.statLabel}>Avg Distance</Text>
            </View>
          </View>

          {/* Clear All Button */}
          {warnings.length > 0 && (
            <TouchableOpacity style={styles.clearAllButton} onPress={onClearAll}>
              <Trash2 size={16} color="#EF4444" />
              <Text style={styles.clearAllText}>Clear All History</Text>
            </TouchableOpacity>
          )}

          {/* Warnings List */}
          <ScrollView 
            style={styles.warningsList} 
            showsVerticalScrollIndicator={false}
          >
            {warnings.length === 0 ? (
              <View style={styles.emptyState}>
                <AlertTriangle size={48} color="#64748B" />
                <Text style={styles.emptyTitle}>No Warnings Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Earthquake warnings will appear here when detected
                </Text>
              </View>
            ) : (
              warnings.map((warning) => (
                <View key={warning.id} style={styles.warningItem}>
                  <View style={styles.warningHeader}>
                    <View style={styles.warningLeft}>
                      <View 
                        style={[
                          styles.warningIndicator,
                          { backgroundColor: getWarningColor(warning) }
                        ]}
                      />
                      <View style={styles.warningInfo}>
                        <Text style={styles.warningTitle}>
                          {warning.isUrgent ? '🚨 URGENT ALERT' : '⚠️ Warning'}
                        </Text>
                        <Text style={styles.warningTime}>
                          {getTimeAgo(warning.timestamp)}
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.dismissButton}
                      onPress={() => onDismissWarning(warning.id)}
                    >
                      <X size={16} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.warningDetails}>
                    <View style={styles.detailRow}>
                      <MapPin size={14} color="#94A3B8" />
                      <Text style={styles.detailText}>
                        {warning.distance.toFixed(1)}km from epicenter
                      </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Clock size={14} color="#94A3B8" />
                      <Text style={styles.detailText}>
                        Estimated arrival: {formatArrivalTime(warning.arrivalTime)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.coordinatesText}>
                        Epicenter: {warning.epicenter.latitude.toFixed(4)}, {warning.epicenter.longitude.toFixed(4)}
                      </Text>
                    </View>
                  </View>

                  {warning.isUrgent && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentBadgeText}>
                        IMMEDIATE ACTION REQUIRED
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: height * 0.85,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(71, 85, 105, 0.3)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearAllText: {
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  warningsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  warningItem: {
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  warningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  warningIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  warningInfo: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  warningTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  dismissButton: {
    padding: 4,
  },
  warningDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  urgentBadge: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
  },
  urgentBadgeText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});