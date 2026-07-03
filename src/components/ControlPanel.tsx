import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore, TransportMode, RoutePreference } from '../store/useAppStore';

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
    if (!meters) return '-- km';
    return (meters / 1000).toFixed(1) + ' km';
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '-- min';
    return Math.ceil(seconds / 60) + ' min';
  };

  return (
    <View style={[styles.container, { bottom: Math.max(insets.bottom + 10, 20) }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Route Status Summary</Text>
        <TouchableOpacity onPress={onClear} hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}>
          <Ionicons name="close" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.modeButton, transportMode === 'Driving' && styles.activeModeButton]}
          onPress={() => handleModeChange('Driving')}
        >
          <Ionicons name="car-outline" size={18} color={transportMode === 'Driving' ? '#F59E0B' : '#6b7280'} />
          <Text style={[styles.modeText, transportMode === 'Driving' && styles.activeModeText]}>Driving</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modeButton, transportMode === 'Walking' && styles.activeModeButton]}
          onPress={() => handleModeChange('Walking')}
        >
          <Ionicons name="walk-outline" size={18} color={transportMode === 'Walking' ? '#F59E0B' : '#6b7280'} />
          <Text style={[styles.modeText, transportMode === 'Walking' && styles.activeModeText]}>Walking</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsBox}>
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>DISTANCE</Text>
            <Text style={styles.statValue}>{formatDistance(distance)}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>EST. TIME</Text>
            <Text style={styles.statValue}>{formatTime(duration)}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <Ionicons name="flash" size={14} color="#F59E0B" />
          <Text style={styles.infoText}>
            {routePreference === 'Illuminated' ? 'Kyiv Outage Slices Enabled' : 'Standard Routing (Outages Ignored)'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.rebuildButton} onPress={togglePreference}>
        <Ionicons name="refresh-outline" size={20} color="white" style={{ marginRight: 8 }} />
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
