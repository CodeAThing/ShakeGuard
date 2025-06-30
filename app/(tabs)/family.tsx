import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, UserPlus, MapPin, Phone, Mail, Shield, Clock, Share2, Settings, Plus, X, Copy, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Heart } from 'lucide-react-native';
import { useFamilyTracking } from '@/hooks/useFamilyTracking';
import { useTheme } from '@/hooks/useTheme';

export default function FamilyScreen() {
  const { colors } = useTheme();
  const {
    familyGroup,
    isLoading,
    createFamilyGroup,
    joinFamilyGroup,
    updateMemberStatus,
    shareLocation,
    leaveFamilyGroup,
    addEmergencyContact,
    getEmergencyContacts,
    getFamilyStats,
  } = useFamilyTracking();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [memberName, setMemberName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const stats = getFamilyStats();
  const emergencyContacts = getEmergencyContacts();

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    const code = await createFamilyGroup(groupName.trim());
    if (code) {
      Alert.alert(
        'Group Created!',
        `Your family group "${groupName}" has been created.\n\nShare this code with family members: ${code}`,
        [
          { text: 'Copy Code', onPress: () => {/* Copy to clipboard */} },
          { text: 'OK' }
        ]
      );
      setShowCreateModal(false);
      setGroupName('');
    } else {
      Alert.alert('Error', 'Failed to create group. Please try again.');
    }
  };

  const handleJoinGroup = async () => {
    if (!groupCode.trim() || !memberName.trim()) {
      Alert.alert('Error', 'Please enter both group code and your name');
      return;
    }

    const success = await joinFamilyGroup(groupCode.trim().toUpperCase(), memberName.trim());
    if (success) {
      Alert.alert('Success', 'You have joined the family group!');
      setShowJoinModal(false);
      setGroupCode('');
      setMemberName('');
    } else {
      Alert.alert('Error', 'Failed to join group. Please check the code and try again.');
    }
  };

  const handleAddContact = async () => {
    if (!contactName.trim()) {
      Alert.alert('Error', 'Please enter a contact name');
      return;
    }

    const success = await addEmergencyContact(
      contactName.trim(),
      contactPhone.trim() || undefined,
      contactEmail.trim() || undefined
    );

    if (success) {
      Alert.alert('Success', 'Emergency contact added!');
      setShowAddContactModal(false);
      setContactName('');
      setContactPhone('');
      setContactEmail('');
    } else {
      Alert.alert('Error', 'Failed to add contact. Please try again.');
    }
  };

  const handleStatusUpdate = (status: 'safe' | 'warning' | 'emergency') => {
    updateMemberStatus(status);
    Alert.alert('Status Updated', `Your status has been updated to ${status.toUpperCase()}`);
  };

  const handleShareLocation = async () => {
    const success = await shareLocation();
    if (success) {
      Alert.alert('Location Shared', 'Your current location has been shared with your family group');
    } else {
      Alert.alert('Error', 'Failed to share location. Please check your location permissions.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return colors.success;
      case 'warning': return colors.warning;
      case 'emergency': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle size={16} color={colors.success} />;
      case 'warning': return <AlertTriangle size={16} color={colors.warning} />;
      case 'emergency': return <AlertTriangle size={16} color={colors.error} />;
      default: return <Clock size={16} color={colors.textSecondary} />;
    }
  };

  const formatLastSeen = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (!familyGroup) {
    return (
      <LinearGradient
        colors={[colors.background, colors.surface, colors.surfaceSecondary]}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <Users size={48} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Family Safety Network</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Connect with family members to share safety status and location during emergencies
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Create Family Group</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={() => setShowJoinModal(true)}
            >
              <UserPlus size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Join Family Group</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Heart size={24} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>Stay Connected During Emergencies</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • Share real-time safety status with family members
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • Automatically share location during earthquake events
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • Quick access to emergency contacts
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • Coordinate family emergency response
            </Text>
          </View>
        </ScrollView>

        {/* Create Group Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Create Family Group</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter group name (e.g., Smith Family)"
                placeholderTextColor={colors.textSecondary}
                value={groupName}
                onChangeText={setGroupName}
              />

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateGroup}
                disabled={isLoading}
              >
                <Text style={styles.modalButtonText}>
                  {isLoading ? 'Creating...' : 'Create Group'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Join Group Modal */}
        <Modal visible={showJoinModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Join Family Group</Text>
                <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter group code"
                placeholderTextColor={colors.textSecondary}
                value={groupCode}
                onChangeText={setGroupCode}
                autoCapitalize="characters"
              />

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
                value={memberName}
                onChangeText={setMemberName}
              />

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.secondary }]}
                onPress={handleJoinGroup}
                disabled={isLoading}
              >
                <Text style={styles.modalButtonText}>
                  {isLoading ? 'Joining...' : 'Join Group'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.background, colors.surface, colors.surfaceSecondary]}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>{familyGroup.name}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Code: {familyGroup.code}
              </Text>
            </View>
            <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.primary }]}>
              <Share2 size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.safe}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Safe</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{stats.warning}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Warning</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.error }]}>{stats.emergency}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Emergency</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.textSecondary }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: colors.success }]}
            onPress={() => handleStatusUpdate('safe')}
          >
            <CheckCircle size={20} color="#FFFFFF" />
            <Text style={styles.statusButtonText}>I'm Safe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: colors.warning }]}
            onPress={() => handleStatusUpdate('warning')}
          >
            <AlertTriangle size={20} color="#FFFFFF" />
            <Text style={styles.statusButtonText}>Need Help</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: colors.error }]}
            onPress={() => handleStatusUpdate('emergency')}
          >
            <AlertTriangle size={20} color="#FFFFFF" />
            <Text style={styles.statusButtonText}>Emergency</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.locationButton, { backgroundColor: colors.primary }]}
          onPress={handleShareLocation}
        >
          <MapPin size={20} color="#FFFFFF" />
          <Text style={styles.locationButtonText}>Share My Location</Text>
        </TouchableOpacity>

        {/* Family Members */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Family Members</Text>
          {familyGroup.members.map((member) => (
            <View key={member.id} style={[styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.memberInfo}>
                <View style={styles.memberHeader}>
                  <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                  {getStatusIcon(member.status)}
                </View>
                <Text style={[styles.memberStatus, { color: getStatusColor(member.status) }]}>
                  {member.status.toUpperCase()}
                </Text>
                {member.lastSeen && (
                  <Text style={[styles.memberLastSeen, { color: colors.textSecondary }]}>
                    Last seen: {formatLastSeen(member.lastSeen)}
                  </Text>
                )}
                {member.location && (
                  <Text style={[styles.memberLocation, { color: colors.textSecondary }]}>
                    📍 Location shared {formatLastSeen(member.location.timestamp)}
                  </Text>
                )}
              </View>
              {member.isEmergencyContact && (
                <Shield size={16} color={colors.primary} />
              )}
            </View>
          ))}
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Contacts</Text>
            <TouchableOpacity onPress={() => setShowAddContactModal(true)}>
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {emergencyContacts.map((contact) => (
            <View key={contact.id} style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                {contact.phone && (
                  <View style={styles.contactDetail}>
                    <Phone size={14} color={colors.textSecondary} />
                    <Text style={[styles.contactText, { color: colors.textSecondary }]}>{contact.phone}</Text>
                  </View>
                )}
                {contact.email && (
                  <View style={styles.contactDetail}>
                    <Mail size={14} color={colors.textSecondary} />
                    <Text style={[styles.contactText, { color: colors.textSecondary }]}>{contact.email}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Leave Group */}
        <TouchableOpacity
          style={[styles.leaveButton, { borderColor: colors.error }]}
          onPress={() => {
            Alert.alert(
              'Leave Group',
              'Are you sure you want to leave this family group?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Leave', style: 'destructive', onPress: leaveFamilyGroup },
              ]
            );
          }}
        >
          <Text style={[styles.leaveButtonText, { color: colors.error }]}>Leave Family Group</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal visible={showAddContactModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Emergency Contact</Text>
              <TouchableOpacity onPress={() => setShowAddContactModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Contact name"
              placeholderTextColor={colors.textSecondary}
              value={contactName}
              onChangeText={setContactName}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Phone number (optional)"
              placeholderTextColor={colors.textSecondary}
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Email address (optional)"
              placeholderTextColor={colors.textSecondary}
              value={contactEmail}
              onChangeText={setContactEmail}
              keyboardType="email-address"
            />

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleAddContact}
            >
              <Text style={styles.modalButtonText}>Add Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 24,
    paddingTop: 50,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  shareButton: {
    padding: 12,
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  memberLastSeen: {
    fontSize: 12,
    marginBottom: 2,
  },
  memberLocation: {
    fontSize: 12,
  },
  contactCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  contactDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    marginLeft: 8,
  },
  leaveButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginTop: 16,
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    gap: 16,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});