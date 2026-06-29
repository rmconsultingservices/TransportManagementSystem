import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Plus, Loader2, Trash2, History, AlertTriangle, CheckCircle2, Container, UserPlus, Search, Calendar as CalendarIcon, Edit, Building2 } from 'lucide-react';
import { fleetService } from '../services/fleetService';
import { maintenanceService } from '../services/maintenanceService';
import { useAuthStore } from '../store/authStore';
import type { Vehicle, Trailer, MaintenanceOrder, FleetOwner } from '../types';

export default function Fleet() {
  const { selectedCompany } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'vehicles' | 'trailers' | 'owners' | 'expedientes'>('vehicles');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [owners, setOwners] = useState<FleetOwner[]>([]);
  const [expedientes, setExpedientes] = useState<MaintenanceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Filters
  const [filterUnit, setFilterUnit] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterRecord, setFilterRecord] = useState('');
  
  // Unit Form state
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [licensePlate, setLicensePlate] = useState('');
  const [fleetOwnerId, setFleetOwnerId] = useState<number | ''>('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('');
  const [axlesCount, setAxlesCount] = useState<number>(2);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [currentMileage, setCurrentMileage] = useState<number>(0);
  const [maintenanceInterval, setMaintenanceInterval] = useState<number>(10000);

  // Owner Form state
  const [editingOwnerId, setEditingOwnerId] = useState<number | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [ownerDescription, setOwnerDescription] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vData, tData, oData, eData] = await Promise.all([
        fleetService.getVehicles(),
        fleetService.getTrailers(),
        fleetService.getFleetOwners(),
        maintenanceService.getMaintenanceOrders()
      ]);
      setVehicles(vData);
      setTrailers(tData);
      setOwners(oData);
      setExpedientes(eData || []);
    } catch (error) {
      console.error('Error fetching fleet data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditingUnitId(null);
    setLicensePlate(''); setBrand(''); setModel(''); setType(''); setFleetOwnerId('');
    setAxlesCount(2); setYear(new Date().getFullYear());
    setCurrentMileage(0); setMaintenanceInterval(activeTab === 'vehicles' ? 10000 : 15000);
  };

  const resetOwnerForm = () => {
    setEditingOwnerId(null);
    setOwnerName('');
    setOwnerDescription('');
  };

  const handleEditUnit = (unit: any) => {
    setEditingUnitId(unit.id);
    setLicensePlate(unit.licensePlate);
    setFleetOwnerId(unit.fleetOwnerId || '');
    setCurrentMileage(unit.currentMileage);
    setMaintenanceInterval(unit.maintenanceInterval);
    
    if (activeTab === 'vehicles') {
      setBrand(unit.brand);
      setModel(unit.model);
      setYear(unit.year);
    } else {
      setType(unit.type);
      setAxlesCount(unit.axlesCount);
    }
    setShowForm(true);
  };

  const handleEditOwner = (owner: FleetOwner) => {
    setEditingOwnerId(owner.id);
    setOwnerName(owner.name);
    setOwnerDescription(owner.description || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'vehicles') {
        const payload = {
          licensePlate, brand, model, year, currentMileage,
          lastMaintenanceMileage: currentMileage, maintenanceInterval,
          fleetOwnerId: fleetOwnerId ? Number(fleetOwnerId) : undefined
        };
        if (editingUnitId) {
          // fetch current vehicle to keep lastMaintenanceMileage if needed
          const current = vehicles.find(v => v.id === editingUnitId);
          await fleetService.updateVehicle(editingUnitId, { ...payload, id: editingUnitId, lastMaintenanceMileage: current?.lastMaintenanceMileage || currentMileage, isActive: true } as any);
        } else {
          await fleetService.createVehicle(payload as any);
        }
      } else {
        const payload = {
          licensePlate, type, axlesCount, currentMileage,
          lastMaintenanceMileage: currentMileage, maintenanceInterval,
          fleetOwnerId: fleetOwnerId ? Number(fleetOwnerId) : undefined
        };
        if (editingUnitId) {
          const current = trailers.find(t => t.id === editingUnitId);
          await fleetService.updateTrailer(editingUnitId, { ...payload, id: editingUnitId, lastMaintenanceMileage: current?.lastMaintenanceMileage || currentMileage, isActive: true } as any);
        } else {
          await fleetService.createTrailer(payload as any);
        }
      }
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating/updating unit:', error);
    }
  };

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { name: ownerName, description: ownerDescription };
      if (editingOwnerId) {
        await fleetService.updateFleetOwner(editingOwnerId, { ...payload, id: editingOwnerId, isActive: true } as any);
      } else {
        await fleetService.createFleetOwner(payload as any);
      }
      setShowForm(false);
      resetOwnerForm();
      fetchData();
    } catch (error) {
      console.error('Error creating/updating owner:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(`¿Estás seguro de que deseas eliminar este registro?`)) {
      try {
        if (activeTab === 'vehicles') await fleetService.deleteVehicle(id);
        else if (activeTab === 'trailers') await fleetService.deleteTrailer(id);
        else if (activeTab === 'owners') await fleetService.deleteFleetOwner(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting record:', error);
      }
    }
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

  const filteredExpedientes = expedientes.filter(exp => {
    const vStr = exp.vehicle ? `${exp.vehicle.licensePlate} ${exp.vehicle.brand} ${exp.vehicle.model}` : '';
    const tStr = exp.trailer ? `${exp.trailer.licensePlate} ${exp.trailer.type}` : '';
    const vehicleMatch = !filterVehicle || 
      vStr.toLowerCase().includes(filterVehicle.toLowerCase()) || 
      tStr.toLowerCase().includes(filterVehicle.toLowerCase());
    const dateMatch = !filterDate || new Date(exp.date).toISOString().split('T')[0] === filterDate;
    const recordMatch = !filterRecord || 
      exp.id.toString().includes(filterRecord) || 
      (exp.serviceRequestId && exp.serviceRequestId.toString().includes(filterRecord));
    return vehicleMatch && dateMatch && recordMatch;
  });

  const displayUnits = (activeTab === 'vehicles' ? vehicles : trailers).filter((u: any) => {
    if (!filterUnit) return true;
    const searchStr = `${u.licensePlate} ${u.brand || ''} ${u.model || ''} ${u.type || ''} ${u.fleetOwner?.name || ''}`.toLowerCase();
    return searchStr.includes(filterUnit.toLowerCase());
  });

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
          {activeTab !== 'owners' && activeTab !== 'expedientes' && (
            <button 
              onClick={() => {
                try {
                  const companyId = selectedCompany?.id ?? (selectedCompany as any)?.Id ?? (selectedCompany as any)?.companyId;
                  if (activeTab === 'vehicles') fleetService.syncOrphanedVehicles(companyId).then(() => fetchData());
                  else fleetService.syncOrphanedTrailers(companyId).then(() => fetchData());
                } catch(e) {}
              }}
              className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors border border-amber-200 shadow-sm"
              title="Vincular unidades sin empresa"
            >
              <UserPlus size={20} />
              Vincular Huérfanos
            </button>
          )}
          
          {activeTab !== 'expedientes' && (
            <button 
              onClick={() => { 
                setShowForm(!showForm); 
                if (activeTab === 'owners') resetOwnerForm(); else resetForm(); 
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={20} />
              {showForm ? 'Cancelar' : (activeTab === 'vehicles' ? 'Nuevo Vehículo' : activeTab === 'trailers' ? 'Nuevo Remolque' : 'Nueva Empresa')}
            </button>
          )}
        </div>
      </div>

      <div className="flex overflow-x-auto whitespace-nowrap border-b border-gray-200 dark:border-gray-700 mb-6 pb-px">
        <button
          onClick={() => { setActiveTab('vehicles'); setShowForm(false); setFilterUnit(''); }}
          className={`flex items-center gap-2 py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'vehicles' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <Truck size={18} /> Vehículos ({vehicles.length})
        </button>
        <button
          onClick={() => { setActiveTab('trailers'); setShowForm(false); setMaintenanceInterval(15000); setFilterUnit(''); }}
          className={`flex items-center gap-2 py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'trailers' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <Container size={18} /> Remolques ({trailers.length})
        </button>
        <button
          onClick={() => { setActiveTab('owners'); setShowForm(false); }}
          className={`flex items-center gap-2 py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'owners' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <Building2 size={18} /> Empresas Propietarias ({owners.length})
        </button>
        <button
          onClick={() => { setActiveTab('expedientes'); setShowForm(false); }}
          className={`flex items-center gap-2 py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'expedientes' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <History size={18} /> Expedientes ({expedientes.length})
        </button>
      </div>

      {activeTab === 'expedientes' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" placeholder="Buscar por placa o marca..." value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex-1 relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex-1 relative">
              <History className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" placeholder="Nro. Expediente o Ticket..." value={filterRecord} onChange={e => setFilterRecord(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Nro. Expediente</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Vehículo</th>
                  <th className="px-6 py-4">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500"><Loader2 className="animate-spin mx-auto mb-2" size={24} />Cargando...</td></tr>
                ) : filteredExpedientes.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No se encontraron expedientes.</td></tr>
                ) : (
                  filteredExpedientes.map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white">#{exp.id}</div>
                        {exp.serviceRequestId && (
                          <Link to={`/workshop/${exp.serviceRequestId}`} className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline inline-flex items-center gap-1 mt-1">Ticket #{exp.serviceRequestId}</Link>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{new Date(exp.date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        {exp.vehicle ? (
                          <><div className="font-bold text-gray-900 dark:text-white uppercase">{exp.vehicle.licensePlate}</div><div className="text-xs text-gray-500">{exp.vehicle.brand}</div></>
                        ) : exp.trailer ? (
                          <><div className="font-bold text-gray-900 dark:text-white uppercase">{exp.trailer.licensePlate}</div><div className="text-xs text-gray-500">{exp.trailer.type}</div></>
                        ) : (<div className="text-gray-500 italic">Desconocido</div>)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300 font-medium"><span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs mr-2 uppercase">{exp.type}</span>Mecánico: {exp.mechanicAssigned || '-'}</div>
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">{exp.notes}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'owners' ? (
        <>
          {showForm && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 mb-8 animate-in fade-in slide-in-from-top-4">
              <h2 className="text-xl font-semibold mb-6">{editingOwnerId ? 'Editar Empresa' : 'Registrar Nueva Empresa Propietaria'}</h2>
              <form onSubmit={handleOwnerSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de la Empresa</label>
                  <input type="text" required value={ownerName} onChange={e => setOwnerName(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción / Detalles (Opcional)</label>
                  <input type="text" value={ownerDescription} onChange={e => setOwnerDescription(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-md font-medium transition-colors">Guardar</button>
                </div>
              </form>
            </div>
          )}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Empresa</th>
                    <th className="px-6 py-4">Descripción</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500"><Loader2 className="animate-spin mx-auto mb-2" size={24} />Cargando...</td></tr>
                  ) : owners.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">No hay empresas registradas.</td></tr>
                  ) : (
                    owners.map((owner) => (
                      <tr key={owner.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white uppercase tracking-tight">{owner.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{owner.description}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEditOwner(owner)} className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Edit size={18} /></button>
                            <button onClick={() => handleDelete(owner.id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-6 flex">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" placeholder={`Buscar ${activeTab === 'vehicles' ? 'vehículos' : 'remolques'} por placa, marca o empresa...`} 
                value={filterUnit} onChange={e => setFilterUnit(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
              />
            </div>
          </div>

          {showForm && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 mb-8 animate-in fade-in slide-in-from-top-4">
              <h2 className="text-xl font-semibold mb-6">{editingUnitId ? 'Editar' : 'Registrar Nuevo'} {activeTab === 'vehicles' ? 'Vehículo' : 'Remolque'}</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Placa / Matrícula</label>
              <input 
                type="text" required value={licensePlate} onChange={e => setLicensePlate(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa Propietaria (Opcional)</label>
              <select 
                value={fleetOwnerId} onChange={e => setFleetOwnerId(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white dark:bg-gray-800"
              >
                <option value="">Ninguna (Propio de esta sucursal)</option>
                {owners.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
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
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500"><Loader2 className="animate-spin mx-auto mb-2" size={24} />Cargando...</td></tr>
              ) : displayUnits.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No hay registros que coincidan.</td></tr>
              ) : (
                displayUnits.map((unit: any) => {
                  const status = getMaintenanceStatus(unit.currentMileage, unit.lastMaintenanceMileage || unit.currentMileage, unit.maintenanceInterval || (activeTab === 'vehicles' ? 10000 : 15000));
                  return (
                    <tr key={unit.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{unit.licensePlate}</div>
                        <div className="text-xs text-gray-500 font-medium">
                          {activeTab === 'vehicles' ? `${unit.brand} ${unit.model} (${unit.year})` : `${unit.type} - ${unit.axlesCount} Ejes`}
                        </div>
                        {unit.fleetOwner && (
                          <div className="text-xs mt-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 inline-block font-medium border border-blue-100 dark:border-blue-800">
                            Propiedad de: {unit.fleetOwner.name}
                          </div>
                        )}
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
                            <History size={16} /> <span className="hidden md:inline">Expediente</span>
                          </Link>
                          <button onClick={() => handleEditUnit(unit)} className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            <Edit size={18} />
                          </button>
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
      </>
      )}
    </div>
  );
}
