import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EarthquakeEvent {
  timestamp: Date;
  intensity: number;
  duration: number;
  peakAcceleration: number;
}

const STORAGE_KEY = 'earthquake_history';

export function useEarthquakeHistory() {
  const [earthquakeHistory, setEarthquakeHistory] = useState<EarthquakeEvent[]>([]);

  // Load history from storage on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        // Convert timestamp strings back to Date objects
        const history = parsed.map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp),
        }));
        setEarthquakeHistory(history);
      }
    } catch (error) {
      console.error('Error loading earthquake history:', error);
    }
  };

  const saveHistory = async (history: EarthquakeEvent[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving earthquake history:', error);
    }
  };

  const addEarthquakeEvent = (event: EarthquakeEvent) => {
    setEarthquakeHistory(prev => {
      const updated = [event, ...prev].slice(0, 100); // Keep only last 100 events
      saveHistory(updated);
      return updated;
    });
  };

  const removeEvent = (index: number) => {
    setEarthquakeHistory(prev => {
      const updated = prev.filter((_, i) => i !== index);
      saveHistory(updated);
      return updated;
    });
  };

  const clearHistory = () => {
    setEarthquakeHistory([]);
    saveHistory([]);
  };

  return {
    earthquakeHistory,
    addEarthquakeEvent,
    removeEvent,
    clearHistory,
  };
}