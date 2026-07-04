import { LatLng } from 'react-native-maps';
import { BuildingPolygon } from '../types/api';
import { RouteResult, RouteSegment } from '../types/routing';

export type { RouteResult, RouteSegment };

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
              const distSq = Math.pow(midLat - pt.latitude, 2) + Math.pow(midLon - pt.longitude, 2);
              if (distSq < closestZoneDistance) {
                closestZoneDistance = distSq;
                closestZone = zone;
              }
            }
          }
        }
        
        // Detour
        if (closestZoneDistance < 0.0004 && closestZone && closestZone.coordinates.length > 0) {
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

      // Calculate path segments based on nearby buildings
      const segments: RouteSegment[] = [];
      let currentSegmentCoords: LatLng[] = [];
      let currentSegmentStatus: 'SAFE' | 'UNKNOWN' | 'DANGER' | null = null;
      const DISTANCE_THRESHOLD_SQ = 0.000004; // 0.002^2

      for (const coord of formattedCoords) {
        let coordStatus: 'SAFE' | 'UNKNOWN' | 'DANGER' = 'UNKNOWN';
        let foundSafe = false;
        let foundDanger = false;
        
        for (const zone of buildingPolygons) {
          if (zone.coordinates.length > 0) {
            const pt = zone.coordinates[0];
            const distSq = Math.pow(coord.latitude - pt.latitude, 2) + Math.pow(coord.longitude - pt.longitude, 2);
            if (distSq < DISTANCE_THRESHOLD_SQ) {
              if (zone.status === 'OFF' || zone.status === 'EMERGENCY') {
                foundDanger = true;
                break;
              } else if (zone.status === 'ON') {
                foundSafe = true;
              }
            }
          }
        }
        
        if (foundDanger) coordStatus = 'DANGER';
        else if (foundSafe) coordStatus = 'SAFE';

        if (currentSegmentStatus === null) {
          currentSegmentStatus = coordStatus;
          currentSegmentCoords.push(coord);
        } else if (currentSegmentStatus === coordStatus) {
          currentSegmentCoords.push(coord);
        } else {
          segments.push({ coordinates: currentSegmentCoords, status: currentSegmentStatus });
          currentSegmentCoords = [currentSegmentCoords[currentSegmentCoords.length - 1], coord];
          currentSegmentStatus = coordStatus;
        }
      }

      if (currentSegmentCoords.length > 0 && currentSegmentStatus !== null) {
        segments.push({ coordinates: currentSegmentCoords, status: currentSegmentStatus });
      }

      let pathStatus: 'SAFE' | 'UNKNOWN' | 'DANGER' = 'SAFE';
      if (segments.some(s => s.status === 'DANGER')) {
        pathStatus = 'DANGER';
      } else if (segments.some(s => s.status === 'UNKNOWN')) {
        pathStatus = 'UNKNOWN';
      }
      return {
        coordinates: formattedCoords,
        segments,
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
    segments: [{ coordinates: [origin, destination], status: 'UNKNOWN' }],
    distance: 0,
    duration: 0,
    status: 'UNKNOWN'
  };
};
