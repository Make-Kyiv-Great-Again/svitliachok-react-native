import { LatLng } from 'react-native-maps';
import { StatusResponse } from '../types/api';

export const calculateRoute = async (
  origin: LatLng,
  destination: LatLng,
  mode: 'Car' | 'Pedestrian',
  preference: 'Fastest' | 'Illuminated',
  outageZones: StatusResponse[]
): Promise<LatLng[]> => {
  try {
    const baseUrl = mode === 'Car' 
      ? 'https://router.project-osrm.org/route/v1/driving'
      : 'https://routing.openstreetmap.de/routed-foot/route/v1/driving';
    
    let coordinatesStr = `${origin.longitude},${origin.latitude};`;
    
    if (preference === 'Illuminated') {
        let closestZoneDistance = Infinity;
        let closestZone: StatusResponse | null = null;
        
        const midLat = (origin.latitude + destination.latitude) / 2;
        const midLon = (origin.longitude + destination.longitude) / 2;
        
        outageZones.forEach(zone => {
          if (zone.lat && zone.lon && zone.power_status === 'OFF') {
            const dist = Math.sqrt(Math.pow(midLat - zone.lat, 2) + Math.pow(midLon - zone.lon, 2));
            if (dist < closestZoneDistance) {
              closestZoneDistance = dist;
              closestZone = zone;
            }
          }
        });
        
        // If a dark zone is near the midpoint, detour around it
        if (closestZoneDistance < 0.02 && closestZone) {
             coordinatesStr += `${(closestZone.lon || 0) + 0.01},${(closestZone.lat || 0) + 0.01};`;
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
