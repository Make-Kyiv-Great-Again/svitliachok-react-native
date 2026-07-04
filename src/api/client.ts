import axios from 'axios';
import { StatusResponse, BuildingPolygon } from '../types/api';

const API_BASE_URL = 'https://svitlo-finder.xyz/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const fetchStatusByCoordinates = async (lat: number, lon: number): Promise<StatusResponse> => {
  const response = await apiClient.get<StatusResponse>('/status/coordinates', {
    params: { lat, lon },
  });
  return response.data;
};

export const fetchBuildingsInRegion = async (
  south: number, west: number, north: number, east: number
): Promise<BuildingPolygon[]> => {
  try {
    const query = `[out:json];way(${south},${west},${north},${east})["addr:housenumber"]["addr:street"];out geom;`;
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const response = await axios.post(overpassUrl, `data=${encodeURIComponent(query)}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const data = response.data;
    const elements = data.elements || [];
    
    if (elements.length === 0) return [];
    
    const buildingsByStreet: Record<string, any[]> = {};
    elements.forEach((b: any) => {
      const street = b.tags['addr:street'];
      if (!buildingsByStreet[street]) buildingsByStreet[street] = [];
      buildingsByStreet[street].push(b);
    });
    
    const uniqueToQuery: {streetName: string, houseName: string}[] = [];
    const queriedKeys = new Set<string>();
    
    for (const street in buildingsByStreet) {
      const streetBuildings = buildingsByStreet[street];
      let count = 0;
      for (const b of streetBuildings) {
        const house = b.tags['addr:housenumber'];
        const key = `${street}||${house}`;
        if (!queriedKeys.has(key)) {
          queriedKeys.add(key);
          uniqueToQuery.push({ streetName: street, houseName: house });
          count++;
          if (count >= 3) break;
        }
      }
    }
    
    // Fetch batch statuses
    const batchRes = await apiClient.post('/status/batch', uniqueToQuery);
    const batchResults = batchRes.data;
    
    const resolvedStatuses: Record<string, string> = {};
    const streetStatuses: Record<string, {houseNum: number, status: string}[]> = {};
    
    batchResults.forEach((item: any) => {
      // API might return 'power_status' or 'status'
      const status = item.power_status || item.status || 'UNKNOWN';
      const key = `${item.streetName}||${item.houseName}`;
      resolvedStatuses[key] = status;
      
      if (!streetStatuses[item.streetName]) streetStatuses[item.streetName] = [];
      const match = item.houseName ? item.houseName.match(/\\d+/) : null;
      const num = match ? parseInt(match[0]) : 1;
      
      streetStatuses[item.streetName].push({
        houseNum: num,
        status: status
      });
    });
    
    return elements.map((b: any) => {
      const street = b.tags['addr:street'];
      const house = b.tags['addr:housenumber'];
      const key = `${street}||${house}`;
      
      let status = 'UNKNOWN';
      if (resolvedStatuses[key] && resolvedStatuses[key] !== 'UNKNOWN') {
        status = resolvedStatuses[key];
      } else if (streetStatuses[street]) {
         const valid = streetStatuses[street].filter(s => s.status !== 'UNKNOWN');
         const list = valid.length > 0 ? valid : streetStatuses[street];
         if (list.length > 0) {
           const match = house ? house.match(/\\d+/) : null;
           const targetNum = match ? parseInt(match[0]) : 1;
           let minDiff = Infinity;
           let bestStatus = 'UNKNOWN';
           list.forEach(item => {
             const diff = Math.abs(item.houseNum - targetNum);
             if (diff < minDiff) {
               minDiff = diff;
               bestStatus = item.status;
             }
           });
            status = bestStatus;
          }
      }

      // MOCK DATA block removed to use real server data
      
      const coordinates = b.geometry.map((pt: any) => ({ latitude: pt.lat, longitude: pt.lon }));
      
      return {
        id: b.id,
        coordinates,
        street,
        house,
        status: status as 'ON' | 'OFF' | 'EMERGENCY' | 'UNKNOWN'
      };
    });
  } catch (error) {
    console.error("Failed to fetch viewport data:", error);
    return [];
  }
};
