/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Bell, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  Info, 
  MapPin, 
  Navigation, 
  Settings, 
  Signal, 
  Siren, 
  TrafficCone, 
  User,
  Zap,
  LogOut,
  Search,
  Maximize2,
  Navigation2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { socketService } from '../services/socketService';
import { useAmbulanceMovement } from '../hooks/useAmbulanceMovement';
import { 
  GoogleMap, 
  useJsApiLoader, 
  Marker, 
  Polyline, 
  Autocomplete, 
  DirectionsRenderer 
} from '@react-google-maps/api';

// --- Types ---
interface Alert {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'emergency';
  time: string;
}

interface AmbulanceDashboardProps {
  onLogout: () => void;
  onNavigateHome: () => void;
  ambulanceId: string;
}


// --- Constants ---
const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ['places'];
const defaultCenter = { lat: 28.636391, lng: 77.378345 }; // GZB

// --- Main Dashboard Component ---
export default function AmbulanceDashboard({ onLogout, onNavigateHome, ambulanceId }: AmbulanceDashboardProps) {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || '',
    libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [destination, setDestination] = useState<string>('');
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral>(defaultCenter);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', message: 'System initialized and ready.', type: 'info', time: '09:00 AM' },
  ]);
  
  const polylineRef = React.useRef<google.maps.Polyline | null>(null);

  const addAlert = (message: string, type: Alert['type']) => {
    const newAlert: Alert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));
  };

  const { currentLocation: movingLocation, heading, remainingDistance, eta, currentSegmentIndex } = useAmbulanceMovement({
    routePath,
    isEmergencyActive,
    speedKmh: 60,
    onDestinationReached: async () => {
      setIsEmergencyActive(false);
      try {
        await fetch('/api/ambulance/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: ambulanceId })
        });
        addAlert('✅ Emergency destination reached.', 'success');
      } catch (error) {
        console.error("Failed to stop emergency on destination reached:", error);
        addAlert('✅ Destination reached.', 'success');
      }
    },
    onLocationUpdate: (location, currentHeading) => {
      setCurrentLocation(location);
      
      // Emit location update
      socketService.emit('ambulanceLocationUpdate', {
        id: ambulanceId,
        location,
        heading: currentHeading
      });

      // Randomly simulate vehicle alerts during movement
      if (Math.random() > 0.995) { // Adjusted probability for requestAnimationFrame
        addAlert('🚗 Nearby vehicle alerted and yielding', 'info');
      }
    }
  });

  useEffect(() => {
    socketService.connect();
    
    const handleSignalUpdate = (data: { id: string; status: string }) => {
      if (data.status === 'GREEN') {
        addAlert(`🚦 Signal ${data.id} cleared (GREEN)`, 'success');
      } else {
        addAlert(`🚦 Signal ${data.id} reset to RED`, 'info');
      }
    };

    socketService.on('signalUpdate', handleSignalUpdate);

    return () => {
      socketService.off('signalUpdate');
      socketService.disconnect();
    };
  }, []);

  const activeLocation = movingLocation || currentLocation;

  useEffect(() => {
    if (polylineRef.current && routePath.length > 0) {
      polylineRef.current.setPath([activeLocation, ...routePath.slice(currentSegmentIndex + 1)]);
    }
  }, [activeLocation, currentSegmentIndex, routePath]);

  useEffect(() => {
    if (isFollowing && map && activeLocation) {
      map.panTo(activeLocation);
    }
  }, [activeLocation, isFollowing, map]);

  const calculateRoute = async () => {
    if (!destination || !isLoaded) return;

    try {
      const directionsService = new google.maps.DirectionsService();
      
      directionsService.route({
        origin: currentLocation,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      }, (results, status) => {
        if (status === google.maps.DirectionsStatus.OK && results) {
          setDirectionsResponse(results);
          setDistance(results.routes[0].legs[0].distance?.text || '');
          setDuration(results.routes[0].legs[0].duration?.text || '');
          
          // Extract detailed path for simulation
          const path = results.routes[0].legs.flatMap(leg => 
            leg.steps.flatMap(step => 
              step.path.map(p => ({ lat: p.lat(), lng: p.lng() }))
            )
          );
          setRoutePath(path);
          setError(null);
          
          addAlert(`📍 Route calculated to ${destination}`, 'info');
        } else {
          console.error("Directions Error Status:", status);
          let errorMessage = "Failed to calculate route.";
          
          if (status === google.maps.DirectionsStatus.REQUEST_DENIED) {
            errorMessage = "Directions request denied. Please ensure 'Directions API' is enabled and Billing is active in Google Cloud Console.";
          } else if (status === google.maps.DirectionsStatus.NOT_FOUND) {
            errorMessage = "Destination or origin not found.";
          } else if (status === google.maps.DirectionsStatus.ZERO_RESULTS) {
            errorMessage = "No route found between origin and destination.";
          }
          
          addAlert(`❌ ${errorMessage}`, 'warning');
          setError(errorMessage);
        }
      });
    } catch (err: any) {
      console.error("Directions Exception:", err);
      addAlert(`❌ An unexpected error occurred while calculating route.`, 'warning');
      setError("An unexpected error occurred.");
    }
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setDestination(place.formatted_address);
      }
    }
  };

  const handleClearSearch = async () => {
    if (isEmergencyActive) {
      try {
        await fetch('/api/ambulance/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: ambulanceId })
        });
        addAlert('✅ Emergency stopped and route cleared.', 'info');
      } catch (error) {
        console.error("Failed to stop emergency on clear:", error);
      }
    }
    
    setDestination('');
    setDirectionsResponse(null);
    setRoutePath([]);
    setIsEmergencyActive(false);
    setDistance('');
    setDuration('');
    setError(null);
    // Optional: Reset to base if desired, but keeping current location for realism
    // setCurrentLocation(defaultCenter);
  };

  const toggleEmergency = async () => {
    if (!isEmergencyActive && !directionsResponse) {
      addAlert('⚠️ Please select a destination first', 'warning');
      return;
    }

    const newState = !isEmergencyActive;
    
    try {
      if (newState) {
        await fetch('/api/ambulance/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: ambulanceId,
            destination: routePath[routePath.length - 1],
            route: routePath
          })
        });
        addAlert('🚑 Emergency mode activated. Clearing route...', 'emergency');
      } else {
        await fetch('/api/ambulance/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: ambulanceId })
        });
        addAlert('✅ Emergency stopped.', 'info');
      }
      setIsEmergencyActive(newState);
    } catch (error) {
      addAlert('❌ Failed to update emergency status', 'warning');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clearroute_token');
    onLogout();
  };

  if (!googleMapsApiKey) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 text-center">
          <div className="bg-amber-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-amber-600 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">API Key Required</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            To enable the interactive map and navigation features, you need to provide a Google Maps API Key.
          </p>
          
          <div className="space-y-4 text-left mb-8">
            <div className="flex gap-3">
              <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
              <p className="text-sm text-slate-600">Go to <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" className="text-blue-600 hover:underline font-bold">Google Cloud Console</a></p>
            </div>
            <div className="flex gap-3">
              <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
              <p className="text-sm text-slate-600">Enable <b>Maps JavaScript</b>, <b>Places</b>, and <b>Directions</b> APIs.</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
              <p className="text-sm text-slate-600">Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to your <b>Settings</b> in AI Studio.</p>
            </div>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            I've added the key, reload
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded && !loadError) {
    console.log('>>> AmbulanceDashboard: Map is still loading...', { isLoaded, loadError, googleMapsApiKey: !!googleMapsApiKey });
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Loading Mission Control...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    const isBillingError = loadError.message?.includes('Billing') || loadError.message?.includes('REQUEST_DENIED');
    const isLegacyError = loadError.message?.includes('legacy API');

    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-red-100 text-center">
          <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            {isBillingError ? 'Billing Required' : isLegacyError ? 'API Activation Required' : 'Map Loading Error'}
          </h2>
          <p className="text-slate-500 mb-6">
            {isBillingError 
              ? "Google Maps requires an active billing account on your Google Cloud Project. Please enable billing to use the map features."
              : isLegacyError
              ? "You need to enable the legacy 'Maps JavaScript API', 'Places API', and 'Directions API' in your Google Cloud Console."
              : "The Google Maps API returned an error. This usually means the key is invalid or restrictions are blocking this domain."}
          </p>
          <div className="p-4 bg-red-50 rounded-xl text-left border border-red-100 mb-8">
            <p className="text-xs font-mono text-red-600 break-all">{loadError.message}</p>
          </div>
          <div className="space-y-3 mb-8">
            <a 
              href="https://console.cloud.google.com/project/_/billing/enable" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              Enable Billing
            </a>
            <a 
              href="https://console.cloud.google.com/google/maps-apis/api-list" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Enable APIs
            </a>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans selection:bg-blue-100">
      {/* Navbar */}
      <nav className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={onNavigateHome}>
          <div className="bg-blue-600 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
            <TrafficCone className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            ClearRoute <span className="text-blue-600">AI</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
            <div className={`w-2 h-2 rounded-full ${isEmergencyActive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isEmergencyActive ? 'Emergency Active' : 'System Ready'}
            </span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-88px)]">
        {/* Left Panel */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Siren className="w-4 h-4 text-blue-600" />
              Emergency Control
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ambulance ID</p>
                <p className="text-sm font-mono font-bold text-slate-700">{ambulanceId}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Current Status</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isEmergencyActive ? 'bg-red-500' : 'bg-green-500'}`} />
                  <p className="text-sm font-bold text-slate-700">{isEmergencyActive ? 'Moving (Emergency)' : 'Idle'}</p>
                </div>
              </div>

              <button 
                onClick={toggleEmergency}
                disabled={!directionsResponse && !isEmergencyActive}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                  isEmergencyActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isEmergencyActive ? (
                  <>
                    <X className="w-6 h-6" />
                    Stop Emergency
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    Start Emergency
                  </>
                )}
              </button>
            </div>
          </motion.div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              Live Alerts
            </h2>
            <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {alerts.map((alert) => (
                  <motion.div 
                    key={alert.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl border ${
                      alert.type === 'emergency' ? 'bg-red-50 border-red-100' : 
                      alert.type === 'success' ? 'bg-green-50 border-green-100' :
                      'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1 rounded-md ${
                        alert.type === 'emergency' ? 'bg-red-100 text-red-600' : 
                        alert.type === 'success' ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {alert.type === 'emergency' ? <AlertTriangle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${
                          alert.type === 'emergency' ? 'text-red-700' : 'text-slate-700'
                        }`}>{alert.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">{alert.time}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="lg:col-span-9 relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-slate-100">
          <GoogleMap
            zoom={15}
            mapContainerStyle={{ width: '100%', height: '100%' }}
            options={{
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              styles: [
                {
                  "featureType": "poi",
                  "elementType": "labels",
                  "stylers": [{ "visibility": "off" }]
                }
              ]
            }}
            onLoad={map => {
              setMap(map);
              map.panTo(activeLocation);
            }}
            onDragStart={() => setIsFollowing(false)}
          >
            {routePath.length > 0 && (
              <Polyline
                onLoad={(polyline) => {
                  polylineRef.current = polyline;
                  polyline.setPath([activeLocation, ...routePath.slice(currentSegmentIndex + 1)]);
                }}
                onUnmount={() => {
                  polylineRef.current = null;
                }}
                path={[activeLocation, ...routePath.slice(currentSegmentIndex + 1)]}
                options={{
                  strokeColor: '#3B82F6',
                  strokeWeight: 6,
                  strokeOpacity: 0.8
                }}
              />
            )}
            {console.log("currentSegmentIndex:", currentSegmentIndex, "routePath length:", routePath.length)}
            
            <Marker 
              position={activeLocation} 
              icon={{
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: "#ef4444",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#ffffff",
                rotation: heading,
              }}
            />

            {directionsResponse && (
              <Marker 
                position={routePath[routePath.length - 1]}
                icon={{
                  url: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // Destination icon
                  scaledSize: new google.maps.Size(30, 30),
                  anchor: new google.maps.Point(15, 15)
                }}
              />
            )}
          </GoogleMap>

          {/* Search Overlay */}
          <div className="absolute top-6 right-6 w-full max-w-sm z-10">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 relative flex items-center w-full">
              <div className="absolute left-4 text-blue-600 pointer-events-none z-10">
                <Search className="w-5 h-5" />
              </div>
              
              <Autocomplete
                onLoad={setAutocomplete}
                onPlaceChanged={onPlaceChanged}
                className="w-full"
              >
                <input
                  type="text"
                  placeholder="Enter destination hospital or location"
                  className="w-full py-4 pl-12 pr-28 outline-none text-sm font-medium text-slate-700 bg-transparent rounded-2xl"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && calculateRoute()}
                />
              </Autocomplete>

              {destination && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-[84px] p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-10 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button 
                onClick={calculateRoute}
                className="absolute right-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors z-10 cursor-pointer"
              >
                Route
              </button>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-3 shadow-lg"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-[11px] font-bold text-red-700 leading-tight">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </div>

          {/* Info Card Overlay */}
          <AnimatePresence>
            {directionsResponse && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute top-6 left-6 z-10 bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 w-72 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg shadow-sm">
                      <Navigation2 className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Route Info</h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Distance</p>
                    <p className="text-xl font-black text-slate-800 tracking-tight">
                      {isEmergencyActive && remainingDistance > 0 
                        ? (remainingDistance > 1000 ? `${(Math.round(remainingDistance / 50) * 50 / 1000).toFixed(2)} km` : `${Math.round(remainingDistance / 50) * 50} m`)
                        : distance}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">ETA</p>
                    <p className="text-xl font-black text-blue-600 tracking-tight">
                      {isEmergencyActive && eta > 0
                        ? (eta > 60 ? `${Math.round(eta / 60)} min` : `< 1 min`)
                        : duration}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-xs font-medium text-slate-600 truncate flex-1" title={destination}>
                    {destination}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map Controls */}
          <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-2">
            <button 
              onClick={() => {
                setIsFollowing(true);
                map?.panTo(activeLocation);
              }}
              className={`bg-white p-3 rounded-xl shadow-lg border border-gray-100 transition-colors cursor-pointer ${isFollowing ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
              title="Recenter"
            >
              <MapPin className="w-5 h-5" />
            </button>
            <button 
              onClick={() => map?.setZoom((map.getZoom() || 15) + 1)}
              className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
