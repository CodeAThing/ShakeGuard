import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Package, CircleCheck as CheckCircle, Circle, Plus, X, RotateCcw, TrendingUp, TriangleAlert as AlertTriangle, CreditCard as Edit3, Trash2 } from 'lucide-react-native';
import { useEmergencyKit } from '@/hooks/useEmergencyKit';
import { useTheme } from '@/hooks/useTheme';

export default function EmergencyKitScreen() {
  const { colors } = useTheme();
  const {
    isLoading,
    toggleItemCompletion,
    addCustomItem,
    removeItem,
    resetKit,
    getKitByCategory,
    getKitStats,
  } = useEmergencyKit();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['water', 'food', 'medical']));
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<any>('tools');
  const [newItemPriority, setNewItemPriority] = useState<any>('important');
  const [itemNotes, setItemNotes] = useState('');

  const categories = getKitByCategory();
  const stats = getKitStats();

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    await addCustomItem({
      name: newItemName.trim(),
      description: newItemDescription.trim(),
      category: newItemCategory,
      priority: newItemPriority,
      quantity: newItemQuantity.trim() || undefined,
    });

    setShowAddModal(false);
    setNewItemName('');
    setNewItemDescription('');
    setNewItemQuantity('');
    setNewItemCategory('tools');
    setNewItemPriority('important');
  };

  const handleItemPress = (item: any) => {
    setSelectedItem(item);
    setItemNotes(item.notes || '');
    setShowNotesModal(true);
  };

  const handleSaveNotes = async () => {
    if (selectedItem) {
      await toggleItemCompletion(selectedItem.id, itemNotes);
      setShowNotesModal(false);
      setSelectedItem(null);
      setItemNotes('');
    }
  };

  const handleResetKit = () => {
    Alert.alert(
      'Reset Emergency Kit',
      'This will reset all items to their default state and remove any custom items. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetKit },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'essential': return colors.error;
      case 'important': return colors.warning;
      case 'recommended': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const iconMap: { [key: string]: string } = {
      water: '💧',
      food: '🥫',
      medical: '🏥',
      tools: '🔧',
      communication: '📱',
      shelter: '🏠',
      documents: '📄',
    };
    return iconMap[categoryId] || '📦';
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={[colors.background, colors.surface, colors.surfaceSecondary]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <Package size={48} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading Emergency Kit...</Text>
        </View>
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
              <Text style={[styles.title, { color: colors.text }]}>Emergency Kit</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Prepare for earthquake emergencies
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Stats */}
        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>Preparation Progress</Text>
            <TouchableOpacity onPress={handleResetKit}>
              <RotateCcw size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={[styles.progressValue, { color: colors.primary }]}>
                {stats.completionPercentage}%
              </Text>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                Overall Complete
              </Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={[styles.progressValue, { color: colors.error }]}>
                {stats.essentialPercentage}%
              </Text>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                Essential Items
              </Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={[styles.progressValue, { color: colors.success }]}>
                {stats.completed}/{stats.total}
              </Text>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                Items Ready
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBarContainer, { backgroundColor: colors.borderLight }]}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: stats.isEssentialComplete ? colors.success : colors.primary,
                  width: `${stats.completionPercentage}%`,
                },
              ]}
            />
          </View>

          {stats.isEssentialComplete && (
            <View style={[styles.completionBadge, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
              <CheckCircle size={16} color={colors.success} />
              <Text style={[styles.completionText, { color: colors.success }]}>
                All essential items completed! 🎉
              </Text>
            </View>
          )}
        </View>

        {/* Categories */}
        {categories.map((category) => (
          <View key={category.id} style={[styles.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(category.id)}
            >
              <View style={styles.categoryLeft}>
                <Text style={styles.categoryIcon}>{getCategoryIcon(category.id)}</Text>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                  <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
                    {category.description}
                  </Text>
                </View>
              </View>
              <View style={styles.categoryStats}>
                <Text style={[styles.categoryProgress, { color: colors.primary }]}>
                  {category.items.filter(item => item.isCompleted).length}/{category.items.length}
                </Text>
                <TrendingUp 
                  size={16} 
                  color={expandedCategories.has(category.id) ? colors.primary : colors.textSecondary}
                  style={{
                    transform: [{ rotate: expandedCategories.has(category.id) ? '90deg' : '0deg' }]
                  }}
                />
              </View>
            </TouchableOpacity>

            {expandedCategories.has(category.id) && (
              <View style={styles.categoryItems}>
                {category.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.itemCard, { borderColor: colors.borderLight }]}
                    onPress={() => handleItemPress(item)}
                  >
                    <TouchableOpacity
                      style={styles.itemCheckbox}
                      onPress={() => toggleItemCompletion(item.id)}
                    >
                      {item.isCompleted ? (
                        <CheckCircle size={24} color={colors.success} />
                      ) : (
                        <Circle size={24} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>

                    <View style={styles.itemContent}>
                      <View style={styles.itemHeader}>
                        <Text style={[
                          styles.itemName,
                          { 
                            color: item.isCompleted ? colors.textSecondary : colors.text,
                            textDecorationLine: item.isCompleted ? 'line-through' : 'none'
                          }
                        ]}>
                          {item.name}
                        </Text>
                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                          <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                            {item.priority}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                        {item.description}
                      </Text>

                      {item.quantity && (
                        <Text style={[styles.itemQuantity, { color: colors.primary }]}>
                          Quantity: {item.quantity}
                        </Text>
                      )}

                      {item.notes && (
                        <Text style={[styles.itemNotes, { color: colors.textSecondary }]}>
                          📝 {item.notes}
                        </Text>
                      )}

                      {item.completedAt && (
                        <Text style={[styles.itemCompleted, { color: colors.success }]}>
                          ✅ Completed {new Date(item.completedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </View>

                    {item.id.startsWith('custom_') && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                          Alert.alert(
                            'Remove Item',
                            'Are you sure you want to remove this custom item?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Remove', style: 'destructive', onPress: () => removeItem(item.id) },
                            ]
                          );
                        }}
                      >
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Emergency Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.tipsHeader}>
            <AlertTriangle size={24} color={colors.warning} />
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Emergency Kit Tips</Text>
          </View>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Store your kit in a cool, dry place that's easily accessible
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Check and rotate food and water every 6 months
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Keep copies of important documents in waterproof containers
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Consider the needs of all family members, including pets
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Practice using your emergency equipment regularly
          </Text>
        </View>
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Custom Item</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Item name"
              placeholderTextColor={colors.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Description"
              placeholderTextColor={colors.textSecondary}
              value={newItemDescription}
              onChangeText={setNewItemDescription}
              multiline
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Quantity (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
            />

            <View style={styles.pickerRow}>
              <Text style={[styles.pickerLabel, { color: colors.text }]}>Category:</Text>
              <View style={styles.pickerButtons}>
                {['water', 'food', 'medical', 'tools', 'communication', 'shelter', 'documents'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.pickerButton,
                      { 
                        backgroundColor: newItemCategory === cat ? colors.primary : colors.borderLight,
                        borderColor: colors.border 
                      }
                    ]}
                    onPress={() => setNewItemCategory(cat)}
                  >
                    <Text style={[
                      styles.pickerButtonText,
                      { color: newItemCategory === cat ? '#FFFFFF' : colors.text }
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.pickerRow}>
              <Text style={[styles.pickerLabel, { color: colors.text }]}>Priority:</Text>
              <View style={styles.pickerButtons}>
                {['essential', 'important', 'recommended'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.pickerButton,
                      { 
                        backgroundColor: newItemPriority === priority ? colors.primary : colors.borderLight,
                        borderColor: colors.border 
                      }
                    ]}
                    onPress={() => setNewItemPriority(priority)}
                  >
                    <Text style={[
                      styles.pickerButtonText,
                      { color: newItemPriority === priority ? '#FFFFFF' : colors.text }
                    ]}>
                      {priority}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleAddItem}
            >
              <Text style={styles.modalButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal visible={showNotesModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedItem?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.itemDescription, { color: colors.textSecondary, marginBottom: 16 }]}>
              {selectedItem?.description}
            </Text>

            <TextInput
              style={[styles.input, styles.notesInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Add notes about this item..."
              placeholderTextColor={colors.textSecondary}
              value={itemNotes}
              onChangeText={setItemNotes}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.success }]}
                onPress={() => {
                  toggleItemCompletion(selectedItem?.id);
                  setShowNotesModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>
                  {selectedItem?.isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveNotes}
              >
                <Text style={styles.modalButtonText}>Save Notes</Text>
              </TouchableOpacity>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
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
  addButton: {
    padding: 12,
    borderRadius: 12,
  },
  progressCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  completionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  categoryCard: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 12,
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryProgress: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryItems: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  itemCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  itemDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  itemCompleted: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  tipsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerRow: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  pickerButtonText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
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