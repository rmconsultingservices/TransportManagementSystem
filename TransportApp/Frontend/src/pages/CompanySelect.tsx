import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function CompanySelect() {
  const navigate = useNavigate();
  const { companies, setSelectedCompany, logout } = useAuthStore();

  const handleSelectCompany = (company: any) => {
    setSelectedCompany(company);
    navigate('/');
  };

  if (!companies || companies.length === 0) {
    return (
      <div className="min-h-screen w-full bg-navy-950 bg-ambient flex items-center justify-center p-4 text-white relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-cyan/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center z-10 bg-navy-800/60 backdrop-blur-xl border border-slate-700/40 rounded-3xl p-8 max-w-md w-full shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-rose-400" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-rose-300">¡Sin empresas asignadas!</h2>
          <p className="text-slate-400 mb-6 text-sm">Comunícate con el administrador del sistema para que te asigne una empresa.</p>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
          >
            Volver al Inicio de Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-navy-950 bg-ambient font-sans text-slate-100 antialiased selection:bg-brand-500 selection:text-white flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient Glow Overlays */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-cyan/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-xl w-full z-10">
        <div className="text-center mb-8">
          {/* App Icon Badge with Glow */}
          <div className="relative group cursor-pointer mb-4 inline-block">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 opacity-70 blur-md group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-navy-800 to-navy-900 border border-slate-700/60 shadow-glass-inset flex items-center justify-center">
              <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-brand-400 drop-shadow-md" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Seleccionar Empresa</h2>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">Elige la empresa con la que deseas trabajar</p>
        </div>

        <div className="grid gap-4">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => handleSelectCompany(company)}
              className="group bg-navy-800/60 backdrop-blur-xl border border-slate-700/60 hover:border-brand-500/80 rounded-2xl p-5 sm:p-6 flex flex-row items-center justify-between text-left transition-all hover:shadow-glow-blue active:scale-[0.99]"
            >
              <div className="pr-4">
                <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-brand-400 transition-colors">
                  {company.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">RIF: {company.rif}</p>
              </div>
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-navy-900 border border-slate-700/80 group-hover:bg-brand-600 group-hover:border-brand-500 flex items-center justify-center transition-all shrink-0">
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors py-2 px-4 rounded-lg hover:bg-slate-800/50"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
