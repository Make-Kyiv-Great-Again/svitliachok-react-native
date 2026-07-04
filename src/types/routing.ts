import { LatLng } from 'react-native-maps';

export interface RouteSegment {
  coordinates: LatLng[];
  status: 'SAFE' | 'UNKNOWN' | 'DANGER';
}

export interface RouteResult {
  coordinates: LatLng[];
  segments: RouteSegment[];
  distance: number; // in meters
  duration: number; // in seconds
  status: 'SAFE' | 'UNKNOWN' | 'DANGER';
}

export const EMPTY_ROUTE: RouteResult = {
  coordinates: [],
  segments: [],
  distance: 0,
  duration: 0,
  status: 'UNKNOWN',
};
