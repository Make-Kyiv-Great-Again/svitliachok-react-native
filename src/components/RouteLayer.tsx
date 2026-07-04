import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Polyline } from 'react-native-maps';
import { RouteResult } from '../types/routing';
import { useTheme } from '../theme/useTheme';

interface RouteLayerProps {
  selectedOrigin: { latitude: number; longitude: number } | null;
  selectedDestination: { latitude: number; longitude: number } | null;
  currentRoute: RouteResult;
}

export const RouteLayer: React.FC<RouteLayerProps> = ({
  selectedOrigin,
  selectedDestination,
  currentRoute,
}) => {
  const { colors } = useTheme();

  return (
    <>
      {selectedOrigin && (
        <Marker
          key={`origin-${selectedOrigin.latitude}-${selectedOrigin.longitude}`}
          coordinate={selectedOrigin}
          title="Origin"
          anchor={{ x: 0.5, y: 0.5 }}
          zIndex={2}
        >
          <View style={[styles.markerRing, { backgroundColor: '#00e676', borderColor: colors.surface }]}>
            <Text style={styles.markerText}>A</Text>
          </View>
        </Marker>
      )}

      {selectedDestination && (
        <Marker
          key={`dest-${selectedDestination.latitude}-${selectedDestination.longitude}`}
          coordinate={selectedDestination}
          title="Destination"
          anchor={{ x: 0.5, y: 0.5 }}
          zIndex={2}
        >
          <View style={[styles.markerRing, { backgroundColor: '#ff3b30', borderColor: colors.surface }]}>
            <Text style={styles.markerText}>B</Text>
          </View>
        </Marker>
      )}

      {currentRoute.segments.map((segment, index) => (
        <Polyline
          key={`route-segment-${currentRoute.distance}-${index}`}
          coordinates={segment.coordinates}
          strokeColor={
            segment.status === 'DANGER'
              ? '#ef4444'
              : segment.status === 'UNKNOWN'
              ? '#94a3b8'
              : '#00e676'
          }
          strokeWidth={6}
          lineJoin="round"
          lineCap="round"
          zIndex={1}
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  markerRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  markerText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: -1, // slight optical adjustment
  },
});
