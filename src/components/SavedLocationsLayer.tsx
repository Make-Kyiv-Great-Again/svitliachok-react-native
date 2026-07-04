import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SavedLocation } from '../types/api';

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
  onPress: (loc: SavedLocation) => void;
}

export const SavedLocationsLayer: React.FC<SavedLocationsLayerProps> = ({ locations, onPress }) => {
  return (
    <>
      {locations.map((loc) => {
        const color = statusColor(loc.power_status);
        const iconName = (ICON_MAP[loc.icon] || 'location') as any;
        return (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            title={loc.name}
            onPress={() => onPress(loc)}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.pin, { backgroundColor: color, borderColor: `${color}80` }]}>
              <Ionicons name={iconName} size={16} color="#fff" />
            </View>
          </Marker>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
