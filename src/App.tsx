/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import AmbulanceDashboard from './components/AmbulanceDashboard';
import UserMapView from './components/UserMapView';

function AppRoutes() {
  console.log('>>> AppRoutes: Rendering...');
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [ambulanceId, setAmbulanceId] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<'idle' | 'granted' | 'denied' | 'requesting'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deniedCount, setDeniedCount] = useState(0);

  useEffect(() => {
    try {
      console.log('>>> AppRoutes: Initializing auth state...');
      const token = localStorage.getItem('clearroute_token');
      const storedId = localStorage.getItem('clearroute_ambulance_id');
      console.log('>>> AppRoutes: Token found:', !!token, 'ID found:', !!storedId);
      setIsAuthenticated(!!token);
      setAmbulanceId(storedId);
      console.log('>>> AppRoutes: Auth state set to:', !!token);
    } catch (error) {
      console.error('>>> AppRoutes: Error accessing localStorage:', error);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    if (locationPermission === 'granted') {
      setDeniedCount(0); 
    }
  }, [locationPermission]);

  const handleLogin = (token: string, id: string) => {
    setIsAuthenticated(true);
    setAmbulanceId(id);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAmbulanceId(null);
    localStorage.removeItem('clearroute_token');
    localStorage.removeItem('clearroute_ambulance_id');
    navigate('/');
  };

  const handleEnableAlerts = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocationPermission('requesting');
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Location granted", position);
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationPermission('granted');
        setDeniedCount(0);
        navigate('/user');
      },
      (error) => {
        console.warn("Location denied", error);
        setLocationPermission('denied');
        setDeniedCount(prev => prev + 1);
        // We stay on the homepage
      },
      options
    );
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <LandingPage 
            onEnableAlerts={handleEnableAlerts}
            onNavigateToLogin={() => navigate('/login')}
            locationPermission={locationPermission}
            deniedCount={deniedCount}
            isAuthenticated={!!isAuthenticated}
          />
        } 
      />
      <Route 
        path="/user" 
        element={
          locationPermission === 'granted' && coords ? <UserMapView initialCoords={coords} /> : <Navigate to="/" />
        } 
      />
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} onNavigateHome={() => navigate('/')} />
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          isAuthenticated ? <AmbulanceDashboard onLogout={handleLogout} onNavigateHome={() => navigate('/')} ambulanceId={ambulanceId || 'AMB123'} /> : <Navigate to="/login" />
        } 
      />
    </Routes>
  );
}

export default function App() {
  console.log('>>> App: Mounting...');
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
