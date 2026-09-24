import React, { useState, useEffect } from 'react';
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
  const [currentTime, setCurrentTime] = useState('9:41');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen bg-navy-950 font-sans text-slate-100 antialiased selection:bg-brand-500 selection:text-white flex flex-col justify-center items-center p-0 sm:p-4">
      {/* Outer viewport shell imitating native iOS screen dimensions */}
      <div className="relative w-full max-w-[430px] min-h-screen sm:min-h-[820px] sm:max-h-[890px] bg-ambient flex flex-col justify-between overflow-hidden sm:rounded-[44px] sm:border-[8px] sm:border-slate-800/80 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
        {/* Top Glow Overlay for Modern Visual Depth */}
        <div className="absolute -top-32 -left-20 w-80 h-80 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-20 w-72 h-72 bg-accent-cyan/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* iOS Status Bar */}
        <header className="w-full pt-3.5 px-7 flex items-center justify-between z-20 select-none" data-purpose="status-bar">
          <span className="text-xs font-semibold tracking-tight text-slate-300">{currentTime}</span>
          {/* Dynamic Island */}
          <div className="hidden sm:block w-28 h-4 bg-slate-900 rounded-full border border-slate-800/60 shadow-inner"></div>
          {/* System icons */}
          <div className="flex items-center space-x-2 text-slate-300">
            {/* Cellular Signal */}
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 18.25A10.95 10.95 0 0 1 2 12C2 6.48 6.48 2 12 2s10 4.48 10 10c0 2.32-.72 4.47-1.95 6.25l-.62-.64C20.44 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9zm0 4a5 5 0 0 0-5 5c0 1.25.46 2.39 1.22 3.28l.71-.71A3.978 3.978 0 0 1 8 12a4 4 0 0 1 8 0c0 .98-.36 1.87-.93 2.57l.71.71c.76-.89 1.22-2.03 1.22-3.28a5 5 0 0 0-5-5zm0 2a3 3 0 0 0-3 3c0 .63.2 1.21.54 1.69l.71-.71A1.993 1.993 0 0 1 10 12a2 2 0 1 1 3.42 1.41l.71.71c.54-.62.87-1.42.87-2.12a3 3 0 0 0-3-3z"/>
            </svg>
            {/* Battery */}
            <div className="w-5 h-2.5 border border-slate-300 rounded-[3px] p-[1px] flex items-center">
              <div className="h-full w-full bg-slate-200 rounded-[1.5px]"></div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full px-6 py-6 flex-1 flex flex-col justify-center z-10">
          {/* Brand & Welcome Section */}
          <section className="flex flex-col items-center text-center mb-6" data-purpose="brand-header">
            {/* App Icon Badge with Glow */}
            <div className="relative group cursor-pointer mb-4">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 opacity-70 blur-md group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-navy-800 to-navy-900 border border-slate-700/60 shadow-glass-inset flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-400 drop-shadow-md" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"></path>
                  <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"></path>
                  <circle cx="7" cy="18" r="2"></circle>
                  <path d="M15 18H9"></path>
                  <circle cx="17" cy="18" r="2"></circle>
              </svg>
            </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              TransportApp
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-[260px]">
              Tu logística inteligente en movimiento
            </p>
          </section>

          {/* Glassmorphic Login Form Card */}
          <section className="bg-navy-800/60 backdrop-blur-xl border border-slate-700/40 rounded-3xl p-6 shadow-2xl" data-purpose="login-form-container">
            {error && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username / Email Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300 tracking-wide" htmlFor="username">
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
                <label className="block text-xs font-medium text-slate-300 tracking-wide" htmlFor="password">
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
            <div className="flex items-center justify-between text-xs pt-1">
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
          </section>
        </main>

        {/* iOS Home Indicator */}
        <div className="w-full pb-3 pt-1 flex justify-center items-center select-none" data-purpose="home-indicator">
          <div className="w-32 h-1 bg-slate-600/70 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
