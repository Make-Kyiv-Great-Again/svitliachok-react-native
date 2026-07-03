import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, Polygon, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAppStore } from '../store/useAppStore';
import { ControlPanel } from '../components/ControlPanel';
import { calculateRoute } from '../utils/routing';

const KYIV_CENTER = {
  latitude: 50.4501,
  longitude: 30.5234,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export const MapScreen = () => {
  const { buildingPolygons, syncOutagesForRegion, transportMode, routePreference } = useAppStore();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [selectedOrigin, setSelectedOrigin] = useState<{latitude: number, longitude: number} | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<{latitude: number, longitude: number} | null>(null);
  const [currentRoute, setCurrentRoute] = useState<{latitude: number, longitude: number}[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
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
      if (!selectedOrigin || !selectedDestination) {
        setCurrentRoute([]);
        return;
      }
      
      setIsLoadingRoute(true);
      const route = await calculateRoute(selectedOrigin, selectedDestination, transportMode, routePreference, buildingPolygons);
      setCurrentRoute(route);
      setIsLoadingRoute(false);
    })();
  }, [selectedOrigin, selectedDestination, transportMode, routePreference, buildingPolygons]);

  const handleMapPress = (e: MapPressEvent) => {
    const coord = e.nativeEvent.coordinate;
    if (!selectedOrigin || (selectedOrigin && selectedDestination)) {
      setSelectedOrigin(coord);
      setSelectedDestination(null);
      setCurrentRoute([]);
    } else {
      setSelectedDestination(coord);
    }
  };

  const handleRegionChange = async (region: Region) => {
    // Only query Overpass if we are zoomed in enough (latitudeDelta < 0.05)
    if (region.latitudeDelta > 0.05) return;
    
    // Calculate bounding box for the region
    const south = region.latitude - region.latitudeDelta / 2;
    const north = region.latitude + region.latitudeDelta / 2;
    const west = region.longitude - region.longitudeDelta / 2;
    const east = region.longitude + region.longitudeDelta / 2;
    
    setIsFetchingBuildings(true);
    await syncOutagesForRegion(south, west, north, east);
    setIsFetchingBuildings(false);
  };

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        initialRegion={KYIV_CENTER}
        showsUserLocation={true}
        onPress={handleMapPress}
        onRegionChangeComplete={handleRegionChange}
      >
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

        {selectedOrigin && (
          <Marker coordinate={selectedOrigin} title="Origin" pinColor="green" />
        )}

        {selectedDestination && (
          <Marker coordinate={selectedDestination} title="Destination" pinColor="blue" />
        )}

        {currentRoute.length > 0 && (
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

      {!selectedOrigin && !selectedDestination && (
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>Tap on the map to set starting point</Text>
        </View>
      )}
      {selectedOrigin && !selectedDestination && (
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>Tap on the map to set destination</Text>
        </View>
      )}

      <ControlPanel />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontWeight: '600',
    color: '#3b82f6',
  },
  fetchingOverlay: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fetchingText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#ea580c',
  },
  instructionContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  instructionText: {
    color: 'white',
    fontWeight: '600',
  },
  errorContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  }
});
