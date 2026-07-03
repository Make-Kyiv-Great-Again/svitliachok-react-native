import { LatLng } from 'react-native-maps';
import { BuildingPolygon } from '../types/api';

export const calculateRoute = async (
  origin: LatLng,
  destination: LatLng,
  mode: 'Car' | 'Pedestrian',
  preference: 'Fastest' | 'Illuminated',
  buildingPolygons: BuildingPolygon[]
): Promise<LatLng[]> => {
  try {
    const baseUrl = mode === 'Car' 
      ? 'https://router.project-osrm.org/route/v1/driving'
      : 'https://routing.openstreetmap.de/routed-foot/route/v1/driving';
    
    let coordinatesStr = `${origin.longitude},${origin.latitude};`;
    
    if (preference === 'Illuminated') {
        let closestZoneDistance = Infinity;
        let closestZone: BuildingPolygon | null = null;
        
        const midLat = (origin.latitude + destination.latitude) / 2;
        const midLon = (origin.longitude + destination.longitude) / 2;
        
        buildingPolygons.forEach(zone => {
          if (zone.status === 'OFF' || zone.status === 'EMERGENCY') {
            // compute rough distance to first coordinate as a centroid approximation
            if (zone.coordinates.length > 0) {
              const pt = zone.coordinates[0];
              const dist = Math.sqrt(Math.pow(midLat - pt.latitude, 2) + Math.pow(midLon - pt.longitude, 2));
              if (dist < closestZoneDistance) {
                closestZoneDistance = dist;
                closestZone = zone;
              }
            }
          }
        });
        
        // If a dark zone is near the midpoint, detour around it
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
      const coords = data.routes[0].geometry.coordinates;
      return coords.map((c: number[]) => ({
        latitude: c[1],
        longitude: c[0]
      }));
    }
  } catch (error) {
    console.error("Error fetching route from OSRM:", error);
  }

  // Fallback to straight line if API fails
  return [origin, destination];
};
