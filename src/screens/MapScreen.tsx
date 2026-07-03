import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, TextInput, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, Polygon, MapPressEvent, Region, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { ControlPanel } from '../components/ControlPanel';
import { calculateRoute } from '../utils/routing';
import { fetchStatusByCoordinates } from '../api/client';
import { StatusResponse } from '../types/api';

const KYIV_CENTER = {
  latitude: 50.4501,
  longitude: 30.5234,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

type AppMode = 'INSPECT' | 'ROUTING';

export const MapScreen = () => {
  const insets = useSafeAreaInsets();
  const { buildingPolygons, syncOutagesForRegion, transportMode, routePreference } = useAppStore();
  const [appMode, setAppMode] = useState<AppMode>('INSPECT');
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Routing State
  const [selectedOrigin, setSelectedOrigin] = useState<{latitude: number, longitude: number} | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<{latitude: number, longitude: number} | null>(null);
  const [currentRoute, setCurrentRoute] = useState<{
    coordinates: {latitude: number, longitude: number}[];
    distance: number;
    duration: number;
  }>({ coordinates: [], distance: 0, duration: 0 });
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  
  // Search UI State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDest, setSearchDest] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Inspect State
  const [inspectedLocation, setInspectedLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [inspectedStatus, setInspectedStatus] = useState<StatusResponse | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);

  const [isFetchingBuildings, setIsFetchingBuildings] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (appMode !== 'ROUTING' || !selectedOrigin || !selectedDestination) {
        return;
      }
      
      setIsLoadingRoute(true);
      const routeResult = await calculateRoute(selectedOrigin, selectedDestination, transportMode, routePreference, buildingPolygons);
      setCurrentRoute(routeResult);
      setIsLoadingRoute(false);
    })();
  }, [selectedOrigin, selectedDestination, transportMode, routePreference, buildingPolygons, appMode]);

  const handleMapPress = async (e: MapPressEvent) => {
    if (isSearchOpen) {
      setIsSearchOpen(false);
      Keyboard.dismiss();
    }

    const coord = e.nativeEvent.coordinate;
    
    if (appMode === 'INSPECT') {
      setInspectedLocation(coord);
      setIsInspecting(true);
      setInspectError(null);
      setInspectedStatus(null);
      
      try {
        const result = await fetchStatusByCoordinates(coord.latitude, coord.longitude);
        setInspectedStatus(result);
      } catch (err: any) {
        console.error("Inspect error:", err);
        setInspectError("No data available for this location.");
      } finally {
        setIsInspecting(false);
      }
    } else {
      // Routing Mode
      if (!selectedOrigin || (selectedOrigin && selectedDestination)) {
        setSelectedOrigin(coord);
        setSelectedDestination(null);
        setCurrentRoute({ coordinates: [], distance: 0, duration: 0 });
      } else {
        setSelectedDestination(coord);
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

  const executeSearch = async () => {
    Keyboard.dismiss();
    if (!searchOrigin || !searchDest) return;

    setIsGeocoding(true);
    try {
      const originResult = await Location.geocodeAsync(searchOrigin);
      const destResult = await Location.geocodeAsync(searchDest);

      if (originResult.length > 0 && destResult.length > 0) {
        setSelectedOrigin({ latitude: originResult[0].latitude, longitude: originResult[0].longitude });
        setSelectedDestination({ latitude: destResult[0].latitude, longitude: destResult[0].longitude });
        setIsSearchOpen(false);
      } else {
        alert("Could not find one of the locations.");
      }
    } catch (e) {
      alert("Error searching for locations.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const renderInspectBottomBlock = () => {
    if (appMode !== 'INSPECT' || !inspectedLocation) return null;

    return (
      <View style={[styles.inspectBottomBlock, { bottom: Math.max(insets.bottom + 10, 20) }]}>
        <TouchableOpacity 
          style={styles.inspectCloseBtn} 
          onPress={() => {
            setInspectedLocation(null);
            setInspectedStatus(null);
          }}
          hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}
        >
          <Ionicons name="close" size={24} color="#94a3b8" />
        </TouchableOpacity>
        
        {isInspecting ? (
          <View style={styles.inspectLoadingRow}>
            <ActivityIndicator size="small" color="#F59E0B" />
            <Text style={styles.inspectLoadingText}>Checking status...</Text>
          </View>
        ) : inspectError ? (
          <Text style={styles.inspectErrorText}>{inspectError}</Text>
        ) : inspectedStatus ? (
          <View>
            <Text style={styles.inspectTitle}>{inspectedStatus.address || 'Address Unknown'}</Text>
            <View style={styles.inspectStatusRow}>
              <View style={[styles.statusDot, { backgroundColor: inspectedStatus.power_status === 'ON' ? '#F59E0B' : '#475569' }]} />
              <Text style={styles.inspectStatusText}>
                Status: {inspectedStatus.power_status === 'ON' ? 'Active' : 
                 inspectedStatus.power_status === 'OFF' ? 'No Power' : 
                 inspectedStatus.power_status}
              </Text>
            </View>
            {inspectedStatus.status_reason && (
              <Text style={styles.inspectSubtext}>{inspectedStatus.status_reason}</Text>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Floating Bar */}
      <View style={[styles.topBarContainer, { paddingTop: Math.max(insets.top, 10) }]}>
        {isSearchOpen ? (
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Origin (e.g. Khreshchatyk 1)"
              placeholderTextColor="#94a3b8"
              value={searchOrigin}
              onChangeText={setSearchOrigin}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Destination (e.g. Podil)"
              placeholderTextColor="#94a3b8"
              value={searchDest}
              onChangeText={setSearchDest}
            />
            <View style={styles.searchButtonsRow}>
              <TouchableOpacity style={styles.searchCancelBtn} onPress={() => setIsSearchOpen(false)}>
                <Text style={styles.searchCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.searchSubmitBtn} onPress={executeSearch}>
                {isGeocoding ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.searchSubmitText}>Search Paths</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.topBarWrapper}>
            <View style={styles.topBar}>
              <TouchableOpacity 
                style={[styles.modeButton, appMode === 'INSPECT' && styles.modeButtonActive]}
                onPress={() => setAppMode('INSPECT')}
              >
                <Text style={[styles.modeButtonText, appMode === 'INSPECT' && styles.modeButtonTextActive]}>Inspect</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeButton, appMode === 'ROUTING' && styles.modeButtonActive]}
                onPress={() => setAppMode('ROUTING')}
              >
                <Text style={[styles.modeButtonText, appMode === 'ROUTING' && styles.modeButtonTextActive]}>Paths</Text>
              </TouchableOpacity>
            </View>
            
            {appMode === 'ROUTING' && (
              <TouchableOpacity 
                style={styles.searchIconBtn} 
                onPress={() => setIsSearchOpen(true)}
              >
                <Ionicons name="search" size={20} color="#1e293b" />
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {appMode === 'ROUTING' && !isSearchOpen && (!selectedOrigin || !selectedDestination) && (
          <View style={styles.instructionContainer}>
            {!selectedOrigin && !selectedDestination && (
              <Text style={styles.instructionText}>Tap on the map to set starting point</Text>
            )}
            {selectedOrigin && !selectedDestination && (
              <Text style={styles.instructionText}>Tap on the map to set destination</Text>
            )}
          </View>
        )}
      </View>

      <MapView 
        style={styles.map}
        initialRegion={KYIV_CENTER}
        showsUserLocation={true}
        onPress={handleMapPress}
        onRegionChangeComplete={handleRegionChange}
        userInterfaceStyle="light"
      >
        {appMode === 'INSPECT' && inspectedLocation && (
          <Marker coordinate={inspectedLocation}>
            <View style={styles.inspectMarkerPin} />
          </Marker>
        )}

        {appMode === 'ROUTING' && selectedOrigin && (
          <Circle
            center={selectedOrigin}
            radius={1000} // 1km radius
            fillColor="transparent"
            strokeColor="rgba(245, 158, 11, 0.6)" // Orange
            strokeWidth={1.5}
            lineDashPattern={[5, 5]}
          />
        )}

        {/* Render Actual Building Polygons from API */}
        {buildingPolygons.map((building) => {
          let fillColor = 'rgba(148, 163, 184, 0.5)'; // Light Grey (Unknown)
          let strokeColor = 'rgba(100, 116, 139, 0.8)';
          
          if (building.status === 'ON') {
             fillColor = 'rgba(245, 158, 11, 0.7)'; // Orange
             strokeColor = 'rgba(245, 158, 11, 1)';
          } else if (building.status === 'OFF' || building.status === 'EMERGENCY') {
             fillColor = 'rgba(30, 41, 59, 0.8)'; // Dark slate
             strokeColor = 'rgba(15, 23, 42, 1)';
          }

          return (
            <Polygon
              key={`building-${building.id}`}
              coordinates={building.coordinates}
              fillColor={fillColor}
              strokeColor={strokeColor}
              strokeWidth={1}
            />
          );
        })}

        {appMode === 'ROUTING' && selectedOrigin && (
          <Marker coordinate={selectedOrigin} title="Origin" pinColor="green" />
        )}

        {appMode === 'ROUTING' && selectedDestination && (
          <Marker coordinate={selectedDestination} title="Destination" pinColor="blue" />
        )}

        {appMode === 'ROUTING' && currentRoute.coordinates.length > 0 && (
          <Polyline
            coordinates={currentRoute.coordinates}
            strokeColor="#3b82f6"
            strokeWidth={4}
          />
        )}
      </MapView>
      
      {isLoadingRoute && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Calculating route...</Text>
        </View>
      )}
      
      {isFetchingBuildings && (
        <View style={styles.fetchingOverlay}>
          <ActivityIndicator size="small" color="#F59E0B" />
          <Text style={styles.fetchingText}>Scanning houses...</Text>
        </View>
      )}

      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {appMode === 'ROUTING' && (
        <ControlPanel
          distance={currentRoute.distance}
          duration={currentRoute.duration}
          onClear={() => {
            setSelectedOrigin(null);
            setSelectedDestination(null);
            setCurrentRoute({ coordinates: [], distance: 0, duration: 0 });
          }}
          onRebuild={() => {
             // to trigger rebuild we just trick the effect by toggling state or it will rebuild when deps change
             // actually since preference/mode changes are in the deps of useEffect, it will auto rebuild!
             // but if they click rebuild button manually? 
             // We can just set currentRoute to empty which might not retrigger unless we add a state.
             // Actually, when preference changes, the useEffect runs automatically.
          }}
        />
      )}
      
      {renderInspectBottomBlock()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topBarContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 10,
    alignItems: 'center',
    paddingTop: 10,
  },
  topBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  modeButtonActive: {
    backgroundColor: '#F59E0B',
  },
  modeButtonText: {
    color: '#64748b',
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  searchIconBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBarContainer: {
    width: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    color: '#0f172a',
    fontSize: 14,
  },
  searchButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  searchCancelBtn: {
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  searchCancelText: {
    color: '#64748b',
    fontWeight: '600',
  },
  searchSubmitBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  searchSubmitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  instructionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  instructionText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 12,
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
    color: '#3b82f6',
  },
  fetchingOverlay: {
    position: 'absolute',
    top: 90,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    color: '#F59E0B',
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
  inspectMarkerPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  inspectBottomBlock: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  inspectCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  inspectLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  inspectLoadingText: {
    color: '#64748b',
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '500',
  },
  inspectErrorText: {
    color: '#ef4444',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  inspectTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  inspectStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  inspectStatusText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
  inspectSubtext: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
});
