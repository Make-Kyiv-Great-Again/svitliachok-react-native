import axios from 'axios';
import { StatusResponse } from '../types/api';

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

// We will mock fetching all outage zones by coordinates since the API is address-based.
// In a real scenario, the backend should return a list of polygons or coordinates of all dark zones in Kyiv.
export const fetchAllOutageZones = async (): Promise<StatusResponse[]> => {
  // Demo mock: Return some mock dark zones in Kyiv if the API doesn't have a bulk endpoint
  return [
    {
      region_id: 25,
      street_id: 1,
      house_id: 1,
      dso_id: 902,
      address: 'Mock Dark Zone 1',
      group_info: { group: 1, subgroup: 1, raw_group_key: '', mapped_group_key: '' },
      power_status: 'OFF',
      status_reason: 'Planned',
      planned_schedule: null,
      weekly_schedule: null,
      has_power: false,
      group: '1',
      last_update: null,
      lat: 50.4501,
      lon: 30.5234, // Kyiv center
    },
    {
      region_id: 25,
      street_id: 2,
      house_id: 2,
      dso_id: 902,
      address: 'Mock Dark Zone 2',
      group_info: { group: 2, subgroup: 2, raw_group_key: '', mapped_group_key: '' },
      power_status: 'OFF',
      status_reason: 'Emergency',
      planned_schedule: null,
      weekly_schedule: null,
      has_power: false,
      group: '2',
      last_update: null,
      lat: 50.4400,
      lon: 30.5100, // Near KPI or similar
    }
  ];
};
