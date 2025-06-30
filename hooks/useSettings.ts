import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Settings {
  sensitivity: number;
  enableNotifications: boolean;
  enableHaptics: boolean;
  updateRate: number;
}

const DEFAULT_SETTINGS: Settings = {
  sensitivity: 1.0,
  enableNotifications: true,
  enableHaptics: true,
  updateRate: 2000, // 2 seconds for battery efficiency
};

const SETTINGS_KEY = 'app_settings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const resetToDefaults = () => {
    saveSettings(DEFAULT_SETTINGS);
  };

  return {
    ...settings,
    setSensitivity: (value: number) => updateSetting('sensitivity', value),
    setEnableNotifications: (value: boolean) => updateSetting('enableNotifications', value),
    setEnableHaptics: (value: boolean) => updateSetting('enableHaptics', value),
    setUpdateRate: (value: number) => updateSetting('updateRate', value),
    resetToDefaults,
  };
}