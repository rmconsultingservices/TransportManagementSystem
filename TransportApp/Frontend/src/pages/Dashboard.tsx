import { useEffect, useState } from 'react';
import { Truck, AlertTriangle, CheckCircle2, Wrench, Container } from 'lucide-react';
import { fleetService } from '../services/fleetService';
import type { Vehicle, Trailer } from '../types';
import { Link } from 'react-router-dom';

type FleetUnit = (Vehicle & { unitType: 'vehicle' }) | (Trailer & { unitType: 'trailer' });

export default function Dashboard() {
  const [units, setUnits] = useState<FleetUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [vehiclesData, trailersData] = await Promise.all([
          fleetService.getVehicles(),
          fleetService.getTrailers()
        ]);
        
        const combined: FleetUnit[] = [
          ...vehiclesData.map(v => ({ ...v, unitType: 'vehicle' as const })),
          ...trailersData.map(t => ({ ...t, unitType: 'trailer' as const }))
        ];
        
        setUnits(combined);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getMaintenanceStatus = (u: FleetUnit) => {
    const kmSinceLast = u.currentMileage - (u.lastMaintenanceMileage || u.currentMileage);
    const interval = u.maintenanceInterval || (u.unitType === 'vehicle' ? 10000 : 15000);
    const remaining = interval - kmSinceLast;
    return remaining;
  };

  const overdueUnits = units.filter(u => getMaintenanceStatus(u) <= 0);
  const upcomingUnits = units.filter(u => {
    const rem = getMaintenanceStatus(u);
    return rem > 0 && rem <= 2000;
  });
  const okUnits = units.filter(u => getMaintenanceStatus(u) > 2000);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Panel de Control</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Resumen operativo y estado de la flota en tiempo real.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* Status Cards */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-lg shadow-red-500/20 text-white flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-red-100 font-medium mb-1">Mantenimiento Vencido</p>
              <h2 className="text-4xl font-bold">{loading ? '-' : overdueUnits.length}</h2>
            </div>
            <div className="bg-red-400/30 p-3 rounded-xl backdrop-blur-sm">
              <AlertTriangle size={24} className="text-white" />
            </div>
          </div>
          <div className="relative z-10 mt-6 pt-4 border-t border-red-400/30">
            <p className="text-sm text-red-100">Unidades que requieren atención crítica.</p>
          </div>
          {/* Decorative background element */}
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 shadow-lg shadow-amber-500/20 text-white flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-amber-100 font-medium mb-1">Mantenimiento Próximo</p>
              <h2 className="text-4xl font-bold">{loading ? '-' : upcomingUnits.length}</h2>
            </div>
            <div className="bg-amber-400/30 p-3 rounded-xl backdrop-blur-sm">
              <Wrench size={24} className="text-white" />
            </div>
          </div>
          <div className="relative z-10 mt-6 pt-4 border-t border-amber-400/30">
            <p className="text-sm text-amber-100">Atención requerida en menos de 2,000 km.</p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-lg shadow-emerald-500/20 text-white flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-emerald-100 font-medium mb-1">Flota Saludable</p>
              <h2 className="text-4xl font-bold">{loading ? '-' : okUnits.length}</h2>
            </div>
            <div className="bg-emerald-400/30 p-3 rounded-xl backdrop-blur-sm">
              <CheckCircle2 size={24} className="text-white" />
            </div>
          </div>
          <div className="relative z-10 mt-6 pt-4 border-t border-emerald-400/30">
            <p className="text-sm text-emerald-100">Unidades operando sin alertas pendientes.</p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} /> Unidades en Riesgo (Vencidas)
            </h3>
            <Link to="/fleet" className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Ver toda la flota</Link>
          </div>
          <div className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Cargando...</div>
            ) : overdueUnits.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <CheckCircle2 size={48} className="text-emerald-500 mb-4 opacity-50" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">¡Excelente! No hay unidades con mantenimiento vencido.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {overdueUnits.map(u => {
                   const excess = Math.abs(getMaintenanceStatus(u));
                   const isVehicle = u.unitType === 'vehicle';
                   return (
                    <li key={`${u.unitType}-${u.id}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 p-2 rounded-lg">
                          {isVehicle ? <Truck size={20} /> : <Container size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{u.licensePlate}</p>
                          <p className="text-xs text-gray-500">
                             {isVehicle ? `${(u as Vehicle).brand} ${(u as Vehicle).model}` : `Remolque ${(u as Trailer).type}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600 dark:text-red-400 text-sm">Vencido por {excess.toLocaleString()} km</p>
                        <Link to={`/fleet/${u.unitType}/${u.id}`} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Ver Expediente →</Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Wrench className="text-amber-500" size={20} /> Mantenimientos Próximos
            </h3>
          </div>
          <div className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Cargando...</div>
            ) : upcomingUnits.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <p>No hay mantenimientos próximos agendados.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {upcomingUnits.map(u => {
                   const rem = getMaintenanceStatus(u);
                   const isVehicle = u.unitType === 'vehicle';
                   return (
                    <li key={`${u.unitType}-${u.id}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 p-2 rounded-lg">
                          {isVehicle ? <Truck size={20} /> : <Container size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{u.licensePlate}</p>
                          <p className="text-xs text-gray-500">
                            {isVehicle ? `${(u as Vehicle).brand} ${(u as Vehicle).model}` : `Remolque ${(u as Trailer).type}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-600 dark:text-amber-400 text-sm">En {rem.toLocaleString()} km</p>
                        <Link to={`/fleet/${u.unitType}/${u.id}`} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Planificar →</Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
