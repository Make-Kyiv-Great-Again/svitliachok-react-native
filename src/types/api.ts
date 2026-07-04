export interface OutageSlot {
  start: number;
  end: number;
  type: string;
}

export interface PlannedDayOutages {
  date: string;
  status: string;
  slots: OutageSlot[];
}

export interface PlannedOutageInfo {
  today: PlannedDayOutages | null;
  tomorrow: PlannedDayOutages | null;
  updatedOn: string | null;
}

export interface GroupAssignment {
  group: number;
  subgroup: number;
  raw_group_key: string;
  mapped_group_key: string;
}

export interface StatusResponse {
  region_id: number;
  street_id: number;
  house_id: number;
  dso_id: number;
  address: string;
  group_info: GroupAssignment;
  power_status: 'ON' | 'OFF' | 'EMERGENCY';
  status_reason: string;
  planned_schedule: PlannedOutageInfo | null;
  weekly_schedule: Record<string, OutageSlot[]> | null;
  has_power: boolean;
  group: string;
  last_update: string | null;
  
  lat?: number;
  lon?: number;
}

export interface BuildingPolygon {
  id: number;
  coordinates: { latitude: number, longitude: number }[];
  street: string;
  house: string;
  status: 'ON' | 'OFF' | 'EMERGENCY' | 'UNKNOWN';
}

export type SavedLocationIcon = 'home' | 'business' | 'school' | 'fitness' | 'restaurant' | 'heart' | 'star' | 'location';

export interface SavedLocation {
  id: string;
  name: string;
  icon: SavedLocationIcon;
  latitude: number;
  longitude: number;
  power_status: 'ON' | 'OFF' | 'EMERGENCY' | 'UNKNOWN';
  savedAt: number;
}
