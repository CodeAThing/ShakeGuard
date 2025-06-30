import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface HeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
  timestamp: Date;
  reportCount: number;
}

interface HeatmapRegion {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  averageIntensity: number;
  reportCount: number;
  lastActivity: Date;
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
}

interface HeatmapFilters {
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  minIntensity: number;
  maxIntensity: number;
}

export function useCommunityHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [regions, setRegions] = useState<HeatmapRegion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<HeatmapFilters>({
    timeRange: '24h',
    minIntensity: 1,
    maxIntensity: 10,
  });

  useEffect(() => {
    loadHeatmapData();
  }, [filters]);

  const loadHeatmapData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Calculate time range
      const now = new Date();
      const timeRanges = {
        '1h': 1 * 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      
      const cutoff = new Date(now.getTime() - timeRanges[filters.timeRange]);

      // Fetch earthquake reports
      const { data: reports, error } = await supabase
        .from('earthquake_reports')
        .select('latitude, longitude, intensity, timestamp')
        .gte('timestamp', cutoff.toISOString())
        .gte('intensity', filters.minIntensity)
        .lte('intensity', filters.maxIntensity)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error loading heatmap data:', error);
        return;
      }

      // Process data into heatmap points
      const processedData = processReportsIntoHeatmap(reports || []);
      setHeatmapData(processedData);

      // Generate regions
      const generatedRegions = generateRegions(processedData);
      setRegions(generatedRegions);

    } catch (error) {
      console.error('Error in loadHeatmapData:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const processReportsIntoHeatmap = (reports: any[]): HeatmapPoint[] => {
    // Group nearby reports (within ~1km) together
    const gridSize = 0.01; // Approximately 1km
    const grid = new Map<string, HeatmapPoint>();

    reports.forEach(report => {
      const gridLat = Math.floor(report.latitude / gridSize) * gridSize;
      const gridLng = Math.floor(report.longitude / gridSize) * gridSize;
      const key = `${gridLat},${gridLng}`;

      if (grid.has(key)) {
        const existing = grid.get(key)!;
        existing.intensity = Math.max(existing.intensity, report.intensity);
        existing.reportCount += 1;
        if (new Date(report.timestamp) > existing.timestamp) {
          existing.timestamp = new Date(report.timestamp);
        }
      } else {
        grid.set(key, {
          latitude: gridLat + gridSize / 2,
          longitude: gridLng + gridSize / 2,
          intensity: report.intensity,
          timestamp: new Date(report.timestamp),
          reportCount: 1,
        });
      }
    });

    return Array.from(grid.values());
  };

  const generateRegions = (heatmapPoints: HeatmapPoint[]): HeatmapRegion[] => {
    if (heatmapPoints.length === 0) return [];

    // Simple clustering algorithm to create regions
    const regions: HeatmapRegion[] = [];
    const regionSize = 0.1; // Approximately 10km

    // Group points into regions
    const regionMap = new Map<string, HeatmapPoint[]>();

    heatmapPoints.forEach(point => {
      const regionLat = Math.floor(point.latitude / regionSize) * regionSize;
      const regionLng = Math.floor(point.longitude / regionSize) * regionSize;
      const key = `${regionLat},${regionLng}`;

      if (!regionMap.has(key)) {
        regionMap.set(key, []);
      }
      regionMap.get(key)!.push(point);
    });

    // Convert to regions
    regionMap.forEach((points, key) => {
      const [latStr, lngStr] = key.split(',');
      const baseLat = parseFloat(latStr);
      const baseLng = parseFloat(lngStr);

      const totalIntensity = points.reduce((sum, p) => sum + p.intensity, 0);
      const totalReports = points.reduce((sum, p) => sum + p.reportCount, 0);
      const averageIntensity = totalIntensity / points.length;
      const maxIntensity = Math.max(...points.map(p => p.intensity));
      const lastActivity = new Date(Math.max(...points.map(p => p.timestamp.getTime())));

      let riskLevel: HeatmapRegion['riskLevel'] = 'low';
      if (maxIntensity >= 7) riskLevel = 'severe';
      else if (maxIntensity >= 5) riskLevel = 'high';
      else if (maxIntensity >= 3) riskLevel = 'moderate';

      regions.push({
        id: key,
        name: `Region ${regions.length + 1}`,
        bounds: {
          north: baseLat + regionSize,
          south: baseLat,
          east: baseLng + regionSize,
          west: baseLng,
        },
        averageIntensity,
        reportCount: totalReports,
        lastActivity,
        riskLevel,
      });
    });

    return regions.sort((a, b) => b.averageIntensity - a.averageIntensity);
  };

  const updateFilters = (newFilters: Partial<HeatmapFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const getHeatmapStats = () => {
    const totalReports = heatmapData.reduce((sum, point) => sum + point.reportCount, 0);
    const averageIntensity = heatmapData.length > 0 
      ? heatmapData.reduce((sum, point) => sum + point.intensity, 0) / heatmapData.length 
      : 0;
    const maxIntensity = heatmapData.length > 0 
      ? Math.max(...heatmapData.map(point => point.intensity)) 
      : 0;
    const activeRegions = regions.length;
    const highRiskRegions = regions.filter(r => r.riskLevel === 'high' || r.riskLevel === 'severe').length;

    return {
      totalReports,
      averageIntensity,
      maxIntensity,
      activeRegions,
      highRiskRegions,
      dataPoints: heatmapData.length,
    };
  };

  const getRegionByLocation = (latitude: number, longitude: number): HeatmapRegion | null => {
    return regions.find(region => 
      latitude >= region.bounds.south &&
      latitude <= region.bounds.north &&
      longitude >= region.bounds.west &&
      longitude <= region.bounds.east
    ) || null;
  };

  const refreshData = () => {
    loadHeatmapData();
  };

  return {
    heatmapData,
    regions,
    isLoading,
    filters,
    updateFilters,
    getHeatmapStats,
    getRegionByLocation,
    refreshData,
  };
}