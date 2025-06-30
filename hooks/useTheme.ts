import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  borderLight: string;
  shadow: string;
}

const lightTheme: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  secondary: '#8B5CF6',
  accent: '#F59E0B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  shadow: '#000000',
};

const darkTheme: ThemeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#60A5FA',
  primaryLight: '#93C5FD',
  secondary: '#A78BFA',
  accent: '#FBBF24',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  border: '#475569',
  borderLight: '#334155',
  shadow: '#000000',
};

const THEME_STORAGE_KEY = 'app_theme_mode';

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(false);

  // Load theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === 'system') {
        setIsDark(colorScheme === 'dark');
      }
    });

    return () => subscription?.remove();
  }, [themeMode]);

  // Update isDark when themeMode changes
  useEffect(() => {
    updateTheme();
  }, [themeMode]);

  const loadThemePreference = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        const mode = stored as ThemeMode;
        setThemeMode(mode);
      } else {
        // Default to system theme
        updateTheme();
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      updateTheme();
    }
  };

  const updateTheme = () => {
    if (themeMode === 'system') {
      const systemTheme = Appearance.getColorScheme();
      setIsDark(systemTheme === 'dark');
    } else {
      setIsDark(themeMode === 'dark');
    }
  };

  const saveThemePreference = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveThemePreference(mode);
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setTheme(newMode);
  };

  const colors = isDark ? darkTheme : lightTheme;

  return {
    themeMode,
    isDark,
    colors,
    setTheme,
    toggleTheme,
  };
}