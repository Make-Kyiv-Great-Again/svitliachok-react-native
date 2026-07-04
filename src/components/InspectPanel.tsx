import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/useTheme';
import { StatusResponse } from '../types/api';

interface InspectPanelProps {
  isInspecting: boolean;
  inspectedStatus: StatusResponse | null;
  inspectError: string | null;
  bottomOffset: number;
  onClose: () => void;
  onSave: () => void;
}

export const InspectPanel: React.FC<InspectPanelProps> = ({
  isInspecting,
  inspectedStatus,
  inspectError,
  bottomOffset,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { bottom: bottomOffset, backgroundColor: colors.surfaceOpaque, shadowColor: colors.shadow }]}>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={onClose}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <Ionicons name="close" size={24} color={colors.iconInactive} />
      </TouchableOpacity>

      {isInspecting ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : inspectError ? (
        <Text style={styles.errorText}>{inspectError}</Text>
      ) : inspectedStatus ? (
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {inspectedStatus.address || 'Address Unknown'}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: inspectedStatus.power_status === 'ON' ? colors.primary : colors.textSecondary },
              ]}
            />
            <Text style={[styles.statusText, { color: colors.textPrimary }]}>
              {inspectedStatus.power_status === 'ON'
                ? t('map.status.on')
                : inspectedStatus.power_status === 'OFF'
                ? t('map.status.off')
                : inspectedStatus.power_status === 'EMERGENCY'
                ? t('map.status.emergency')
                : t('map.status.unknown')}
            </Text>
          </View>
          {inspectedStatus.status_reason && (
            <Text style={[styles.subtext, { color: colors.textSecondary }]}>
              {inspectedStatus.status_reason}
            </Text>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primaryDim, borderColor: colors.primary }]}
            onPress={onSave}
          >
            <Ionicons name="bookmark-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.saveBtnText, { color: colors.primary }]}>Save location</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    width: '90%',
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtext: {
    fontSize: 13,
    marginTop: 4,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
