import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Info, Smartphone, Activity, Zap, ExternalLink, Shield } from 'lucide-react-native';

export default function AboutScreen() {
  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
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
            <Shield size={32} color="#60A5FA" />
          </View>
          <Text style={styles.title}>ShakeGuard</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.tagline}>Your Personal Earthquake Early Warning System</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.description}>
            ShakeGuard is an advanced earthquake detection and early warning app that uses your device's 
            built-in sensors to monitor seismic activity. The app analyzes accelerometer 
            and gyroscope data to detect potential earthquakes and provides instant alerts with 
            estimated arrival times to help keep you and your community safe.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Activity size={20} color="#10B981" />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Real-time Detection</Text>
                <Text style={styles.featureDescription}>
                  Continuous sensor data analysis for immediate earthquake detection
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Zap size={20} color="#F59E0B" />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Early Warning System</Text>
                <Text style={styles.featureDescription}>
                  Calculates seismic wave arrival times and sends push notifications to nearby users
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Smartphone size={20} color="#60A5FA" />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Multi-sensor Analysis</Text>
                <Text style={styles.featureDescription}>
                  Uses both accelerometer and gyroscope for accurate detection
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Shield size={20} color="#8B5CF6" />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Community Protection</Text>
                <Text style={styles.featureDescription}>
                  Crowdsourced earthquake reporting and real-time community alerts
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* How it Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How ShakeGuard Works</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              ShakeGuard continuously monitors your device's accelerometer and gyroscope 
              sensors, analyzing the data for patterns consistent with seismic activity. 
              When unusual vibrations or movements are detected that exceed configured 
              thresholds, the app triggers an earthquake alert.
            </Text>
            
            <Text style={styles.infoText}>
              The early warning system calculates seismic wave arrival times using:
            </Text>
            
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Distance from earthquake epicenter</Text>
              <Text style={styles.bulletItem}>• S-wave speed of 3.5 km/s for calculations</Text>
              <Text style={styles.bulletItem}>• Real-time push notifications to nearby users</Text>
              <Text style={styles.bulletItem}>• Urgent alerts for arrivals under 10 seconds</Text>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Notice</Text>
          
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              ShakeGuard is designed for educational and awareness purposes. It should not 
              be used as a substitute for official earthquake monitoring systems or 
              emergency alerts. Always follow official emergency protocols and 
              evacuation procedures in your area.
            </Text>
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleLinkPress('https://earthquake.usgs.gov/')}
          >
            <Text style={styles.linkText}>USGS Earthquake Hazards Program</Text>
            <ExternalLink size={16} color="#60A5FA" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleLinkPress('https://www.ready.gov/earthquakes')}
          >
            <Text style={styles.linkText}>Earthquake Safety Guidelines</Text>
            <ExternalLink size={16} color="#60A5FA" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built with React Native and Expo
          </Text>
          <Text style={styles.footerText}>
            © 2025 ShakeGuard
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
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  version: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#60A5FA',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#CBD5E1',
    lineHeight: 24,
    textAlign: 'center',
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 12,
  },
  bulletList: {
    marginTop: 8,
  },
  bulletItem: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 4,
  },
  warningCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  warningText: {
    fontSize: 14,
    color: '#FBBF24',
    lineHeight: 20,
    fontWeight: '500',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  linkText: {
    fontSize: 16,
    color: '#60A5FA',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
});