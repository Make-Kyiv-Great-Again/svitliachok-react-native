import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppStore, TransportMode, RoutePreference } from '../store/useAppStore';

export const ControlPanel = () => {
  const { 
    transportMode, 
    setTransportMode, 
    routePreference, 
    setRoutePreference,
    isOnline,
    lastSyncTime
  } = useAppStore();

  const handleModeChange = (mode: TransportMode) => setTransportMode(mode);
  const handlePrefChange = (pref: RoutePreference) => setRoutePreference(pref);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Routing Options</Text>
        <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#4ade80' : '#f87171' }]} />
      </View>
      
      <Text style={styles.label}>Transport Mode:</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, transportMode === 'Car' && styles.activeButton]}
          onPress={() => handleModeChange('Car')}
        >
          <Text style={[styles.buttonText, transportMode === 'Car' && styles.activeText]}>Car</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, transportMode === 'Pedestrian' && styles.activeButton]}
          onPress={() => handleModeChange('Pedestrian')}
        >
          <Text style={[styles.buttonText, transportMode === 'Pedestrian' && styles.activeText]}>Pedestrian</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Route Preference:</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, routePreference === 'Fastest' && styles.activeButton]}
          onPress={() => handlePrefChange('Fastest')}
        >
          <Text style={[styles.buttonText, routePreference === 'Fastest' && styles.activeText]}>Fastest</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, routePreference === 'Illuminated' && styles.activeButton]}
          onPress={() => handlePrefChange('Illuminated')}
        >
          <Text style={[styles.buttonText, routePreference === 'Illuminated' && styles.activeText]}>Illuminated</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.syncText}>
        Last synced: {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    fontWeight: '600',
    color: '#4b5563',
  },
  activeText: {
    color: 'white',
  },
  syncText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  }
});
