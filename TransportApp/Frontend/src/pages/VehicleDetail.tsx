import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Truck, ArrowLeft, History, Wrench, AlertTriangle, Calendar, CheckCircle2 } from 'lucide-react';
import { fleetService } from '../services/fleetService';
import { maintenanceService } from '../services/maintenanceService';
import type { Vehicle, Trailer, MaintenanceOrder } from '../types';

interface VehicleDetailProps {
  type: 'vehicle' | 'trailer';
}

export default function VehicleDetail({ type }: VehicleDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [unit, setUnit] = useState<Vehicle | Trailer | null>(null);
  const [history, setHistory] = useState<MaintenanceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const unitId = parseInt(id);
        
        const unitPromise = type === 'vehicle' 
          ? fleetService.getVehicle(unitId) 
          : fleetService.getTrailer(unitId);
          
        const historyPromise = maintenanceService.getMaintenanceOrders(
          type === 'vehicle' ? { vehicleId: unitId } : { trailerId: unitId }
        );

        const [unitData, historyData] = await Promise.all([unitPromise, historyPromise]);
        setUnit(unitData);
        setHistory(historyData);
      } catch (error: any) {
        console.error('Error fetching unit details:', error);
        setErrorMsg(error.response?.data?.message || error.response?.data || 'Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, type]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando expediente...</div>;
  }

  if (!unit) {
    return (
      <div className="p-8 text-center animate-in fade-in duration-500">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-8 rounded-2xl max-w-md mx-auto">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Unidad no encontrada</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {errorMsg || `No se pudo encontrar el registro del ${type === 'vehicle' ? 'vehículo' : 'remolque'} con ID #${id}. Esto puede ocurrir si el registro fue eliminado o si pertenece a otra empresa.`}
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Reintentar carga
            </button>
            <button 
              onClick={() => navigate('/fleet')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
            >
              Volver a la lista de flota
            </button>
          </div>
        </div>
      </div>
    );
  }

  const kmSinceLast = unit.currentMileage - (unit.lastMaintenanceMileage || unit.currentMileage);
  const interval = unit.maintenanceInterval || (type === 'vehicle' ? 10000 : 15000);
  const remaining = interval - kmSinceLast;
  
  let statusColor = 'text-emerald-500';
  let statusBg = 'bg-emerald-500/10 border-emerald-500/20';
  let StatusIcon = CheckCircle2;
  let statusText = 'Saludable';

  if (remaining <= 0) {
    statusColor = 'text-red-500';
    statusBg = 'bg-red-500/10 border-red-500/20';
    StatusIcon = AlertTriangle;
    statusText = 'Vencido';
  } else if (remaining < 2000) {
    statusColor = 'text-amber-500';
    statusBg = 'bg-amber-500/10 border-amber-500/20';
    StatusIcon = Wrench;
    statusText = 'Próximo';
  }

  const isVehicle = (u: Vehicle | Trailer): u is Vehicle => type === 'vehicle';
  const subtitle = isVehicle(unit) 
    ? `${unit.brand} ${unit.model} • ${unit.year}`
    : `Remolque ${unit.type} • ${unit.axlesCount} Ejes`;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-4 sm:mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-tight break-all">
              {unit.licensePlate}
            </h1>
            <span className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold uppercase rounded-full border flex items-center gap-1.5 ${statusColor} ${statusBg}`}>
              <StatusIcon size={12} className="sm:w-[14px] sm:h-[14px]" /> {statusText}
            </span>
          </div>
          <p className="text-sm sm:text-lg text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 mb-1">Kilometraje Total</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{unit.currentMileage.toLocaleString()} <span className="text-sm font-normal text-gray-400">km</span></p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 mb-1">Último Servicio</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{(unit.lastMaintenanceMileage || 0).toLocaleString()} <span className="text-sm font-normal text-gray-400">km</span></p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 mb-1">Próximo a los</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{((unit.lastMaintenanceMileage || 0) + interval).toLocaleString()} <span className="text-sm font-normal text-gray-400">km</span></p>
          <p className={`text-xs mt-1 font-medium ${statusColor}`}>
            {remaining <= 0 ? `Excedido por ${Math.abs(remaining).toLocaleString()} km` : `Faltan ${remaining.toLocaleString()} km`}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="text-indigo-500" size={24} />
            Expediente de Mantenimiento
          </h2>
          <span className="text-sm font-medium text-gray-500 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">{history.length} registros</span>
        </div>

        <div className="p-6">
          {history.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <History size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">No hay historial disponible</p>
              <p className="text-sm">Los registros se añadirán automáticamente cuando se completen servicios en el taller.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((order, index) => (
                <div key={order.id} className={`relative pl-8 ${index !== history.length - 1 ? 'pb-6 border-l-2 border-indigo-100 dark:border-indigo-900' : ''}`}>
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white dark:border-gray-800 shadow-sm" />
                  
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700 group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded">
                            {order.type}
                          </span>
                          <span className="text-sm font-medium text-gray-400 flex items-center gap-1">
                            <Calendar size={14} /> {new Date(order.date).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">Mantenimiento a {order.mileageAtMaintenance.toLocaleString()} km</h4>
                      </div>
                      
                      {order.serviceRequestId && (
                        <Link 
                          to={`/workshop/${order.serviceRequestId}`}
                          className="inline-flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Ver Ticket #{order.serviceRequestId.toString().padStart(4, '0')}
                        </Link>
                      )}
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {order.notes || "Sin observaciones detalladas."}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs font-medium text-gray-500">
                      <span className="flex items-center gap-1.5"><Wrench size={14} /> Mecánico: <strong className="text-gray-700 dark:text-gray-300">{order.mechanicAssigned}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
