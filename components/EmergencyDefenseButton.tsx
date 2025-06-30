import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Shield, ShieldCheck, Power, MapPin, Smartphone, TriangleAlert as AlertTriangle, Clock, Sun, Zap } from 'lucide-react-native';
import { useEmergencyDefense } from '@/hooks/useEmergencyDefense';

interface EmergencyDefenseButtonProps {
  onActivate?: (success: boolean) => void;
  onDeactivate?: (success: boolean) => void;
}

export function EmergencyDefenseButton({ 
  onActivate, 
  onDeactivate 
}: EmergencyDefenseButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [falseAlarmTimeRemaining, setFalseAlarmTimeRemaining] = useState(0);
  
  const { 
    defenseState, 
    activateEmergencyDefense, 
    deactivateEmergencyDefense,
    restoreBrightness,
    emergencyBrightnessRestore,
    disableForFalseAlarm,
    getDefenseStatus,
    getRemainingFalseAlarmTime
  } = useEmergencyDefense();

  // Update false alarm time remaining every minute
  useEffect(() => {
    const updateTimer = () => {
      setFalseAlarmTimeRemaining(getRemainingFalseAlarmTime());
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [getRemainingFalseAlarmTime, defenseState.falseAlarmDisabled]);

  const handleToggleDefense = async () => {
    setIsProcessing(true);
    
    try {
      if (defenseState.isActive) {
        const success = await deactivateEmergencyDefense();
        onDeactivate?.(success);
      } else {
        const success = await activateEmergencyDefense();
        onActivate?.(success);
      }
    } catch (error) {
      console.error('Error toggling emergency defense:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFalseAlarmDisable = async () => {
    setIsProcessing(true);
    
    try {
      await disableForFalseAlarm();
    } catch (error) {
      console.error('Error disabling for false alarm:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreBrightness = async () => {
    setIsProcessing(true);
    
    try {
      if (defenseState.isActive) {
        await restoreBrightness();
      } else {
        // Emergency restore - can be used anytime
        await emergencyBrightnessRestore();
      }
    } catch (error) {
      console.error('Error restoring brightness:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const status = getDefenseStatus();

  return (
    <View style={styles.container}>
      {/* Emergency Brightness Restore Button - Always Available */}
      <TouchableOpacity
        style={styles.emergencyBrightnessButton}
        onPress={handleRestoreBrightness}
        disabled={isProcessing}
        activeOpacity={0.8}
      >
        <View style={styles.emergencyBrightnessContent}>
          <View style={styles.iconContainer}>
            <Zap size={20} color="#F59E0B" />
          </View>
          <Text style={styles.emergencyBrightnessText}>
            Emergency Brightness Restore
          </Text>
        </View>
      </TouchableOpacity>

      {/* Main Emergency Defense Button */}
      <TouchableOpacity
        style={[
          styles.defenseButton,
          defenseState.isActive && styles.defenseButtonActive,
          defenseState.falseAlarmDisabled && styles.defenseButtonDisabled,
          isProcessing && styles.defenseButtonProcessing,
        ]}
        onPress={handleToggleDefense}
        disabled={isProcessing || defenseState.falseAlarmDisabled}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : defenseState.isActive ? (
            <ShieldCheck size={24} color="#FFFFFF" />
          ) : defenseState.falseAlarmDisabled ? (
            <AlertTriangle size={24} color="#FFFFFF" />
          ) : (
            <Shield size={24} color="#FFFFFF" />
          )}
          
          <Text style={styles.buttonText}>
            {isProcessing 
              ? (defenseState.isActive ? 'Deactivating...' : 'Activating...') 
              : defenseState.falseAlarmDisabled
                ? `Disabled (${falseAlarmTimeRemaining}m remaining)`
                : defenseState.isActive 
                  ? 'Deactivate Defense Mode' 
                  : 'Activate Emergency Defense'
            }
          </Text>
        </View>
      </TouchableOpacity>

      {/* Brightness Restore Button (when Defense is active) */}
      {defenseState.isActive && status.brightnessReduced && (
        <TouchableOpacity
          style={styles.brightnessButton}
          onPress={handleRestoreBrightness}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <View style={styles.brightnessContent}>
            <Sun size={18} color="#F59E0B" />
            <Text style={styles.brightnessText}>
              Restore Screen Brightness
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* False Alarm Button */}
      {(defenseState.isActive || defenseState.falseAlarmDisabled) && (
        <TouchableOpacity
          style={[
            styles.falseAlarmButton,
            defenseState.falseAlarmDisabled && styles.falseAlarmButtonActive,
          ]}
          onPress={handleFalseAlarmDisable}
          disabled={isProcessing || defenseState.falseAlarmDisabled}
          activeOpacity={0.8}
        >
          <View style={styles.falseAlarmContent}>
            <AlertTriangle size={16} color={defenseState.falseAlarmDisabled ? "#F59E0B" : "#EF4444"} />
            <Text style={[
              styles.falseAlarmText,
              defenseState.falseAlarmDisabled && styles.falseAlarmTextActive
            ]}>
              {defenseState.falseAlarmDisabled 
                ? `False Alarm Mode Active (${falseAlarmTimeRemaining}m remaining)`
                : 'False Alarm? Disable for 30 minutes'
              }
            </Text>
            {defenseState.falseAlarmDisabled && (
              <Clock size={14} color="#F59E0B" />
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Status Container */}
      {defenseState.isActive && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>🛡️ Emergency Defense Active</Text>
          
          <View style={styles.statusList}>
            <View style={styles.statusItem}>
              <Smartphone size={16} color={status.brightnessReduced ? '#10B981' : status.brightnessRestored ? '#F59E0B' : '#64748B'} />
              <Text style={[
                styles.statusText,
                { color: status.brightnessReduced ? '#10B981' : status.brightnessRestored ? '#F59E0B' : '#64748B' }
              ]}>
                {status.brightnessReduced ? 'Screen brightness reduced' : status.brightnessRestored ? 'Screen brightness restored' : 'Screen brightness unchanged'}
              </Text>
            </View>

            <View style={styles.statusItem}>
              <Power size={16} color={status.batterySavingEnabled ? '#10B981' : '#64748B'} />
              <Text style={[
                styles.statusText,
                { color: status.batterySavingEnabled ? '#10B981' : '#64748B' }
              ]}>
                Power optimization enabled
              </Text>
            </View>

            <View style={styles.statusItem}>
              <MapPin size={16} color={status.locationSent ? '#10B981' : '#64748B'} />
              <Text style={[
                styles.statusText,
                { color: status.locationSent ? '#10B981' : '#64748B' }
              ]}>
                Emergency location transmitted
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* False Alarm Status */}
      {defenseState.falseAlarmDisabled && (
        <View style={styles.falseAlarmStatusContainer}>
          <Text style={styles.falseAlarmStatusTitle}>⏸️ False Alarm Protection</Text>
          <Text style={styles.falseAlarmStatusText}>
            Emergency Defense Mode is temporarily disabled to prevent false activations.
          </Text>
          <Text style={styles.falseAlarmStatusTime}>
            Re-enables automatically in {falseAlarmTimeRemaining} minutes
          </Text>
        </View>
      )}

      <Text style={styles.description}>
        {defenseState.falseAlarmDisabled 
          ? 'Emergency Defense is temporarily disabled due to false alarm protection. Use Emergency Brightness Restore if needed.'
          : defenseState.isActive 
            ? 'Emergency Defense Mode is protecting your device and conserving battery during the earthquake emergency.'
            : 'Automatically reduces screen brightness, optimizes battery usage, and sends your location to emergency services. Emergency Brightness Restore is always available.'
        }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  emergencyBrightnessButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    minWidth: 280,
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  emergencyBrightnessContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 10,
    padding: 2,
  },
  emergencyBrightnessText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  defenseButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 280,
    shadowColor: '#DC2626',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  defenseButtonActive: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
  },
  defenseButtonDisabled: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  defenseButtonProcessing: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  brightnessButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    minWidth: 280,
  },
  brightnessContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  brightnessText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
  },
  falseAlarmButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    minWidth: 280,
  },
  falseAlarmButtonActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  falseAlarmContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  falseAlarmText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  falseAlarmTextActive: {
    color: '#F59E0B',
  },
  statusContainer: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    width: '100%',
    maxWidth: 320,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusList: {
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  falseAlarmStatusContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    width: '100%',
    maxWidth: 320,
  },
  falseAlarmStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 8,
    textAlign: 'center',
  },
  falseAlarmStatusText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  falseAlarmStatusTime: {
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'center',
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 320,
    lineHeight: 16,
  },
});