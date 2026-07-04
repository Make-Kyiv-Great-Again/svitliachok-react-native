import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { SavedLocationIcon } from '../types/api';

const ICONS: { key: SavedLocationIcon; label: string; ionicon: string }[] = [
  { key: 'home',       label: 'Home',     ionicon: 'home-outline' },
  { key: 'business',   label: 'Work',     ionicon: 'business-outline' },
  { key: 'school',     label: 'School',   ionicon: 'school-outline' },
  { key: 'fitness',    label: 'Gym',      ionicon: 'fitness-outline' },
  { key: 'restaurant', label: 'Food',     ionicon: 'restaurant-outline' },
  { key: 'heart',      label: 'Favorite', ionicon: 'heart-outline' },
  { key: 'star',       label: 'Other',    ionicon: 'star-outline' },
  { key: 'location',   label: 'Place',    ionicon: 'location-outline' },
];

interface SaveLocationSheetProps {
  onSave: (name: string, icon: SavedLocationIcon) => void;
  onCancel: () => void;
  bottomOffset: number;
  suggestedName?: string;
}

export const SaveLocationSheet: React.FC<SaveLocationSheetProps> = ({
  onSave,
  onCancel,
  bottomOffset,
  suggestedName = '',
}) => {
  const { colors } = useTheme();
  const [name, setName] = useState(suggestedName);
  const [selectedIcon, setSelectedIcon] = useState<SavedLocationIcon>('location');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, selectedIcon);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
    >
      <View style={[styles.overlay]} pointerEvents="box-none">
        <View
          style={[
            styles.sheet,
            { bottom: bottomOffset, backgroundColor: colors.surface, shadowColor: colors.shadow },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Save Location</Text>
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Ionicons name="close" size={24} color={colors.iconInactive} />
            </TouchableOpacity>
          </View>

          {/* Name Input */}
          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Location name…"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

          {/* Icon Picker */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CHOOSE ICON</Text>
          <View style={styles.iconGrid}>
            {ICONS.map((item) => {
              const isSelected = selectedIcon === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.iconCell,
                    { backgroundColor: isSelected ? colors.primaryDim : colors.background, borderColor: isSelected ? colors.primary : colors.border },
                  ]}
                  onPress={() => setSelectedIcon(item.key)}
                >
                  <Ionicons
                    name={item.ionicon as any}
                    size={24}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.iconLabel, { color: isSelected ? colors.primary : colors.textSecondary }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: name.trim() ? colors.primary : colors.border }]}
            onPress={handleSave}
            disabled={!name.trim()}
          >
            <Ionicons name="bookmark" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
  },
  input: {
    fontSize: 16,
    height: 44,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  iconCell: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
