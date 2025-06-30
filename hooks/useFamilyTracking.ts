import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useLocation } from './useLocation';

interface FamilyMember {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  isEmergencyContact: boolean;
  lastSeen?: Date;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  status: 'safe' | 'warning' | 'emergency' | 'unknown';
  deviceId: string;
}

interface FamilyGroup {
  id: string;
  name: string;
  code: string;
  members: FamilyMember[];
  createdAt: Date;
  ownerId: string;
}

const FAMILY_STORAGE_KEY = 'family_group_data';
const USER_ID_KEY = 'user_device_id';

export function useFamilyTracking() {
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null);
  const [userDeviceId, setUserDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { getCurrentLocation } = useLocation();

  useEffect(() => {
    initializeUser();
    loadFamilyGroup();
  }, []);

  const initializeUser = async () => {
    try {
      let deviceId = await AsyncStorage.getItem(USER_ID_KEY);
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem(USER_ID_KEY, deviceId);
      }
      setUserDeviceId(deviceId);
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  };

  const loadFamilyGroup = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAMILY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const group: FamilyGroup = {
          ...parsed,
          createdAt: new Date(parsed.createdAt),
          members: parsed.members.map((member: any) => ({
            ...member,
            lastSeen: member.lastSeen ? new Date(member.lastSeen) : undefined,
            location: member.location ? {
              ...member.location,
              timestamp: new Date(member.location.timestamp),
            } : undefined,
          })),
        };
        setFamilyGroup(group);
      }
    } catch (error) {
      console.error('Error loading family group:', error);
    }
  };

  const saveFamilyGroup = async (group: FamilyGroup) => {
    try {
      await AsyncStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(group));
      setFamilyGroup(group);
    } catch (error) {
      console.error('Error saving family group:', error);
    }
  };

  const createFamilyGroup = useCallback(async (groupName: string): Promise<string | null> => {
    if (!userDeviceId) return null;

    setIsLoading(true);
    try {
      const groupCode = Math.random().toString(36).substr(2, 8).toUpperCase();
      const newGroup: FamilyGroup = {
        id: `group_${Date.now()}`,
        name: groupName,
        code: groupCode,
        members: [{
          id: userDeviceId,
          name: 'Me',
          isEmergencyContact: true,
          status: 'safe',
          deviceId: userDeviceId,
        }],
        createdAt: new Date(),
        ownerId: userDeviceId,
      };

      await saveFamilyGroup(newGroup);
      return groupCode;
    } catch (error) {
      console.error('Error creating family group:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userDeviceId]);

  const joinFamilyGroup = useCallback(async (groupCode: string, memberName: string): Promise<boolean> => {
    if (!userDeviceId) return false;

    setIsLoading(true);
    try {
      // In a real app, this would query the server for the group
      // For now, we'll simulate joining a group
      const mockGroup: FamilyGroup = {
        id: `group_${groupCode}`,
        name: 'Family Group',
        code: groupCode,
        members: [
          {
            id: 'owner_device',
            name: 'Group Owner',
            isEmergencyContact: true,
            status: 'safe',
            deviceId: 'owner_device',
          },
          {
            id: userDeviceId,
            name: memberName,
            isEmergencyContact: false,
            status: 'safe',
            deviceId: userDeviceId,
          }
        ],
        createdAt: new Date(),
        ownerId: 'owner_device',
      };

      await saveFamilyGroup(mockGroup);
      return true;
    } catch (error) {
      console.error('Error joining family group:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userDeviceId]);

  const updateMemberStatus = useCallback(async (status: FamilyMember['status']) => {
    if (!familyGroup || !userDeviceId) return;

    try {
      const updatedGroup = {
        ...familyGroup,
        members: familyGroup.members.map(member =>
          member.deviceId === userDeviceId
            ? { ...member, status, lastSeen: new Date() }
            : member
        ),
      };

      await saveFamilyGroup(updatedGroup);
    } catch (error) {
      console.error('Error updating member status:', error);
    }
  }, [familyGroup, userDeviceId]);

  const shareLocation = useCallback(async () => {
    if (!familyGroup || !userDeviceId) return false;

    try {
      const location = await getCurrentLocation(true);
      if (!location) return false;

      const updatedGroup = {
        ...familyGroup,
        members: familyGroup.members.map(member =>
          member.deviceId === userDeviceId
            ? {
                ...member,
                location: {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  timestamp: new Date(),
                },
                lastSeen: new Date(),
              }
            : member
        ),
      };

      await saveFamilyGroup(updatedGroup);
      return true;
    } catch (error) {
      console.error('Error sharing location:', error);
      return false;
    }
  }, [familyGroup, userDeviceId, getCurrentLocation]);

  const leaveFamilyGroup = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(FAMILY_STORAGE_KEY);
      setFamilyGroup(null);
    } catch (error) {
      console.error('Error leaving family group:', error);
    }
  }, []);

  const addEmergencyContact = useCallback(async (name: string, phone?: string, email?: string) => {
    if (!familyGroup) return false;

    try {
      const newMember: FamilyMember = {
        id: `contact_${Date.now()}`,
        name,
        phone,
        email,
        isEmergencyContact: true,
        status: 'unknown',
        deviceId: `contact_${Date.now()}`,
      };

      const updatedGroup = {
        ...familyGroup,
        members: [...familyGroup.members, newMember],
      };

      await saveFamilyGroup(updatedGroup);
      return true;
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      return false;
    }
  }, [familyGroup]);

  const getEmergencyContacts = useCallback(() => {
    return familyGroup?.members.filter(member => member.isEmergencyContact) || [];
  }, [familyGroup]);

  const getFamilyStats = useCallback(() => {
    if (!familyGroup) return { total: 0, safe: 0, warning: 0, emergency: 0, unknown: 0 };

    const stats = familyGroup.members.reduce(
      (acc, member) => {
        acc.total++;
        acc[member.status]++;
        return acc;
      },
      { total: 0, safe: 0, warning: 0, emergency: 0, unknown: 0 }
    );

    return stats;
  }, [familyGroup]);

  return {
    familyGroup,
    userDeviceId,
    isLoading,
    createFamilyGroup,
    joinFamilyGroup,
    updateMemberStatus,
    shareLocation,
    leaveFamilyGroup,
    addEmergencyContact,
    getEmergencyContacts,
    getFamilyStats,
  };
}