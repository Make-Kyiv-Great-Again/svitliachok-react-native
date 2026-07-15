import { LatLng } from 'react-native-maps';
import * as turf from '@turf/turf';
import { RouteSegment, RouteLamp } from '../types/routing';
import { fetchStatusByCoordinates } from '../api/client';

/**
 * Phase 1: Chunk the coordinates into 100m segments and fetch their live status.
 * This defines the initial gray (UNKNOWN), red (DANGER), and green (SAFE) segments.
 */
export async function buildInitialRouteSegments(
  coordinates: LatLng[],
  signal?: AbortSignal
): Promise<RouteSegment[]> {
  if (coordinates.length < 2) {
    return [{ coordinates, status: 'UNKNOWN' }];
  }

  // 1. Chunking: Convert to Turf LineString and split into 100m segments
  const lineCoords = coordinates.map((c) => [c.longitude, c.latitude]);
  const routeLine = turf.lineString(lineCoords);
  const totalLength = turf.length(routeLine, { units: 'meters' });

  const segments: { coords: LatLng[]; midpoint: LatLng }[] = [];
  let traveled = 0;

  while (traveled < totalLength) {
    let nextDist = traveled + 100;
    if (nextDist > totalLength) {
      nextDist = totalLength;
    }
    const chunk = turf.lineSliceAlong(routeLine, traveled, nextDist, { units: 'meters' });
    const chunkCoords = chunk.geometry.coordinates;

    if (chunkCoords.length >= 2) {
      const midIndex = Math.floor(chunkCoords.length / 2);
      const midPt = chunkCoords[midIndex];

      segments.push({
        coords: chunkCoords.map((c) => ({ latitude: c[1], longitude: c[0] })),
        midpoint: { latitude: midPt[1], longitude: midPt[0] },
      });
    }

    traveled = nextDist;
    if (nextDist <= traveled && nextDist >= totalLength) break;
  }

  // 2. Fetch live power status for each chunk's midpoint concurrently
  const statusPromises = segments.map(async (seg) => {
    try {
      if (signal?.aborted) return 'UNKNOWN';
      const statusRes = await fetchStatusByCoordinates(seg.midpoint.latitude, seg.midpoint.longitude);
      return statusRes.power_status || 'UNKNOWN';
    } catch (error) {
      return 'UNKNOWN';
    }
  });

  const statuses = await Promise.all(statusPromises);
  if (signal?.aborted) throw new Error('Aborted');

  return segments.map((seg, i) => {
    const liveStatus = statuses[i];
    let status: 'SAFE' | 'UNKNOWN' | 'DANGER' = 'UNKNOWN';
    if (liveStatus === 'ON') {
      status = 'SAFE';
    } else if (liveStatus === 'OFF' || liveStatus === 'EMERGENCY') {
      status = 'DANGER';
    }
    return {
      coordinates: seg.coords,
      status,
    };
  });
}

/**
 * Phase 2: Query the Overpass API for lamps on ALL segments,
 * verify the 3-lamp threshold, downgrade segments if needed,
 * and associate each lamp with its closest segment's final status.
 */
export async function verifyLampsForSegments(
  initialSegments: RouteSegment[],
  signal?: AbortSignal
): Promise<{ segments: RouteSegment[]; lamps: RouteLamp[] }> {
  // We check lamps on EVERY route segment now
  const segmentsToCheckLamps = initialSegments.map((seg, i) => ({ seg, index: i }));

  let lampCoordinates: LatLng[] = [];
  if (segmentsToCheckLamps.length > 0) {
    const aroundClauses = segmentsToCheckLamps.map(({ seg }) => {
      const coords = seg.coordinates.map(c => `${c.latitude},${c.longitude}`).join(',');
      return `node["highway"="street_lamp"](around:30,${coords});`;
    }).join('');

    const query = `[out:json][timeout:25]; (${aroundClauses}); out body;`;
    const overpassUrl = process.env.EXPO_PUBLIC_OVERPASS_URL || 'https://overpass-api.de';

    let attempts = 0;
    let fetchedLamps = false;

    while (attempts < 2 && !fetchedLamps && !signal?.aborted) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const onAbort = () => controller.abort();
        if (signal) signal.addEventListener('abort', onAbort);

        console.log('trying to fetch lamps from : ', overpassUrl, 'query length:', query.length);

        const response = await fetch(`${overpassUrl}/api/interpreter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (signal) signal.removeEventListener('abort', onAbort);

        if (response.ok) {
          console.log('fetched lamps successfully');
          const text = await response.text();
          if (text.trim().startsWith('<')) {
            console.warn('Overpass HTML Error output:', text.substring(0, 500));
            throw new Error('Overpass returned HTML');
          }
          const data = JSON.parse(text);
          const elements = data.elements || [];
          lampCoordinates = elements.map((el: any) => ({ latitude: el.lat, longitude: el.lon }));
          fetchedLamps = true;
        }
      } catch (error) {
        console.warn(`Overpass lamp fetch attempt ${attempts} failed. Query length was ${query.length}. Error:`, error);
      }
    }
  }

  if (signal?.aborted) throw new Error('Aborted');

  const lampPoints = turf.featureCollection(
    lampCoordinates.map((c) => turf.point([c.longitude, c.latitude]))
  );

  // 1. Determine final segment statuses based on lamp counts
  const finalSegments: RouteSegment[] = initialSegments.map((seg, i) => {
    let status = seg.status;

    // We only apply the 3-lamp threshold to downgrade SAFE/UNKNOWN segments.
    // DANGER segments are already OFF.
    if (status === 'SAFE' || status === 'UNKNOWN') {
      const segLine = turf.lineString(seg.coordinates.map((c) => [c.longitude, c.latitude]));
      let lampCount = 0;

      for (const pt of lampPoints.features) {
        const dist = turf.pointToLineDistance(pt, segLine, { units: 'meters' });
        if (dist <= 20) {
          lampCount++;
          if (lampCount >= 3) break;
        }
      }

      if (lampCount < 3) {
        console.log(`Downgrading segment ${i} (was ${status}) to DANGER due to only ${lampCount} lamps`);
        status = 'DANGER';
      }
    }

    return { coordinates: seg.coordinates, status };
  });

  // 2. Associate each lamp with its closest segment's final status
  const finalLamps: RouteLamp[] = lampCoordinates.map((lamp) => {
    const lampPt = turf.point([lamp.longitude, lamp.latitude]);
    let closestStatus: 'SAFE' | 'UNKNOWN' | 'DANGER' = 'UNKNOWN';
    let minDistance = Infinity;

    finalSegments.forEach((seg) => {
      const segLine = turf.lineString(seg.coordinates.map((c) => [c.longitude, c.latitude]));
      const dist = turf.pointToLineDistance(lampPt, segLine, { units: 'meters' });
      if (dist < minDistance) {
        minDistance = dist;
        closestStatus = seg.status;
      }
    });

    return {
      latitude: lamp.latitude,
      longitude: lamp.longitude,
      status: closestStatus,
    };
  });

  return { segments: finalSegments, lamps: finalLamps };
}
