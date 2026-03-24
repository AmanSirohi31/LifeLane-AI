export interface Location {
  lat: number;
  lng: number;
}

export interface Ambulance {
  id: string;
  vehicleNumber: string;
  currentLocation: Location;
  destination?: Location;
  status: 'idle' | 'active';
  route?: Location[];
  lastUpdated: string;
}

export interface User {
  socketId: string;
  currentLocation: Location;
  lastSeen: string;
}

export interface TrafficSignal {
  id: string;
  location: Location;
  status: 'RED' | 'GREEN';
  lastChanged: string;
}
