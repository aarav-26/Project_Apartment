import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Building2, ShieldCheck, Wrench, User, Users, Home, Lock,
  ClipboardCheck, Key, Mail, Smartphone, Settings, Calendar,
  EyeOff, Eye, Hammer, Bell, FileText, Monitor, Globe,
  Cloud, Sun, Moon, Star, Zap, Umbrella, Droplet, Wind,
  Coffee, Heart, MessageSquare, AlertCircle, Camera, Headphones
} from 'lucide-react';

const floatingIcons = [
  ShieldCheck, Wrench, User, Users, Home, Lock,
  ClipboardCheck, Key, Mail, Smartphone, Settings, Calendar,
  Hammer, Bell, FileText, Monitor, Globe,
  Cloud, Sun, Moon, Star, Zap, Umbrella,
  Droplet, Wind, Coffee, Heart, MessageSquare,
  AlertCircle, Camera, Headphones
];

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  const demoCredentials = [
    { role: 'Admin', username: 'admin', password: 'password123' },
    { role: 'Tenant', username: 'tenant1', password: 'password123' },
    { role: 'Maintenance', username: 'maintenance1', password: 'password123' },
  ];

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create a more controlled random distribution
  const getRandomPosition = (index: number, total: number) => {
    // Divide screen into sectors and ensure coverage
    const sectorSize = 100 / Math.ceil(Math.sqrt(total));
    const sectorRow = Math.floor(index / Math.ceil(Math.sqrt(total)));
    const sectorCol = index % Math.ceil(Math.sqrt(total));
    
    // Position within sector with some randomness
    const minPos = 5; // Minimum distance from edges
    const top = minPos + sectorRow * sectorSize + (Math.random() * (sectorSize - minPos * 2));
    const left = minPos + sectorCol * sectorSize + (Math.random() * (sectorSize - minPos * 2));
    
    return { top, left };
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 overflow-hidden">
      
      {/* Enhanced Floating Icons with Full Coverage */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingIcons.map((Icon, index) => {
          const { top, left } = getRandomPosition(index, floatingIcons.length);
          const size = 32 + (index % 4) * 8;
          const duration = 10 + (index % 7);
          const delay = (index * 0.3) % 8;
          const colorClass = [
            'text-blue-500', 
            'text-emerald-500', 
            'text-violet-500',
            'text-amber-500',
            'text-rose-500'
          ][index % 5];

          return (
            <div
              key={index}
              className={`absolute ${colorClass}`}
              style={{
                top: `${top}%`,
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                animation: `float ${duration}s ease-in-out ${delay}s infinite`,
                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <Icon className="w-full h-full" />
            </div>
          );
        })}

        {/* Additional decorative elements for depth */}
        {Array.from({ length: 24 }).map((_, index) => {
          const { top, left } = getRandomPosition(index + floatingIcons.length, 24);
          const size = 40 + (index % 5) * 15;
          
          return (
            <div
              key={`circle-${index}`}
              className="absolute rounded-full bg-blue-300/20"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                top: `${top}%`,
                left: `${left}%`,
                animation: `pulse ${12 + (index % 8)}s ease-in-out ${index % 5}s infinite`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          );
        })}
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md rounded-3xl bg-white/30 shadow-2xl backdrop-blur-lg border border-white/30 z-10">
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4 text-3xl font-bold text-gray-800">ApartmentCare</h2>
            <p className="text-sm text-gray-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username or Email
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                placeholder="Enter username or email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-sm text-gray-600">
            <div className="border-t pt-4">
              <p className="text-center font-medium mb-2">Demo Credentials</p>
              <div className="space-y-2 text-xs">
                {demoCredentials.map((cred, index) => (
                  <div
                    key={index}
                    className="flex justify-between bg-white border px-3 py-2 rounded shadow-sm"
                  >
                    <span className="font-medium">{cred.role}</span>
                    <span>{cred.username} / {cred.password}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
          50% { transform: translate(-50%, calc(-50% - 25px)) rotate(5deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.2; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default Login;
