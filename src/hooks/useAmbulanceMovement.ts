import { useState, useEffect, useRef, useCallback } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface UseAmbulanceMovementProps {
  routePath: Location[];
  isEmergencyActive: boolean;
  speedKmh?: number; // Default 60 km/h
  onDestinationReached?: () => void;
  onLocationUpdate?: (location: Location, heading: number) => void;
}

export function useAmbulanceMovement({
  routePath,
  isEmergencyActive,
  speedKmh = 60,
  onDestinationReached,
  onLocationUpdate
}: UseAmbulanceMovementProps) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [remainingDistance, setRemainingDistance] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);
  
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const currentSegmentIndexRef = useRef<number>(0);
  const distanceAlongSegmentRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const cumulativeDistancesRef = useRef<number[]>([]);

  // Pre-calculate cumulative distances for the route
  useEffect(() => {
    if (routePath.length > 0 && window.google?.maps?.geometry) {
      const distances = [0];
      let total = 0;
      for (let i = 0; i < routePath.length - 1; i++) {
        const p1 = new google.maps.LatLng(routePath[i].lat, routePath[i].lng);
        const p2 = new google.maps.LatLng(routePath[i + 1].lat, routePath[i + 1].lng);
        total += google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
        distances.push(total);
      }
      cumulativeDistancesRef.current = distances;
    }
  }, [routePath]);

  // Reset state when route changes
  useEffect(() => {
    if (!isEmergencyActive && routePath.length > 0) {
      setCurrentLocation(routePath[0]);
      currentSegmentIndexRef.current = 0;
      setCurrentSegmentIndex(0);
      distanceAlongSegmentRef.current = 0;
      lastTimeRef.current = undefined;
      setRemainingDistance(0);
      setEta(0);
    }
  }, [routePath, isEmergencyActive]);

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current === undefined) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
      return;
    }
    
    const deltaTime = (time - lastTimeRef.current) / 1000; // in seconds
    lastTimeRef.current = time;

    if (!window.google || !window.google.maps || !window.google.maps.geometry) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // Speed in meters per second
    const speedMs = (speedKmh * 1000) / 3600;
    let distanceToMove = speedMs * deltaTime;

    let currentIndex = currentSegmentIndexRef.current;
    let currentDistance = distanceAlongSegmentRef.current;

    while (distanceToMove > 0 && currentIndex < routePath.length - 1) {
      const p1 = routePath[currentIndex];
      const p2 = routePath[currentIndex + 1];
      
      const p1LatLng = new google.maps.LatLng(p1.lat, p1.lng);
      const p2LatLng = new google.maps.LatLng(p2.lat, p2.lng);
      
      const segmentDistance = google.maps.geometry.spherical.computeDistanceBetween(p1LatLng, p2LatLng);
      const remainingSegmentDistance = segmentDistance - currentDistance;

      if (distanceToMove >= remainingSegmentDistance) {
        // Move to next segment
        distanceToMove -= remainingSegmentDistance;
        currentIndex++;
        currentDistance = 0;
      } else {
        // Stay in current segment
        currentDistance += distanceToMove;
        distanceToMove = 0;
      }
    }

    if (currentIndex !== currentSegmentIndexRef.current) {
      setCurrentSegmentIndex(currentIndex);
    }
    currentSegmentIndexRef.current = currentIndex;
    distanceAlongSegmentRef.current = currentDistance;

    if (currentIndex >= routePath.length - 1) {
      const finalLoc = routePath[routePath.length - 1];
      setCurrentLocation(finalLoc);
      if (onLocationUpdate) onLocationUpdate(finalLoc, heading);
      if (onDestinationReached) onDestinationReached();
      return; // Stop animation
    }

    const p1 = routePath[currentIndex];
    const p2 = routePath[currentIndex + 1];
    const p1LatLng = new google.maps.LatLng(p1.lat, p1.lng);
    const p2LatLng = new google.maps.LatLng(p2.lat, p2.lng);
    const segmentDistance = google.maps.geometry.spherical.computeDistanceBetween(p1LatLng, p2LatLng);
    
    const fraction = segmentDistance === 0 ? 1 : currentDistance / segmentDistance;
    const currentPos = google.maps.geometry.spherical.interpolate(p1LatLng, p2LatLng, fraction);
    
    const newLoc = { lat: currentPos.lat(), lng: currentPos.lng() };
    const newHeading = google.maps.geometry.spherical.computeHeading(p1LatLng, p2LatLng);
    
    setCurrentLocation(newLoc);
    setHeading(newHeading);

    // Calculate remaining distance and ETA
    if (cumulativeDistancesRef.current.length > 0) {
      const totalDistance = cumulativeDistancesRef.current[cumulativeDistancesRef.current.length - 1];
      const distanceCovered = cumulativeDistancesRef.current[currentIndex] + currentDistance;
      const remaining = Math.max(0, totalDistance - distanceCovered);
      setRemainingDistance(remaining);
      setEta(remaining / speedMs); // ETA in seconds
    }
    
    // Throttle location updates to once every 1000ms
    const now = Date.now();
    if (!lastUpdateRef.current || now - lastUpdateRef.current >= 1000) {
      lastUpdateRef.current = now;
      if (onLocationUpdate) {
        onLocationUpdate(newLoc, newHeading);
      }
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [routePath, speedKmh, onDestinationReached, onLocationUpdate, heading]);

  useEffect(() => {
    if (isEmergencyActive && routePath.length > 1) {
      lastTimeRef.current = undefined;
      requestRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isEmergencyActive, animate, routePath.length]);

  return { currentLocation, heading, remainingDistance, eta, currentSegmentIndex };
}
