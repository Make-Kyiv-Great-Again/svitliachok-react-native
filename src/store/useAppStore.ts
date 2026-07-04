import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { BuildingPolygon, SavedLocation } from '../types/api';
import { fetchBuildingsInRegion } from '../api/client';

export type TransportMode = 'Driving' | 'Walking';
export type RoutePreference = 'Fastest' | 'Illuminated';
export type ThemePreference = 'system' | 'light' | 'dark';

interface AppState {
  buildingPolygons: BuildingPolygon[];
  lastSyncTime: number | null;
  isOnline: boolean;
  isSyncing: boolean;
  transportMode: TransportMode;
  routePreference: RoutePreference;
  themePreference: ThemePreference;
  savedLocations: SavedLocation[];

  setOnlineStatus: (status: boolean) => void;
  setTransportMode: (mode: TransportMode) => void;
  setRoutePreference: (pref: RoutePreference) => void;
  setThemePreference: (theme: ThemePreference) => void;
  addSavedLocation: (loc: SavedLocation) => void;
  removeSavedLocation: (id: string) => void;
  updateSavedLocationStatus: (id: string, power_status: SavedLocation['power_status']) => void;
  syncOutagesForRegion: (south: number, west: number, north: number, east: number) => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      buildingPolygons: [],
      lastSyncTime: null,
      isOnline: true,
      isSyncing: false,
      transportMode: 'Driving',
      routePreference: 'Fastest',
      themePreference: 'system',
      savedLocations: [],

      setOnlineStatus: (status: boolean) => set({ isOnline: status }),
      setTransportMode: (mode: TransportMode) => set({ transportMode: mode }),
      setRoutePreference: (pref: RoutePreference) => set({ routePreference: pref }),
      setThemePreference: (theme: ThemePreference) => set({ themePreference: theme }),

      addSavedLocation: (loc: SavedLocation) =>
        set((state) => ({ savedLocations: [...state.savedLocations, loc] })),

      removeSavedLocation: (id: string) =>
        set((state) => ({ savedLocations: state.savedLocations.filter((l) => l.id !== id) })),

      updateSavedLocationStatus: (id: string, power_status: SavedLocation['power_status']) =>
        set((state) => ({
          savedLocations: state.savedLocations.map((l) =>
            l.id === id ? { ...l, power_status } : l,
          ),
        })),

      syncOutagesForRegion: async (south, west, north, east) => {
        const networkState = await Network.getNetworkStateAsync();
        const online = !!networkState.isConnected && !!networkState.isInternetReachable;
        set({ isOnline: online });

        if (!online) {
          console.log('Device is offline. Using cached building polygons.');
          return;
        }

        try {
          set({ isSyncing: true });
          const polygons = await fetchBuildingsInRegion(south, west, north, east);
          
          // Merge with existing polygons to act as a cache
          const existing = get().buildingPolygons;
          const mergedMap = new Map();
          existing.forEach(p => mergedMap.set(p.id, p));
          polygons.forEach(p => mergedMap.set(p.id, p));
          
          set({
            buildingPolygons: Array.from(mergedMap.values()),
            lastSyncTime: Date.now(),
            isSyncing: false,
          });
          console.log(`Successfully synced ${polygons.length} buildings for region.`);
        } catch (error) {
          console.warn('Failed to sync buildings:', error);
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'svitliachok-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        buildingPolygons: state.buildingPolygons,
        lastSyncTime: state.lastSyncTime,
        transportMode: state.transportMode,
        routePreference: state.routePreference,
        themePreference: state.themePreference,
        savedLocations: state.savedLocations,
      }),
    }
  )
);
