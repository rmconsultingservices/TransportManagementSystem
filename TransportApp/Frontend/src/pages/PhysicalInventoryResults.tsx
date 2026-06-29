import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, PackageOpen, MapPin, Calculator, AlertTriangle, AlertCircle, Ban } from 'lucide-react';
import type { PhysicalInventory, PhysicalInventoryDetail } from '../types/inventory';
import { physicalInventoryService } from '../services/physicalInventoryService';
import toast from 'react-hot-toast';

export default function PhysicalInventoryResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<PhysicalInventory | null>(null);
  const [details, setDetails] = useState<PhysicalInventoryDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [zeroUncounted, setZeroUncounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (id) {
      loadInventory(Number(id));
    }
  }, [id]);

  const loadInventory = async (invId: number) => {
    try {
      const data = await physicalInventoryService.getById(invId);
      setInventory(data);
      setDetails(data.details);
    } catch (error) {
      toast.error('Error al cargar la toma de inventario');
      navigate('/inventory/physical');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockChange = (sparePartId: number, value: string) => {
    const val = value === '' ? undefined : parseInt(value);
    
    setDetails(prev => prev.map(d => 
      d.sparePartId === sparePartId 
        ? { ...d, realStock: val } 
        : d
    ));
  };

  const handleSaveProgress = async () => {
    if (!inventory) return;
    setIsSaving(true);
    try {
      const payload = details
        .filter(d => d.realStock !== undefined)
        .map(d => ({
          sparePartId: d.sparePartId,
          realStock: d.realStock!
        }));
      
      await physicalInventoryService.updateResults(inventory.id!, payload);
      toast.success('Progreso guardado correctamente');
    } catch (error) {
      toast.error('Error al guardar el progreso');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProcess = async () => {
    if (!inventory) return;
    
    if (!window.confirm('¿Está seguro de procesar esta toma física? Esta acción generará un ajuste de inventario y no se puede deshacer.')) {
      return;
    }

    setIsProcessing(true);
    try {
      // First save current values
      const payload = details
        .filter(d => d.realStock !== undefined)
        .map(d => ({
          sparePartId: d.sparePartId,
          realStock: d.realStock!
        }));
      
      if (payload.length > 0) {
        await physicalInventoryService.updateResults(inventory.id!, payload);
      }

      // Then process
      const result = await physicalInventoryService.process(inventory.id!, { zeroUncounted });
      
      if (result.hasDifferences) {
        toast.success('Inventario procesado con diferencias (Ajuste generado)');
      } else {
        toast.success('Inventario procesado sin diferencias');
      }
      
      loadInventory(inventory.id!);
    } catch (error: any) {
      toast.error(error.response?.data || 'Error al procesar el inventario');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!inventory) return;
    
    if (!window.confirm('¿Está seguro de anular esta toma física? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsCanceling(true);
    try {
      await physicalInventoryService.cancel(inventory.id!);
      toast.success('Inventario anulado exitosamente');
      loadInventory(inventory.id!);
    } catch (error: any) {
      toast.error(error.response?.data || 'Error al anular el inventario');
    } finally {
      setIsCanceling(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Cargando...</div>;
  }

  if (!inventory) {
    return <div className="p-6 text-center text-red-500">Toma de inventario no encontrada</div>;
  }

  const isProcessed = inventory.status === 'PROCESSED';

  const filteredDetails = details.filter(d => 
    (d.sparePart?.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.sparePart?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const uncountedCount = details.filter(d => d.realStock === undefined).length;
  const withDiffCount = details.filter(d => d.realStock !== undefined && d.realStock !== d.theoreticalStock).length;

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/inventory/physical')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <ArrowLeft className="text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Toma Física: {inventory.number}
              </h1>
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                inventory.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                isProcessed ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {inventory.status === 'CANCELLED' ? 'Anulado' : isProcessed ? 'Procesado' : 'Iniciado'}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1"><PackageOpen size={14} /> {inventory.warehouse?.name}</span>
              {inventory.location && <span className="flex items-center gap-1"><MapPin size={14} /> {inventory.location.name}</span>}
            </p>
          </div>
        </div>
        
        {!isProcessed && inventory.status !== 'CANCELLED' && (
          <div className="flex items-stretch gap-3">
            <button
              onClick={handleCancel}
              disabled={isCanceling}
              className="bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2"
            >
              <Ban size={20} />
              <span>{isCanceling ? 'Anulando...' : 'Anular'}</span>
            </button>
            <button
              onClick={handleSaveProgress}
              disabled={isSaving}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
            >
              <Save size={20} />
              <span className="hidden sm:inline">{isSaving ? 'Guardando...' : 'Guardar Progreso'}</span>
            </button>
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <CheckCircle size={20} />
              <span className="hidden sm:inline">{isProcessing ? 'Procesando...' : 'Procesar Ajuste'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 shrink-0">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <Calculator size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Artículos</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{details.length}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pendientes por Contar</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{uncountedCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Con Diferencias</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{withDiffCount}</p>
          </div>
        </div>
      </div>

      {/* Toolbar & Options */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 shrink-0">
        <input
          type="text"
          placeholder="Buscar repuesto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />

        {!isProcessed && (
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/50 hover:bg-red-100 transition">
            <input 
              type="checkbox" 
              checked={zeroUncounted}
              onChange={(e) => setZeroUncounted(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
            />
            <span className="font-medium text-red-800 dark:text-red-400">Colocar en cero artículos no ingresados al procesar</span>
          </label>
        )}
      </div>

      {/* Main Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Artículo</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right bg-blue-50/50 dark:bg-blue-900/10">Stock Teórico</th>
                <th className="px-6 py-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-right bg-indigo-50/50 dark:bg-indigo-900/10">Conteo Real</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDetails.map((detail) => {
                // If processed, realStock is either value or 0 depending on zeroUncounted
                // Actually if processed, backend saved it. We just show realStock.
                const diff = detail.realStock !== undefined 
                  ? detail.realStock - detail.theoreticalStock 
                  : (isProcessed ? 0 : null);

                return (
                  <tr key={detail.sparePartId} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${diff !== null && diff !== 0 ? 'bg-orange-50/30 dark:bg-orange-900/10' : ''}`}>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {detail.sparePart?.code}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {detail.sparePart?.name}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right bg-blue-50/30 dark:bg-blue-900/5 font-semibold text-gray-700 dark:text-gray-200">
                      {detail.theoreticalStock}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-right bg-indigo-50/30 dark:bg-indigo-900/5">
                      {isProcessed ? (
                        <span className="font-bold text-indigo-700 dark:text-indigo-300 text-base">
                          {detail.realStock !== undefined ? detail.realStock : (zeroUncounted ? 0 : detail.theoreticalStock)}
                        </span>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          value={detail.realStock === undefined ? '' : detail.realStock}
                          onChange={(e) => handleStockChange(detail.sparePartId, e.target.value)}
                          className="w-24 text-right bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-800 rounded-md p-1 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-indigo-700 dark:text-indigo-300"
                          placeholder="-"
                        />
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-medium">
                      {diff === null ? (
                        <span className="text-gray-400">-</span>
                      ) : diff > 0 ? (
                        <span className="text-green-600 dark:text-green-400">+{diff}</span>
                      ) : diff < 0 ? (
                        <span className="text-red-600 dark:text-red-400">{diff}</span>
                      ) : (
                        <span className="text-gray-500">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
