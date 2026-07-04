import React from 'react';
import { Marker, Polyline } from 'react-native-maps';
import { RouteResult } from '../types/routing';

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
  return (
    <>
      {selectedOrigin && (
        <Marker
          key={`origin-${selectedOrigin.latitude}-${selectedOrigin.longitude}`}
          coordinate={selectedOrigin}
          title="Origin"
          pinColor="green"
        />
      )}

      {selectedDestination && (
        <Marker
          key={`dest-${selectedDestination.latitude}-${selectedDestination.longitude}`}
          coordinate={selectedDestination}
          title="Destination"
          pinColor="blue"
        />
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
          strokeWidth={5}
        />
      ))}
    </>
  );
};
