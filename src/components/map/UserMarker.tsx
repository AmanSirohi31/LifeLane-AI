import React from 'react';
import { Marker } from '@react-google-maps/api';

interface UserMarkerProps {
  position: {
    lat: number;
    lng: number;
  };
}

const UserMarker: React.FC<UserMarkerProps> = ({ position }) => {
  return (
    <Marker
      position={position}
      title="Your Location"
      icon={window.google ? {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#2563eb', // blue-600
        fillOpacity: 1,
        strokeWeight: 3,
        strokeColor: '#ffffff',
      } : undefined}
    />
  );
};

export default UserMarker;
