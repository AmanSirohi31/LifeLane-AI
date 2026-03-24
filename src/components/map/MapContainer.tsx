import React from 'react';

interface MapContainerProps {
  children: React.ReactNode;
  className?: string;
}

const MapContainer: React.FC<MapContainerProps> = ({ children, className = "" }) => {
  return (
    <div className={`relative w-full h-full bg-slate-100 overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export default MapContainer;
