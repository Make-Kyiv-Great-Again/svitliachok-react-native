import { useState, useEffect } from 'react';
import { LatLng } from 'react-native-maps';
import { BuildingPolygon } from '../types/api';
import { RouteResult, EMPTY_ROUTE } from '../types/routing';
import { calculateRoute } from '../utils/routing';

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

  useEffect(() => {
    if (appMode !== 'ROUTING' || !selectedOrigin || !selectedDestination) return;

    let cancelled = false;

    (async () => {
      setIsLoadingRoute(true);
      setAlternativeRoute(null);

      const defaultRoute = await calculateRoute(
        selectedOrigin,
        selectedDestination,
        transportMode,
        'Fastest',
        buildingPolygons,
      );
      if (cancelled) return;
      setCurrentRoute(defaultRoute);

      if (defaultRoute.status === 'UNKNOWN' || defaultRoute.status === 'DANGER') {
        const altRoute = await calculateRoute(
          selectedOrigin,
          selectedDestination,
          transportMode,
          'Illuminated',
          buildingPolygons,
        );
        if (!cancelled) {
          if (Math.abs(altRoute.distance - defaultRoute.distance) > 10 || altRoute.status !== defaultRoute.status) {
            setAlternativeRoute(altRoute);
          }
        }
      }

      if (!cancelled) setIsLoadingRoute(false);
    })();

    return () => { cancelled = true; };
  }, [selectedOrigin, selectedDestination, transportMode, buildingPolygons, appMode]);

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
