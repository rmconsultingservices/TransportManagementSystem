import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Plus, Loader2, PenTool, CheckCircle2, Clock, UserCheck, Trash2, Printer } from 'lucide-react';
import { workshopService } from '../services/workshopService';
import { fleetService } from '../services/fleetService';
import { staffService } from '../services/staffService';
import type { ServiceRequest, Vehicle, Driver, Mechanic } from '../types';

export default function Workshop() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Assignment State
  const [assigningReqId, setAssigningReqId] = useState<number | null>(null);
  const [selectedMechanicId, setSelectedMechanicId] = useState<number | ''>('');

  // Form state
  const [vehicleId, setVehicleId] = useState<number | ''>('');
  const [driverId, setDriverId] = useState<number | ''>('');
  const [repairType, setRepairType] = useState('Preventiva');
  const [description, setDescription] = useState('');
  const [activities, setActivities] = useState<{ description: string }[]>([{ description: '' }]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqData, vehData, drvData, mechData] = await Promise.all([
        workshopService.getRequests(),
        fleetService.getVehicles(),
        staffService.getDrivers(),
        staffService.getMechanics()
      ]);
      setRequests(reqData);
      setVehicles(vehData);
      setDrivers(drvData.filter(d => d.isActive));
      setMechanics(mechData.filter(m => m.isActive));
    } catch (error) {
      console.error('Error fetching workshop data:', error);
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
      await workshopService.createRequest({
        vehicleId: vehicleId === '' ? undefined : Number(vehicleId),
        driverId: driverId === '' ? undefined : Number(driverId),
        repairType,
        description,
        activities: activities.filter(a => a.description.trim() !== '')
      });
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating service request:', error);
    }
  };

  const submitAssignMechanic = async (id: number) => {
    if (selectedMechanicId === '') return;
    try {
      await workshopService.assignMechanic(id, Number(selectedMechanicId));
      setAssigningReqId(null);
      setSelectedMechanicId('');
      fetchData();
    } catch (error) {
      console.error('Error assigning mechanic:', error);
    }
  };

  const resetForm = () => {
    setVehicleId('');
    setDriverId('');
    setRepairType('Preventiva');
    setDescription('');
    setActivities([{ description: '' }]);
  };

  const addActivityRow = () => {
    setActivities([...activities, { description: '' }]);
  };

  const updateActivityRow = (index: number, val: string) => {
    const newActs = [...activities];
    newActs[index].description = val;
    setActivities(newActs);
  };

  const removeActivityRow = (index: number) => {
    if (activities.length > 1) {
      setActivities(activities.filter((_, i) => i !== index));
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Pendiente':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><Clock size={12}/> {status}</span>;
      case 'En Revisión':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><PenTool size={12}/> {status}</span>;
      case 'Completado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 size={12}/> {status}</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Wrench className="text-blue-600" size={32} />
            Taller Mecánico
          </h1>
          <p className="text-gray-500 mt-1">Gestión de tickets, atención de fallas y mantenimiento.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          {showForm ? 'Cancelar' : 'Nueva Solicitud'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-blue-700 dark:text-blue-400">
            Abrir Solicitud de Servicio
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehículo Afectado</label>
              <select 
                required
                value={vehicleId} onChange={e => setVehicleId(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Seleccione un vehículo activo...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{v.licensePlate} - {v.brand} {v.model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chofer Reportante</label>
              <select 
                required
                value={driverId} onChange={e => setDriverId(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Seleccione un chofer de la lista...</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{d.name} {d.licenseNumber ? `(${d.licenseNumber})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Reparación</label>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="repairType" value="Preventiva" checked={repairType === 'Preventiva'} onChange={e => setRepairType(e.target.value)} className="text-blue-600 focus:ring-blue-500"/>
                  <span className="text-sm dark:text-gray-300">Preventiva</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="repairType" value="Correctiva" checked={repairType === 'Correctiva'} onChange={e => setRepairType(e.target.value)} className="text-blue-600 focus:ring-blue-500"/>
                  <span className="text-sm dark:text-gray-300">Correctiva</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="repairType" value="Preventiva / Correctiva" checked={repairType === 'Preventiva / Correctiva'} onChange={e => setRepairType(e.target.value)} className="text-blue-600 focus:ring-blue-500"/>
                  <span className="text-sm dark:text-gray-300">Ambas</span>
                </label>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">Protocolo de Mantenimiento (Actividades a realizar)</h3>
              {activities.map((act, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input 
                    type="text" required
                    value={act.description} onChange={(e) => updateActivityRow(idx, e.target.value)}
                    placeholder={`Actividad ${idx + 1}`}
                    className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  {activities.length > 1 && (
                    <button type="button" onClick={() => removeActivityRow(idx)} className="text-red-500 hover:text-red-700 px-2 flex items-center">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addActivityRow} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-2">
                <Plus size={16} /> Agregar renglón
              </button>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones Generales</label>
              <textarea 
                required rows={3}
                value={description} onChange={e => setDescription(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="ej. Cambio de aceite y revisión de tren delantero por sonido extraño..."
              />
            </div>
            <div className="flex justify-end md:col-span-2">
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-md font-medium transition-colors"
              >
                Generar Ticket de Taller
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">Vehículo</th>
                <th className="px-6 py-4">Falla Reportada</th>
                <th className="px-6 py-4">Mecánico Asignado</th>
                <th className="px-6 py-4">Estatus</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Cargando solicitudes de taller...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No hay solicitudes de mantenimiento pendientes en este momento.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">#{req.id.toString().padStart(4, '0')}</div>
                      <div className="text-xs text-gray-500">{new Date(req.dateRequested).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white uppercase">
                        {req.vehicle?.licensePlate || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-600">{req.driver?.name || 'Chofer Desconocido'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm max-w-xs truncate" title={req.description}>
                      {req.description}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {req.mechanic ? (
                        <span className="text-blue-600 dark:text-blue-400">{req.mechanic.name}</span>
                      ) : assigningReqId === req.id ? (
                        <div className="flex gap-2">
                          <select 
                            className="text-xs border rounded p-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:border-gray-600"
                            value={selectedMechanicId}
                            onChange={(e) => setSelectedMechanicId(e.target.value === '' ? '' : parseInt(e.target.value))}
                          >
                            <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Seleccione...</option>
                            {mechanics.map(m => (
                              <option key={m.id} value={m.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{m.name}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => submitAssignMechanic(req.id)}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                          >
                            <UserCheck size={14} />
                          </button>
                          <button 
                            onClick={() => { setAssigningReqId(null); setSelectedMechanicId(''); }}
                            className="text-gray-500 text-xs px-2"
                          >
                            Volver
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Sin Asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                        {req.status === 'Pendiente' && assigningReqId !== req.id && (
                          <button 
                            onClick={() => setAssigningReqId(req.id)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
                          >
                            Asignar Mecánico
                          </button>
                        )}
                        <Link 
                          to={`/print/ticket/${req.id}`}
                          target="_blank"
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 border border-gray-200"
                          title="Imprimir Reporte"
                        >
                          <Printer size={14} /> Imprimir
                        </Link>
                        {(req.status === 'En Revisión' || req.status === 'Completado') && (
                          <Link 
                            to={`/workshop/${req.id}`}
                            className="bg-green-50 hover:bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-md font-medium transition-colors border border-green-200"
                          >
                            Ver Expediente
                          </Link>
                        )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
