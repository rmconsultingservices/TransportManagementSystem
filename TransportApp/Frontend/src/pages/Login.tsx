import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [username, setUsername] = useState(() => localStorage.getItem('remembered_username') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('remember_me') === 'true');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/Auth/login', { username, password });
      const { token, user, companies } = response.data;

      if (rememberMe) {
        localStorage.setItem('remembered_username', username);
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remembered_username');
        localStorage.removeItem('remember_me');
      }

      setAuth(token, user, companies || []);

      if (companies && companies.length === 1) {
        navigate('/');
      } else {
        navigate('/select-company');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión. Por favor verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-navy-950 bg-ambient font-sans text-slate-100 antialiased selection:bg-brand-500 selection:text-white flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient Glow Overlays */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-cyan/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Responsive Centered Card Container */}
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        {/* Brand & Welcome Section */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8" data-purpose="brand-header">
          {/* App Icon Badge with Glow */}
          <div className="relative group cursor-pointer mb-4">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 opacity-70 blur-md group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-navy-800 to-navy-900 border border-slate-700/60 shadow-glass-inset flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-brand-400 drop-shadow-md" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"></path>
                <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"></path>
                <circle cx="7" cy="18" r="2"></circle>
                <path d="M15 18H9"></path>
                <circle cx="17" cy="18" r="2"></circle>
            </svg>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            TransportApp
            <span className="inline-block w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xs">
            Tu logística inteligente en movimiento
          </p>
        </div>

        {/* Glassmorphic Login Form Card */}
        <div className="w-full bg-navy-800/60 backdrop-blur-xl border border-slate-700/40 rounded-3xl p-6 sm:p-8 shadow-2xl" data-purpose="login-form-container">
          {error && (
            <div className="mb-5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm px-4 py-3 rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username / Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-medium text-slate-300 tracking-wide" htmlFor="username">
                Usuario o Correo
              </label>
              <div className="relative rounded-xl border border-slate-700/80 bg-navy-900/70 transition-all duration-200 input-field">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                </div>
                <input
                  className="w-full pl-10 pr-4 py-3 bg-transparent text-sm text-white placeholder-slate-500 rounded-xl focus:outline-none border-0 ring-0 focus:ring-0"
                  id="username"
                  name="username"
                  placeholder="ejemplo@transport.com"
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field with Visibility Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-medium text-slate-300 tracking-wide" htmlFor="password">
                  Contraseña
                </label>
              </div>
              <div className="relative rounded-xl border border-slate-700/80 bg-navy-900/70 transition-all duration-200 input-field">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                    <rect height="11" rx="2" ry="2" width="18" x="3" y="11"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                </div>
                <input
                  className="w-full pl-10 pr-11 py-3 bg-transparent text-sm text-white placeholder-slate-500 rounded-xl focus:outline-none border-0 ring-0 focus:ring-0"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  aria-label="Alternar visibilidad de contraseña"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer select-none">
                <input
                  className="rounded border-slate-700 bg-navy-900 text-brand-500 focus:ring-0 focus:ring-offset-0 focus:outline-none w-4 h-4 cursor-pointer"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-slate-300 hover:text-white transition-colors">
                  Recordarme
                </span>
              </label>
            </div>

            {/* Primary Submit Action */}
            <div className="pt-2">
              <button
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm tracking-wide text-white bg-gradient-to-r from-brand-600 via-brand-500 to-blue-500 hover:from-brand-500 hover:to-blue-400 active:scale-[0.98] shadow-glow-blue transition-all duration-200 flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M5 12h14"></path>
                      <path d="M12 5l7 7-7 7"></path>
                  </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
