import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { StatusResponse } from '../types/api';
import { fetchAllOutageZones } from '../api/client';

export type TransportMode = 'Car' | 'Pedestrian';
export type RoutePreference = 'Fastest' | 'Illuminated';

interface AppState {
  outageZones: StatusResponse[];
  lastSyncTime: number | null;
  isOnline: boolean;
  isSyncing: boolean;
  transportMode: TransportMode;
  routePreference: RoutePreference;
  
  setOnlineStatus: (status: boolean) => void;
  setTransportMode: (mode: TransportMode) => void;
  setRoutePreference: (pref: RoutePreference) => void;
  syncOutages: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      outageZones: [],
      lastSyncTime: null,
      isOnline: true,
      isSyncing: false,
      transportMode: 'Car',
      routePreference: 'Fastest',

      setOnlineStatus: (status: boolean) => set({ isOnline: status }),
      setTransportMode: (mode: TransportMode) => set({ transportMode: mode }),
      setRoutePreference: (pref: RoutePreference) => set({ routePreference: pref }),

      syncOutages: async () => {
        const networkState = await Network.getNetworkStateAsync();
        const online = !!networkState.isConnected && !!networkState.isInternetReachable;
        set({ isOnline: online });

        if (!online) {
          console.log('Device is offline. Using cached outage zones.');
          return;
        }

        try {
          set({ isSyncing: true });
          const zones = await fetchAllOutageZones();
          set({
            outageZones: zones,
            lastSyncTime: Date.now(),
            isSyncing: false,
          });
          console.log('Successfully synced outage zones.');
        } catch (error) {
          console.error('Failed to sync outage zones:', error);
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'svitliachok-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        outageZones: state.outageZones,
        lastSyncTime: state.lastSyncTime,
        transportMode: state.transportMode,
        routePreference: state.routePreference,
      }), // only persist these fields
    }
  )
);
