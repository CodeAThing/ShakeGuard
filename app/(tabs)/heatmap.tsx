import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Map, TrendingUp, MapPin, Clock, Filter, RefreshCw, ChartBar as BarChart3, TriangleAlert as AlertTriangle, Activity, Users, Zap } from 'lucide-react-native';
import { useCommunityHeatmap } from '@/hooks/useCommunityHeatmap';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

export default function HeatmapScreen() {
  const { colors } = useTheme();
  const {
    heatmapData,
    regions,
    isLoading,
    filters,
    updateFilters,
    getHeatmapStats,
    refreshData,
  } = useCommunityHeatmap();

  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const stats = getHeatmapStats();

  const handleRefresh = async () => {
    setRefreshing(true);
    refreshData();
    setRefreshing(false);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return colors.success;
      case 'moderate': return colors.warning;
      case 'high': return colors.error;
      case 'severe': return '#DC2626';
      default: return colors.textSecondary;
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 2) return colors.success;
    if (intensity <= 4) return colors.warning;
    if (intensity <= 6) return colors.error;
    return '#DC2626';
  };

  const formatTimeAgo = (date: Date) => {
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

  return (
    <LinearGradient
      colors={[colors.background, colors.surface, colors.surfaceSecondary]}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Map size={28} color={colors.primary} />
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>Community Heatmap</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {stats.dataPoints} activity points • {filters.timeRange}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '30' }]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '30' }]}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.filtersTitle, { color: colors.text }]}>Filters</Text>
            
            <View style={styles.filterRow}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Time Range:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterOptions}>
                  {(['1h', '6h', '24h', '7d', '30d'] as const).map((range) => (
                    <TouchableOpacity
                      key={range}
                      style={[
                        styles.filterOption,
                        { 
                          backgroundColor: filters.timeRange === range ? colors.primary : colors.borderLight,
                          borderColor: colors.border 
                        }
                      ]}
                      onPress={() => updateFilters({ timeRange: range })}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          { color: filters.timeRange === range ? '#FFFFFF' : colors.text }
                        ]}
                      >
                        {range}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.filterRow}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Min Intensity:</Text>
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
                      onPress={() => updateFilters({ minIntensity: intensity })}
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Activity size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalReports}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Reports</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TrendingUp size={20} color={colors.warning} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.averageIntensity.toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Intensity</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Zap size={20} color={colors.error} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.maxIntensity.toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Max Intensity</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MapPin size={20} color={colors.secondary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.activeRegions}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Regions</Text>
          </View>
        </View>

        {/* Risk Alert */}
        {stats.highRiskRegions > 0 && (
          <View style={[styles.alertCard, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
            <AlertTriangle size={24} color={colors.error} />
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, { color: colors.error }]}>High Risk Areas Detected</Text>
              <Text style={[styles.alertText, { color: colors.text }]}>
                {stats.highRiskRegions} region{stats.highRiskRegions > 1 ? 's' : ''} showing high seismic activity
              </Text>
            </View>
          </View>
        )}

        {/* Heatmap Visualization */}
        <View style={[styles.heatmapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heatmapHeader}>
            <BarChart3 size={24} color={colors.primary} />
            <Text style={[styles.heatmapTitle, { color: colors.text }]}>Activity Heatmap</Text>
          </View>
          
          <View style={styles.heatmapContainer}>
            <View style={[styles.heatmapPlaceholder, { backgroundColor: colors.borderLight }]}>
              <Map size={48} color={colors.textSecondary} />
              <Text style={[styles.heatmapPlaceholderText, { color: colors.textSecondary }]}>
                Interactive heatmap visualization
              </Text>
              <Text style={[styles.heatmapSubtext, { color: colors.textSecondary }]}>
                {stats.dataPoints} data points from {filters.timeRange}
              </Text>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={[styles.legendTitle, { color: colors.text }]}>Intensity Scale:</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: colors.success }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>1-2 Light</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: colors.warning }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>3-4 Moderate</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: colors.error }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>5-6 Strong</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#DC2626' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>7+ Severe</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Active Regions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Regions</Text>
          
          {regions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MapPin size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No Active Regions</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                No earthquake activity detected in the selected time range
              </Text>
            </View>
          ) : (
            regions.map((region) => (
              <View key={region.id} style={[styles.regionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.regionHeader}>
                  <View style={styles.regionInfo}>
                    <Text style={[styles.regionName, { color: colors.text }]}>{region.name}</Text>
                    <View style={styles.regionMeta}>
                      <View style={[styles.riskBadge, { backgroundColor: getRiskColor(region.riskLevel) + '20' }]}>
                        <Text style={[styles.riskText, { color: getRiskColor(region.riskLevel) }]}>
                          {region.riskLevel.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.regionTime, { color: colors.textSecondary }]}>
                        {formatTimeAgo(region.lastActivity)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.regionStats}>
                    <Text style={[styles.regionIntensity, { color: getIntensityColor(region.averageIntensity) }]}>
                      {region.averageIntensity.toFixed(1)}
                    </Text>
                    <Text style={[styles.regionLabel, { color: colors.textSecondary }]}>Avg Intensity</Text>
                  </View>
                </View>
                
                <View style={styles.regionDetails}>
                  <View style={styles.regionDetail}>
                    <Users size={14} color={colors.textSecondary} />
                    <Text style={[styles.regionDetailText, { color: colors.textSecondary }]}>
                      {region.reportCount} reports
                    </Text>
                  </View>
                  <View style={styles.regionDetail}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={[styles.regionDetailText, { color: colors.textSecondary }]}>
                      Last: {formatTimeAgo(region.lastActivity)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity Points</Text>
          
          {heatmapData.slice(0, 10).map((point, index) => (
            <View key={index} style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.activityHeader}>
                <View style={[styles.intensityDot, { backgroundColor: getIntensityColor(point.intensity) }]} />
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityIntensity, { color: colors.text }]}>
                    Intensity {point.intensity.toFixed(1)}
                  </Text>
                  <Text style={[styles.activityLocation, { color: colors.textSecondary }]}>
                    {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                  </Text>
                </View>
                <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                  {formatTimeAgo(point.timestamp)}
                </Text>
              </View>
              
              {point.reportCount > 1 && (
                <Text style={[styles.activityReports, { color: colors.primary }]}>
                  {point.reportCount} reports clustered
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoHeader}>
            <Activity size={24} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>About Community Heatmap</Text>
          </View>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Visualizes earthquake activity patterns across your region
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Clusters nearby reports for clearer visualization
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Identifies high-risk areas based on recent activity
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Updates in real-time as new reports are submitted
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Helps communities prepare for potential seismic events
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
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
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
  },
  heatmapCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  heatmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heatmapTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  heatmapContainer: {
    marginBottom: 16,
  },
  heatmapPlaceholder: {
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatmapPlaceholderText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  heatmapSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  legend: {
    marginTop: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  regionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  regionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  regionInfo: {
    flex: 1,
  },
  regionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  regionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '600',
  },
  regionTime: {
    fontSize: 12,
  },
  regionStats: {
    alignItems: 'center',
  },
  regionIntensity: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  regionLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  regionDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  regionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  regionDetailText: {
    fontSize: 12,
  },
  activityCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intensityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityIntensity: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityLocation: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  activityTime: {
    fontSize: 12,
  },
  activityReports: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});