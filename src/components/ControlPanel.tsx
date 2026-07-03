import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore, TransportMode, RoutePreference } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/useTheme';

interface ControlPanelProps {
  distance?: number;
  duration?: number;
  routeStatus?: 'SAFE' | 'UNKNOWN' | 'DANGER';
  hasAlternative?: boolean;
  onSwapRoute?: () => void;
  onClear: () => void;
  onRebuild: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ distance, duration, routeStatus, hasAlternative, onSwapRoute, onClear, onRebuild }) => {
  const insets = useSafeAreaInsets();
  const { 
    transportMode, 
    setTransportMode,
  } = useAppStore();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleModeChange = (mode: TransportMode) => {
    setTransportMode(mode);
    onRebuild();
  };
  
  const formatDistance = (meters?: number) => {
    if (!meters) return '-- ' + t('controlPanel.metrics.kilometers');
    return (meters / 1000).toFixed(1) + ' ' + t('controlPanel.metrics.kilometers');
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '-- ' + t('controlPanel.metrics.minutes');
    return Math.ceil(seconds / 60) + ' ' + t('controlPanel.metrics.minutes');
  };

  return (
    <View style={[styles.container, { bottom: Math.max(insets.bottom, 20), backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('controlPanel.title')}</Text>
        <TouchableOpacity onPress={onClear} hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}>
          <Ionicons name="close" size={24} color={colors.iconInactive} />
        </TouchableOpacity>
      </View>

      {/* Route Status Banner */}
      {routeStatus === 'SAFE' ? (
        <View style={[styles.bannerContainer, { backgroundColor: '#10b98120', borderColor: '#10b981' }]}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={[styles.bannerText, { color: '#10b981' }]}>The path is fully illuminated and safe</Text>
        </View>
      ) : hasAlternative ? (
        <TouchableOpacity 
          style={[styles.bannerContainer, { backgroundColor: '#f59e0b20', borderColor: '#f59e0b' }]}
          onPress={onSwapRoute}
        >
          <Ionicons name="flash" size={20} color="#f59e0b" />
          <Text style={[styles.bannerText, { color: '#f59e0b' }]}>Found a lighter path. Tap to view.</Text>
        </TouchableOpacity>
      ) : routeStatus ? (
        <View style={[styles.bannerContainer, { backgroundColor: colors.surfaceOpaque, borderColor: colors.border }]}>
          <Ionicons name="warning" size={20} color={colors.textSecondary} />
          <Text style={[styles.bannerText, { color: colors.textSecondary }]}>Path has gray zones. No alternative found.</Text>
        </View>
      ) : null}
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[
            styles.modeButton, 
            { backgroundColor: colors.surface, borderColor: colors.border },
            transportMode === 'Driving' && [styles.activeModeButton, { borderColor: colors.primary, backgroundColor: colors.primaryDim }]
          ]}
          onPress={() => handleModeChange('Driving')}
        >
          <Ionicons name="car-outline" size={18} color={transportMode === 'Driving' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.modeText, { color: colors.textSecondary }, transportMode === 'Driving' && { color: colors.primary }]}>{t('controlPanel.mode.driving')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.modeButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            transportMode === 'Walking' && [styles.activeModeButton, { borderColor: colors.primary, backgroundColor: colors.primaryDim }]
          ]}
          onPress={() => handleModeChange('Walking')}
        >
          <Ionicons name="walk-outline" size={18} color={transportMode === 'Walking' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.modeText, { color: colors.textSecondary }, transportMode === 'Walking' && { color: colors.primary }]}>{t('controlPanel.mode.walking')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statsBox, { backgroundColor: colors.background }]}>
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('controlPanel.metrics.distance').toUpperCase()}</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatDistance(distance)}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('controlPanel.metrics.duration').toUpperCase()}</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatTime(duration)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  activeModeButton: {
    borderColor: '#F59E0B',
    backgroundColor: '#fff7ed',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeModeText: {
    color: '#F59E0B',
  },
  statsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '600',
  }
});
