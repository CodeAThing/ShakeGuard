import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EmergencyKitItem {
  id: string;
  name: string;
  description: string;
  category: 'water' | 'food' | 'medical' | 'tools' | 'communication' | 'shelter' | 'documents';
  priority: 'essential' | 'important' | 'recommended';
  quantity?: string;
  isCompleted: boolean;
  completedAt?: Date;
  notes?: string;
}

interface EmergencyKitCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  items: EmergencyKitItem[];
}

const EMERGENCY_KIT_STORAGE_KEY = 'emergency_kit_checklist';

const defaultKitItems: EmergencyKitItem[] = [
  // Water
  {
    id: 'water_1',
    name: 'Drinking Water',
    description: '1 gallon per person per day for at least 3 days',
    category: 'water',
    priority: 'essential',
    quantity: '3+ gallons per person',
    isCompleted: false,
  },
  {
    id: 'water_2',
    name: 'Water Purification Tablets',
    description: 'For treating questionable water sources',
    category: 'water',
    priority: 'important',
    quantity: '1 bottle',
    isCompleted: false,
  },
  {
    id: 'water_3',
    name: 'Portable Water Filter',
    description: 'Backup water filtration system',
    category: 'water',
    priority: 'recommended',
    quantity: '1 unit',
    isCompleted: false,
  },

  // Food
  {
    id: 'food_1',
    name: 'Non-perishable Food',
    description: '3-day supply of food per person',
    category: 'food',
    priority: 'essential',
    quantity: '3+ days per person',
    isCompleted: false,
  },
  {
    id: 'food_2',
    name: 'Can Opener',
    description: 'Manual can opener for canned foods',
    category: 'food',
    priority: 'essential',
    quantity: '1 unit',
    isCompleted: false,
  },
  {
    id: 'food_3',
    name: 'Energy Bars',
    description: 'High-energy, long-lasting nutrition bars',
    category: 'food',
    priority: 'important',
    quantity: '1 box per person',
    isCompleted: false,
  },

  // Medical
  {
    id: 'medical_1',
    name: 'First Aid Kit',
    description: 'Comprehensive first aid supplies',
    category: 'medical',
    priority: 'essential',
    quantity: '1 kit',
    isCompleted: false,
  },
  {
    id: 'medical_2',
    name: 'Prescription Medications',
    description: '7-day supply of essential medications',
    category: 'medical',
    priority: 'essential',
    quantity: '7+ days',
    isCompleted: false,
  },
  {
    id: 'medical_3',
    name: 'Emergency Medications',
    description: 'Pain relievers, anti-diarrheal, antacid',
    category: 'medical',
    priority: 'important',
    quantity: '1 set',
    isCompleted: false,
  },

  // Tools
  {
    id: 'tools_1',
    name: 'Flashlight',
    description: 'Battery-powered or hand-crank flashlight',
    category: 'tools',
    priority: 'essential',
    quantity: '1 per person',
    isCompleted: false,
  },
  {
    id: 'tools_2',
    name: 'Emergency Radio',
    description: 'Battery-powered or hand-crank radio',
    category: 'tools',
    priority: 'essential',
    quantity: '1 unit',
    isCompleted: false,
  },
  {
    id: 'tools_3',
    name: 'Multi-tool or Swiss Army Knife',
    description: 'Versatile tool for various needs',
    category: 'tools',
    priority: 'important',
    quantity: '1 unit',
    isCompleted: false,
  },
  {
    id: 'tools_4',
    name: 'Duct Tape',
    description: 'For emergency repairs and sealing',
    category: 'tools',
    priority: 'important',
    quantity: '1 roll',
    isCompleted: false,
  },

  // Communication
  {
    id: 'comm_1',
    name: 'Cell Phone Chargers',
    description: 'Car charger and portable battery pack',
    category: 'communication',
    priority: 'essential',
    quantity: '1 set',
    isCompleted: false,
  },
  {
    id: 'comm_2',
    name: 'Emergency Contact List',
    description: 'Printed list of important phone numbers',
    category: 'communication',
    priority: 'essential',
    quantity: '1 copy',
    isCompleted: false,
  },
  {
    id: 'comm_3',
    name: 'Whistle',
    description: 'For signaling help',
    category: 'communication',
    priority: 'important',
    quantity: '1 per person',
    isCompleted: false,
  },

  // Shelter
  {
    id: 'shelter_1',
    name: 'Emergency Blankets',
    description: 'Thermal blankets for warmth',
    category: 'shelter',
    priority: 'essential',
    quantity: '1 per person',
    isCompleted: false,
  },
  {
    id: 'shelter_2',
    name: 'Sleeping Bags',
    description: 'For overnight shelter needs',
    category: 'shelter',
    priority: 'important',
    quantity: '1 per person',
    isCompleted: false,
  },
  {
    id: 'shelter_3',
    name: 'Plastic Sheeting',
    description: 'For shelter and weather protection',
    category: 'shelter',
    priority: 'recommended',
    quantity: '10x10 feet',
    isCompleted: false,
  },

  // Documents
  {
    id: 'docs_1',
    name: 'Important Documents',
    description: 'Copies of ID, insurance, bank records',
    category: 'documents',
    priority: 'essential',
    quantity: '1 set',
    isCompleted: false,
  },
  {
    id: 'docs_2',
    name: 'Cash',
    description: 'Small bills and coins',
    category: 'documents',
    priority: 'important',
    quantity: '$200+',
    isCompleted: false,
  },
  {
    id: 'docs_3',
    name: 'Emergency Plan',
    description: 'Written family emergency plan',
    category: 'documents',
    priority: 'essential',
    quantity: '1 copy',
    isCompleted: false,
  },
];

export function useEmergencyKit() {
  const [kitItems, setKitItems] = useState<EmergencyKitItem[]>(defaultKitItems);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadKitData();
  }, []);

  const loadKitData = async () => {
    try {
      const stored = await AsyncStorage.getItem(EMERGENCY_KIT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const items = parsed.map((item: any) => ({
          ...item,
          completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
        }));
        setKitItems(items);
      }
    } catch (error) {
      console.error('Error loading emergency kit data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveKitData = async (items: EmergencyKitItem[]) => {
    try {
      await AsyncStorage.setItem(EMERGENCY_KIT_STORAGE_KEY, JSON.stringify(items));
      setKitItems(items);
    } catch (error) {
      console.error('Error saving emergency kit data:', error);
    }
  };

  const toggleItemCompletion = async (itemId: string, notes?: string) => {
    const updatedItems = kitItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          isCompleted: !item.isCompleted,
          completedAt: !item.isCompleted ? new Date() : undefined,
          notes: notes || item.notes,
        };
      }
      return item;
    });

    await saveKitData(updatedItems);
  };

  const addCustomItem = async (item: Omit<EmergencyKitItem, 'id' | 'isCompleted'>) => {
    const newItem: EmergencyKitItem = {
      ...item,
      id: `custom_${Date.now()}`,
      isCompleted: false,
    };

    const updatedItems = [...kitItems, newItem];
    await saveKitData(updatedItems);
  };

  const removeItem = async (itemId: string) => {
    const updatedItems = kitItems.filter(item => item.id !== itemId);
    await saveKitData(updatedItems);
  };

  const resetKit = async () => {
    await saveKitData(defaultKitItems);
  };

  const getKitByCategory = (): EmergencyKitCategory[] => {
    const categories: EmergencyKitCategory[] = [
      {
        id: 'water',
        name: 'Water & Hydration',
        icon: '💧',
        description: 'Essential water supplies and purification',
        items: kitItems.filter(item => item.category === 'water'),
      },
      {
        id: 'food',
        name: 'Food & Nutrition',
        icon: '🥫',
        description: 'Non-perishable food and cooking supplies',
        items: kitItems.filter(item => item.category === 'food'),
      },
      {
        id: 'medical',
        name: 'Medical & Health',
        icon: '🏥',
        description: 'First aid and medical supplies',
        items: kitItems.filter(item => item.category === 'medical'),
      },
      {
        id: 'tools',
        name: 'Tools & Equipment',
        icon: '🔧',
        description: 'Essential tools and equipment',
        items: kitItems.filter(item => item.category === 'tools'),
      },
      {
        id: 'communication',
        name: 'Communication',
        icon: '📱',
        description: 'Communication and signaling devices',
        items: kitItems.filter(item => item.category === 'communication'),
      },
      {
        id: 'shelter',
        name: 'Shelter & Warmth',
        icon: '🏠',
        description: 'Shelter and protection supplies',
        items: kitItems.filter(item => item.category === 'shelter'),
      },
      {
        id: 'documents',
        name: 'Documents & Money',
        icon: '📄',
        description: 'Important documents and cash',
        items: kitItems.filter(item => item.category === 'documents'),
      },
    ];

    return categories;
  };

  const getKitStats = () => {
    const total = kitItems.length;
    const completed = kitItems.filter(item => item.isCompleted).length;
    const essential = kitItems.filter(item => item.priority === 'essential');
    const essentialCompleted = essential.filter(item => item.isCompleted).length;
    
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const essentialPercentage = essential.length > 0 ? Math.round((essentialCompleted / essential.length) * 100) : 0;

    return {
      total,
      completed,
      completionPercentage,
      essential: essential.length,
      essentialCompleted,
      essentialPercentage,
      isEssentialComplete: essentialPercentage === 100,
    };
  };

  return {
    kitItems,
    isLoading,
    toggleItemCompletion,
    addCustomItem,
    removeItem,
    resetKit,
    getKitByCategory,
    getKitStats,
  };
}