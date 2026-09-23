import React from 'react';
import { 
  X, Truck, Container, DollarSign, Wrench, Calendar, 
  User, CheckCircle2, Clock, AlertTriangle, Package, FileText, 
  Building2, Gauge, ArrowRight, Loader2
} from 'lucide-react';
import type { UnitMaintenanceDetail } from '../../services/dashboardService';

interface VehicleMaintenanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: UnitMaintenanceDetail | null;
  loading: boolean;
  startDate: string;
  endDate: string;
}

export default function VehicleMaintenanceDetailModal({
  isOpen,
  onClose,
  detail,
  loading,
  startDate,
  endDate
}: VehicleMaintenanceDetailModalProps) {
  if (!isOpen) return null;

  const isVehicle = Boolean(detail?.unitType ? (detail.unitType.toLowerCase().includes('chuto') || detail.unitType.toLowerCase().includes('vehicle')) : true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Cabecera de la Unidad */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md">
              {isVehicle ? <Truck size={26} /> : <Container size={26} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {detail?.licensePlate || 'Cargando...'}
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {detail?.unitType || (isVehicle ? 'Chuto' : 'Remolque')}
                </span>
                {detail?.fleetOwnerName && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                    <Building2 size={12} />
                    {detail.fleetOwnerName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {detail?.brand} {detail?.model} • Historial y repuestos del período ({startDate} al {endDate})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {detail?.currentMileage != null && detail.currentMileage > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                <Gauge size={14} className="text-indigo-500" />
                {detail.currentMileage.toLocaleString()} km
              </div>
            )}

            <button
              onClick={onClose}
              aria-label="Cerrar modal"
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Resumen de Métricas de la Unidad */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gasto Total Repuestos</span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              ${detail ? detail.totalCostInPeriod.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Entradas</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {detail?.totalServicesCount ?? 0}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Fallas Correctivas</span>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {detail?.correctiveServicesCount ?? 0}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Servicios Preventivos</span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {detail?.preventiveServicesCount ?? 0}
            </p>
          </div>
        </div>

        {/* Listado de Servicios / Tickets */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Wrench className="animate-spin mb-3 text-indigo-600" size={32} />
              <p className="text-sm font-semibold">Cargando expediente de la unidad...</p>
            </div>
          ) : !detail || detail.services.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={48} />
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">Sin entradas de taller en el período</p>
              <p className="text-xs mt-1">Esta unidad no reportó fallas ni consumió repuestos en el rango de fechas seleccionado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Órdenes de Servicio y Repuestos Instalados ({detail.services.length})
              </h3>

              {detail.services.map((svc) => {
                const isCorrective = Boolean((svc.repairType || '').toLowerCase().includes('corr'));
                const isCompleted = Boolean((svc.status || '').toLowerCase().includes('complet'));

                return (
                  <div 
                    key={svc.serviceRequestId}
                    className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-800/70 shadow-sm transition-all"
                  >
                    {/* Encabezado del Servicio */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-black text-sm px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white">
                          Ticket #{svc.serviceRequestId.toString().padStart(4, '0')}
                        </span>

                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isCorrective 
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' 
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {svc.repairType}
                        </span>

                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        }`}>
                          {svc.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{new Date(svc.dateRequested).toLocaleDateString('es-ES')}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Costo Ticket</span>
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                            ${svc.totalServiceCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Datos descriptivos del Ticket */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-400 uppercase text-[10px]">Fallo Reportado / Diagnóstico</span>
                        <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">
                          {svc.reportedFailureDescription || 'Sin descripción de falla'}
                        </p>
                        {svc.observations && (
                          <p className="text-slate-500 italic mt-1 text-[11px]">
                            Observaciones: {svc.observations}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Wrench size={13} className="text-slate-400" />
                          <span>Mecánico: <strong className="text-slate-800 dark:text-white">{svc.mechanicName}</strong></span>
                        </div>
                        {svc.driverName && (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <User size={13} className="text-slate-400" />
                            <span>Chofer: <strong>{svc.driverName}</strong></span>
                          </div>
                        )}
                        {svc.mileageAtService != null && (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <Gauge size={13} className="text-slate-400" />
                            <span>Odómetro: <strong>{svc.mileageAtService.toLocaleString()} km</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Repuestos Utilizados en este Ticket */}
                    {svc.installedParts.length > 0 ? (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                          <Package size={14} className="text-indigo-500" />
                          <span>Repuestos Instalados ({svc.installedParts.length})</span>
                        </div>

                        <div className="overflow-x-auto bg-slate-50/70 dark:bg-slate-900/40 rounded-xl p-2 border border-slate-100 dark:border-slate-700/40">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="text-slate-400 uppercase font-bold text-[10px] pb-1">
                                <th className="pb-1 pl-2">Código</th>
                                <th className="pb-1">Descripción del Repuesto</th>
                                <th className="pb-1 text-right">Cantidad</th>
                                <th className="pb-1 text-right">Costo Unit.</th>
                                <th className="pb-1 text-right pr-2">Total ($)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800">
                              {svc.installedParts.map((part, pIdx) => (
                                <tr key={pIdx} className="hover:bg-white/60 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="py-1.5 pl-2 font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {part.code}
                                  </td>
                                  <td className="py-1.5 font-medium text-slate-900 dark:text-white">
                                    {part.name}
                                  </td>
                                  <td className="py-1.5 text-right font-mono text-slate-700 dark:text-slate-300">
                                    {part.quantity} {part.unitOfMeasure}
                                  </td>
                                  <td className="py-1.5 text-right font-mono text-slate-600 dark:text-slate-400">
                                    ${(part.unitCost ?? 0).toFixed(2)}
                                  </td>
                                  <td className="py-1.5 pr-2 text-right font-mono font-black text-slate-900 dark:text-white">
                                    ${(part.totalCost ?? 0).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-slate-400 text-[11px] italic">
                        No se registraron repuestos con costo cargados en esta orden.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-colors"
          >
            Cerrar Historial
          </button>
        </div>

      </div>
    </div>
  );
}
