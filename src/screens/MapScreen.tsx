import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme/useTheme';
import { useRouting } from '../hooks/useRouting';
import { useSearch } from '../hooks/useSearch';
import { fetchStatusByCoordinates } from '../api/client';
import { StatusResponse, SavedLocation, SavedLocationIcon } from '../types/api';

import { ControlPanel } from '../components/ControlPanel';
import { MapTopBar } from '../components/MapTopBar';
import { InspectPanel } from '../components/InspectPanel';
import { RouteLayer } from '../components/RouteLayer';
import { SavedLocationsLayer } from '../components/SavedLocationsLayer';
import { SaveLocationSheet } from '../components/SaveLocationSheet';
import { darkMapStyle } from '../theme/mapStyles';

const KYIV_CENTER = {
  latitude: 50.4501,
  longitude: 30.5234,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

type AppMode = 'INSPECT' | 'ROUTING';

export const MapScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { buildingPolygons, syncOutagesForRegion, transportMode, savedLocations, addSavedLocation, updateSavedLocationStatus, removeSavedLocation } = useAppStore();
  const { i18n } = useTranslation();
  const { colors, isDarkMode } = useTheme();

  const [appMode, setAppMode] = useState<AppMode>('INSPECT');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFetchingBuildings, setIsFetchingBuildings] = useState(false);

  // Inspect State
  const [inspectedLocation, setInspectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [inspectedStatus, setInspectedStatus] = useState<StatusResponse | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [isSaveSheetOpen, setIsSaveSheetOpen] = useState(false);

  // Routing Hook
  const {
    selectedOrigin,
    selectedDestination,
    currentRoute,
    alternativeRoute,
    isLoadingRoute,
    setOrigin,
    setDestination,
    clearRoute,
    swapAlternative,
  } = useRouting({ appMode, transportMode, buildingPolygons });

  // Search Hook
  const {
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    closeSearch,
  } = useSearch(i18n.language);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  const handleMapPress = async (e: MapPressEvent) => {
    if (isSearchOpen) {
      closeSearch();
      Keyboard.dismiss();
      return;
    }

    const coord = e.nativeEvent.coordinate;

    if (appMode === 'INSPECT') {
      setInspectedLocation(coord);
      setIsInspecting(true);
      setInspectError(null);
      setInspectedStatus(null);
      try {
        const result = await fetchStatusByCoordinates(coord.latitude, coord.longitude);
        //console.log('checked coords:', coord)
        console.log('result:', result)
        setInspectedStatus(result);
      } catch (err: any) {
        console.warn('Inspect error:', err);
        setInspectError('No data available for this location.');
      } finally {
        setIsInspecting(false);
      }
    } else {
      if (!selectedOrigin || (selectedOrigin && selectedDestination)) {
        setOrigin(coord);
      } else {
        setDestination(coord);
      }
    }
  };

  const handleRegionChange = async (region: Region) => {
    if (region.latitudeDelta > 0.05) return;
    const south = region.latitude - region.latitudeDelta / 2;
    const north = region.latitude + region.latitudeDelta / 2;
    const west = region.longitude - region.longitudeDelta / 2;
    const east = region.longitude + region.longitudeDelta / 2;
    setIsFetchingBuildings(true);
    await syncOutagesForRegion(south, west, north, east);
    setIsFetchingBuildings(false);
  };

  const handleSelectSearchResult = async (result: any) => {
    Keyboard.dismiss();
    closeSearch();
    const coord = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };

    if (appMode === 'INSPECT') {
      setInspectedLocation(coord);
      setIsInspecting(true);
      setInspectError(null);
      setInspectedStatus(null);
      try {
        const statusResult = await fetchStatusByCoordinates(coord.latitude, coord.longitude);
        setInspectedStatus(statusResult);
      } catch (err: any) {
        setInspectError('No data available for this location.');
      } finally {
        setIsInspecting(false);
      }
    } else {
      if (!selectedOrigin || (selectedOrigin && selectedDestination)) {
        setOrigin(coord);
      } else {
        setDestination(coord);
      }
    }
  };

  const topPadding = Math.max(insets.top, 10);
  const bottomOffset = Math.max(insets.bottom, 20);

  const inspectedSavedLoc = inspectedLocation
    ? savedLocations.find(l => l.latitude === inspectedLocation.latitude && l.longitude === inspectedLocation.longitude)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView
        style={styles.map}
        initialRegion={KYIV_CENTER}
        showsUserLocation={true}
        onPress={handleMapPress}
        onRegionChangeComplete={handleRegionChange}
        userInterfaceStyle={colors.mapStyle}
        customMapStyle={isDarkMode ? darkMapStyle : []}
      >
        {appMode === 'INSPECT' && inspectedLocation && !inspectedSavedLoc && (
          <Marker coordinate={inspectedLocation}>
            <View style={styles.inspectMarkerPin} />
          </Marker>
        )}

        {appMode === 'ROUTING' && (
          <RouteLayer
            selectedOrigin={selectedOrigin}
            selectedDestination={selectedDestination}
            currentRoute={currentRoute}
          />
        )}

        {/* Always show saved location pins */}
        <SavedLocationsLayer
          locations={savedLocations}
          inspectedLocation={appMode === 'INSPECT' ? inspectedLocation : null}
          onPress={(loc) => {
            // In INSPECT mode, tapping a saved pin shows its status
            if (appMode === 'INSPECT') {
              setInspectedLocation({ latitude: loc.latitude, longitude: loc.longitude });
              setInspectedStatus(null);
              setIsInspecting(true);
              setInspectError(null);
              fetchStatusByCoordinates(loc.latitude, loc.longitude)
                .then((res) => { setInspectedStatus(res); updateSavedLocationStatus(loc.id, res.power_status); })
                .catch(() => setInspectError('No data available for this location.'))
                .finally(() => setIsInspecting(false));
            }
          }}
        />
      </MapView>

      {/* Floating Settings Button */}
      {!isSearchOpen && (
        <TouchableOpacity
          style={[styles.settingsBtn, { top: topPadding, backgroundColor: colors.surface, shadowColor: colors.shadow }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Top Floating Bar */}
      <MapTopBar
        appMode={appMode}
        onModeChange={setAppMode}
        isSearchOpen={isSearchOpen}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearchOpen={() => setIsSearchOpen(true)}
        onSearchClose={closeSearch}
        searchResults={searchResults}
        isSearching={isSearching}
        onSelectSearchResult={handleSelectSearchResult}
        selectedOrigin={selectedOrigin}
        selectedDestination={selectedDestination}
        topPadding={topPadding}
      />

      {/* Route Loading Overlay */}
      {isLoadingRoute && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Calculating route...</Text>
        </View>
      )}

      {/* Buildings Fetching Indicator */}
      {isFetchingBuildings && (
        <View style={[styles.fetchingOverlay, { top: topPadding + 56, backgroundColor: colors.surfaceOpaque }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.fetchingText, { color: colors.textPrimary }]}>Scanning area...</Text>
        </View>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Routing Control Panel */}
      {appMode === 'ROUTING' && selectedOrigin && selectedDestination && (
        <ControlPanel
          distance={currentRoute.distance}
          duration={currentRoute.duration}
          routeStatus={currentRoute.status}
          hasAlternative={alternativeRoute !== null}
          onSwapRoute={swapAlternative}
          onClear={clearRoute}
          onRebuild={() => { }}
        />
      )}

      {/* Inspect Panel — hidden when save sheet is open */}
      {appMode === 'INSPECT' && inspectedLocation && !isSaveSheetOpen && (
        <InspectPanel
          isInspecting={isInspecting}
          inspectedStatus={inspectedStatus}
          inspectError={inspectError}
          bottomOffset={bottomOffset}
          onClose={() => {
            setInspectedLocation(null);
            setInspectedStatus(null);
            setIsSaveSheetOpen(false);
          }}
          onSave={() => setIsSaveSheetOpen(true)}
          isSaved={!!inspectedSavedLoc}
          onRemove={() => {
            if (inspectedSavedLoc) {
              removeSavedLocation(inspectedSavedLoc.id);
              setInspectedLocation(null);
              setInspectedStatus(null);
            }
          }}
        />
      )}

      {/* Save Location Sheet */}
      {isSaveSheetOpen && inspectedStatus && (
        <SaveLocationSheet
          bottomOffset={bottomOffset}
          suggestedName={inspectedStatus.address || ''}
          onCancel={() => setIsSaveSheetOpen(false)}
          onSave={(name: string, icon: SavedLocationIcon) => {
            const newLoc: SavedLocation = {
              id: `${Date.now()}`,
              name,
              icon,
              latitude: inspectedLocation!.latitude,
              longitude: inspectedLocation!.longitude,
              power_status: inspectedStatus.power_status ?? 'UNKNOWN',
              savedAt: Date.now(),
            };
            addSavedLocation(newLoc);
            setIsSaveSheetOpen(false);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  settingsBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  inspectMarkerPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  loadingOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontWeight: '600',
  },
  fetchingOverlay: {
    position: 'absolute',
    right: 20,
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  fetchingText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
