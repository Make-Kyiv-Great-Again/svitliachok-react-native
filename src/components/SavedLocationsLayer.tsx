import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SavedLocation } from '../types/api';
import { useTheme } from '../theme/useTheme';

const ICON_MAP: Record<string, string> = {
  home:       'home',
  business:   'business',
  school:     'school',
  fitness:    'fitness',
  restaurant: 'restaurant',
  heart:      'heart',
  star:       'star',
  location:   'location',
};

function statusColor(status: SavedLocation['power_status']): string {
  switch (status) {
    case 'ON':        return '#00e676';
    case 'OFF':       return '#ef4444';
    case 'EMERGENCY': return '#f59e0b';
    default:          return '#94a3b8';
  }
}

interface SavedLocationsLayerProps {
  locations: SavedLocation[];
  inspectedLocation?: { latitude: number; longitude: number } | null;
  onPress: (loc: SavedLocation) => void;
}

export const SavedLocationsLayer: React.FC<SavedLocationsLayerProps> = ({ locations, inspectedLocation, onPress }) => {
  const { colors } = useTheme();

  return (
    <>
      {locations.map((loc) => {
        const color = statusColor(loc.power_status);
        const iconName = (ICON_MAP[loc.icon] || 'location') as any;
        const isSelected = inspectedLocation?.latitude === loc.latitude && inspectedLocation?.longitude === loc.longitude;

        return (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            onPress={() => onPress(loc)}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={isSelected ? 10 : 1}
          >
            <View style={styles.markerContainer}>
              {isSelected && (
                <View style={[styles.nameBubble, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
                  <Text style={[styles.nameText, { color: colors.textPrimary }]}>{loc.name}</Text>
                </View>
              )}
              <View style={[styles.pin, { backgroundColor: color }]}>
                <Ionicons name={iconName} size={15} color="#fff" />
              </View>
              <View style={styles.triangle} />
            </View>
          </Marker>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  nameBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ffffff',
    marginTop: -1.5,
  },
});
