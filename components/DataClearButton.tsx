import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Trash2, Database, TriangleAlert as AlertTriangle } from 'lucide-react-native';

interface DataClearButtonProps {
  onClearComplete?: (success: boolean) => void;
}

export function DataClearButton({ onClearComplete }: DataClearButtonProps) {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearData = async () => {
    Alert.alert(
      'Clear All Database Data',
      'This will permanently delete ALL data from the Supabase tables:\n\n• User Locations\n• Earthquake Events\n• Sensor Readings\n• Earthquake Reports\n\nThis action cannot be undone. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              const response = await fetch('/clear-data', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              const result = await response.json();

              if (result.success) {
                Alert.alert(
                  'Data Cleared Successfully',
                  `All data has been cleared from the database:\n\n` +
                  `• User Locations: ${result.results.userLocations.count} rows deleted\n` +
                  `• Earthquake Events: ${result.results.earthquakeEvents.count} rows deleted\n` +
                  `• Sensor Readings: ${result.results.sensorReadings.count} rows deleted\n` +
                  `• Earthquake Reports: ${result.results.earthquakeReports.count} rows deleted\n\n` +
                  `Verification:\n` +
                  `• User Locations: ${result.verification.userLocations} rows remaining\n` +
                  `• Earthquake Events: ${result.verification.earthquakeEvents} rows remaining\n` +
                  `• Sensor Readings: ${result.verification.sensorReadings} rows remaining\n` +
                  `• Earthquake Reports: ${result.verification.earthquakeReports} rows remaining`,
                  [{ text: 'OK' }]
                );
                onClearComplete?.(true);
              } else {
                Alert.alert(
                  'Clear Data Failed',
                  `Some operations failed:\n\n${result.message}\n\nPlease check the console for details.`,
                  [{ text: 'OK' }]
                );
                onClearComplete?.(false);
              }
            } catch (error) {
              Alert.alert(
                'Error',
                'An error occurred while clearing data. Please try again.',
                [{ text: 'OK' }]
              );
              onClearComplete?.(false);
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.warningContainer}>
        <AlertTriangle size={20} color="#F59E0B" />
        <Text style={styles.warningText}>
          Database Management
        </Text>
      </View>
      
      <Text style={styles.description}>
        Clear all data from Supabase tables including earthquake reports and map data while preserving table structure and schema.
      </Text>

      <TouchableOpacity
        style={[styles.clearButton, isClearing && styles.clearButtonDisabled]}
        onPress={handleClearData}
        disabled={isClearing}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          {isClearing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Database size={20} color="#FFFFFF" />
          )}
          <Text style={styles.buttonText}>
            {isClearing ? 'Clearing Data...' : 'Clear All Database Data'}
          </Text>
          <Trash2 size={16} color="#FFFFFF" style={styles.trashIcon} />
        </View>
      </TouchableOpacity>
      
      <Text style={styles.note}>
        ⚠️ This action is irreversible. All earthquake events, locations, sensor readings, and map reports will be permanently deleted.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#DC2626',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  clearButtonDisabled: {
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
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    marginRight: 8,
  },
  trashIcon: {
    opacity: 0.8,
  },
  note: {
    fontSize: 12,
    color: '#FBBF24',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});