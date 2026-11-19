import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, PackageOpen, MapPin, Calculator, AlertTriangle, AlertCircle, Ban, QrCode, Camera } from 'lucide-react';
import type { PhysicalInventory, PhysicalInventoryDetail } from '../types/inventory';
import { formatSparePartName } from '../types/inventory';
import { physicalInventoryService } from '../services/physicalInventoryService';
import { QrScannerModal } from '../components/QrScannerModal';
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
  const [multiUnitInputs, setMultiUnitInputs] = useState<Record<number, Record<number, string>>>({});
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [scannedDetailFromWedge, setScannedDetailFromWedge] = useState<PhysicalInventoryDetail | null>(null);
  const [lastScannedPartId, setLastScannedPartId] = useState<number | null>(null);

  // Support physical USB / Bluetooth barcode & QR scanner guns (keyboard wedge)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      const now = Date.now();
      if (now - lastKeyTime > 80) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter' && buffer.length >= 4) {
        const cleaned = buffer.trim().replace(/^#/, '').toUpperCase();
        buffer = '';
        const found = details.find(d => (d.sparePart?.code || '').trim().toUpperCase() === cleaned);
        if (found) {
          setScannedDetailFromWedge(found);
          setShowQrScanner(true);
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [details]);

  const handleQrCountConfirmed = async (sparePartId: number, countedQuantity: number) => {
    setDetails(prev =>
      prev.map(d => (d.sparePartId === sparePartId ? { ...d, realStock: countedQuantity } : d))
    );
    setLastScannedPartId(sparePartId);
    toast.success(`Conteo registrado: ${countedQuantity}`);

    // Auto-save count to server in background so mobile counts are persisted immediately
    if (inventory?.id) {
      try {
        await physicalInventoryService.updateResults(inventory.id, [
          { sparePartId, realStock: countedQuantity }
        ]);
      } catch (err) {
        console.warn('Auto-save count warning:', err);
      }
    }
  };

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
    } catch (error: any) {
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

  const handleMultiStockChange = (sparePartId: number, unitId: number, value: string, sparePartUnits: any[]) => {
    setMultiUnitInputs(prev => {
      const currentInputs = prev[sparePartId] || {};
      const newInputs = { ...currentInputs, [unitId]: value };
      
      let total = 0;
      let hasInput = false;
      
      Object.entries(newInputs).forEach(([uIdStr, val]) => {
        if (val === '') return;
        const uId = Number(uIdStr);
        const qty = Number(val) || 0;
        hasInput = true;
        
        if (uId === 0) {
          total += qty;
        } else {
          const unitDef = sparePartUnits.find(u => u.unitOfMeasureId === uId);
          if (unitDef) {
            const mult = unitDef.isInverse ? (1 / (unitDef.equivalence || 1)) : unitDef.equivalence;
            total += qty * mult;
          }
        }
      });
      
      setDetails(prevDetails => prevDetails.map(d => 
        d.sparePartId === sparePartId 
          ? { ...d, realStock: hasInput ? total : undefined } 
          : d
      ));
      
      return { ...prev, [sparePartId]: newInputs };
    });
  };

  const handleSaveProgress = async () => {
    if (!inventory) return;
    setIsSaving(true);
    try {
      const payload = details
        .map(d => ({ sparePartId: d.sparePartId, realStock: d.realStock == null ? null : d.realStock }));
      
      await physicalInventoryService.updateResults(inventory.id!, payload);
      toast.success('Progreso guardado correctamente');
    } catch (error: any) {
      const msg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.title || error.response?.data?.message || 'Error al guardar el progreso');
      toast.error(msg);
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
        .map(d => ({ sparePartId: d.sparePartId, realStock: d.realStock == null ? null : d.realStock }));
      
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
      const msg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.title || error.response?.data?.message || 'Error al procesar el inventario');
      toast.error(msg);
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
      const msg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.title || error.response?.data?.message || 'Error al anular el inventario');
      toast.error(msg);
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

  const filteredDetails = details.filter(d => {
    const s = searchTerm.toLowerCase();
    const formatted = formatSparePartName(d.sparePart).toLowerCase();
    return (
      formatted.includes(s) ||
      (d.sparePart?.code || '').toLowerCase().includes(s) ||
      (d.sparePart?.name || '').toLowerCase().includes(s) ||
      (d.sparePart?.brand || '').toLowerCase().includes(s) ||
      (d.sparePart?.model || '').toLowerCase().includes(s)
    );
  });

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
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar por código, nombre, marca o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 sm:w-80 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {!isProcessed && inventory.status !== 'CANCELLED' && (
            <button
              type="button"
              onClick={() => {
                setScannedDetailFromWedge(null);
                setShowQrScanner(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-lg shadow-md shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer shrink-0"
              title="Escanear código QR del artículo o estante con la cámara"
            >
              <QrCode size={19} />
              <span>Escanear QR</span>
            </button>
          )}
        </div>

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
              {filteredDetails.map((detail, idx) => {
                // If processed, realStock is either value or 0 depending on zeroUncounted
                // Actually if processed, backend saved it. We just show realStock.
                const diff = detail.realStock != null 
                  ? detail.realStock - detail.theoreticalStock 
                  : (isProcessed ? 0 : null);

                return (
                  <tr key={detail.id || `${detail.sparePartId}-${idx}`} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${diff !== null && diff !== 0 ? 'bg-orange-50/30 dark:bg-orange-900/10' : ''}`}>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {detail.sparePart?.code}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {formatSparePartName(detail.sparePart)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right bg-blue-50/30 dark:bg-blue-900/5 font-semibold text-gray-700 dark:text-gray-200">
                      {detail.theoreticalStock}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-right bg-indigo-50/30 dark:bg-indigo-900/5">
                      {isProcessed ? (
                        <span className="font-bold text-indigo-700 dark:text-indigo-300 text-base">
                          {detail.realStock != null ? detail.realStock : (zeroUncounted ? 0 : detail.theoreticalStock)}
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1 items-end">
                          {detail.sparePart?.sparePartUnits && detail.sparePart.sparePartUnits.length > 0 ? (
                            <>
                              {detail.sparePart.sparePartUnits.map(u => (
                                <div key={u.unitOfMeasureId} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 font-medium">{u.unitOfMeasure?.abbreviation}:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={multiUnitInputs[detail.sparePartId]?.[u.unitOfMeasureId] ?? ''}
                                    onChange={(e) => handleMultiStockChange(detail.sparePartId, u.unitOfMeasureId, e.target.value, detail.sparePart!.sparePartUnits!)}
                                    className="w-20 text-right bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 rounded p-1 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm text-indigo-700 dark:text-indigo-300"
                                    placeholder="-"
                                  />
                                </div>
                              ))}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium">{detail.sparePart?.unitOfMeasure?.abbreviation || 'UND'}:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={multiUnitInputs[detail.sparePartId]?.[0] ?? ''}
                                  onChange={(e) => handleMultiStockChange(detail.sparePartId, 0, e.target.value, detail.sparePart!.sparePartUnits!)}
                                  className="w-20 text-right bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 rounded p-1 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm text-indigo-700 dark:text-indigo-300"
                                  placeholder="-"
                                />
                              </div>
                              <div className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded mt-1 border border-indigo-100 dark:border-indigo-800">
                                Total: {detail.realStock != null ? detail.realStock : '-'} {detail.sparePart?.unitOfMeasure?.abbreviation || 'UND'}
                              </div>
                            </>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              value={detail.realStock == null ? '' : detail.realStock}
                              onChange={(e) => handleStockChange(detail.sparePartId, e.target.value)}
                              className="w-24 text-right bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-800 rounded-md p-1 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-indigo-700 dark:text-indigo-300"
                              placeholder="-"
                            />
                          )}
                        </div>
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

      {/* Botón Flotante Móvil para Escaneo con el Pulgar en Pasillos */}
      {!isProcessed && inventory.status !== 'CANCELLED' && (
        <button
          type="button"
          onClick={() => {
            setScannedDetailFromWedge(null);
            setShowQrScanner(true);
          }}
          className="sm:hidden fixed bottom-5 right-5 z-40 bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-5 py-3.5 rounded-full shadow-2xl shadow-amber-500/40 flex items-center gap-2 border-2 border-white dark:border-gray-900 cursor-pointer"
        >
          <Camera size={20} />
          <span>Escanear QR</span>
        </button>
      )}

      {/* Modal Escáner QR con Cámara y Tarjeta de Conteo Rápido */}
      <QrScannerModal
        isOpen={showQrScanner}
        onClose={() => {
          setShowQrScanner(false);
          setScannedDetailFromWedge(null);
        }}
        details={details}
        onCountConfirmed={handleQrCountConfirmed}
        initialScannedDetail={scannedDetailFromWedge}
      />
    </div>
  );
}

