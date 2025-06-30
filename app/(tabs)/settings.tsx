import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Zap, Bell, Gauge, RefreshCcw, Moon, Sun, Smartphone } from 'lucide-react-native';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';

export default function SettingsScreen() {
  const { colors, themeMode, isDark, setTheme, toggleTheme } = useTheme();
  const {
    sensitivity,
    setSensitivity,
    enableNotifications,
    setEnableNotifications,
    enableHaptics,
    setEnableHaptics,
    updateRate,
    setUpdateRate,
    resetToDefaults,
  } = useSettings();

  const sensitivityOptions = [
    { label: 'Low', value: 0.5, description: 'Detect only strong movements' },
    { label: 'Medium', value: 1.0, description: 'Balanced sensitivity' },
    { label: 'High', value: 1.5, description: 'Detect subtle movements' },
    { label: 'Very High', value: 2.0, description: 'Maximum sensitivity' },
  ];

  const updateRateOptions = [
    { label: '1 second', value: 1000, description: 'High precision, more battery usage' },
    { label: '2 seconds', value: 2000, description: 'Good balance (recommended)' },
    { label: '3 seconds', value: 3000, description: 'Battery efficient' },
    { label: '5 seconds', value: 5000, description: 'Maximum battery savings' },
  ];

  const themeOptions = [
    { label: 'Light', value: 'light' as const, icon: Sun },
    { label: 'Dark', value: 'dark' as const, icon: Moon },
    { label: 'System', value: 'system' as const, icon: Smartphone },
  ];

  return (
    <LinearGradient
      colors={[colors.background, colors.surface, colors.surfaceSecondary]}
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
            <Settings size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Configure detection parameters</Text>
        </View>

        {/* Theme Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          
          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingHeader}>
              {isDark ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
              <Text style={[styles.settingTitle, { color: colors.text }]}>Theme</Text>
            </View>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Choose your preferred app appearance
            </Text>
            
            <View style={styles.optionsContainer}>
              {themeOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      { 
                        backgroundColor: themeMode === option.value ? colors.primary : colors.borderLight,
                        borderColor: colors.border 
                      }
                    ]}
                    onPress={() => setTheme(option.value)}
                  >
                    <IconComponent 
                      size={16} 
                      color={themeMode === option.value ? '#FFFFFF' : colors.text} 
                    />
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: themeMode === option.value ? '#FFFFFF' : colors.text }
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Detection Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Detection</Text>
          
          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingHeader}>
              <Gauge size={20} color={colors.primary} />
              <Text style={[styles.settingTitle, { color: colors.text }]}>Sensitivity</Text>
            </View>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Adjust how sensitive the earthquake detection should be
            </Text>
            
            <View style={styles.optionsContainer}>
              {sensitivityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: sensitivity === option.value ? colors.primary : colors.borderLight,
                      borderColor: colors.border 
                    }
                  ]}
                  onPress={() => setSensitivity(option.value)}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: sensitivity === option.value ? '#FFFFFF' : colors.text }
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      { color: sensitivity === option.value ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
                    ]}
                  >
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingHeader}>
              <Zap size={20} color={colors.warning} />
              <Text style={[styles.settingTitle, { color: colors.text }]}>Update Rate</Text>
            </View>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              How frequently sensor data is collected (affects battery life)
            </Text>
            
            <View style={styles.optionsContainer}>
              {updateRateOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: updateRate === option.value ? colors.primary : colors.borderLight,
                      borderColor: colors.border 
                    }
                  ]}
                  onPress={() => setUpdateRate(option.value)}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: updateRate === option.value ? '#FFFFFF' : colors.text }
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      { color: updateRate === option.value ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
                    ]}
                  >
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          
          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Bell size={20} color={colors.success} />
                <View style={styles.toggleInfo}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Push Notifications</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Receive alerts when earthquakes are detected
                  </Text>
                </View>
              </View>
              <Switch
                value={enableNotifications}
                onValueChange={setEnableNotifications}
                trackColor={{ false: colors.borderLight, true: colors.success }}
                thumbColor={enableNotifications ? '#FFFFFF' : colors.textSecondary}
              />
            </View>
          </View>

          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <RefreshCcw size={20} color={colors.secondary} />
                <View style={styles.toggleInfo}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Haptic Feedback</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Feel vibrations when earthquakes are detected
                  </Text>
                </View>
              </View>
              <Switch
                value={enableHaptics}
                onValueChange={setEnableHaptics}
                trackColor={{ false: colors.borderLight, true: colors.secondary }}
                thumbColor={enableHaptics ? '#FFFFFF' : colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Battery Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Battery Optimization</Text>
          
          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.batteryInfo}>
              <Text style={[styles.batteryTitle, { color: colors.text }]}>Current Settings Impact</Text>
              <Text style={[styles.batteryDescription, { color: colors.textSecondary }]}>
                Update rate: {updateRate === 1000 ? 'High' : updateRate === 2000 ? 'Medium' : updateRate === 3000 ? 'Low' : 'Very Low'} battery usage
              </Text>
              <Text style={[styles.batteryTip, { color: colors.warning }]}>
                💡 Tip: Use 2-3 second intervals for optimal battery life while maintaining good earthquake detection.
              </Text>
            </View>
          </View>
        </View>

        {/* Early Warning System Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Early Warning System</Text>
          
          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoContainer}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>How It Works</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                • Monitors earthquake reports from other users in real-time
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                • Calculates seismic wave arrival times based on distance
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                • Sends push notifications with estimated arrival time
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                • Urgent alerts for waves arriving in less than 10 seconds
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                • Uses S-wave speed of 3.5 km/s for calculations
              </Text>
            </View>
          </View>
        </View>

        {/* Reset Button */}
        <TouchableOpacity
          style={[styles.resetButton, { borderColor: colors.error }]}
          onPress={resetToDefaults}
        >
          <RefreshCcw size={16} color={colors.error} />
          <Text style={[styles.resetButtonText, { color: colors.error }]}>Reset Settings to Defaults</Text>
        </TouchableOpacity>
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
    marginBottom: 32,
    paddingTop: 50,
  },
  headerIcon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  batteryInfo: {
    alignItems: 'center',
  },
  batteryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  batteryDescription: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  batteryTip: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoContainer: {
    paddingVertical: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 16,
  },
  resetButtonText: {
    fontWeight: '600',
    marginLeft: 8,
  },
});