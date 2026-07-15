import { useState, useEffect, useRef } from 'react';
import { LatLng } from 'react-native-maps';
import { BuildingPolygon } from '../types/api';
import { RouteResult, EMPTY_ROUTE } from '../types/routing';
import { calculateRoute } from '../utils/routing';
import { buildInitialRouteSegments, verifyLampsForSegments } from '../utils/routeOptimizer';

export type AppMode = 'INSPECT' | 'ROUTING';

interface UseRoutingParams {
  appMode: AppMode;
  transportMode: 'Driving' | 'Walking' | 'Cycling';
  buildingPolygons: BuildingPolygon[];
}

export function useRouting({ appMode, transportMode, buildingPolygons }: UseRoutingParams) {
  const [selectedOrigin, setSelectedOriginState] = useState<LatLng | null>(null);
  const [selectedDestination, setSelectedDestinationState] = useState<LatLng | null>(null);
  const [currentRoute, setCurrentRoute] = useState<RouteResult>(EMPTY_ROUTE);
  const [alternativeRoute, setAlternativeRoute] = useState<RouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  const buildingPolygonsRef = useRef(buildingPolygons);
  useEffect(() => {
    buildingPolygonsRef.current = buildingPolygons;
  }, [buildingPolygons]);

  useEffect(() => {
    if (appMode !== 'ROUTING' || !selectedOrigin || !selectedDestination) return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setIsLoadingRoute(true);
      setAlternativeRoute(null);

      // 1. Calculate OSRM route
      const defaultRoute = await calculateRoute(
        selectedOrigin,
        selectedDestination,
        transportMode,
        'Fastest',
        buildingPolygonsRef.current,
      );
      if (cancelled) return;
      
      // 2. Phase 1: Split into initial red/green/gray segments based on power status
      try {
        const initialSegments = await buildInitialRouteSegments(defaultRoute.coordinates, controller.signal);
        defaultRoute.segments = initialSegments;
        defaultRoute.status = initialSegments.some(s => s.status === 'DANGER') 
          ? 'DANGER' 
          : initialSegments.some(s => s.status === 'UNKNOWN') 
            ? 'UNKNOWN' 
            : 'SAFE';
      } catch (err) {
        console.warn('Error processing initial default route segments:', err);
      }

      // 3. Immediately display the initial route (built and split)
      setCurrentRoute({ ...defaultRoute });
      setIsLoadingRoute(false);

      // 4. Phase 2: In the background, query Overpass lamps for those defined segments
      try {
        const { segments: finalSegments, lamps } = await verifyLampsForSegments(defaultRoute.segments, controller.signal);
        if (!cancelled) {
          defaultRoute.segments = finalSegments;
          defaultRoute.lamps = lamps;
          defaultRoute.status = finalSegments.some(s => s.status === 'DANGER') 
            ? 'DANGER' 
            : finalSegments.some(s => s.status === 'UNKNOWN') 
              ? 'UNKNOWN' 
              : 'SAFE';
          setCurrentRoute({ ...defaultRoute });
        }
      } catch (err) {
        console.warn('Error verifying default route lamps:', err);
      }

      // Check if we need an alternative route
      if (defaultRoute.status === 'UNKNOWN' || defaultRoute.status === 'DANGER') {
        const altRoute = await calculateRoute(
          selectedOrigin,
          selectedDestination,
          transportMode,
          'Illuminated',
          buildingPolygonsRef.current,
        );
        if (cancelled) return;

        // Phase 1 for altRoute
        try {
          const initialAltSegments = await buildInitialRouteSegments(altRoute.coordinates, controller.signal);
          altRoute.segments = initialAltSegments;
          altRoute.status = initialAltSegments.some(s => s.status === 'DANGER') 
            ? 'DANGER' 
            : initialAltSegments.some(s => s.status === 'UNKNOWN') 
              ? 'UNKNOWN' 
              : 'SAFE';
        } catch (err) {
          console.warn('Error processing initial alt route segments:', err);
        }

        // Render altRoute initially
        if (!cancelled) {
          if (Math.abs(altRoute.distance - defaultRoute.distance) > 10 || altRoute.status !== defaultRoute.status) {
            setAlternativeRoute({ ...altRoute });
          }
        }

        // Phase 2 for altRoute (background lamp check)
        try {
          const { segments: finalAltSegments, lamps: altLamps } = await verifyLampsForSegments(altRoute.segments, controller.signal);
          if (!cancelled) {
            altRoute.segments = finalAltSegments;
            altRoute.lamps = altLamps;
            altRoute.status = finalAltSegments.some(s => s.status === 'DANGER') 
              ? 'DANGER' 
              : finalAltSegments.some(s => s.status === 'UNKNOWN') 
                ? 'UNKNOWN' 
                : 'SAFE';
            
            if (Math.abs(altRoute.distance - defaultRoute.distance) > 10 || altRoute.status !== defaultRoute.status) {
              setAlternativeRoute({ ...altRoute });
            }
          }
        } catch (err) {
          console.warn('Error verifying alt route lamps:', err);
        }
      }
    })();

    return () => { cancelled = true; controller.abort(); };
  }, [selectedOrigin, selectedDestination, transportMode, appMode]);

  const setOrigin = (coord: LatLng) => {
    setSelectedOriginState(coord);
    setSelectedDestinationState(null);
    setCurrentRoute(EMPTY_ROUTE);
    setAlternativeRoute(null);
  };

  const setDestination = (coord: LatLng) => {
    setSelectedDestinationState(coord);
  };

  const clearRoute = () => {
    setSelectedOriginState(null);
    setSelectedDestinationState(null);
    setCurrentRoute(EMPTY_ROUTE);
    setAlternativeRoute(null);
  };

  const swapAlternative = () => {
    if (!alternativeRoute) return;
    setAlternativeRoute(currentRoute);
    setCurrentRoute(alternativeRoute);
  };

  return {
    selectedOrigin,
    selectedDestination,
    currentRoute,
    alternativeRoute,
    isLoadingRoute,
    setOrigin,
    setDestination,
    clearRoute,
    swapAlternative,
  };
}
