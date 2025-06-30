import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, TriangleAlert as AlertTriangle, MapPin } from 'lucide-react-native';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { intensity: number; description: string }) => Promise<boolean>;
}

export function ReportModal({ visible, onClose, onSubmit }: ReportModalProps) {
  const [intensity, setIntensity] = useState<number>(1);
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (intensity < 1 || intensity > 10) {
      Alert.alert('Invalid Intensity', 'Please select an intensity between 1 and 10');
      return;
    }

    setSubmitting(true);
    try {
      const success = await onSubmit({ intensity, description });
      if (success) {
        // Reset form
        setIntensity(1);
        setDescription('');
        onClose();
      }
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setIntensity(1);
      setDescription('');
      onClose();
    }
  };

  const getIntensityColor = (level: number) => {
    if (level <= 3) return '#10B981';
    if (level <= 5) return '#F59E0B';
    if (level <= 7) return '#EF4444';
    return '#DC2626';
  };

  const getIntensityLabel = (level: number) => {
    if (level <= 2) return 'Light';
    if (level <= 4) return 'Moderate';
    if (level <= 6) return 'Strong';
    if (level <= 8) return 'Severe';
    return 'Extreme';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#334155']}
          style={styles.modalContainer}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <AlertTriangle size={24} color="#EF4444" />
              <Text style={styles.title}>Report Earthquake</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={submitting}
            >
              <X size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.locationInfo}>
              <MapPin size={16} color="#60A5FA" />
              <Text style={styles.locationText}>
                Using your current location
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Earthquake Intensity</Text>
              <Text style={styles.sectionSubtitle}>
                Rate the intensity from 1 (barely felt) to 10 (extreme)
              </Text>
              
              <View style={styles.intensityContainer}>
                <Text style={styles.intensityValue}>
                  {intensity} - {getIntensityLabel(intensity)}
                </Text>
                <View 
                  style={[
                    styles.intensityIndicator,
                    { backgroundColor: getIntensityColor(intensity) }
                  ]}
                />
              </View>

              <View style={styles.intensityButtons}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.intensityButton,
                      intensity === level && styles.intensityButtonActive,
                      { borderColor: getIntensityColor(level) },
                      intensity === level && { backgroundColor: getIntensityColor(level) + '20' },
                    ]}
                    onPress={() => setIntensity(level)}
                    disabled={submitting}
                  >
                    <Text
                      style={[
                        styles.intensityButtonText,
                        intensity === level && styles.intensityButtonTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description (Optional)</Text>
              <Text style={styles.sectionSubtitle}>
                Describe what you felt or observed
              </Text>
              
              <TextInput
                style={styles.textInput}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g., Strong shaking for about 30 seconds, items fell off shelves..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={4}
                maxLength={500}
                editable={!submitting}
              />
              <Text style={styles.characterCount}>
                {description.length}/500 characters
              </Text>
            </View>

            <View style={styles.warningBox}>
              <AlertTriangle size={16} color="#F59E0B" />
              <Text style={styles.warningText}>
                This report will be shared publicly to help others in your area stay informed about seismic activity.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <AlertTriangle size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(71, 85, 105, 0.3)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  locationText: {
    color: '#F8FAFC',
    fontSize: 14,
    marginLeft: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
  },
  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.5)',
  },
  intensityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  intensityIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  intensityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intensityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityButtonActive: {
    borderWidth: 2,
  },
  intensityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  intensityButtonTextActive: {
    color: '#F8FAFC',
  },
  textInput: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.5)',
    borderRadius: 8,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  warningText: {
    color: '#FCD34D',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(71, 85, 105, 0.3)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#7F1D1D',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});