import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, FileSpreadsheet, Calendar, Search, Loader2, DollarSign, 
  CheckCircle2, Clock, Package, Download, Building2, Layers
} from 'lucide-react';
import { purchasingService } from '../services/purchasingService';
import type { ExpensesSheetResponse, ExpensesSheetItem } from '../types';

interface ExpensesSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DatePreset = 'month' | 'prev_month' | 'year' | '30d' | 'custom';

export default function ExpensesSheetModal({ isOpen, onClose }: ExpensesSheetModalProps) {
  const [preset, setPreset] = useState<DatePreset>('month');

  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [data, setData] = useState<ExpensesSheetResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'CXP' | 'PAGADO'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'C' | 'S'>('all');

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
      const s = start.toISOString().split('T')[0];
      const e = end.toISOString().split('T')[0];
      setStartDate(s);
      setEndDate(e);
      loadExpensesSheet(s, e);
    }
  };

  const loadExpensesSheet = async (start = startDate, end = endDate) => {
    try {
      setLoading(true);
      const res = await purchasingService.getExpensesSheet(start, end);
      setData(res);
    } catch (error) {
      console.error('Error cargando hoja de gastos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadExpensesSheet(startDate, endDate);
    }
  }, [isOpen]);

  const handleCustomDateApply = () => {
    loadExpensesSheet(startDate, endDate);
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const blob = await purchasingService.exportExpensesExcel(startDate, endDate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanCompany = (data?.companyName || 'Empresa').replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `Registro_Gastos_${cleanCompany}_${startDate}_a_${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Hubo un error al generar el archivo Excel.');
    } finally {
      setExportingExcel(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];

    return data.items.filter(item => {
      if (statusFilter !== 'all' && item.estatus !== statusFilter) return false;
      if (typeFilter !== 'all' && item.tipo !== typeFilter) return false;

      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const match = 
          item.numeroFactura?.toLowerCase().includes(term) ||
          item.proveedor?.toLowerCase().includes(term) ||
          item.descripcion?.toLowerCase().includes(term) ||
          item.vehiculo?.toLowerCase().includes(term) ||
          item.reqCompra?.toLowerCase().includes(term) ||
          item.marca?.toLowerCase().includes(term) ||
          item.modelo?.toLowerCase().includes(term) ||
          item.empresa?.toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [data?.items, statusFilter, typeFilter, searchTerm]);

  const visibleSummary = useMemo(() => {
    const totalSpent = filteredItems.reduce((acc, curr) => acc + (curr.costoTotal || 0), 0);
    const totalPaid = filteredItems
      .filter(i => i.estatus === 'PAGADO')
      .reduce((acc, curr) => acc + (curr.costoTotal || 0), 0);
    const totalPendingCxp = filteredItems
      .filter(i => i.estatus === 'CXP')
      .reduce((acc, curr) => acc + (curr.costoTotal || 0), 0);
    
    const uniqueInvoices = new Set(filteredItems.map(i => `${i.numeroFactura}-${i.proveedor}`)).size;

    return {
      totalItems: filteredItems.length,
      uniqueInvoices,
      totalSpent,
      totalPaid,
      totalPendingCxp
    };
  }, [filteredItems]);

  const formatCurrency = (val: number) => {
    return (val || 0).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-[98vw] 2xl:max-w-7xl h-[92vh] flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
              <FileSpreadsheet size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  Visualizador del Registro de Gastos y Compras
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  Formato Oficial
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {data?.companyName || 'Empresa'} &bull; {data?.periodText || 'Período en curso'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={exportingExcel || loading}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm shadow-emerald-600/20 active:scale-95 cursor-pointer"
              title="Descargar este reporte con las 18 columnas en formato Excel"
            >
              {exportingExcel ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Download size={15} />
              )}
              <span className="hidden sm:inline">Exportar a Excel</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-xl transition-all cursor-pointer"
              title="Cerrar ventana"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="p-3 sm:px-6 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    preset === item.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {preset === 'custom' && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <Calendar size={14} className="text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 dark:text-white focus:outline-hidden [color-scheme:light] dark:[color-scheme:dark]"
                />
                <span className="text-slate-400 text-xs">a</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 dark:text-white focus:outline-hidden [color-scheme:light] dark:[color-scheme:dark]"
                />
                <button
                  onClick={handleCustomDateApply}
                  className="ml-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold cursor-pointer"
                >
                  Filtrar
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar factura, proveedor, placa..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-slate-700 text-white dark:bg-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('CXP')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'CXP'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                }`}
              >
                Solo CXP
              </button>
              <button
                onClick={() => setStatusFilter('PAGADO')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'PAGADO'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                Solo Pagado
              </button>
            </div>

            <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-slate-700 text-white dark:bg-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                C y S
              </button>
              <button
                onClick={() => setTypeFilter('C')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'C'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                }`}
              >
                (C) Compras
              </button>
              <button
                onClick={() => setTypeFilter('S')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'S'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                }`}
              >
                (S) Servicios
              </button>
            </div>
          </div>
        </div>

        {/* RESUMEN KPIS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 sm:px-6 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
              <DollarSign size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                Total Gastado (Visible)
              </p>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {formatCurrency(visibleSummary.totalSpent)}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                Pagado al Día
              </p>
              <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 truncate">
                {formatCurrency(visibleSummary.totalPaid)}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
              <Clock size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                Pendiente por Pagar (CXP)
              </p>
              <p className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 truncate">
                {formatCurrency(visibleSummary.totalPendingCxp)}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 shrink-0">
              <Package size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                Ítems Registrados
              </p>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {visibleSummary.totalItems}{' '}
                <span className="text-xs font-semibold text-slate-500">
                  ({visibleSummary.uniqueInvoices} facturas)
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* TABLA PRINCIPAL (18 COLUMNAS EXACTAS DE EXCEL) */}
        <div className="flex-1 overflow-auto bg-white dark:bg-slate-900 relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs z-20">
              <Loader2 size={36} className="animate-spin text-blue-600 mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Cargando registro de compras y gastos...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
                <FileSpreadsheet size={32} />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No se encontraron registros de gastos
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
                No hay ítems registrados en el rango seleccionado ({startDate} al {endDate}) o para los filtros aplicados.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[2100px] text-xs">
              <thead className="sticky top-0 z-10 shadow-xs">
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <th colSpan={13} className="py-1 px-3 bg-slate-200/80 dark:bg-slate-800 text-left border-r border-slate-300 dark:border-slate-700">
                    <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                      <Layers size={13} />
                      1. DATOS DE GASTO, COMPRA O SERVICIO
                    </span>
                  </th>
                  <th colSpan={3} className="py-1 px-3 bg-emerald-100/70 dark:bg-emerald-950/40 text-left border-r border-emerald-300 dark:border-emerald-800">
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 size={13} />
                      2. DATOS DE PAGO
                    </span>
                  </th>
                  <th colSpan={2} className="py-1 px-3 bg-indigo-100/70 dark:bg-indigo-950/40 text-left">
                    <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                      <Building2 size={13} />
                      3. DESTINO & ASIGNACIÓN
                    </span>
                  </th>
                </tr>

                <tr className="bg-slate-800 text-slate-100 dark:bg-slate-950 font-bold uppercase text-[10px] tracking-wide border-b border-slate-700">
                  <th className="py-2.5 px-3">FECHA COMPRA</th>
                  <th className="py-2.5 px-2 text-center">TIPO</th>
                  <th className="py-2.5 px-2 text-center">ESTATUS</th>
                  <th className="py-2.5 px-3 min-w-[240px]">DESCRIPCIÓN</th>
                  <th className="py-2.5 px-3">MODELO</th>
                  <th className="py-2.5 px-3">MARCA</th>
                  <th className="py-2.5 px-2 text-right">CANT.</th>
                  <th className="py-2.5 px-3">REQ. COMPRA</th>
                  <th className="py-2.5 px-3">N° FACTURA</th>
                  <th className="py-2.5 px-3 min-w-[180px]">PROVEEDOR</th>
                  <th className="py-2.5 px-3 text-right">COSTO UNIT.</th>
                  <th className="py-2.5 px-3 text-right">COSTO TOTAL</th>
                  <th className="py-2.5 px-3 border-r border-slate-700">FECHA RECIBIDO</th>
                  
                  <th className="py-2.5 px-3 bg-slate-800/90 text-emerald-300">PAGADO AL DÍA</th>
                  <th className="py-2.5 px-3 bg-slate-800/90 text-emerald-300">FORMA PAGO</th>
                  <th className="py-2.5 px-3 bg-slate-800/90 text-emerald-300 text-right border-r border-slate-700">TOTAL FACTURA</th>

                  <th className="py-2.5 px-3 bg-slate-800/80 text-indigo-300 min-w-[160px]">VEHÍCULO / DESTINO</th>
                  <th className="py-2.5 px-3 bg-slate-800/80 text-indigo-300 min-w-[180px]">EMPRESA</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-medium">
                {filteredItems.map((item, index) => {
                  const isPaid = item.estatus?.toUpperCase() === 'PAGADO';
                  const isService = item.tipo?.toUpperCase() === 'S';

                  return (
                    <tr 
                      key={`${item.numeroFactura}-${item.reqCompra}-${index}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {item.fechaCompra}
                      </td>

                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          isService 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}>
                          {item.tipo || 'C'}
                        </span>
                      </td>

                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                          isPaid 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {item.estatus || 'CXP'}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-medium">
                        {item.descripcion}
                      </td>

                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {item.modelo}
                      </td>

                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {item.marca}
                      </td>

                      <td className="py-2 px-2 text-right text-slate-800 dark:text-slate-200 font-bold whitespace-nowrap">
                        {item.cantidad}
                      </td>

                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {item.reqCompra}
                      </td>

                      <td className="py-2 px-3 text-slate-900 dark:text-slate-100 font-bold whitespace-nowrap">
                        {item.numeroFactura}
                      </td>

                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                        {item.proveedor}
                      </td>

                      <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                        {formatCurrency(item.costoUnitario)}
                      </td>

                      <td className="py-2 px-3 text-right text-slate-900 dark:text-white font-bold font-mono whitespace-nowrap bg-slate-50/50 dark:bg-slate-800/30">
                        {formatCurrency(item.costoTotal)}
                      </td>

                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono text-[11px] border-r border-slate-200 dark:border-slate-800">
                        {item.fechaRecibido}
                      </td>

                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono text-[11px] bg-emerald-50/30 dark:bg-emerald-950/10">
                        {item.pagadoDia || '---'}
                      </td>

                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap text-[11px] bg-emerald-50/30 dark:bg-emerald-950/10">
                        {item.formaPago || '---'}
                      </td>

                      <td className="py-2 px-3 text-right text-slate-800 dark:text-slate-200 font-mono whitespace-nowrap border-r border-slate-200 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-950/10">
                        {formatCurrency(item.totalFactura)}
                      </td>

                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-semibold whitespace-nowrap bg-indigo-50/30 dark:bg-indigo-950/10">
                        {item.vehiculo}
                      </td>

                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap text-[11px] bg-indigo-50/30 dark:bg-indigo-950/10">
                        {item.empresa}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* FOOTER BAR */}
        <div className="p-3 sm:px-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              Mostrando <strong className="text-slate-800 dark:text-white">{filteredItems.length}</strong> de <strong className="text-slate-800 dark:text-white">{data?.items?.length || 0}</strong> ítems registrados
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
            <span className="hidden sm:inline">
              Período: <strong className="text-slate-700 dark:text-slate-300">{startDate}</strong> al <strong className="text-slate-700 dark:text-slate-300">{endDate}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={exportingExcel || loading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              {exportingExcel ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={14} />
              )}
              <span>Descargar Excel Oficial</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
