import React, { useEffect, useState, useMemo } from 'react';
import { 
  Truck, AlertTriangle, CheckCircle2, Wrench, Container, 
  BarChart3, TrendingUp, DollarSign, Clock, Package, 
  PackageX, Download, Calendar, ShieldAlert, ArrowUpRight, 
  Activity, Users, FileSpreadsheet, RefreshCw, X, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fleetService } from '../services/fleetService';
import { 
  dashboardService, 
  type OperationalKpis, 
  type FinancialKpis, 
  type InventoryKpis, 
  type StaffKpis 
} from '../services/dashboardService';
import type { Vehicle, Trailer } from '../types';
import { useAuthStore } from '../store/authStore';

type FleetUnit = (Vehicle & { unitType: 'vehicle' }) | (Trailer & { unitType: 'trailer' });
type DatePreset = '30d' | '90d' | 'month' | 'year' | 'custom';

export default function Dashboard() {
  const { selectedCompany } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'gerencial' | 'mantenimiento'>('gerencial');

  // Fechas y Filtros
  const [preset, setPreset] = useState<DatePreset>('30d');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Estados de carga
  const [loadingExecutive, setLoadingExecutive] = useState(true);
  const [loadingFleet, setLoadingFleet] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Datos Ejecutivos
  const [opKpis, setOpKpis] = useState<OperationalKpis | null>(null);
  const [finKpis, setFinKpis] = useState<FinancialKpis | null>(null);
  const [invKpis, setInvKpis] = useState<InventoryKpis | null>(null);
  const [staffKpis, setStaffKpis] = useState<StaffKpis | null>(null);

  // Modal de Quiebres de Stock
  const [showStockoutModal, setShowStockoutModal] = useState(false);

  // Datos Pestaña Mantenimiento (Original)
  const [units, setUnits] = useState<FleetUnit[]>([]);

  // Función para aplicar preset de fechas
  const handlePresetChange = (p: DatePreset) => {
    setPreset(p);
    const now = new Date();
    const endStr = now.toISOString().split('T')[0];
    let start = new Date();

    if (p === '30d') {
      start.setDate(now.getDate() - 30);
    } else if (p === '90d') {
      start.setDate(now.getDate() - 90);
    } else if (p === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (p === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
    }

    if (p !== 'custom') {
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(endStr);
    }
  };

  // Carga de KPIs Gerenciales
  const fetchExecutiveData = async () => {
    try {
      setLoadingExecutive(true);
      const results = await Promise.allSettled([
        dashboardService.getOperationalKpis(startDate, endDate),
        dashboardService.getFinancialKpis(startDate, endDate),
        dashboardService.getInventoryKpis(startDate, endDate),
        dashboardService.getStaffKpis(startDate, endDate)
      ]);

      if (results[0].status === 'fulfilled') setOpKpis(results[0].value);
      if (results[1].status === 'fulfilled') setFinKpis(results[1].value);
      if (results[2].status === 'fulfilled') setInvKpis(results[2].value);
      if (results[3].status === 'fulfilled') setStaffKpis(results[3].value);

      const rejected = results.filter(r => r.status === 'rejected');
      if (rejected.length === 4) {
        toast.error('Error de conexión con el servidor backend');
      } else if (rejected.length > 0) {
        console.warn('Algunos indicadores no pudieron cargarse:', rejected);
      }
    } catch (error) {
      console.error('Error al cargar datos gerenciales:', error);
      toast.error('Error al cargar indicadores gerenciales');
    } finally {
      setLoadingExecutive(false);
    }
  };

  // Carga de Flota (Pestaña Mantenimiento)
  const fetchFleetData = async () => {
    try {
      setLoadingFleet(true);
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
      console.error('Error al cargar datos de flota:', error);
    } finally {
      setLoadingFleet(false);
    }
  };

  useEffect(() => {
    fetchExecutiveData();
  }, [startDate, endDate, selectedCompany]);

  useEffect(() => {
    fetchFleetData();
  }, [selectedCompany]);

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      toast.loading('Generando reporte en Excel...', { id: 'excel-export' });
      await dashboardService.downloadExcelReport(startDate, endDate);
      toast.success('Reporte descargado correctamente', { id: 'excel-export' });
    } catch (error) {
      console.error('Error exportando excel:', error);
      toast.error('Error al exportar reporte a Excel', { id: 'excel-export' });
    } finally {
      setExportingExcel(false);
    }
  };

  // Cálculos para la pestaña de mantenimiento
  const getMaintenanceStatus = (u: FleetUnit) => {
    const kmSinceLast = u.currentMileage - (u.lastMaintenanceMileage || u.currentMileage);
    const interval = u.maintenanceInterval || (u.unitType === 'vehicle' ? 10000 : 15000);
    return interval - kmSinceLast;
  };

  const overdueUnits = useMemo(() => units.filter(u => getMaintenanceStatus(u) <= 0), [units]);
  const upcomingUnits = useMemo(() => units.filter(u => {
    const rem = getMaintenanceStatus(u);
    return rem > 0 && rem <= 2000;
  }), [units]);
  const okUnits = useMemo(() => units.filter(u => getMaintenanceStatus(u) > 2000), [units]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Activity className="text-indigo-600 dark:text-indigo-400" size={32} />
            Panel de Control
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            Supervisión integral de flota, costos operativos, inventario y productividad.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner">
          <button
            onClick={() => setActiveTab('gerencial')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'gerencial'
                ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-md scale-[1.02]'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 size={18} />
            Dashboard Gerencial
          </button>
          <button
            onClick={() => setActiveTab('mantenimiento')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'mantenimiento'
                ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-md scale-[1.02]'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Wrench size={18} />
            Estado de Mantenimiento
            {overdueUnits.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {overdueUnits.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: DASHBOARD GERENCIAL INTEGRAL                                  */}
      {/* ========================================================================= */}
      {activeTab === 'gerencial' && (
        <div className="space-y-8">
          
          {/* Controls Bar: Date Range + Excel Export */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mr-1">Período:</span>
              {(
                [
                  { id: '30d', label: 'Últimos 30d' },
                  { id: '90d', label: 'Últimos 90d' },
                  { id: 'month', label: 'Este Mes' },
                  { id: 'year', label: 'Año Actual' },
                  { id: 'custom', label: 'Personalizado' },
                ] as const
              ).map(item => (
                <button
                  key={item.id}
                  onClick={() => handlePresetChange(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    preset === item.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Custom Range Pickers & Excel Export */}
            <div className="flex flex-wrap items-center gap-3">
              {preset === 'custom' && (
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <span className="text-gray-400">hasta</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <button
                onClick={fetchExecutiveData}
                disabled={loadingExecutive}
                title="Recargar datos"
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
              >
                <RefreshCw size={16} className={loadingExecutive ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={handleExportExcel}
                disabled={exportingExcel}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                <FileSpreadsheet size={16} />
                {exportingExcel ? 'Exportando...' : 'Exportar a Excel'}
              </button>
            </div>
          </div>

          {loadingExecutive && (
            <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <RefreshCw size={36} className="text-indigo-600 animate-spin mb-3" />
              <p className="text-gray-500 font-medium text-sm">Calculando indicadores gerenciales...</p>
            </div>
          )}

          {!loadingExecutive && opKpis && finKpis && invKpis && staffKpis && (
            <>
              {/* ========================================================= */}
              {/* PILAR 1: INDICADORES OPERATIVOS (FLOTA Y SERVICIOS)      */}
              {/* ========================================================= */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-1.5 bg-blue-600 rounded-full"></span>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    1. Indicadores Operativos (Flota y Servicios)
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Disponibilidad de Flota Global */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Disponibilidad Flota</span>
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Truck size={20} />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        {opKpis.fleetAvailabilityPercent}%
                      </span>
                      <span className="text-xs text-gray-500">operativa</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden my-3">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          opKpis.fleetAvailabilityPercent >= 85 ? 'bg-emerald-500' : opKpis.fleetAvailabilityPercent >= 70 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, opKpis.fleetAvailabilityPercent)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span>Chutos: <strong className="text-gray-800 dark:text-gray-200">{opKpis.vehiclesAvailabilityPercent}%</strong></span>
                      <span>Remolques: <strong className="text-gray-800 dark:text-gray-200">{opKpis.trailersAvailabilityPercent}%</strong></span>
                      <span className="text-red-500 font-semibold">{opKpis.inWorkshopTotal} en taller</span>
                    </div>
                  </div>

                  {/* MTTR (Tiempo Medio de Reparación) */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">MTTR (Tiempo Reparación)</span>
                      <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                        <Clock size={20} />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        {opKpis.mttrDays}
                      </span>
                      <span className="text-sm font-medium text-gray-500">días ({opKpis.mttrHours}h)</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Promedio desde apertura de solicitud hasta entrega por mecánico.
                    </p>
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 flex justify-between">
                      <span>Órdenes completadas:</span>
                      <strong className="text-indigo-600 dark:text-indigo-400">{opKpis.completedOrdersCount}</strong>
                    </div>
                  </div>

                  {/* Preventivo vs Correctivo Ratio */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between col-span-1 lg:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Preventivo vs. Correctivo
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        opKpis.preventivePercent >= 70 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {opKpis.preventivePercent >= 70 ? '✓ Meta Óptima (>70%)' : '⚠ Alto Correctivo'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 my-2">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold block">Preventivos</span>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{opKpis.preventivePercent}%</span>
                          <span className="text-xs text-emerald-600">({opKpis.preventiveCount} servicios)</span>
                        </div>
                      </div>

                      <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
                        <span className="text-xs text-rose-700 dark:text-rose-400 font-semibold block">Correctivos</span>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-2xl font-bold text-rose-800 dark:text-rose-300">{opKpis.correctivePercent}%</span>
                          <span className="text-xs text-rose-600">({opKpis.correctiveCount} fallas)</span>
                        </div>
                      </div>
                    </div>

                    {/* Dual Segment Progress */}
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-500" 
                        style={{ width: `${opKpis.preventivePercent}%` }}
                        title={`Preventivo: ${opKpis.preventivePercent}%`}
                      ></div>
                      <div 
                        className="bg-rose-500 h-full transition-all duration-500" 
                        style={{ width: `${opKpis.correctivePercent}%` }}
                        title={`Correctivo: ${opKpis.correctivePercent}%`}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Frecuencia de Fallas por Unidad */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="text-amber-500" size={18} />
                        Frecuencia de Fallas por Unidad (Reincidencias en Taller)
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Activos que han entrado repetidamente al taller en el período seleccionado.
                      </p>
                    </div>
                  </div>

                  {opKpis.failureFrequency.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      No se registraron fallas para este período.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {opKpis.failureFrequency.map((u, idx) => (
                        <div 
                          key={`${u.unitType}-${u.id}`}
                          className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 bg-gray-50/50 dark:bg-gray-700/20 transition flex flex-col justify-between"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300">
                                #{idx + 1}
                              </span>
                              <div>
                                <span className="font-bold text-gray-900 dark:text-white text-sm">{u.licensePlate}</span>
                                <span className="text-xs text-gray-400 block">{u.brandOrType} {u.model}</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              {u.totalFailures} {u.totalFailures === 1 ? 'servicio' : 'servicios'}
                            </span>
                          </div>

                          <div className="mt-3 pt-2 border-t border-gray-200/50 dark:border-gray-700 flex justify-between text-xs text-gray-500">
                            <span className="text-rose-600 font-medium">{u.correctiveCount} Correctivos</span>
                            <span className="text-emerald-600 font-medium">{u.preventiveCount} Preventivos</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ========================================================= */}
              {/* PILAR 2: CONTROL FINANCIERO Y DE COSTOS                  */}
              {/* ========================================================= */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-1.5 bg-emerald-600 rounded-full"></span>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    2. Control Financiero y de Costos
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Gasto Total Mantenimiento</span>
                    <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      $ {finKpis.totalMaintenanceCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <p className="text-xs text-gray-400 mt-2">Costo acumulado de repuestos asignados en órdenes cerradas.</p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Costo Promedio por Unidad</span>
                    <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                      $ {finKpis.averageCostPerServicedUnit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <p className="text-xs text-gray-400 mt-2">Promedio sobre {finKpis.servicedUnitsCount} unidades atendidas.</p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Unidades Atendidas</span>
                    <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                      {finKpis.servicedUnitsCount}
                    </span>
                    <p className="text-xs text-gray-400 mt-2">Chutos o remolques con reparaciones completadas en el rango.</p>
                  </div>

                  {/* Valor Total de Inventario Inmovilizado (> 90 días) */}
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-2xl shadow-lg shadow-amber-500/20 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-amber-100 uppercase tracking-wider">Inventario Inmovilizado</span>
                        <PackageX size={20} className="text-amber-200" />
                      </div>
                      <span className="text-2xl font-bold">
                        $ {finKpis.immobilizedInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="mt-3 pt-2 border-t border-amber-400/40 text-xs text-amber-100 flex justify-between items-center">
                      <span>Sin rotación &gt; 90 días</span>
                      <span className="font-bold bg-white/20 px-2 py-0.5 rounded-full">{finKpis.immobilizedItemsCount} repuestos</span>
                    </div>
                  </div>
                </div>

                {/* Top 5 Vehículos con Mayor Gasto */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <DollarSign className="text-emerald-500" size={18} />
                    Top 5 Vehículos con Mayor Gasto de Mantenimiento
                  </h3>

                  {finKpis.topSpendingVehicles.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      No hay gastos registrados en el período seleccionado.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {finKpis.topSpendingVehicles.map((v, idx) => {
                        const maxSpend = finKpis.topSpendingVehicles[0]?.totalCost || 1;
                        const pct = Math.round((v.totalCost / maxSpend) * 100);
                        return (
                          <div key={v.id} className="space-y-1.5">
                            <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-200">
                                <span className="text-xs text-gray-400 font-mono">#{idx + 1}</span>
                                <span>{v.licensePlate}</span>
                                <span className="text-xs font-normal text-gray-400">({v.unitType} - {v.brandModel})</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-xs text-gray-400">{v.servicesCount} servicios / {v.partsCount} repuestos</span>
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                                  $ {v.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ========================================================= */}
              {/* PILAR 3: GESTIÓN DE INVENTARIO (REPUESTOS)               */}
              {/* ========================================================= */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-1.5 bg-rose-600 rounded-full"></span>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    3. Gestión de Inventario (Repuestos)
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Tarjeta de Alerta de Quiebre de Stock */}
                  <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white p-6 rounded-2xl shadow-lg shadow-rose-500/20 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-100">Alertas de Quiebre</span>
                        <div className="p-2 bg-white/20 rounded-xl">
                          <ShieldAlert size={22} className="text-white" />
                        </div>
                      </div>
                      <span className="text-4xl font-extrabold">{invKpis.stockoutAlertsCount}</span>
                      <p className="text-xs text-rose-100 mt-2">
                        Repuestos que han alcanzado o perforado su nivel mínimo de seguridad o están agotados.
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-rose-400/40 flex justify-between items-center">
                      <span className="text-xs text-rose-100">
                        Valoración Total: <strong>${invKpis.totalInventoryValuation.toLocaleString('en-US')}</strong>
                      </span>
                      <button
                        onClick={() => setShowStockoutModal(true)}
                        className="bg-white text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                      >
                        Ver Repuestos Críticos →
                      </button>
                    </div>
                  </div>

                  {/* Rotación de Repuestos de Mayor Uso */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 col-span-1 lg:col-span-2">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                      <Package className="text-indigo-600 dark:text-indigo-400" size={18} />
                      Índice de Rotación: Repuestos Más Consumidos en Período
                    </h3>

                    {invKpis.topTurnoverParts.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">
                        No se ha registrado consumo de repuestos en este período.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-semibold uppercase">
                            <tr>
                              <th className="p-2 rounded-l-lg">Código</th>
                              <th className="p-2">Repuesto</th>
                              <th className="p-2">Categoría</th>
                              <th className="p-2 text-right">Cant. Consumida</th>
                              <th className="p-2 text-right rounded-r-lg">Gasto Total ($)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {invKpis.topTurnoverParts.map(item => (
                              <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                                <td className="p-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.code}</td>
                                <td className="p-2 font-medium text-gray-900 dark:text-white">{item.name}</td>
                                <td className="p-2 text-gray-500">{item.category}</td>
                                <td className="p-2 text-right font-bold text-gray-800 dark:text-gray-200">
                                  {item.totalQuantityConsumed} {item.unitOfMeasure}
                                </td>
                                <td className="p-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  $ {item.totalCostConsumed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* PILAR 4: RENDIMIENTO DE PERSONAL                         */}
              {/* ========================================================= */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-1.5 bg-purple-600 rounded-full"></span>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    4. Rendimiento de Personal
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Productividad por Mecánico */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                      <Users className="text-purple-600 dark:text-purple-400" size={18} />
                      Productividad por Mecánico (Órdenes Completadas)
                    </h3>

                    {staffKpis.mechanicProductivity.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">
                        No hay servicios completados por mecánicos en este período.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {staffKpis.mechanicProductivity.map(m => (
                          <div 
                            key={m.mechanicId} 
                            className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-bold flex items-center justify-center text-sm">
                                {m.mechanicName.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 dark:text-white text-sm block">{m.mechanicName}</span>
                                <span className="text-xs text-gray-400">{m.speciality || 'Mecánico General'}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-base">
                                {m.completedOrders} {m.completedOrders === 1 ? 'orden' : 'órdenes'}
                              </span>
                              <span className="text-xs text-gray-400 block">
                                MTTR: {m.averageRepairTimeHours}h | {m.totalPartsInstalledCount} repuestos
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Incidencias por Chofer Solicitante */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                      <Truck className="text-indigo-600 dark:text-indigo-400" size={18} />
                      Incidencias por Chofer Solicitante
                    </h3>

                    {staffKpis.driverIncidents.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">
                        No hay incidencias reportadas por choferes en este período.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {staffKpis.driverIncidents.map(d => (
                          <div 
                            key={d.driverId}
                            className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white text-sm block">{d.driverName}</span>
                              <span className="text-xs text-gray-400">Licencia: {d.licenseNumber || 'N/A'}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-gray-800 dark:text-gray-200 text-base">
                                {d.totalIncidents} {d.totalIncidents === 1 ? 'reporte' : 'reportes'}
                              </span>
                              <div className="flex gap-2 text-xs justify-end mt-0.5">
                                <span className="text-rose-600 font-semibold">{d.correctiveCount} corr.</span>
                                <span className="text-emerald-600 font-semibold">{d.preventiveCount} prev.</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* MODAL DE QUIEBRE DE STOCK                                */}
          {/* ========================================================= */}
          {showStockoutModal && invKpis && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-rose-50 dark:bg-rose-900/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500 text-white rounded-xl">
                      <ShieldAlert size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">
                        Repuestos en Quiebre o Stock Crítico
                      </h3>
                      <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                        {invKpis.stockoutAlerts.length} repuestos requieren reposición urgente.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowStockoutModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-2 flex-1">
                  {invKpis.stockoutAlerts.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">¡Excelente! No hay repuestos bajo stock mínimo.</p>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase font-semibold">
                        <tr>
                          <th className="p-2.5 rounded-l-lg">Código</th>
                          <th className="p-2.5">Repuesto</th>
                          <th className="p-2.5">Categoría</th>
                          <th className="p-2.5 text-center">Stock Actual</th>
                          <th className="p-2.5 text-center">Stock Mínimo</th>
                          <th className="p-2.5 text-right">Costo Unit.</th>
                          <th className="p-2.5 text-center rounded-r-lg">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {invKpis.stockoutAlerts.map(a => (
                          <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{a.code}</td>
                            <td className="p-2.5 font-medium text-gray-900 dark:text-white">{a.name}</td>
                            <td className="p-2.5 text-gray-500">{a.category}</td>
                            <td className="p-2.5 text-center font-bold text-rose-600">
                              {a.stockQuantity} {a.unitOfMeasure}
                            </td>
                            <td className="p-2.5 text-center text-gray-500">
                              {a.minimumStock} {a.unitOfMeasure}
                            </td>
                            <td className="p-2.5 text-right font-mono">$ {a.unitCost.toFixed(2)}</td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                a.status === 'AGOTADO' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
                  <button
                    onClick={() => setShowStockoutModal(false)}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: ESTADO DE MANTENIMIENTO (VISTA ORIGINAL MANTENIDA AL 100%)    */}
      {/* ========================================================================= */}
      {activeTab === 'mantenimiento' && (
        <div className="space-y-8 animate-in fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {/* Status Cards */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-lg shadow-red-500/20 text-white flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <p className="text-red-100 font-medium mb-1">Mantenimiento Vencido</p>
                  <h2 className="text-4xl font-bold">{loadingFleet ? '-' : overdueUnits.length}</h2>
                </div>
                <div className="bg-red-400/30 p-3 rounded-xl backdrop-blur-sm">
                  <AlertTriangle size={24} className="text-white" />
                </div>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-red-400/30">
                <p className="text-sm text-red-100">Unidades que requieren atención crítica.</p>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 shadow-lg shadow-amber-500/20 text-white flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <p className="text-amber-100 font-medium mb-1">Mantenimiento Próximo</p>
                  <h2 className="text-4xl font-bold">{loadingFleet ? '-' : upcomingUnits.length}</h2>
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
                  <h2 className="text-4xl font-bold">{loadingFleet ? '-' : okUnits.length}</h2>
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
                {loadingFleet ? (
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
                      );
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
                {loadingFleet ? (
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
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
