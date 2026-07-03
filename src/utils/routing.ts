import { LatLng } from 'react-native-maps';
import { BuildingPolygon } from '../types/api';

export interface RouteResult {
  coordinates: LatLng[];
  distance: number; // in meters
  duration: number; // in seconds
  status: 'SAFE' | 'UNKNOWN' | 'DANGER';
}

export const calculateRoute = async (
  origin: LatLng,
  destination: LatLng,
  mode: 'Driving' | 'Walking' | 'Cycling',
  preference: 'Fastest' | 'Illuminated',
  buildingPolygons: BuildingPolygon[]
): Promise<RouteResult> => {
  try {
    let baseUrl = 'https://router.project-osrm.org/route/v1/driving';
    if (mode === 'Walking') {
      baseUrl = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving';
    } else if (mode === 'Cycling') {
      baseUrl = 'https://routing.openstreetmap.de/routed-bike/route/v1/driving';
    }
    
    let coordinatesStr = `${origin.longitude},${origin.latitude};`;
    
    if (preference === 'Illuminated') {
        let closestZoneDistance = Infinity;
        let closestZone: BuildingPolygon | null = null;
        
        const midLat = (origin.latitude + destination.latitude) / 2;
        const midLon = (origin.longitude + destination.longitude) / 2;
        
        for (const zone of buildingPolygons) {
          if (zone.status === 'OFF' || zone.status === 'EMERGENCY') {
            if (zone.coordinates.length > 0) {
              const pt = zone.coordinates[0];
              const dist = Math.sqrt(Math.pow(midLat - pt.latitude, 2) + Math.pow(midLon - pt.longitude, 2));
              if (dist < closestZoneDistance) {
                closestZoneDistance = dist;
                closestZone = zone;
              }
            }
          }
        }
        
        // Detour
        if (closestZoneDistance < 0.02 && closestZone && closestZone.coordinates.length > 0) {
             const pt = closestZone.coordinates[0];
             coordinatesStr += `${pt.longitude + 0.01},${pt.latitude + 0.01};`;
        }
    }
    
    coordinatesStr += `${destination.longitude},${destination.latitude}`;

    const url = `${baseUrl}/${coordinatesStr}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coords = route.geometry.coordinates;
      const formattedCoords = coords.map((c: number[]) => ({
        latitude: c[1],
        longitude: c[0]
      }));

      // Calculate path status based on nearby buildings
      let pathStatus: 'SAFE' | 'UNKNOWN' | 'DANGER' = 'UNKNOWN';
      let hasKnownData = false;

      for (const zone of buildingPolygons) {
        if (zone.coordinates.length > 0) {
          const pt = zone.coordinates[0];
          // Check if building is close to any point on the route
          const isNearRoute = formattedCoords.some((rc: LatLng) => {
             const dist = Math.sqrt(Math.pow(rc.latitude - pt.latitude, 2) + Math.pow(rc.longitude - pt.longitude, 2));
             return dist < 0.002; // approx 200m
          });

          if (isNearRoute) {
            if (zone.status === 'OFF' || zone.status === 'EMERGENCY') {
              pathStatus = 'DANGER';
              break; // Immediately red if any outage found
            } else if (zone.status === 'ON') {
              hasKnownData = true;
            }
          }
        }
      }

      if (pathStatus !== 'DANGER') {
        pathStatus = hasKnownData ? 'SAFE' : 'UNKNOWN';
      }

      return {
        coordinates: formattedCoords,
        distance: route.distance || 0,
        duration: route.duration || 0,
        status: pathStatus
      };
    }
  } catch (error) {
    console.error("Error fetching route from OSRM:", error);
  }

  // Fallback
  return {
    coordinates: [origin, destination],
    distance: 0,
    duration: 0,
    status: 'UNKNOWN'
  };
};
