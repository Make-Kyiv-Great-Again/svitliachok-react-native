import React, { useEffect, useRef } from 'react';
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
  inspectedLocation?: { latitude: number; longitude: number } | null;
  onPress: (loc: SavedLocation) => void;
}

export const SavedLocationsLayer: React.FC<SavedLocationsLayerProps> = ({ locations, inspectedLocation, onPress }) => {
  const markerRefs = useRef<Record<string, any>>({});
  const prevActiveLocIdRef = useRef<string | null>(null);

  useEffect(() => {
    const activeLoc = inspectedLocation
      ? locations.find(
          (l) =>
            l.latitude === inspectedLocation.latitude &&
            l.longitude === inspectedLocation.longitude
        )
      : null;

    const activeLocId = activeLoc ? activeLoc.id : null;

    if (activeLocId !== prevActiveLocIdRef.current) {
      locations.forEach((loc) => {
        const ref = markerRefs.current[loc.id];
        if (ref) {
          if (activeLocId && loc.id === activeLocId) {
            ref.showCallout();
          } else {
            ref.hideCallout();
          }
        }
      });
      prevActiveLocIdRef.current = activeLocId;
    }
  }, [inspectedLocation, locations]);

  return (
    <>
      {locations.map((loc) => {
        const color = statusColor(loc.power_status);
        const iconName = (ICON_MAP[loc.icon] || 'location') as any;
        return (
          <Marker
            key={loc.id}
            ref={(el) => {
              if (el) markerRefs.current[loc.id] = el;
            }}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            title={loc.name}
            onPress={() => {
              prevActiveLocIdRef.current = loc.id;
              onPress(loc);
            }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.markerContainer}>
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
