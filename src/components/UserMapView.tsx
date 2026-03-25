import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Siren,
  Navigation,
  Bell,
  AlertTriangle,
  CheckCircle2,
  ArrowLeftRight,
  RotateCcw,
  TrafficCone,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, GoogleMapWrapper } from './map';
import { useMapLoader } from '../hooks/useMapLoader';
import { socketService } from '../services/socketService';

interface UserMapViewProps {
  initialCoords: { lat: number; lng: number };
}

export default function UserMapView({ initialCoords }: UserMapViewProps) {
  const navigate = useNavigate();
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useMapLoader();
  const [ambulanceLocation, setAmbulanceLocation] = useState<{ lat: number; lng: number; heading?: number } | null>(null);
  const [activeAlert, setActiveAlert] = useState<{ message: string; type: 'urgent' | 'warning' | 'safe'; icon: React.ReactNode } | null>(null);
  const [isAlertsEnabled, setIsAlertsEnabled] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(initialCoords);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(initialCoords);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = socketService.connect();

    socket.on('ambulanceNearby', (data: { ambulanceId: string; distance: number; location: { lat: number; lng: number }; heading?: number }) => {
      if (!isAlertsEnabled) return;

      const { distance, location, heading } = data;
      setAmbulanceLocation({ ...location, heading });
      
      // Only set alert if it's different or new
      let newAlert: typeof activeAlert = null;
      if (distance < 50) {
        newAlert = { 
          message: "🚑 Ambulance passing now. Stay clear!", 
          type: 'urgent', 
          icon: <Siren className="w-6 h-6 text-white animate-pulse" /> 
        };
      } else if (distance < 200) {
        newAlert = { 
          message: "🚑 Ambulance approaching from behind", 
          type: 'urgent', 
          icon: <AlertTriangle className="w-6 h-6 text-white" /> 
        };
      } else if (distance <= 500) {
        newAlert = { 
          message: "➡️ Move left to clear path", 
          type: 'warning', 
          icon: <ArrowLeftRight className="w-6 h-6 text-amber-600" /> 
        };
      }

      if (newAlert && (!activeAlert || activeAlert.message !== newAlert.message)) {
        setActiveAlert(newAlert);
      }
    });

    socket.on('ambulanceGone', () => {
      setAmbulanceLocation(null);
      setActiveAlert(null);
    });

    socket.on('signalUpdate', (data: { id: string; status: string }) => {
      if (!isAlertsEnabled) return;
      if (data.status === 'GREEN') {
        setActiveAlert({ 
          message: "🚦 Signal ahead turned green", 
          type: 'safe', 
          icon: <CheckCircle2 className="w-6 h-6 text-green-600" /> 
        });
      }
    });

    return () => {
      socketService.off('ambulanceNearby');
      socketService.off('ambulanceGone');
      socketService.off('signalUpdate');
    };
  }, [isAlertsEnabled]);

  useEffect(() => {
    if (coords) {
      socketService.emit('userLocationUpdate', coords);
    }
  }, [coords]);

  useEffect(() => {
    // Update coordinates if initialCoords change (e.g. on re-entry)
    setCoords(initialCoords);
    setMapCenter(initialCoords);
  }, [initialCoords]);

  useEffect(() => {
    // Update alerts based on ambulance distance
    // This is now handled by real-time socket events
  }, [isAlertsEnabled]);

  const handleRecenter = () => {
    if (coords) {
      setMapCenter({ ...coords });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-6"
        />
        <p className="text-slate-600 font-bold text-lg animate-pulse">Fetching your location...</p>
        <p className="text-slate-400 text-sm mt-2">Please allow location access to continue</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 p-6 rounded-[2.5rem] mb-6">
          <AlertTriangle className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Location access denied</h2>
        <p className="text-slate-500 mb-8 max-w-xs">We need your real-time location to alert you about approaching emergency vehicles.</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 active:scale-95 transition-transform"
          >
            Try Again
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold active:scale-95 transition-transform"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!googleMapsApiKey) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-amber-50 p-6 rounded-[2.5rem] mb-6">
          <Settings className="w-16 h-16 text-amber-500 animate-spin-slow" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">API Key Required</h2>
        <p className="text-slate-500 mb-8 max-w-xs">To view the map and receive alerts, you need to provide a Google Maps API Key.</p>
        
        <div className="space-y-4 text-left mb-8 max-w-sm w-full">
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

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 active:scale-95 transition-transform"
          >
            I've added the key, reload
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold active:scale-95 transition-transform"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded && !loadError) {
    console.log('>>> UserMapView: Map is still loading...', { isLoaded, loadError });
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-6"
        />
        <p className="text-slate-600 font-bold text-lg animate-pulse">Initializing Map...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Navbar */}
      <nav className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 flex items-center justify-between z-50">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="bg-blue-600 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
            <TrafficCone className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            ClearRoute <span className="text-blue-600">AI</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Live Tracking</span>
          </div>
          {coords && (
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coordinates</p>
              <p className="text-[11px] font-mono text-slate-600">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
            </div>
          )}
        </div>
      </nav>

      <div className="relative flex-1 bg-[#F3F4F6] overflow-hidden flex flex-col min-h-0">
        <MapContainer className="flex-1">
          {isLoaded && mapCenter ? (
            <GoogleMapWrapper center={mapCenter} ambulanceLocation={ambulanceLocation} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100">
              {loadError ? (
                <div className="text-center p-6 max-w-sm">
                  <div className="bg-red-50 p-4 rounded-2xl mb-4 inline-block">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-slate-800 font-bold text-lg mb-2">
                    {loadError.message?.includes('Billing') || loadError.message?.includes('REQUEST_DENIED') 
                      ? 'Billing Required' 
                      : loadError.message?.includes('legacy API') 
                      ? 'API Activation Required' 
                      : 'Map Error'}
                  </p>
                  <p className="text-slate-500 text-sm mb-6">
                    {loadError.message?.includes('Billing') || loadError.message?.includes('REQUEST_DENIED')
                      ? "Google Maps requires an active billing account. Please enable billing in your Google Cloud Console."
                      : loadError.message?.includes('legacy API')
                      ? "Please enable 'Maps JavaScript API', 'Places API', and 'Directions API' in your Google Cloud Console."
                      : "There was an issue loading the map. Please check your API key and internet connection."}
                  </p>
                  <div className="flex flex-col gap-2">
                    <a 
                      href="https://console.cloud.google.com/project/_/billing/enable" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-100"
                    >
                      Enable Billing
                    </a>
                    <button 
                      onClick={() => window.location.reload()}
                      className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
                  />
                  <p className="text-slate-500 font-medium">Initializing Map...</p>
                </div>
              )}
            </div>
          )}
        </MapContainer>

        {/* Floating Alert Panel */}
        <AnimatePresence mode="wait">
          {activeAlert && (
            <motion.div 
              key={activeAlert.message}
              initial={{ y: 120, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 120, opacity: 0, scale: 0.95 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-50"
            >
              <div className={`p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 flex items-center gap-6 transition-all duration-500 backdrop-blur-xl ${
                activeAlert.type === 'urgent' ? 'bg-red-600/95 border-red-400 text-white' :
                activeAlert.type === 'warning' ? 'bg-amber-50/95 border-amber-200 text-amber-900' :
                'bg-white/95 border-slate-100 text-slate-800'
              }`}>
                <div className={`p-4 rounded-3xl shadow-inner ${
                  activeAlert.type === 'urgent' ? 'bg-white/20' :
                  activeAlert.type === 'warning' ? 'bg-amber-100' :
                  'bg-green-50'
                }`}>
                  {activeAlert.icon}
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-black tracking-tight leading-none">{activeAlert.message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-40">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRecenter}
            className="p-5 bg-white rounded-[2rem] shadow-2xl border border-slate-100 hover:bg-slate-50 transition-all group relative"
          >
            <RotateCcw className="w-7 h-7 text-slate-600 group-hover:rotate-[-90deg] transition-transform duration-500" />
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAlertsEnabled(!isAlertsEnabled)}
            className={`p-5 rounded-[2rem] shadow-2xl border transition-all group relative ${
              isAlertsEnabled ? 'bg-blue-600 border-blue-500' : 'bg-white border-slate-100'
            }`}
          >
            <Bell className={`w-7 h-7 transition-colors ${isAlertsEnabled ? 'text-white' : 'text-slate-600'}`} />
          </motion.button>
        </div>

        {/* Real-time Location Info Card */}
        {coords && (
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="absolute left-8 top-8 z-40 bg-white/90 backdrop-blur-md p-5 rounded-[2rem] shadow-2xl border border-white/50 min-w-[200px]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-2 rounded-xl">
                <Navigation className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Your Location</p>
                <p className="text-sm font-bold text-slate-800">Active Tracking</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Latitude</span>
                <span className="text-xs font-mono font-bold text-slate-700">{coords.lat.toFixed(6)}°</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Longitude</span>
                <span className="text-xs font-mono font-bold text-slate-700">{coords.lng.toFixed(6)}°</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
