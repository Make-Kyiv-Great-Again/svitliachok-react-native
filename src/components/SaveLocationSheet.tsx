import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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

const ICON_COLS = 4;

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

  const canSave = name.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <View
          style={[
            styles.sheet,
            { bottom: bottomOffset, backgroundColor: colors.surface, shadowColor: colors.shadow },
          ]}
        >
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Save Location</Text>
            <TouchableOpacity
              onPress={onCancel}
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
              style={[styles.closeBtn, { backgroundColor: colors.background }]}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Name Input */}
          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} style={styles.inputIcon} />
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
            {name.length > 0 && (
              <TouchableOpacity onPress={() => setName('')} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
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
                    {
                      backgroundColor: isSelected ? colors.primaryDim : colors.background,
                      borderColor: isSelected ? colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setSelectedIcon(item.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.ionicon as any}
                    size={22}
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
            style={[
              styles.saveBtn,
              { backgroundColor: canSave ? colors.primary : colors.border },
            ]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            <Ionicons name="bookmark" size={17} color="#fff" style={{ marginRight: 7 }} />
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
  },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 14,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 18,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
    marginHorizontal: -4,
  },
  iconCell: {
    width: `${100 / ICON_COLS}%` as any,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 4,
    paddingHorizontal: 4,
  },
  iconLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
