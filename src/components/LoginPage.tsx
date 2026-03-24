import React, { useState } from 'react';
import { Siren, Lock, User, Loader2, AlertCircle, TrafficCone } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  onLogin: (token: string, ambulanceId: string) => void;
  onNavigateHome: () => void;
}

export default function LoginPage({ onLogin, onNavigateHome }: LoginPageProps) {
  const [ambulanceId, setAmbulanceId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ambulanceId, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('clearroute_token', data.token);
        localStorage.setItem('clearroute_ambulance_id', ambulanceId);
        onLogin(data.token, ambulanceId);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6">
      {/* Logo Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-12 cursor-pointer group"
        onClick={onNavigateHome}
      >
        <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
          <TrafficCone className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">
          ClearRoute <span className="text-blue-600">AI</span>
        </h1>
      </motion.div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-10"
      >
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Operator Login</h2>
          <p className="text-slate-500 text-sm">Authorized Ambulance Personnel Only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Ambulance ID</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Siren className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                value={ambulanceId}
                onChange={(e) => setAmbulanceId(e.target.value)}
                placeholder="Enter Ambulance ID (e.g. AMB123)"
                required
                className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                required
                className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-8"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <span>🚑 Login & Start Control</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-xs text-slate-400">
            Forgot credentials? Contact system administrator.
          </p>
        </div>
      </motion.div>

      {/* Footer Info */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-slate-400 text-xs font-medium uppercase tracking-widest"
      >
        Secure Terminal • Junction Control v2.4
      </motion.p>
    </div>
  );
}
