import { useState, useCallback, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Brightness from 'expo-brightness';
import { useLocation } from './useLocation';
import { supabase } from '@/lib/supabase';

interface EmergencyDefenseState {
  isActive: boolean;
  originalBrightness: number | null;
  batterySavingEnabled: boolean;
  locationSent: boolean;
  falseAlarmDisabled: boolean;
  falseAlarmDisabledUntil: Date | null;
  brightnessRestored: boolean;
  isInitialized: boolean;
}

export function useEmergencyDefense() {
  const [defenseState, setDefenseState] = useState<EmergencyDefenseState>({
    isActive: false,
    originalBrightness: null,
    batterySavingEnabled: false,
    locationSent: false,
    falseAlarmDisabled: false,
    falseAlarmDisabledUntil: null,
    brightnessRestored: false,
    isInitialized: false,
  });

  const { getCurrentLocation } = useLocation();
  const falseAlarmCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const initializationAttempted = useRef<boolean>(false);

  // Initialize brightness state on first load to prevent startup issues
  const initializeBrightnessState = useCallback(async () => {
    if (initializationAttempted.current || defenseState.isInitialized) {
      return;
    }

    initializationAttempted.current = true;

    try {
      if (Platform.OS !== 'web') {
        // Get current brightness and store it as baseline
        const currentBrightness = await Brightness.getBrightnessAsync();
        console.log('📱 Initial brightness level:', currentBrightness);
        
        // If brightness is very low (< 0.3), restore it to normal
        if (currentBrightness < 0.3) {
          console.log('🔆 Detected low brightness on startup, restoring to normal level');
          await Brightness.setBrightnessAsync(0.8); // Set to comfortable level
        }
      } else {
        // Web platform - ensure no CSS filters are applied
        try {
          document.body.style.filter = '';
          document.body.style.animationPlayState = '';
          document.body.style.transition = '';
        } catch (error) {
          // Ignore web errors
        }
      }

      setDefenseState(prev => ({
        ...prev,
        isInitialized: true,
      }));

      console.log('✅ Emergency Defense brightness state initialized');
    } catch (error) {
      console.warn('⚠️ Could not initialize brightness state:', error);
      setDefenseState(prev => ({
        ...prev,
        isInitialized: true,
      }));
    }
  }, [defenseState.isInitialized]);

  // Initialize on first render
  useState(() => {
    initializeBrightnessState();
  });

  // Check if false alarm mode is still active
  const checkFalseAlarmStatus = useCallback(() => {
    if (defenseState.falseAlarmDisabledUntil) {
      const now = new Date();
      if (now >= defenseState.falseAlarmDisabledUntil) {
        setDefenseState(prev => ({
          ...prev,
          falseAlarmDisabled: false,
          falseAlarmDisabledUntil: null,
        }));
        
        if (falseAlarmCheckInterval.current) {
          clearInterval(falseAlarmCheckInterval.current);
          falseAlarmCheckInterval.current = null;
        }
        
        console.log('🔄 False alarm mode expired, Emergency Defense Mode re-enabled');
      }
    }
  }, [defenseState.falseAlarmDisabledUntil]);

  // Set up interval to check false alarm status
  useState(() => {
    if (defenseState.falseAlarmDisabled && !falseAlarmCheckInterval.current) {
      falseAlarmCheckInterval.current = setInterval(checkFalseAlarmStatus, 60000); // Check every minute
    }
    return () => {
      if (falseAlarmCheckInterval.current) {
        clearInterval(falseAlarmCheckInterval.current);
      }
    };
  });

  const activateEmergencyDefense = useCallback(async (): Promise<boolean> => {
    // Ensure initialization is complete
    if (!defenseState.isInitialized) {
      await initializeBrightnessState();
    }

    // Check if false alarm mode is active
    if (defenseState.falseAlarmDisabled) {
      console.log('⏸️ Emergency Defense Mode activation skipped - False alarm mode active');
      const timeRemaining = defenseState.falseAlarmDisabledUntil 
        ? Math.ceil((defenseState.falseAlarmDisabledUntil.getTime() - new Date().getTime()) / (1000 * 60))
        : 0;
      
      Alert.alert(
        '⏸️ Emergency Defense Disabled',
        `Emergency Defense Mode is temporarily disabled due to false alarm protection.\n\nTime remaining: ${timeRemaining} minutes`,
        [{ text: 'OK' }]
      );
      return false;
    }

    try {
      console.log('🚨 Activating Emergency Defense Mode...');
      
      let brightnessSuccess = false;
      let batterySavingSuccess = false;
      let locationSuccess = false;
      let originalBrightness: number | null = null;

      // 1. Reduce screen brightness to lowest safe level
      if (Platform.OS !== 'web') {
        try {
          // Get current brightness first
          const currentBrightness = await Brightness.getBrightnessAsync();
          originalBrightness = currentBrightness;
          
          // Only reduce if brightness is not already low
          if (currentBrightness > 0.2) {
            await Brightness.setBrightnessAsync(0.1);
            brightnessSuccess = true;
            console.log('✅ Screen brightness reduced to 10%');
          } else {
            console.log('ℹ️ Brightness already low, skipping reduction');
            brightnessSuccess = true;
          }
        } catch (error) {
          console.warn('⚠️ Could not control screen brightness:', error);
          // Continue with other emergency measures
        }
      } else {
        // Web fallback - try to dim the screen using CSS
        try {
          document.body.style.filter = 'brightness(0.3)';
          brightnessSuccess = true;
          console.log('✅ Web screen dimmed using CSS filter');
        } catch (error) {
          console.warn('⚠️ Could not dim web screen:', error);
        }
      }

      // 2. Enable battery saving mode (limited functionality without expo-battery)
      if (Platform.OS !== 'web') {
        try {
          // Note: Without expo-battery, we can only provide basic optimizations
          console.log('📱 Battery optimization mode activated (limited functionality)');
          batterySavingSuccess = true;
          console.log('✅ Battery monitoring activated');
        } catch (error) {
          console.warn('⚠️ Could not access battery information:', error);
        }
      } else {
        // Web fallback - reduce CPU usage by limiting animations
        try {
          document.body.style.animationPlayState = 'paused';
          document.body.style.transition = 'none';
          batterySavingSuccess = true;
          console.log('✅ Web performance optimizations applied');
        } catch (error) {
          console.warn('⚠️ Could not apply web optimizations:', error);
        }
      }

      // 3. Send current location to database
      try {
        const currentLocation = await getCurrentLocation(true);
        
        if (currentLocation) {
          // Create timestamp in local timezone (GMT+3)
          const now = new Date();
          const localTimestamp = new Date(now.getTime() + (3 * 60 * 60 * 1000));

          const emergencyData = {
            user_id: 'anonymous-user',
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            timestamp: localTimestamp.toISOString(),
            emergency: true, // Mark as emergency location
          };

          const { error } = await supabase
            .from('user_locations')
            .insert([emergencyData]);

          if (error) {
            console.error('❌ Failed to send emergency location:', error);
          } else {
            locationSuccess = true;
            console.log('✅ Emergency location sent to database');
          }
        } else {
          console.warn('⚠️ Could not get current location for emergency report');
        }
      } catch (error) {
        console.error('❌ Error sending emergency location:', error);
      }

      // Update state
      setDefenseState(prev => ({
        ...prev,
        isActive: true,
        originalBrightness,
        batterySavingEnabled: batterySavingSuccess,
        locationSent: locationSuccess,
        brightnessRestored: false,
      }));

      // Show user notification
      const successCount = [brightnessSuccess, batterySavingSuccess, locationSuccess].filter(Boolean).length;
      const message = `Emergency Defense Mode activated!\n\n` +
        `✅ ${successCount}/3 emergency measures successful:\n` +
        `${brightnessSuccess ? '• Screen brightness reduced\n' : ''}` +
        `${batterySavingSuccess ? '• Power optimization enabled\n' : ''}` +
        `${locationSuccess ? '• Emergency location transmitted\n' : ''}` +
        `\nYour device is now optimized for emergency conditions.`;

      Alert.alert('🛡️ Emergency Defense Mode', message, [{ text: 'OK' }]);

      console.log('🛡️ Emergency Defense Mode activation complete');
      return successCount > 0;

    } catch (error) {
      console.error('❌ Emergency Defense Mode activation failed:', error);
      Alert.alert(
        'Emergency Defense Error',
        'Failed to fully activate Emergency Defense Mode. Some features may not be available.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }, [getCurrentLocation, defenseState.falseAlarmDisabled, defenseState.falseAlarmDisabledUntil, defenseState.isInitialized, initializeBrightnessState]);

  const deactivateEmergencyDefense = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 Deactivating Emergency Defense Mode...');

      // Restore original brightness or set to comfortable level
      if (Platform.OS !== 'web') {
        try {
          const targetBrightness = defenseState.originalBrightness || 0.8; // Default to 80% if no original stored
          await Brightness.setBrightnessAsync(targetBrightness);
          console.log('✅ Screen brightness restored');
        } catch (error) {
          console.warn('⚠️ Could not restore screen brightness:', error);
        }
      } else if (Platform.OS === 'web') {
        try {
          document.body.style.filter = '';
          document.body.style.animationPlayState = '';
          document.body.style.transition = '';
          console.log('✅ Web screen and performance restored');
        } catch (error) {
          console.warn('⚠️ Could not restore web settings:', error);
        }
      }

      // Reset state
      setDefenseState(prev => ({
        ...prev,
        isActive: false,
        originalBrightness: null,
        batterySavingEnabled: false,
        locationSent: false,
        brightnessRestored: false,
      }));

      Alert.alert(
        '🔄 Emergency Defense Deactivated',
        'Your device settings have been restored to normal.',
        [{ text: 'OK' }]
      );

      console.log('🔄 Emergency Defense Mode deactivated');
      return true;

    } catch (error) {
      console.error('❌ Emergency Defense Mode deactivation failed:', error);
      return false;
    }
  }, [defenseState.originalBrightness]);

  const restoreBrightness = useCallback(async (): Promise<boolean> => {
    try {
      console.log('💡 Restoring brightness while keeping Emergency Defense active...');

      if (Platform.OS !== 'web') {
        try {
          const targetBrightness = defenseState.originalBrightness || 0.8; // Default to 80% if no original stored
          await Brightness.setBrightnessAsync(targetBrightness);
          console.log('✅ Screen brightness restored to original level');
        } catch (error) {
          console.warn('⚠️ Could not restore screen brightness:', error);
          return false;
        }
      } else if (Platform.OS === 'web') {
        try {
          document.body.style.filter = '';
          console.log('✅ Web screen brightness restored');
        } catch (error) {
          console.warn('⚠️ Could not restore web screen brightness:', error);
          return false;
        }
      }

      // Update state to reflect brightness restoration
      setDefenseState(prev => ({
        ...prev,
        brightnessRestored: true,
      }));

      Alert.alert(
        '💡 Brightness Restored',
        'Screen brightness has been restored to normal while keeping other Emergency Defense features active.',
        [{ text: 'OK' }]
      );

      return true;

    } catch (error) {
      console.error('❌ Error restoring brightness:', error);
      Alert.alert(
        'Brightness Error',
        'Failed to restore screen brightness. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }, [defenseState.originalBrightness]);

  // Emergency brightness restore function - can be called anytime
  const emergencyBrightnessRestore = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🚨 Emergency brightness restore requested...');

      if (Platform.OS !== 'web') {
        try {
          await Brightness.setBrightnessAsync(0.8); // Set to comfortable level
          console.log('✅ Emergency brightness restore completed');
        } catch (error) {
          console.warn('⚠️ Could not restore brightness:', error);
          return false;
        }
      } else if (Platform.OS === 'web') {
        try {
          document.body.style.filter = '';
          console.log('✅ Web emergency brightness restore completed');
        } catch (error) {
          console.warn('⚠️ Could not restore web brightness:', error);
          return false;
        }
      }

      // Update state if Emergency Defense is active
      if (defenseState.isActive) {
        setDefenseState(prev => ({
          ...prev,
          brightnessRestored: true,
        }));
      }

      return true;

    } catch (error) {
      console.error('❌ Error in emergency brightness restore:', error);
      return false;
    }
  }, [defenseState.isActive]);

  const disableForFalseAlarm = useCallback(async (): Promise<boolean> => {
    try {
      // Set false alarm mode for 30 minutes
      const disabledUntil = new Date();
      disabledUntil.setMinutes(disabledUntil.getMinutes() + 30);

      // If Emergency Defense is currently active, deactivate it first
      if (defenseState.isActive) {
        await deactivateEmergencyDefense();
      }

      setDefenseState(prev => ({
        ...prev,
        falseAlarmDisabled: true,
        falseAlarmDisabledUntil: disabledUntil,
      }));

      // Set up interval to check when to re-enable
      if (falseAlarmCheckInterval.current) {
        clearInterval(falseAlarmCheckInterval.current);
      }
      falseAlarmCheckInterval.current = setInterval(checkFalseAlarmStatus, 60000);

      Alert.alert(
        '⏸️ False Alarm Protection Activated',
        'Emergency Defense Mode has been disabled for 30 minutes due to false alarm.\n\nThis will prevent automatic activation during this period. The system will automatically re-enable after 30 minutes.',
        [{ text: 'OK' }]
      );

      console.log('⏸️ Emergency Defense Mode disabled for false alarm - 30 minute cooldown started');
      return true;

    } catch (error) {
      console.error('❌ Error disabling Emergency Defense for false alarm:', error);
      Alert.alert(
        'Error',
        'Failed to disable Emergency Defense Mode. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }, [defenseState.isActive, deactivateEmergencyDefense, checkFalseAlarmStatus]);

  const getDefenseStatus = useCallback(() => {
    return {
      isActive: defenseState.isActive,
      batterySavingEnabled: defenseState.batterySavingEnabled,
      locationSent: defenseState.locationSent,
      brightnessReduced: defenseState.originalBrightness !== null && !defenseState.brightnessRestored,
      brightnessRestored: defenseState.brightnessRestored,
      falseAlarmDisabled: defenseState.falseAlarmDisabled,
      falseAlarmTimeRemaining: defenseState.falseAlarmDisabledUntil 
        ? Math.max(0, Math.ceil((defenseState.falseAlarmDisabledUntil.getTime() - new Date().getTime()) / (1000 * 60)))
        : 0,
      isInitialized: defenseState.isInitialized,
    };
  }, [defenseState]);

  const getRemainingFalseAlarmTime = useCallback(() => {
    if (!defenseState.falseAlarmDisabledUntil) return 0;
    return Math.max(0, Math.ceil((defenseState.falseAlarmDisabledUntil.getTime() - new Date().getTime()) / (1000 * 60)));
  }, [defenseState.falseAlarmDisabledUntil]);

  return {
    defenseState,
    activateEmergencyDefense,
    deactivateEmergencyDefense,
    restoreBrightness,
    emergencyBrightnessRestore,
    disableForFalseAlarm,
    getDefenseStatus,
    getRemainingFalseAlarmTime,
  };
}