import React, { useState, useMemo } from 'react';
import { 
  X, Search, ChevronDown, ChevronRight, Layers, LayoutGrid, 
  Table as TableIcon, DollarSign, Package, Building2, 
  ArrowUpRight, ArrowLeft, RefreshCw, FileText
} from 'lucide-react';
import type { SupplierPurchasesResponse, SupplierPurchaseGroup, SupplierPurchaseItem } from '../../services/dashboardService';

interface SupplierPurchasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SupplierPurchasesResponse | null;
  loading: boolean;
  startDate: string;
  endDate: string;
}

const PALETTE = [
  { bg: 'bg-indigo-600', text: 'text-indigo-600', lightBg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-800' },
  { bg: 'bg-emerald-600', text: 'text-emerald-600', lightBg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' },
  { bg: 'bg-blue-600', text: 'text-blue-600', lightBg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800' },
  { bg: 'bg-amber-600', text: 'text-amber-600', lightBg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' },
  { bg: 'bg-purple-600', text: 'text-purple-600', lightBg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-800' },
  { bg: 'bg-teal-600', text: 'text-teal-600', lightBg: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-teal-200 dark:border-teal-800' },
  { bg: 'bg-rose-600', text: 'text-rose-600', lightBg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800' },
  { bg: 'bg-cyan-600', text: 'text-cyan-600', lightBg: 'bg-cyan-50 dark:bg-cyan-950/40', border: 'border-cyan-200 dark:border-cyan-800' },
];

export default function SupplierPurchasesModal({
  isOpen,
  onClose,
  data,
  loading,
  startDate,
  endDate
}: SupplierPurchasesModalProps) {
  const [viewMode, setViewMode] = useState<'tree' | 'treemap'>('tree');
  const [search, setSearch] = useState('');
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<number>>(new Set());
  const [selectedSupplierForTreemap, setSelectedSupplierForTreemap] = useState<SupplierPurchaseGroup | null>(null);

  // Filtrado de datos por búsqueda
  const filteredSuppliers = useMemo(() => {
    if (!data?.suppliers) return [];
    if (!search.trim()) return data.suppliers;

    const q = search.toLowerCase();
    return data.suppliers
      .map(sup => {
        const matchSup = sup.supplierName.toLowerCase().includes(q) || 
                         (sup.taxId && sup.taxId.toLowerCase().includes(q)) ||
                         (sup.code && sup.code.toLowerCase().includes(q));

        const matchedItems = sup.items.filter(item => 
          item.name.toLowerCase().includes(q) || 
          item.code.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );

        if (matchSup || matchedItems.length > 0) {
          return {
            ...sup,
            items: matchSup ? sup.items : matchedItems
          };
        }
        return null;
      })
      .filter((s): s is SupplierPurchaseGroup => s !== null);
  }, [data, search]);

  const toggleSupplier = (supplierId: number) => {
    setExpandedSuppliers(prev => {
      const next = new Set(prev);
      if (next.has(supplierId)) {
        next.delete(supplierId);
      } else {
        next.add(supplierId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!data?.suppliers) return;
    setExpandedSuppliers(new Set(data.suppliers.map(s => s.supplierId)));
  };

  const collapseAll = () => {
    setExpandedSuppliers(new Set());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Cabecera del Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                <Layers size={22} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Gasto por Proveedor y Artículo
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Desglose jerárquico de compras y repuestos adquiridos ({startDate} al {endDate})
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* Selector de Vista: TreeGrid vs Treemap */}
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'tree'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TableIcon size={14} />
                Tabla Jerárquica
              </button>
              <button
                onClick={() => setViewMode('treemap')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'treemap'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid size={14} />
                Mapa de Árbol (Treemap)
              </button>
            </div>

            <button
              onClick={onClose}
              aria-label="Cerrar modal"
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tarjetas Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Comprado en Período</span>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                ${data ? data.totalPurchasedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <Building2 size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proveedores con Compras</span>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {data?.suppliersCount ?? 0}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <Package size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Variedad de Artículos</span>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {data?.totalItemsCount ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <RefreshCw className="animate-spin mb-3 text-indigo-600" size={32} />
              <p className="text-sm font-semibold">Cargando desglose de compras por proveedor...</p>
            </div>
          ) : !data || data.suppliers.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Building2 className="mx-auto mb-3 opacity-30" size={48} />
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">No se registraron compras en el período seleccionado</p>
              <p className="text-xs mt-1">Prueba ampliando el rango de fechas en los filtros del dashboard.</p>
            </div>
          ) : viewMode === 'tree' ? (
            /* VISTA 1: TABLA JERÁRQUICA (TREEGRID) */
            <div className="space-y-3">
              {/* Barra de Búsqueda y Controles de Expansión */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                  <input
                    type="text"
                    placeholder="Buscar proveedor, artículo o código..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center text-xs">
                  <button
                    onClick={expandAll}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold transition-colors"
                  >
                    Expandir Todos
                  </button>
                  <button
                    onClick={collapseAll}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold transition-colors"
                  >
                    Colapsar Todos
                  </button>
                </div>
              </div>

              {/* Lista Jerárquica */}
              <div className="space-y-2">
                {filteredSuppliers.map((sup, sIdx) => {
                  const isExpanded = expandedSuppliers.has(sup.supplierId);
                  const color = PALETTE[sIdx % PALETTE.length];

                  return (
                    <div 
                      key={sup.supplierId}
                      className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-800/60 shadow-sm transition-all"
                    >
                      {/* Fila Nivel 1: Proveedor */}
                      <div 
                        onClick={() => toggleSupplier(sup.supplierId)}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3">
                          <button 
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                            aria-label="Alternar proveedor"
                          >
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>
                          
                          <div className={`w-2 h-8 rounded-full ${color.bg}`} />

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-slate-900 dark:text-white">
                                {sup.supplierName}
                              </span>
                              {sup.taxId && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                                  {sup.taxId}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">
                              {sup.items.length} {sup.items.length === 1 ? 'artículo' : 'artículos'} • {sup.invoicesCount} {sup.invoicesCount === 1 ? 'factura' : 'facturas'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <p className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                              ${sup.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <span className="text-[11px] font-bold text-slate-400">
                              {sup.percentageOfTotal}% del total
                            </span>
                          </div>

                          {/* Mini barra de progreso proporcional */}
                          <div className="hidden sm:block w-20 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${color.bg}`} 
                              style={{ width: `${Math.min(100, sup.percentageOfTotal)}%` }} 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Fila Nivel 2: Tabla de Artículos (Expandible) */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-3 sm:p-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-700 pb-2">
                                  <th className="pb-2 pl-2">Código</th>
                                  <th className="pb-2">Descripción del Artículo</th>
                                  <th className="pb-2">Categoría</th>
                                  <th className="pb-2 text-right">Cant. Comprada</th>
                                  <th className="pb-2 text-right">Costo Unit. Promedio</th>
                                  <th className="pb-2 text-right pr-2">Costo Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
                                {sup.items.map((item) => (
                                  <tr key={item.sparePartId} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="py-2.5 pl-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                                      {item.code}
                                    </td>
                                    <td className="py-2.5 font-semibold text-slate-900 dark:text-white">
                                      {item.name}
                                    </td>
                                    <td className="py-2.5 text-slate-500">
                                      <span className="px-2 py-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-md text-[10px] font-bold">
                                        {item.category}
                                      </span>
                                    </td>
                                    <td className="py-2.5 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                                      {item.totalQuantity.toLocaleString()} {item.unitOfMeasure}
                                    </td>
                                    <td className="py-2.5 text-right font-mono font-semibold text-slate-600 dark:text-slate-400">
                                      ${item.averageUnitCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2.5 pr-2 text-right font-mono font-black text-slate-900 dark:text-white">
                                      ${item.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* VISTA 2: TREEMAP INTERACTIVO */
            <div className="space-y-4">
              {/* Breadcrumb del Treemap */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <button
                    onClick={() => setSelectedSupplierForTreemap(null)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      selectedSupplierForTreemap 
                        ? 'text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer' 
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    <Building2 size={14} />
                    Todos los Proveedores
                  </button>

                  {selectedSupplierForTreemap && (
                    <>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Package size={14} className="text-amber-500" />
                        {selectedSupplierForTreemap.supplierName}
                      </span>
                    </>
                  )}
                </div>

                {selectedSupplierForTreemap && (
                  <button
                    onClick={() => setSelectedSupplierForTreemap(null)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                  >
                    <ArrowLeft size={13} />
                    Volver a vista general
                  </button>
                )}
              </div>

              {/* Contenedor del Treemap */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
                {!selectedSupplierForTreemap ? (
                  /* Nivel 1 Treemap: Proveedores */
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500">
                      Haz clic en cualquier cuadro de proveedor para hacer drill-down y ver los artículos específicos comprados:
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {data.suppliers.map((sup, idx) => {
                        const color = PALETTE[idx % PALETTE.length];
                        return (
                          <div
                            key={sup.supplierId}
                            onClick={() => setSelectedSupplierForTreemap(sup)}
                            className={`group relative p-4 rounded-2xl border cursor-pointer transition-all transform hover:-translate-y-1 hover:shadow-lg ${color.lightBg} ${color.border}`}
                            style={{ minHeight: '130px' }}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-mono text-[10px] font-black uppercase text-slate-400">
                                {sup.percentageOfTotal}%
                              </span>
                              <div className="p-1 rounded-lg bg-white/80 dark:bg-slate-800/80 text-slate-400 group-hover:text-indigo-600 transition-colors">
                                <ArrowUpRight size={14} />
                              </div>
                            </div>

                            <div className="mt-2">
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-2">
                                {sup.supplierName}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {sup.items.length} artículos comprados
                              </p>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-baseline justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Gasto</span>
                              <span className="font-black text-sm text-slate-900 dark:text-white font-mono">
                                ${sup.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Nivel 2 Treemap: Artículos del Proveedor Seleccionado */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-500">
                        Artículos comprados a <strong className="text-slate-800 dark:text-white">{selectedSupplierForTreemap.supplierName}</strong>:
                      </p>
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        Total: ${selectedSupplierForTreemap.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {selectedSupplierForTreemap.items.map((item, iIdx) => {
                        const itemPct = selectedSupplierForTreemap.totalSpent > 0 
                          ? Math.round((item.totalCost / selectedSupplierForTreemap.totalSpent) * 100) 
                          : 0;
                        const color = PALETTE[iIdx % PALETTE.length];

                        return (
                          <div
                            key={item.sparePartId}
                            className={`p-4 rounded-2xl border ${color.lightBg} ${color.border} flex flex-col justify-between`}
                            style={{ minHeight: '120px' }}
                          >
                            <div>
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="font-bold text-slate-400">{item.code}</span>
                                <span className="font-black text-indigo-600 dark:text-indigo-400">{itemPct}%</span>
                              </div>
                              <h5 className="font-extrabold text-xs text-slate-900 dark:text-white mt-1 line-clamp-2">
                                {item.name}
                              </h5>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {item.totalQuantity} {item.unitOfMeasure} @ ${item.averageUnitCost.toFixed(2)}
                              </p>
                            </div>

                            <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-right">
                              <span className="font-black text-sm text-slate-900 dark:text-white font-mono">
                                ${item.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-colors"
          >
            Cerrar Detalle
          </button>
        </div>

      </div>
    </div>
  );
}
