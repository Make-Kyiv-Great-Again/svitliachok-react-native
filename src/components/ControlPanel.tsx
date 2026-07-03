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
  onClear: () => void;
  onRebuild: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ distance, duration, onClear, onRebuild }) => {
  const insets = useSafeAreaInsets();
  const { 
    transportMode, 
    setTransportMode, 
    routePreference, 
    setRoutePreference,
  } = useAppStore();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleModeChange = (mode: TransportMode) => {
    setTransportMode(mode);
    onRebuild();
  };
  
  const togglePreference = () => {
    const newPref = routePreference === 'Illuminated' ? 'Fastest' : 'Illuminated';
    setRoutePreference(newPref);
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
        
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        <View style={styles.infoRow}>
          <Ionicons name="flash" size={14} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            {routePreference === 'Illuminated' ? 'Kyiv Outage Slices Enabled' : 'Standard Routing (Outages Ignored)'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.rebuildButton, { backgroundColor: colors.primary }]} onPress={togglePreference}>
        <Ionicons name="refresh-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.rebuildButtonText}>
          {routePreference === 'Illuminated' ? 'Switch to Fastest Route' : 'Avoid Blackouts & Rebuild'}
        </Text>
      </TouchableOpacity>
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
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    width: '100%',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  infoText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '600',
  },
  rebuildButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  rebuildButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  }
});
