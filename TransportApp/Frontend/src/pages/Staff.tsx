import { useEffect, useState } from 'react';
import { Users, UserPlus, Loader2 } from 'lucide-react';
import { staffService } from '../services/staffService';
import type { Driver, Mechanic } from '../types';

export default function Staff() {
  const [activeTab, setActiveTab] = useState<'drivers' | 'mechanics'>('drivers');
  
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [licenseOrSpeciality, setLicenseOrSpeciality] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [drvData, mechData] = await Promise.all([
        staffService.getDrivers(),
        staffService.getMechanics()
      ]);
      setDrivers(drvData);
      setMechanics(mechData);
    } catch (error) {
      console.error('Error fetching staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'drivers') {
        await staffService.createDriver({
          name,
          phoneNumber: phoneNumber || undefined,
          licenseNumber: licenseOrSpeciality || undefined,
          isActive: true
        });
      } else {
        await staffService.createMechanic({
          name,
          phoneNumber: phoneNumber || undefined,
          speciality: licenseOrSpeciality || undefined,
          isActive: true
        });
      }
      setShowForm(false);
      setName('');
      setPhoneNumber('');
      setLicenseOrSpeciality('');
      fetchData();
    } catch (error) {
      console.error('Error creating staff member:', error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="text-teal-600" size={32} />
            Gestión de Personal
          </h1>
          <p className="text-gray-500 mt-1">Administra los Choferes y el Equipo de Mecánicos.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <UserPlus size={20} />
          {showForm ? 'Cancelar' : `Añadir ${activeTab === 'drivers' ? 'Chofer' : 'Mecánico'}`}
        </button>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'drivers' 
              ? 'border-teal-600 text-teal-600 dark:text-teal-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => { setActiveTab('drivers'); setShowForm(false); }}
        >
          Lista de Choferes
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'mechanics' 
              ? 'border-teal-600 text-teal-600 dark:text-teal-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => { setActiveTab('mechanics'); setShowForm(false); }}
        >
          Lista de Mecánicos
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-semibold mb-6 text-teal-700 dark:text-teal-400">
            Registrar Nuevo {activeTab === 'drivers' ? 'Chofer' : 'Mecánico'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo</label>
              <input 
                type="text" required
                value={name} onChange={e => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
              <input 
                type="text"
                value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {activeTab === 'drivers' ? 'Nro. de Licencia' : 'Especialidad'}
              </label>
              <input 
                type="text"
                value={licenseOrSpeciality} onChange={e => setLicenseOrSpeciality(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder={activeTab === 'drivers' ? "Opcional" : "ej. Electricista, Motor"}
              />
            </div>
             <div className="md:col-span-3 flex justify-end">
              <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-2 rounded-md font-medium transition-colors">
                Guardar {activeTab === 'drivers' ? 'Chofer' : 'Mecánico'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
           <div className="p-12 text-center text-gray-500">
             <Loader2 className="animate-spin mx-auto mb-2" size={24} />
             Cargando personal...
           </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">ID / Estado</th>
                <th className="px-6 py-4">Nombre Completo</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4">{activeTab === 'drivers' ? 'Licencia' : 'Especialidad'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
               {(activeTab === 'drivers' ? drivers : mechanics as any[]).map(person => (
                <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                   <td className="px-6 py-4">
                     <span className="text-gray-500">#{person.id.toString().padStart(3, '0')}</span>
                     {person.isActive && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Activo</span>}
                   </td>
                   <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                     {person.name}
                   </td>
                   <td className="px-6 py-4 text-gray-600">
                     {person.phoneNumber || 'N/A'}
                   </td>
                   <td className="px-6 py-4 text-sm text-gray-500">
                     {activeTab === 'drivers' ? person.licenseNumber : person.speciality || 'N/A'}
                   </td>
                </tr>
               ))}
               {(activeTab === 'drivers' ? drivers.length : mechanics.length) === 0 && (
                 <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No hay {activeTab === 'drivers' ? 'choferes' : 'mecánicos'} registrados aún.
                    </td>
                 </tr>
               )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
