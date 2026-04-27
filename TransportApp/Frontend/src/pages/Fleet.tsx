import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Plus, Loader2, Trash2, History, AlertTriangle, CheckCircle2, Container, UserPlus } from 'lucide-react';
import { fleetService } from '../services/fleetService';
import type { Vehicle, Trailer } from '../types';

export default function Fleet() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'trailers'>('vehicles');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('');
  const [axlesCount, setAxlesCount] = useState<number>(2);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [currentMileage, setCurrentMileage] = useState<number>(0);
  const [maintenanceInterval, setMaintenanceInterval] = useState<number>(10000);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vData, tData] = await Promise.all([
        fleetService.getVehicles(),
        fleetService.getTrailers()
      ]);
      setVehicles(vData);
      setTrailers(tData);
    } catch (error) {
      console.error('Error fetching fleet data:', error);
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
      if (activeTab === 'vehicles') {
        await fleetService.createVehicle({
          licensePlate, brand, model, year, currentMileage,
          lastMaintenanceMileage: currentMileage, maintenanceInterval
        });
      } else {
        await fleetService.createTrailer({
          licensePlate, type, axlesCount, currentMileage,
          lastMaintenanceMileage: currentMileage, maintenanceInterval
        });
      }
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating unit:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(`¿Estás seguro de que deseas eliminar este ${activeTab === 'vehicles' ? 'vehículo' : 'remolque'}?`)) {
      try {
        if (activeTab === 'vehicles') await fleetService.deleteVehicle(id);
        else await fleetService.deleteTrailer(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting unit:', error);
      }
    }
  };

  const resetForm = () => {
    setLicensePlate(''); setBrand(''); setModel(''); setType('');
    setAxlesCount(2); setYear(new Date().getFullYear());
    setCurrentMileage(0); setMaintenanceInterval(activeTab === 'vehicles' ? 10000 : 15000);
  };

  const getMaintenanceStatus = (current: number, last: number, interval: number) => {
    const kmSinceLast = current - last;
    const remaining = interval - kmSinceLast;
    
    if (remaining <= 0) {
      return { 
        label: 'Vencido', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
        icon: <AlertTriangle size={14} />, detail: `${Math.abs(remaining).toLocaleString()} km de exceso`
      };
    } else if (remaining < 2000) {
      return { 
        label: 'Próximo', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
        icon: <AlertTriangle size={14} />, detail: `En ${remaining.toLocaleString()} km`
      };
    }
    return { 
      label: 'Al día', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
      icon: <CheckCircle2 size={14} />, detail: `Faltan ${remaining.toLocaleString()} km`
    };
  };

  const handleSyncOrphaned = async () => {
    try {
      setLoading(true);
      if (activeTab === 'vehicles') {
        const res = await fleetService.syncOrphanedVehicles();
        alert(`Sincronizados ${res.count} vehículos.`);
      } else {
        const res = await fleetService.syncOrphanedTrailers();
        alert(`Sincronizados ${res.count} remolques.`);
      }
      fetchData();
    } catch (error) {
      console.error('Error syncing units:', error);
      alert('Error al sincronizar unidades.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Truck className="text-blue-600" size={32} />
            Flota de Transporte
          </h1>
          <p className="text-gray-500 mt-1">Gestión de vehículos, remolques y mantenimientos.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSyncOrphaned}
            className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors border border-amber-200 shadow-sm"
            title="Vincular unidades sin empresa"
          >
            <UserPlus size={20} />
            Vincular Huérfanos
          </button>
          <button 
            onClick={() => { setShowForm(!showForm); resetForm(); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} />
            {showForm ? 'Cancelar' : activeTab === 'vehicles' ? 'Nuevo Vehículo' : 'Nuevo Remolque'}
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto whitespace-nowrap border-b border-gray-200 dark:border-gray-700 mb-6 pb-px">
        <button
          onClick={() => { setActiveTab('vehicles'); setShowForm(false); }}
          className={`flex items-center gap-2 py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'vehicles' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <Truck size={18} /> Vehículos ({vehicles.length})
        </button>
        <button
          onClick={() => { setActiveTab('trailers'); setShowForm(false); setMaintenanceInterval(15000); }}
          className={`flex items-center gap-2 py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'trailers' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <Container size={18} /> Remolques ({trailers.length})
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-semibold mb-6">Registrar Nuevo {activeTab === 'vehicles' ? 'Vehículo' : 'Remolque'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Placa / Matrícula</label>
              <input 
                type="text" required value={licensePlate} onChange={e => setLicensePlate(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            
            {activeTab === 'vehicles' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marca</label>
                  <input type="text" required value={brand} onChange={e => setBrand(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modelo</label>
                  <input type="text" required value={model} onChange={e => setModel(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Año</label>
                  <input type="number" required min="1950" max={new Date().getFullYear() + 1} value={year} onChange={e => setYear(parseInt(e.target.value))} className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Remolque</label>
                  <select required value={type} onChange={e => setType(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white dark:bg-gray-800">
                    <option value="">Seleccione tipo...</option>
                    <option value="Cisterna">Cisterna</option>
                    <option value="Plataforma">Plataforma</option>
                    <option value="Furgón">Furgón</option>
                    <option value="Refrigerado">Refrigerado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cant. Ejes</label>
                  <input type="number" required min="1" max="10" value={axlesCount} onChange={e => setAxlesCount(parseInt(e.target.value))} className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kilometraje Actual (km)</label>
              <input type="number" required min="0" step="0.1" value={currentMileage} onChange={e => setCurrentMileage(parseFloat(e.target.value))} className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ciclo de Mant. (km)</label>
              <input type="number" required min="1000" step="1000" value={maintenanceInterval} onChange={e => setMaintenanceInterval(parseInt(e.target.value))} className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className={`flex items-end ${activeTab === 'trailers' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              <button type="submit" className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-md font-medium transition-colors">Guardar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Unidad</th>
                <th className="px-6 py-4">Kilometraje</th>
                <th className="px-6 py-4">Salud Mecánica</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500"><Loader2 className="animate-spin mx-auto mb-2" size={24} />Cargando...</td>
                </tr>
              ) : (activeTab === 'vehicles' ? vehicles : trailers).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No hay registros.</td>
                </tr>
              ) : (
                (activeTab === 'vehicles' ? vehicles : trailers).map((unit: any) => {
                  const status = getMaintenanceStatus(unit.currentMileage, unit.lastMaintenanceMileage || unit.currentMileage, unit.maintenanceInterval || (activeTab === 'vehicles' ? 10000 : 15000));
                  return (
                    <tr key={unit.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{unit.licensePlate}</div>
                        <div className="text-xs text-gray-500 font-medium">
                          {activeTab === 'vehicles' ? `${unit.brand} ${unit.model} (${unit.year})` : `${unit.type} - ${unit.axlesCount} Ejes`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-gray-200">{unit.currentMileage.toLocaleString()} km</div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold">Total Acumulado</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-current/10 ${status.color}`}>
                          {status.icon}{status.label}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 font-medium italic">{status.detail}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/fleet/${activeTab === 'vehicles' ? 'vehicle' : 'trailer'}/${unit.id}`} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold">
                            <History size={16} /> Expediente
                          </Link>
                          <button onClick={() => handleDelete(unit.id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
