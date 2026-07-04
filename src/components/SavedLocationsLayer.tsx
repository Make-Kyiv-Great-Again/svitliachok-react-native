import React from 'react';
import { View, StyleSheet } from 'react-native';
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
  onPress: (loc: SavedLocation) => void;
}

export const SavedLocationsLayer: React.FC<SavedLocationsLayerProps> = ({ locations, onPress }) => {
  const { isDarkMode } = useTheme();
  const iconColor = isDarkMode ? '#000000' : '#ffffff';

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
            <View style={[styles.pin, { backgroundColor: color }]}>
              <Ionicons name={iconName} size={15} color={iconColor} />
            </View>
          </Marker>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
