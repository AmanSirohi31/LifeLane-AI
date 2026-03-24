import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { mapConfig } from '../../utils/mapConfig';
import UserMarker from './UserMarker';

interface GoogleMapWrapperProps {
  center: {
    lat: number;
    lng: number;
  };
  zoom?: number;
}

const GoogleMapWrapper: React.FC<GoogleMapWrapperProps> = ({ center, zoom = mapConfig.defaultZoom }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Recenter map when center prop changes
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapConfig.mapOptions}
    >
      <UserMarker position={center} />
    </GoogleMap>
  );
};

export default GoogleMapWrapper;
