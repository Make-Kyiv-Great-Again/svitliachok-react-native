import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import MapView, { Marker, Polyline, Polygon, MapPressEvent, Region, Callout, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAppStore } from '../store/useAppStore';
import { ControlPanel } from '../components/ControlPanel';
import { calculateRoute } from '../utils/routing';
import { darkMapStyle } from '../utils/mapStyle';
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
  const { buildingPolygons, syncOutagesForRegion, transportMode, routePreference } = useAppStore();
  const [appMode, setAppMode] = useState<AppMode>('INSPECT');
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Routing State
  const [selectedOrigin, setSelectedOrigin] = useState<{latitude: number, longitude: number} | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<{latitude: number, longitude: number} | null>(null);
  const [currentRoute, setCurrentRoute] = useState<{latitude: number, longitude: number}[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  
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
      const route = await calculateRoute(selectedOrigin, selectedDestination, transportMode, routePreference, buildingPolygons);
      setCurrentRoute(route);
      setIsLoadingRoute(false);
    })();
  }, [selectedOrigin, selectedDestination, transportMode, routePreference, buildingPolygons, appMode]);

  const handleMapPress = async (e: MapPressEvent) => {
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
        setCurrentRoute([]);
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

  const toggleMode = () => {
    if (appMode === 'INSPECT') {
      setAppMode('ROUTING');
      setInspectedLocation(null);
      setInspectedStatus(null);
    } else {
      setAppMode('INSPECT');
      setSelectedOrigin(null);
      setSelectedDestination(null);
      setCurrentRoute([]);
    }
  };

  const renderInspectMarker = () => {
    if (!inspectedLocation) return null;
    
    return (
      <Marker coordinate={inspectedLocation}>
        <View style={styles.inspectMarkerPin} />
        <Callout tooltip>
          <View style={styles.calloutContainer}>
            {isInspecting ? (
              <View style={styles.calloutLoading}>
                <ActivityIndicator size="small" color="#ea580c" />
                <Text style={styles.calloutText}>Checking status...</Text>
              </View>
            ) : inspectError ? (
              <Text style={styles.calloutError}>{inspectError}</Text>
            ) : inspectedStatus ? (
              <View>
                <Text style={styles.calloutTitle}>{inspectedStatus.address || 'Address Unknown'}</Text>
                <View style={styles.calloutStatusRow}>
                  <View style={[styles.statusDot, { backgroundColor: inspectedStatus.power_status === 'ON' ? '#ea580c' : '#111827' }]} />
                  <Text style={styles.calloutStatusText}>
                    {inspectedStatus.power_status === 'ON' ? 'POWER ON' : 
                     inspectedStatus.power_status === 'OFF' ? 'POWER OFF' : 
                     inspectedStatus.power_status}
                  </Text>
                </View>
                {inspectedStatus.status_reason && (
                  <Text style={styles.calloutSubtext}>{inspectedStatus.status_reason}</Text>
                )}
              </View>
            ) : null}
          </View>
        </Callout>
      </Marker>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Floating Bar */}
      <SafeAreaView style={styles.topBarContainer}>
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
          <View style={styles.instructionContainer}>
            {!selectedOrigin && !selectedDestination && (
              <Text style={styles.instructionText}>Tap on the map to set starting point</Text>
            )}
            {selectedOrigin && !selectedDestination && (
              <Text style={styles.instructionText}>Tap on the map to set destination</Text>
            )}
          </View>
        )}
      </SafeAreaView>

      <MapView 
        style={styles.map}
        initialRegion={KYIV_CENTER}
        showsUserLocation={true}
        onPress={handleMapPress}
        onRegionChangeComplete={handleRegionChange}
        userInterfaceStyle="dark"
        customMapStyle={darkMapStyle}
      >
        {appMode === 'INSPECT' && renderInspectMarker()}

        {appMode === 'ROUTING' && selectedOrigin && (
          <Circle
            center={selectedOrigin}
            radius={1000} // 1km radius
            fillColor="transparent"
            strokeColor="rgba(251, 146, 60, 0.8)" // Orange
            strokeWidth={1.5}
            lineDashPattern={[5, 5]}
          />
        )}

        {/* Render Actual Building Polygons from API */}
        {buildingPolygons.map((building) => {
          let fillColor = 'rgba(75, 85, 99, 0.5)'; // Grey (Unknown)
          let strokeColor = 'rgba(75, 85, 99, 0.8)';
          
          if (building.status === 'ON') {
             fillColor = 'rgba(234, 88, 12, 0.8)'; // Orange
             strokeColor = 'rgba(251, 146, 60, 1)';
          } else if (building.status === 'OFF' || building.status === 'EMERGENCY') {
             fillColor = 'rgba(17, 24, 39, 0.95)'; // Black
             strokeColor = 'rgba(55, 65, 81, 1)';
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

        {appMode === 'ROUTING' && currentRoute.length > 0 && (
          <Polyline
            coordinates={currentRoute}
            strokeColor="#3b82f6"
            strokeWidth={5}
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
          <ActivityIndicator size="small" color="#ea580c" />
          <Text style={styles.fetchingText}>Scanning houses...</Text>
        </View>
      )}

      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {appMode === 'ROUTING' && <ControlPanel />}
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
  topBarContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 10,
    alignItems: 'center',
    paddingTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  modeButtonActive: {
    backgroundColor: '#ea580c',
  },
  modeButtonText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  instructionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  instructionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
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
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fetchingText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#ea580c',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 100,
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
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 3,
    borderColor: '#ea580c',
  },
  calloutContainer: {
    width: 200,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
  },
  calloutLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutText: {
    color: '#f8fafc',
    marginLeft: 8,
    fontSize: 14,
  },
  calloutError: {
    color: '#fca5a5',
    fontSize: 14,
  },
  calloutTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  calloutStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  calloutStatusText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  calloutSubtext: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
  },
});
