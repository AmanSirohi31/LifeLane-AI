import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrafficCone, 
  ChevronRight, 
  Shield, 
  Zap, 
  Globe, 
  Siren,
  MapPin,
  AlertTriangle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// Use a high-quality placeholder image for the hero section
const heroImage = "https://images.unsplash.com/photo-1587744356973-4530552a3a2c?auto=format&fit=crop&q=80&w=2000";

interface LandingPageProps {
  onEnableAlerts: () => void;
  onNavigateToLogin: () => void;
  locationPermission: 'idle' | 'granted' | 'denied' | 'requesting';
  deniedCount: number;
  isAuthenticated: boolean;
}

export default function LandingPage({ 
  onEnableAlerts, 
  onNavigateToLogin, 
  locationPermission, 
  deniedCount,
  isAuthenticated 
}: LandingPageProps) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleAllow = () => {
    setShowModal(false);
    onEnableAlerts();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      {/* Location Access Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-6">
                  <MapPin className="w-10 h-10 text-blue-600" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Enable Location Access</h3>
                <p className="text-slate-500 leading-relaxed mb-8">
                  We need your location to alert you about nearby ambulances in real time. This helps you clear the path safely and efficiently.
                </p>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAllow}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                  >
                    Allow
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Navbar */}
      <nav className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
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

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#solutions" className="hover:text-blue-600 transition-colors">Solutions</a>
          <a href="#about" className="hover:text-blue-600 transition-colors">About</a>
        </div>

        <button 
          onClick={onNavigateToLogin}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-slate-200"
        >
          <Siren className="w-4 h-4" />
          {isAuthenticated ? 'Go to Dashboard' : 'Operator Login'}
        </button>
      </nav>

      <div className="relative">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Next-Gen Traffic Control</span>
              </div>
              
              <h2 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                Clearing the path for <span className="text-blue-600">life-saving</span> missions.
              </h2>
              
              <p className="text-lg text-slate-500 mb-10 max-w-lg leading-relaxed">
                ClearRoute AI uses real-time traffic intelligence to create green corridors for emergency vehicles, reducing response times by up to 40%.
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    id="enable-alerts-btn"
                    onClick={() => {
                      if (locationPermission === 'granted') {
                        navigate('/user');
                      } else {
                        setShowModal(true);
                      }
                    }}
                    disabled={locationPermission === 'requesting'}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-70 disabled:cursor-wait"
                  >
                    {locationPermission === 'requesting' ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MapPin className="w-5 h-5" />
                    )}
                    {locationPermission === 'requesting' ? 'Requesting...' : 'Enable Live Alerts'}
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                    Watch Demo
                  </button>
                </div>
                
                {locationPermission === 'denied' && deniedCount > 0 && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm font-semibold flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Location access was denied. Please check your browser settings.
                  </motion.p>
                )}
              </div>

              <div className="mt-12 flex items-center gap-6 grayscale opacity-50">
                <div className="flex items-center gap-2 font-bold text-slate-400">
                  <Globe className="w-5 h-5" /> CITY GOV
                </div>
                <div className="flex items-center gap-2 font-bold text-slate-400">
                  <Shield className="w-5 h-5" /> EMS SECURE
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 bg-white p-4 rounded-[2.5rem] shadow-2xl border border-slate-100">
                <img 
                  src={heroImage} 
                  alt="Dashboard Preview" 
                  className="rounded-[2rem] w-full object-cover aspect-[4/3] shadow-inner"
                />
              </div>
              
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-30 -z-10" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-30 -z-10" />
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 bg-slate-50 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h3 className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4">Core Capabilities</h3>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Built for critical infrastructure.</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Zap className="w-6 h-6 text-blue-600" />,
                  title: "Real-time Preemption",
                  desc: "Automatically adjust traffic signals as emergency vehicles approach junctions."
                },
                {
                  icon: <Globe className="w-6 h-6 text-blue-600" />,
                  title: "City-wide Mesh",
                  desc: "Integrated network connecting every signal, sensor, and emergency unit."
                },
                {
                  icon: <Shield className="w-6 h-6 text-blue-600" />,
                  title: "Secure Protocol",
                  desc: "Military-grade encryption for all command and control communications."
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                >
                  <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h4>
                  <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-slate-100 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <TrafficCone className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-slate-800">ClearRoute AI</span>
            </div>
            <p className="text-slate-400 text-sm">© 2026 ClearRoute AI. All rights reserved.</p>
            <div className="flex gap-6 text-sm font-bold text-slate-400">
              <a href="#" className="hover:text-blue-600">Privacy</a>
              <a href="#" className="hover:text-blue-600">Terms</a>
              <a href="#" className="hover:text-blue-600">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
