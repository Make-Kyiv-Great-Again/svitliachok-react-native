import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore, TransportMode, RoutePreference } from '../store/useAppStore';

interface ControlPanelProps {
  distance?: number;
  duration?: number;
  onClear: () => void;
  onRebuild: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ distance, duration, onClear, onRebuild }) => {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Route Status Summary</Text>
        <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.modeButton, transportMode === 'Driving' && styles.activeModeButton]}
          onPress={() => handleModeChange('Driving')}
        >
          <Ionicons name="car-outline" size={18} color={transportMode === 'Driving' ? '#ea580c' : '#6b7280'} />
          <Text style={[styles.modeText, transportMode === 'Driving' && styles.activeModeText]}>Driving</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modeButton, transportMode === 'Walking' && styles.activeModeButton]}
          onPress={() => handleModeChange('Walking')}
        >
          <Ionicons name="walk-outline" size={18} color={transportMode === 'Walking' ? '#ea580c' : '#6b7280'} />
          <Text style={[styles.modeText, transportMode === 'Walking' && styles.activeModeText]}>Walking</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modeButton, transportMode === 'Cycling' && styles.activeModeButton]}
          onPress={() => handleModeChange('Cycling')}
        >
          <Ionicons name="bicycle-outline" size={18} color={transportMode === 'Cycling' ? '#ea580c' : '#6b7280'} />
          <Text style={[styles.modeText, transportMode === 'Cycling' && styles.activeModeText]}>Cycling</Text>
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
          <Ionicons name="flash" size={14} color="#ea580c" />
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
      
      <View style={styles.footerRow}>
        <Ionicons name="bulb-outline" size={14} color="#9ca3af" />
        <Text style={styles.footerText}>
          Drag markers on the map to dynamically re-evaluate route segments.
        </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  clearBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  clearText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
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
    borderColor: '#ea580c',
    backgroundColor: '#fff7ed',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeModeText: {
    color: '#ea580c',
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
    color: '#ea580c',
    fontSize: 13,
    fontWeight: '600',
  },
  rebuildButton: {
    backgroundColor: '#f59e0b', // Amber-500 matching the screenshot
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  rebuildButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  footerText: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    flex: 1,
  }
});
