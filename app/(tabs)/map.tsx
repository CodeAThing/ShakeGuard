import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Map, MapPin, Clock, TrendingUp, Users, RefreshCw, Filter, TriangleAlert as AlertTriangle, Eye, EyeOff } from 'lucide-react-native';
import { supabase, EarthquakeReport } from '../../lib/supabase';
import { MapView } from '../../components/MapView';
import { ReportModal } from '../../components/ReportModal';
import { useLocation } from '../../hooks/useLocation';
import { useTheme } from '../../hooks/useTheme';

const { width, height } = Dimensions.get('window');

interface MapFilters {
  timeRange: '1h' | '6h' | '24h' | '7d' | 'all';
  minIntensity: number;
  showMyReports: boolean;
}

export default function MapScreen() {
  const { colors } = useTheme();
  const [reports, setReports] = useState<EarthquakeReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<EarthquakeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<EarthquakeReport | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MapFilters>({
    timeRange: '24h',
    minIntensity: 1,
    showMyReports: false,
  });
  
  const { location, getCurrentLocation } = useLocation();
  const realtimeSubscription = useRef<any>(null);

  useEffect(() => {
    loadReports();
    setupRealtimeSubscription();
    
    return () => {
      if (realtimeSubscription.current) {
        realtimeSubscription.current.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('earthquake_reports')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000); // Limit to prevent performance issues

      if (error) {
        console.error('Error loading earthquake reports:', error);
        Alert.alert('Error', 'Failed to load earthquake reports');
        return;
      }

      const reportsWithDates = data.map(report => ({
        ...report,
        timestamp: new Date(report.timestamp).toISOString(),
        created_at: report.created_at ? new Date(report.created_at).toISOString() : undefined,
      }));

      setReports(reportsWithDates);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    realtimeSubscription.current = supabase
      .channel('earthquake_reports')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'earthquake_reports',
        },
        (payload) => {
          console.log('New earthquake report received:', payload);
          const newReport = {
            ...payload.new,
            timestamp: new Date(payload.new.timestamp).toISOString(),
            created_at: payload.new.created_at ? new Date(payload.new.created_at).toISOString() : undefined,
          } as EarthquakeReport;
          
          setReports(prev => [newReport, ...prev]);
          
          // Show alert for new reports
          Alert.alert(
            '🚨 New Earthquake Report',
            `Intensity ${newReport.intensity} reported ${getTimeAgo(new Date(newReport.timestamp))}`,
            [{ text: 'View on Map', onPress: () => {} }]
          );
        }
      )
      .subscribe();
  };

  const applyFilters = () => {
    let filtered = [...reports];

    // Time range filter
    if (filters.timeRange !== 'all') {
      const now = new Date();
      const timeRanges = {
        '1h': 1 * 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
      };
      
      const cutoff = new Date(now.getTime() - timeRanges[filters.timeRange]);
      filtered = filtered.filter(report => new Date(report.timestamp) >= cutoff);
    }

    // Intensity filter
    filtered = filtered.filter(report => report.intensity >= filters.minIntensity);

    // My reports filter (if implemented with user authentication)
    if (filters.showMyReports) {
      filtered = filtered.filter(report => report.user_id === 'anonymous-user');
    }

    setFilteredReports(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const handleReportSubmit = async (reportData: {
    intensity: number;
    description: string;
  }) => {
    try {
      const currentLocation = await getCurrentLocation(true);
      
      if (!currentLocation) {
        Alert.alert('Error', 'Unable to get your location. Please enable location services.');
        return false;
      }

      // Create timestamp in local timezone (GMT+3)
      const now = new Date();
      const localTimestamp = new Date(now.getTime() + (3 * 60 * 60 * 1000));

      const report: Omit<EarthquakeReport, 'id'> = {
        user_id: 'anonymous-user',
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        intensity: reportData.intensity,
        description: reportData.description,
        timestamp: localTimestamp.toISOString(),
      };

      const { error } = await supabase
        .from('earthquake_reports')
        .insert([report]);

      if (error) {
        console.error('Error submitting report:', error);
        Alert.alert('Error', 'Failed to submit earthquake report');
        return false;
      }

      Alert.alert(
        'Report Submitted',
        'Your earthquake report has been submitted successfully and will appear on the map.',
        [{ text: 'OK' }]
      );

      return true;
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'An error occurred while submitting your report');
      return false;
    }
  };

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

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return colors.success;
    if (intensity <= 5) return colors.warning;
    if (intensity <= 7) return colors.error;
    return '#DC2626';
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity <= 2) return 'Light';
    if (intensity <= 4) return 'Moderate';
    if (intensity <= 6) return 'Strong';
    if (intensity <= 8) return 'Severe';
    return 'Extreme';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed Header */}
      <LinearGradient
        colors={[colors.background, colors.surface]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Map size={24} color={colors.primary} />
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: colors.text }]}>Live Map</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {filteredReports.length} reports
                </Text>
              </View>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '30' }]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} color={colors.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '30' }]}
                onPress={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filters */}
          {showFilters && (
            <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.filtersTitle, { color: colors.text }]}>Filters</Text>
              
              <View style={styles.filterRow}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Time:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filterOptions}>
                    {(['1h', '6h', '24h', '7d', 'all'] as const).map((range) => (
                      <TouchableOpacity
                        key={range}
                        style={[
                          styles.filterOption,
                          { 
                            backgroundColor: filters.timeRange === range ? colors.primary : colors.borderLight,
                            borderColor: colors.border 
                          }
                        ]}
                        onPress={() => setFilters(prev => ({ ...prev, timeRange: range }))}
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            { color: filters.timeRange === range ? '#FFFFFF' : colors.text }
                          ]}
                        >
                          {range === 'all' ? 'All' : range}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.filterRow}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Min:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filterOptions}>
                    {[1, 3, 5, 7].map((intensity) => (
                      <TouchableOpacity
                        key={intensity}
                        style={[
                          styles.filterOption,
                          { 
                            backgroundColor: filters.minIntensity === intensity ? colors.primary : colors.borderLight,
                            borderColor: colors.border 
                          }
                        ]}
                        onPress={() => setFilters(prev => ({ ...prev, minIntensity: intensity }))}
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            { color: filters.minIntensity === intensity ? '#FFFFFF' : colors.text }
                          ]}
                        >
                          {intensity}+
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Map View */}
        <View style={[styles.mapContainer, { borderColor: colors.border }]}>
          <MapView
            reports={filteredReports}
            userLocation={location}
            onReportPress={setSelectedReport}
            loading={loading}
          />
        </View>

        {/* Stats Bar */}
        <View style={[styles.statsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Users size={14} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{filteredReports.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reports</Text>
          </View>
          
          <View style={styles.statItem}>
            <TrendingUp size={14} color={colors.warning} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {filteredReports.length > 0 
                ? Math.max(...filteredReports.map(r => r.intensity)).toFixed(1)
                : '0'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Max</Text>
          </View>
          
          <View style={styles.statItem}>
            <Clock size={14} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {filteredReports.length > 0 
                ? getTimeAgo(new Date(Math.max(...filteredReports.map(r => new Date(r.timestamp).getTime()))))
                : 'N/A'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Latest</Text>
          </View>
        </View>

        {/* Recent Reports List */}
        <View style={styles.reportsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Reports</Text>
          
          {filteredReports.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MapPin size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No Reports Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                No earthquake reports match your current filters
              </Text>
            </View>
          ) : (
            filteredReports.slice(0, 20).map((report) => (
              <TouchableOpacity
                key={report.id}
                style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setSelectedReport(report)}
              >
                <View style={styles.reportHeader}>
                  <View style={[styles.intensityDot, { backgroundColor: getIntensityColor(report.intensity) }]} />
                  <View style={styles.reportInfo}>
                    <Text style={[styles.reportTitle, { color: colors.text }]}>
                      Intensity {report.intensity} • {getIntensityLabel(report.intensity)}
                    </Text>
                    <Text style={[styles.reportTime, { color: colors.textSecondary }]}>
                      {getTimeAgo(new Date(report.timestamp))} • GMT+3
                    </Text>
                  </View>
                </View>
                
                {report.description && (
                  <Text style={[styles.reportDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                    "{report.description}"
                  </Text>
                )}
                
                <Text style={[styles.reportLocation, { color: colors.textSecondary }]}>
                  📍 {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Bottom padding for fixed button */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Fixed Report Button */}
      <View style={[styles.reportButtonContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.reportButton, { backgroundColor: colors.error }]}
          onPress={() => setShowReportModal(true)}
        >
          <AlertTriangle size={20} color="#FFFFFF" />
          <Text style={styles.reportButtonText}>Report Earthquake</Text>
        </TouchableOpacity>
      </View>

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportSubmit}
      />

      {/* Selected Report Details */}
      {selectedReport && (
        <View style={[styles.reportDetails, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.reportDetailsHeader}>
            <View style={styles.reportDetailsInfo}>
              <Text style={[styles.reportDetailsTitle, { color: colors.text }]}>
                Intensity {selectedReport.intensity} • {getIntensityLabel(selectedReport.intensity)}
              </Text>
              <Text style={[styles.reportDetailsTime, { color: colors.textSecondary }]}>
                {getTimeAgo(new Date(selectedReport.timestamp))} • GMT+3
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedReport(null)}
            >
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>×</Text>
            </TouchableOpacity>
          </View>
          
          {selectedReport.description && (
            <Text style={[styles.reportDetailsDescription, { color: colors.textSecondary }]}>
              "{selectedReport.description}"
            </Text>
          )}
          
          <Text style={[styles.reportDetailsLocation, { color: colors.textSecondary }]}>
            📍 {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.1)',
    zIndex: 10,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  filtersContainer: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 12,
    marginRight: 8,
    width: 40,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  filterOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 10,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  reportsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  reportCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  intensityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  reportTime: {
    fontSize: 11,
    marginTop: 2,
  },
  reportDescription: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 6,
    lineHeight: 16,
  },
  reportLocation: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  bottomPadding: {
    height: 100,
  },
  reportButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  reportDetails: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  reportDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  reportDetailsInfo: {
    flex: 1,
  },
  reportDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  reportDetailsTime: {
    fontSize: 11,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  reportDetailsDescription: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 6,
    lineHeight: 16,
  },
  reportDetailsLocation: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
});