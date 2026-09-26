import React, { useEffect, useState, useMemo } from 'react';
import { 
  Truck, AlertTriangle, CheckCircle2, Wrench, Container, 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Clock, Package, 
  PackageX, Download, Calendar, ShieldAlert, ArrowUpRight, 
  Activity, Users, FileSpreadsheet, RefreshCw, X, AlertCircle,
  ArrowUp, ArrowDown, Minus, Filter, Warehouse as WarehouseIcon, Building2,
  Layers, ArrowUpDown, ExternalLink, Search, Printer
} from 'lucide-react';
import SupplierPurchasesModal from '../components/dashboard/SupplierPurchasesModal';
import VehicleMaintenanceDetailModal from '../components/dashboard/VehicleMaintenanceDetailModal';
import ExpensesSheetModal from '../components/ExpensesSheetModal';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fleetService } from '../services/fleetService';
import { 
  dashboardService, 
  type OperationalKpis, 
  type FinancialKpis, 
  type InventoryKpis, 
  type StaffKpis,
  type SupplierPurchasesResponse,
  type UnitMaintenanceDetail
} from '../services/dashboardService';
import {
  GaugeChart,
  Sparkline,
  DonutChart,
  HorizontalBarChart,
  LineTrendChart,
  StackedColumnChart
} from '../components/dashboard/DashboardCharts';
import type { Vehicle, Trailer } from '../types';
import { useAuthStore } from '../store/authStore';

type FleetUnit = (Vehicle & { unitType: 'vehicle' }) | (Trailer & { unitType: 'trailer' });
type DatePreset = 'month' | 'prev_month' | 'year' | '30d' | 'custom';
type AssetTypeFilter = 'all' | 'vehicle' | 'trailer';

export default function Dashboard() {
  const { selectedCompany } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'gerencial' | 'mantenimiento'>('gerencial');

  // ==========================================
  // Filtros Globales
  // ==========================================
  const [preset, setPreset] = useState<DatePreset>('month');
  const [assetType, setAssetType] = useState<AssetTypeFilter>('all');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>(undefined);
  const [selectedFleetOwnerId, setSelectedFleetOwnerId] = useState<number | undefined>(undefined);

  // Fechas: Por defecto "Este Mes"
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
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

  // Pestaña activa en sección de personal (Mecánicos vs Choferes)
  const [staffView, setStaffView] = useState<'mechanics' | 'drivers'>('mechanics');

  // Datos Pestaña Mantenimiento (Flota)
  const [units, setUnits] = useState<FleetUnit[]>([]);

  // Estados para Modales de Drill-Down
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierData, setSupplierData] = useState<SupplierPurchasesResponse | null>(null);
  const [loadingSupplierPurchases, setLoadingSupplierPurchases] = useState(false);

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [vehicleDetailData, setVehicleDetailData] = useState<UnitMaintenanceDetail | null>(null);
  const [loadingVehicleDetail, setLoadingVehicleDetail] = useState(false);

  // Estados de Ordenamiento y Visualización de Flota Completa
  const [sortField, setSortField] = useState<'cost' | 'failures' | 'corrective' | 'roadside' | 'preventive' | 'plate'>('cost');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');

  const handleOpenSupplierPurchases = async () => {
    try {
      setIsSupplierModalOpen(true);
      setLoadingSupplierPurchases(true);
      const res = await dashboardService.getSupplierPurchases(startDate, endDate);
      setSupplierData(res);
    } catch (error) {
      console.error('Error cargando compras por proveedor:', error);
      toast.error('Error al cargar datos de compras');
    } finally {
      setLoadingSupplierPurchases(false);
    }
  };

  const handleOpenVehicleDetail = async (unit: { id: number; unitType: string }) => {
    try {
      setIsVehicleModalOpen(true);
      setLoadingVehicleDetail(true);
      const res = await dashboardService.getUnitMaintenanceDetail(unit.id, unit.unitType, startDate, endDate);
      setVehicleDetailData(res);
    } catch (error) {
      console.error('Error cargando historial de la unidad:', error);
      toast.error('Error al cargar detalle de la unidad');
    } finally {
      setLoadingVehicleDetail(false);
    }
  };

  const handleSort = (field: 'cost' | 'failures' | 'corrective' | 'roadside' | 'preventive' | 'plate') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedFailureUnits = useMemo(() => {
    if (!opKpis?.failureFrequency) return [];
    let list = [...opKpis.failureFrequency];

    if (unitSearch.trim()) {
      const q = unitSearch.toLowerCase();
      list = list.filter(u => 
        u.licensePlate.toLowerCase().includes(q) || 
        u.brandOrType.toLowerCase().includes(q) ||
        u.model.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === 'cost') {
        valA = a.totalCostAccumulated ?? 0;
        valB = b.totalCostAccumulated ?? 0;
      } else if (sortField === 'failures') {
        valA = a.totalFailures;
        valB = b.totalFailures;
      } else if (sortField === 'corrective') {
        valA = a.correctiveCount;
        valB = b.correctiveCount;
      } else if (sortField === 'roadside') {
        valA = a.roadsideCount ?? 0;
        valB = b.roadsideCount ?? 0;
      } else if (sortField === 'preventive') {
        valA = a.preventiveCount;
        valB = b.preventiveCount;
      } else {
        valA = a.licensePlate.toLowerCase();
        valB = b.licensePlate.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return showAllUnits ? list : list.slice(0, 10);
  }, [opKpis?.failureFrequency, unitSearch, sortField, sortDirection, showAllUnits]);

  // Manejador de cambio de Preset de fecha
  const handlePresetChange = (p: DatePreset) => {
    setPreset(p);
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (p === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
    } else if (p === 'prev_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (p === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = now;
    } else if (p === '30d') {
      start.setDate(now.getDate() - 30);
      end = now;
    }

    if (p !== 'custom') {
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  // Carga de KPIs Gerenciales
  const fetchExecutiveData = async () => {
    try {
      setLoadingExecutive(true);
      const results = await Promise.allSettled([
        dashboardService.getOperationalKpis(startDate, endDate, assetType, selectedFleetOwnerId),
        dashboardService.getFinancialKpis(startDate, endDate, assetType, selectedFleetOwnerId),
        dashboardService.getInventoryKpis(startDate, endDate, selectedWarehouseId),
        dashboardService.getStaffKpis(startDate, endDate, selectedFleetOwnerId)
      ]);

      if (results[0].status === 'fulfilled') setOpKpis(results[0].value);
      if (results[1].status === 'fulfilled') setFinKpis(results[1].value);
      if (results[2].status === 'fulfilled') setInvKpis(results[2].value);
      if (results[3].status === 'fulfilled') setStaffKpis(results[3].value);

      const rejected = results.filter(r => r.status === 'rejected');
      if (rejected.length === 4) {
        toast.error('Error de conexión con el servidor backend');
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
  }, [startDate, endDate, assetType, selectedWarehouseId, selectedFleetOwnerId, selectedCompany]);

  useEffect(() => {
    fetchFleetData();
  }, [selectedCompany]);

  // Exportar Excel
  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      toast.loading('Generando reporte en Excel...', { id: 'excel-export' });
      await dashboardService.downloadExcelReport(startDate, endDate, assetType, selectedWarehouseId, selectedFleetOwnerId);
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

  // Formateador de tiempo MTTR
  const formatMttrTime = (hours: number, days: number) => {
    if (days >= 1) {
      const remainingHours = Math.round(hours % 24);
      return `${Math.floor(days)}d ${remainingHours}h`;
    }
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 print:p-0 print:m-0 print:max-w-none print:w-full">
      
      {/* ========================================================================= */}
      {/* CABECERA EXCLUSIVA PARA IMPRESIÓN (REPORT HEADER)                         */}
      {/* ========================================================================= */}
      <div className="hidden print:flex items-center justify-between pb-4 mb-5 border-b-2 border-slate-900 bg-white">
        <div className="flex items-center gap-4">
          {selectedCompany?.logoUrl ? (
            <img src={selectedCompany.logoUrl} alt="Logo" className="w-14 h-14 object-contain" />
          ) : (
            <div className="p-2.5 bg-blue-600 text-white rounded-xl">
              <Activity size={24} />
            </div>
          )}
          <div>
            <p className="text-[10px] font-black text-blue-700 tracking-widest uppercase">
              INFORME GERENCIAL Y OPERATIVO DE FLOTA
            </p>
            <h1 className="text-xl font-black text-slate-900 leading-tight">
              {selectedCompany?.name || 'EMPRESA DE TRANSPORTE'}
            </h1>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">
              Período analizado: <strong className="text-slate-900 font-mono">{startDate}</strong> al <strong className="text-slate-900 font-mono">{endDate}</strong> &bull; Filtro: <strong className="text-slate-900">{assetType === 'all' ? 'Toda la Flota (Chutos y Remolques)' : assetType === 'vehicle' ? 'Solo Chutos' : 'Solo Remolques'}</strong>
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-[10px] font-mono font-bold tracking-wide uppercase">
            {activeTab === 'gerencial' ? 'DASHBOARD GERENCIAL' : 'CONTROL DE MANTENIMIENTO'}
          </span>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            Fecha Emisión: {new Date().toLocaleDateString('es-ES')} {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TOP HEADER & TAB SWITCHER (PANTALLA)                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Activity className="text-blue-600 dark:text-blue-400" size={32} />
            Panel de Control Ejecutivo
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Supervisión integral de flota, costos operativos, disponibilidad de taller y stock.
          </p>
        </div>

        {/* Tabs Principales */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
          <button
            onClick={() => setActiveTab('gerencial')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === 'gerencial'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 size={18} />
            Dashboard Gerencial
          </button>
          <button
            onClick={() => setActiveTab('mantenimiento')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === 'mantenimiento'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wrench size={18} />
            Estado de Mantenimiento
            {overdueUnits.length > 0 && (
              <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-extrabold ml-1">
                {overdueUnits.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: DASHBOARD GERENCIAL (ESTRUCTURA DE ARRIBA HACIA ABAJO)         */}
      {/* ========================================================================= */}
      {activeTab === 'gerencial' && (
        <div className="space-y-6">
          
          {/* ===================================================================== */}
          {/* 0. FRANJA SUPERIOR: BARRA DE FILTROS GLOBALES Y ACCIÓN EXCEL          */}
          {/* ===================================================================== */}
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col xl:flex-row xl:items-center justify-between gap-4 print:hidden">
            
            {/* Filtros Izquierda / Centro */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Presets de Período */}
              <div className="flex items-center bg-slate-50 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {(
                  [
                    { id: 'month', label: 'Este Mes' },
                    { id: 'prev_month', label: 'Mes Anterior' },
                    { id: 'year', label: 'Año en Curso' },
                    { id: '30d', label: 'Últimos 30d' },
                    { id: 'custom', label: 'Personalizado' },
                  ] as const
                ).map(item => (
                  <button
                    key={item.id}
                    onClick={() => handlePresetChange(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      preset === item.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Filtro por Tipo de Unidad (Chutos / Remolques / Todos) */}
              <div className="flex items-center bg-slate-50 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setAssetType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    assetType === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setAssetType('vehicle')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    assetType === 'vehicle'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                  }`}
                >
                  <Truck size={13} />
                  Solo Chutos
                </button>
                <button
                  onClick={() => setAssetType('trailer')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    assetType === 'trailer'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                  }`}
                >
                  <Container size={13} />
                  Solo Remolques
                </button>
              </div>

              {/* Filtro de Almacén/Taller */}
              {invKpis?.warehouses && invKpis.warehouses.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <WarehouseIcon size={14} className="text-slate-400" />
                  <select
                    value={selectedWarehouseId || ''}
                    onChange={(e) => setSelectedWarehouseId(e.target.value ? Number(e.target.value) : undefined)}
                    aria-label="Filtrar por taller o almacén"
                    className="bg-transparent text-xs font-semibold text-slate-800 dark:text-white focus:outline-none cursor-pointer py-1 dark:bg-slate-900 [color-scheme:light] dark:[color-scheme:dark]"
                  >
                    <option value="" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">
                      Todos los Talleres / Almacenes
                    </option>
                    {invKpis.warehouses.map(w => (
                      <option key={w.id} value={w.id} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filtro de Empresa Propietaria */}
              {opKpis?.fleetOwners && opKpis.fleetOwners.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Building2 size={14} className="text-slate-400" />
                  <select
                    value={selectedFleetOwnerId || ''}
                    onChange={(e) => setSelectedFleetOwnerId(e.target.value ? Number(e.target.value) : undefined)}
                    aria-label="Filtrar por empresa propietaria"
                    className="bg-transparent text-xs font-semibold text-slate-800 dark:text-white focus:outline-none cursor-pointer py-1 dark:bg-slate-900 [color-scheme:light] dark:[color-scheme:dark]"
                  >
                    <option value="" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">
                      Todas las Empresas Propietarias
                    </option>
                    {opKpis.fleetOwners
                      .filter((fo, idx, arr) => arr.findIndex(x => x.name.trim().toLowerCase() === fo.name.trim().toLowerCase()) === idx)
                      .map(fo => (
                        <option key={fo.id} value={fo.id} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">
                          {fo.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Pickers de Fechas (si es Personalizado) */}
              {preset === 'custom' && (
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Calendar size={14} className="text-slate-400 ml-1" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="bg-transparent text-xs text-slate-800 dark:text-white focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
                  />
                  <span className="text-slate-400 text-xs">a</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="bg-transparent text-xs text-slate-800 dark:text-white focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              )}
            </div>

            {/* Botones de Acción: Registro de Gastos y Exportar Dashboard */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExpensesModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
                title="Abrir el Registro Oficial y Control de Gastos y Compras (18 columnas para Auditoría)"
              >
                <FileSpreadsheet size={15} />
                <span>Ver Registro de Gastos</span>
              </button>

              <button
                onClick={handleExportExcel}
                disabled={exportingExcel || loadingExecutive}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
              >
                {exportingExcel ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <FileSpreadsheet size={15} />
                )}
                <span>Exportar Dashboard (.xlsx)</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                title="Imprimir el Dashboard o Guardar como PDF tal cual como se ve en pantalla"
              >
                <Printer size={15} />
                <span>Imprimir Reporte</span>
              </button>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* NIVEL 1: CABECERA EJECUTIVA (KPI CARDS CON GAUGE Y SPARKLINE)         */}
          {/* ===================================================================== */}
          <div className="dashboard-grid-3 grid grid-cols-1 md:grid-cols-3 gap-5 print:grid-cols-3 print:gap-3">
            
            {/* KPI 1: Disponibilidad de Flota (Gauge Velocímetro) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Disponibilidad de Flota
                  </span>
                  {/* Trend Arrow */}
                  {opKpis && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                      opKpis.fleetAvailabilityDelta >= 0 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {opKpis.fleetAvailabilityDelta >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      <span>{Math.abs(opKpis.fleetAvailabilityDelta).toFixed(1)}% vs anterior</span>
                    </div>
                  )}
                </div>

                {/* Gauge Chart */}
                <div className="my-2">
                  <GaugeChart 
                    value={opKpis ? opKpis.fleetAvailabilityPercent : 0} 
                    size={200}
                    label="Meta >85%"
                  />
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Operativas: <strong className="text-slate-800 dark:text-slate-200">{opKpis?.operationalTotal ?? '-'}</strong> / {opKpis?.totalActiveUnits ?? '-'}
                </span>
                <span>
                  En Taller: <strong className="text-rose-600">{opKpis?.inWorkshopTotal ?? '-'}</strong>
                </span>
              </div>
            </div>

            {/* KPI 2: MTTR (Tiempo Medio de Reparación con Sparkline) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Tiempo Medio de Reparación (MTTR)
                  </span>
                  {/* Trend Arrow: menor tiempo es MEJOR (verde) */}
                  {opKpis && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                      opKpis.mttrDeltaHours <= 0 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {opKpis.mttrDeltaHours <= 0 ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                      <span>{Math.abs(opKpis.mttrDeltaHours).toFixed(1)}h vs anterior</span>
                    </div>
                  )}
                </div>

                {/* Main Value Display */}
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {opKpis ? formatMttrTime(opKpis.mttrHours, opKpis.mttrDays) : '-'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">promedio</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Tiempo desde apertura de solicitud hasta cierre de orden.
                  </p>
                </div>

                {/* Sparkline Semanal */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-400">Tendencia semanal de MTTR:</span>
                  </div>
                  <div className="w-full flex justify-center py-1">
                    <Sparkline 
                      data={opKpis?.mttrSparkline || []} 
                      width={280} 
                      height={40} 
                      color="#3b82f6" 
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Órdenes cerradas: <strong className="text-slate-800 dark:text-slate-200">{opKpis?.completedOrdersCount ?? 0}</strong>
                </span>
                <span className="text-blue-600 font-semibold">
                  {opKpis?.mttrDays ? `${opKpis.mttrDays.toFixed(1)} días` : '0 días'}
                </span>
              </div>
            </div>

            {/* KPI 3: Gasto Total de Mantenimiento */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Gasto Total de Mantenimiento
                  </span>
                  {/* Trend Arrow */}
                  {finKpis && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                      finKpis.totalCostDeltaPercent <= 0 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {finKpis.totalCostDeltaPercent <= 0 ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                      <span>{Math.abs(finKpis.totalCostDeltaPercent).toFixed(1)}% vs anterior</span>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      ${finKpis ? finKpis.totalMaintenanceCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Acumulado de repuestos consumidos en órdenes completadas.
                  </p>
                </div>

                {/* Sub-métricas Financieras */}
                <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Costo Promedio</span>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                      ${finKpis ? finKpis.averageCostPerServicedUnit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                    </p>
                    <span className="text-[10px] text-slate-400">por unidad atendida</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inventario Inmovilizado</span>
                    <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                      ${finKpis ? finKpis.immobilizedInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                    </p>
                    <span className="text-[10px] text-slate-400">{finKpis?.immobilizedItemsCount ?? 0} ítems &gt;90d</span>
                  </div>
                </div>

                {/* Botón de acceso al Gasto por Proveedor por Artículo */}
                <div className="mt-3 pt-2">
                  <button
                    onClick={handleOpenSupplierPurchases}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-indigo-50 dark:bg-slate-900/70 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs flex items-center justify-between border border-slate-200/80 dark:border-slate-700 transition-all group shadow-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                        <Layers size={13} />
                      </div>
                      <span>Gasto por Proveedor y Artículo</span>
                    </div>
                    <ArrowUpRight size={14} className="text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Unidades atendidas: <strong className="text-slate-800 dark:text-slate-200">{finKpis?.servicedUnitsCount ?? 0}</strong>
                </span>
                <span className="text-slate-400">Valuación en Divisas ($)</span>
              </div>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* NIVEL 2: CUERPO PRINCIPAL (ANÁLISIS Y TENDENCIAS)                     */}
          {/* ===================================================================== */}
          <div className="dashboard-grid-3 grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-3 print:gap-3">
            
            {/* Columna 1: Preventivo vs Correctivo (Donut Ring Chart) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Preventivo vs. Correctivo
                    </h2>
                    <p className="text-xs text-slate-400">
                      Balance y disciplina del plan de mantenimiento
                    </p>
                  </div>
                </div>

                <div className="py-2">
                  <DonutChart 
                    preventive={opKpis?.preventiveCount ?? 0}
                    corrective={opKpis?.correctiveCount ?? 0}
                    roadside={opKpis?.roadsideCount ?? 0}
                    other={opKpis?.otherTypeCount ?? 0}
                    size={190}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 flex items-center justify-between">
                <span>Ideal: &gt;70% Preventivo</span>
                <span className={`font-bold ${
                  (opKpis?.preventivePercent ?? 0) >= 70 ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {(opKpis?.preventivePercent ?? 0) >= 70 ? 'Cumpliendo Meta' : 'Alerta Planificación'}
                </span>
              </div>
            </div>

            {/* Columna 2: Top 5 Unidades con Mayor Gasto (Horizontal Bar Chart) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Top 5 Unidades con Mayor Gasto
                    </h2>
                    <p className="text-xs text-slate-400">
                      Chutos y remolques que concentran más costos
                    </p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                    Divisas ($)
                  </span>
                </div>

                <div className="py-2">
                  <HorizontalBarChart data={finKpis?.topSpendingVehicles ?? []} onItemClick={handleOpenVehicleDetail} />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 flex items-center justify-between">
                <span>Top de unidades en el período</span>
                {finKpis?.topSpendingVehicles && finKpis.topSpendingVehicles.length > 0 ? (
                  <button 
                    onClick={() => handleOpenVehicleDetail(finKpis.topSpendingVehicles[0])}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                    title={`Ver órdenes de ${finKpis.topSpendingVehicles[0].licensePlate}`}
                  >
                    <span>Ver órdenes</span>
                    <ArrowUpRight size={12} />
                  </button>
                ) : (
                  <Link to="/workshop" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1">
                    <span>Ver órdenes</span>
                    <ArrowUpRight size={12} />
                  </Link>
                )}
              </div>
            </div>

            {/* Columna 3: Evolución del Costo Promedio (Línea Histórica 6 Meses) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Evolución del Costo (Últimos 6 Meses)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Tendencia mensual acumulada de mantenimiento
                    </p>
                  </div>
                </div>

                <div className="py-1">
                  <LineTrendChart data={finKpis?.monthlyEvolution ?? []} />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 flex items-center justify-between">
                <span>Histórico consolidado</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Total semestre: ${finKpis?.monthlyEvolution?.reduce((acc, m) => acc + m.totalCost, 0).toLocaleString('en-US', { maximumFractionDigits: 0 }) ?? 0}
                </span>
              </div>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* NIVEL 3: PANELES INFERIORES (CONTROL OPERATIVO Y PERSONAL)             */}
          {/* ===================================================================== */}
          <div className="dashboard-grid-2 grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-3">
            
            {/* Panel Izquierdo: Alertas de Quiebre de Stock (Data Grid Condicional) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="text-rose-600" size={18} />
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        Alertas de Quiebre de Stock (Repuestos)
                      </h2>
                      <p className="text-xs text-slate-400">
                        Ítems con existencia crítica o agotada en taller
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    (invKpis?.stockoutAlertsCount ?? 0) > 0 
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' 
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  }`}>
                    {invKpis?.stockoutAlertsCount ?? 0} alertas
                  </span>
                </div>

                {/* Data Grid en pantalla */}
                <div className="mt-3 overflow-x-auto">
                  {invKpis && invKpis.stockoutAlerts && invKpis.stockoutAlerts.length > 0 ? (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="pb-2">Repuesto</th>
                          <th className="pb-2">Almacén</th>
                          <th className="pb-2 text-right">Actual</th>
                          <th className="pb-2 text-right">Mínimo</th>
                          <th className="pb-2 text-right">Costo Unit.</th>
                          <th className="pb-2 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {invKpis.stockoutAlerts.slice(0, 5).map(item => {
                          const isAgotado = item.stockQuantity <= 0;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="py-2.5 pr-2">
                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                  {item.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {item.code} {item.category ? `• ${item.category}` : ''}
                                </div>
                              </td>
                              <td className="py-2.5 pr-2 text-slate-500 text-[11px]">
                                {item.warehouseName || 'Principal'}
                              </td>
                              <td className="py-2.5 px-2 text-right font-bold text-slate-800 dark:text-slate-200 font-mono">
                                {item.stockQuantity} {item.unitOfMeasure}
                              </td>
                              <td className="py-2.5 px-2 text-right text-slate-400 font-mono">
                                {item.minimumStock}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-300">
                                ${item.unitCost.toFixed(2)}
                              </td>
                              <td className="py-2.5 pl-2 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  isAgotado
                                    ? 'bg-red-500 text-white shadow-sm'
                                    : 'bg-amber-400 text-amber-950 font-bold'
                                }`}>
                                  {isAgotado ? 'Agotado' : 'Crítico'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
                      <CheckCircle2 size={24} className="text-emerald-500" />
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        Niveles de inventario óptimos
                      </span>
                      <span className="text-[11px]">Ningún repuesto por debajo de su stock de seguridad.</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 flex items-center justify-between">
                <span>Valuación Total: ${invKpis?.totalInventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2 }) ?? '0.00'}</span>
                <Link to="/inventory" className="text-blue-600 hover:underline font-semibold flex items-center gap-1 print:hidden">
                  Gestionar inventario <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>

            {/* Panel Derecho: Personal y Productividad (Mecánicos & Choferes) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="text-indigo-600" size={18} />
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        Desempeño y Productividad del Personal
                      </h2>
                      <p className="text-xs text-slate-400">
                        {staffView === 'mechanics' ? 'Productividad de mecánicos en taller' : 'Incidencias reportadas por chofer'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Mecánicos vs Choferes */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 print:hidden">
                    <button
                      onClick={() => setStaffView('mechanics')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                        staffView === 'mechanics'
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Mecánicos
                    </button>
                    <button
                      onClick={() => setStaffView('drivers')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                        staffView === 'drivers'
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Choferes
                    </button>
                  </div>
                </div>

                {/* Gráfico de Columnas Apiladas (Stacked Bars) */}
                <div className="py-2">
                  {staffView === 'mechanics' ? (
                    <StackedColumnChart 
                      data={(staffKpis?.mechanicProductivity ?? []).map(m => ({
                        id: m.mechanicId,
                        title: m.mechanicName,
                        subtitle: `${m.speciality || 'Mecánico'} • ${m.averageRepairTimeHours.toFixed(1)}h prom.`,
                        val1: m.preventiveOrdersCount,
                        val2: m.correctiveOrdersCount
                      }))}
                      label1="Preventivos"
                      label2="Correctivos"
                      emptyText="No hay actividades de mecánicos registradas"
                    />
                  ) : (
                    <StackedColumnChart 
                      data={(staffKpis?.driverIncidents ?? []).map(d => ({
                        id: d.driverId,
                        title: d.driverName,
                        subtitle: `Lic: ${d.licenseNumber || 'S/N'}`,
                        val1: d.preventiveCount,
                        val2: d.correctiveCount
                      }))}
                      label1="Servicios Prev."
                      label2="Fallas Corr."
                      emptyText="No hay incidencias de choferes registradas"
                    />
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 flex items-center justify-between">
                <span>
                  {staffView === 'mechanics'
                    ? `${staffKpis?.mechanicProductivity.length ?? 0} mecánicos activos`
                    : `${staffKpis?.driverIncidents.length ?? 0} choferes con registros`
                  }
                </span>
                <span className="text-slate-400 text-[11px]">
                  Desglose Preventivo (Azul) vs Correctivo (Rojo)
                </span>
              </div>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* NIVEL 4: FRECUENCIA DE FALLAS Y GASTO POR UNIDAD                      */}
          {/* ===================================================================== */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck size={17} className="text-indigo-600" />
                  Frecuencia de Fallas y Gasto por Unidad
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consolida el historial de entradas al taller y el costo acumulado en repuestos por vehículo (haz clic en la placa para ver el desglose)
                </p>
              </div>

              {/* Controles: Buscador y Toggle Ver Toda la Flota */}
              <div className="flex items-center gap-2.5 print:hidden">
                <div className="relative w-48 sm:w-60">
                  <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
                  <input
                    type="text"
                    placeholder="Buscar placa o marca..."
                    value={unitSearch}
                    onChange={(e) => setUnitSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <button
                  onClick={() => setShowAllUnits(!showAllUnits)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    showAllUnits
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {showAllUnits ? 'Top 10 Unidades' : `Ver Flota Completa (${opKpis?.failureFrequency?.length ?? 0})`}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {sortedFailureUnits.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                      <th 
                        onClick={() => handleSort('plate')}
                        className="pb-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>Unidad / Placa</span>
                          <ArrowUpDown size={11} className={sortField === 'plate' ? 'text-indigo-600 font-bold' : 'opacity-40'} />
                        </div>
                      </th>
                      <th className="pb-2">Tipo / Marca</th>
                      <th 
                        onClick={() => handleSort('corrective')}
                        className="pb-2 text-center cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Fallas Correctivas</span>
                          <ArrowUpDown size={11} className={sortField === 'corrective' ? 'text-indigo-600 font-bold' : 'opacity-40'} />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('roadside')}
                        className="pb-2 text-center cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Auxilios Viales</span>
                          <ArrowUpDown size={11} className={sortField === 'roadside' ? 'text-indigo-600 font-bold' : 'opacity-40'} />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('preventive')}
                        className="pb-2 text-center cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Servicios Prev.</span>
                          <ArrowUpDown size={11} className={sortField === 'preventive' ? 'text-indigo-600 font-bold' : 'opacity-40'} />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('failures')}
                        className="pb-2 text-center cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Total Entradas</span>
                          <ArrowUpDown size={11} className={sortField === 'failures' ? 'text-indigo-600 font-bold' : 'opacity-40'} />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('cost')}
                        className="pb-2 text-right cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Costo Total Acumulado ($)</span>
                          <ArrowUpDown size={11} className={sortField === 'cost' ? 'text-indigo-600 font-bold' : 'opacity-40'} />
                        </div>
                      </th>
                      <th className="pb-2 text-right pr-2">Último Servicio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {sortedFailureUnits.map((unit, idx) => (
                      <tr key={unit.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="py-2.5 pr-2 font-extrabold text-slate-900 dark:text-white font-mono">
                          <button
                            onClick={() => handleOpenVehicleDetail(unit)}
                            className="font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline font-mono flex items-center gap-1.5 group text-left cursor-pointer"
                            title="Ver desglose de servicios y repuestos instalados"
                          >
                            <span>{unit.licensePlate}</span>
                            <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                          </button>
                        </td>
                        <td className="py-2.5 pr-2 text-slate-500">
                          {(unit.unitType?.toLowerCase().includes('chuto') || unit.unitType?.toLowerCase().includes('vehicle')) ? 'Chuto' : 'Remolque'} {unit.brandOrType ? `• ${unit.brandOrType}` : ''}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            unit.correctiveCount > 3 ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 font-black' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {unit.correctiveCount}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            (unit.roadsideCount ?? 0) > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-black' : 'bg-slate-100 text-slate-400 dark:bg-slate-700/60 dark:text-slate-400'
                          }`}>
                            {unit.roadsideCount ?? 0}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-300 font-medium">
                          {unit.preventiveCount}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-900 dark:text-white font-mono">
                          {unit.totalFailures}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ${unit.totalCostAccumulated != null ? unit.totalCostAccumulated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                        </td>
                        <td className="py-2.5 pr-2 text-right text-slate-400 font-mono text-[11px]">
                          {unit.lastServiceDate ? new Date(unit.lastServiceDate).toLocaleDateString('es-ES') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  No se registraron fallas recurrentes en el período seleccionado.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: ESTADO DE MANTENIMIENTO (KILOMETRAJE Y SALUD DE FLOTA)         */}
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

          {/* Detailed Lists */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="text-red-500" size={20} />
                  Unidades en Riesgo Crítico ({overdueUnits.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {overdueUnits.length === 0 ? (
                  <p className="p-6 text-sm text-gray-500 text-center">No hay unidades con mantenimiento vencido.</p>
                ) : (
                  overdueUnits.map(u => {
                    const diff = getMaintenanceStatus(u);
                    return (
                      <div key={u.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
                            {u.unitType === 'vehicle' ? <Truck size={24} /> : <Container size={24} />}
                          </div>
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                              {u.unitType === 'vehicle' ? 'Chuto' : 'Remolque'}
                            </span>
                            <h4 className="text-base font-bold text-gray-900 dark:text-white">{u.licensePlate}</h4>
                            <p className="text-sm text-gray-500">
                              {u.unitType === 'vehicle' ? `${(u as Vehicle).brand} ${(u as Vehicle).model}` : (u as Trailer).type}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end w-full sm:w-auto">
                          <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                            Excedido por {Math.abs(diff).toLocaleString()} km
                          </span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Kilometraje actual: {u.currentMileage.toLocaleString()} km
                          </span>
                          <span className="text-xs text-gray-400">
                            Último mant.: {(u.lastMaintenanceMileage || 0).toLocaleString()} km
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Wrench className="text-amber-500" size={20} />
                  Próximos a Mantenimiento ({upcomingUnits.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {upcomingUnits.length === 0 ? (
                  <p className="p-6 text-sm text-gray-500 text-center">No hay unidades próximas a mantenimiento.</p>
                ) : (
                  upcomingUnits.map(u => {
                    const diff = getMaintenanceStatus(u);
                    return (
                      <div key={u.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
                            {u.unitType === 'vehicle' ? <Truck size={24} /> : <Container size={24} />}
                          </div>
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                              {u.unitType === 'vehicle' ? 'Chuto' : 'Remolque'}
                            </span>
                            <h4 className="text-base font-bold text-gray-900 dark:text-white">{u.licensePlate}</h4>
                            <p className="text-sm text-gray-500">
                              {u.unitType === 'vehicle' ? `${(u as Vehicle).brand} ${(u as Vehicle).model}` : (u as Trailer).type}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end w-full sm:w-auto">
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            Restan {diff.toLocaleString()} km
                          </span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Kilometraje actual: {u.currentMileage.toLocaleString()} km
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Modal 1: Gasto por Proveedor por Artículo */}
      <SupplierPurchasesModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        data={supplierData}
        loading={loadingSupplierPurchases}
        startDate={startDate}
        endDate={endDate}
      />

      {/* Modal 2: Detalle de Mantenimiento por Unidad (Drill-Down) */}
      <VehicleMaintenanceDetailModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        detail={vehicleDetailData}
        loading={loadingVehicleDetail}
        startDate={startDate}
        endDate={endDate}
      />


      {/* ========================================================================= */}
      {/* PIE DE PÁGINA EXCLUSIVO PARA IMPRESIÓN                                    */}
      {/* ========================================================================= */}
      <div className="hidden print:flex items-center justify-between pt-4 mt-6 border-t border-slate-300 text-[10px] text-slate-500 font-mono">
        <span>Sistema de Gestión de Transporte y Flota &bull; {selectedCompany?.name || 'Empresa'}</span>
        <span>Reporte Gerencial &bull; Confidencial &bull; Página 1</span>
      </div>

      {/* Modal 3: Registro Oficial de Gastos y Compras (Auditoría) */}
      <ExpensesSheetModal
        isOpen={showExpensesModal}
        onClose={() => setShowExpensesModal(false)}
      />

    </div>
  );
}
