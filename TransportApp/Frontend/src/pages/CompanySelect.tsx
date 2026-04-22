import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="text-center">
            <h2 className="text-xl mb-4 text-red-400">Error: No companies assigned.</h2>
            <p className="text-slate-400 mb-6">Contact your administrator.</p>
            <button onClick={() => { logout(); navigate("/login"); }} className="bg-slate-700 px-4 py-2 rounded">
              Back to Login
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="bg-blue-500/10 p-4 rounded-full mb-4 ring-1 ring-blue-500/30 inline-flex">
            <Building2 className="h-10 w-10 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Select Workspace</h2>
          <p className="text-slate-400 mt-2 text-md">Choose the company you want to work in</p>
        </div>

        <div className="grid gap-4">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => handleSelectCompany(company)}
              className="group bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-xl p-6 flex flex-row items-center justify-between text-left transition-all hover:shadow-lg hover:shadow-blue-500/10"
            >
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {company.name}
                </h3>
                <p className="text-sm text-slate-400 mt-1">RIF: {company.rif}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-700 group-hover:bg-blue-600 flex items-center justify-center transition-colors">
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-white" />
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-8 text-center">
             <button onClick={() => { logout(); navigate("/login"); }} className="text-slate-500 hover:text-white text-sm">
                Sign Out
             </button>
        </div>
      </div>
    </div>
  );
}
