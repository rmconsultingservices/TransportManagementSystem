import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workshopService } from '../services/workshopService';
import { inventoryService } from '../services/inventoryService';
import { ArrowLeft, Loader2, CheckCircle2, Clock, AlertCircle, ShoppingCart, Text, Box, Plus, Minus, X , Trash2, Wrench, Printer } from 'lucide-react';
import type { ServiceRequest, SparePart } from '../types';
import { formatSparePartName } from '../types';
import SparePartSelector from '../components/SparePartSelector';

export default function ServiceExecutionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Note State
  const [newNote, setNewNote] = useState('');
  // Requisition State
  const [showReqForm, setShowReqForm] = useState(false);
  const [reqDesc, setReqDesc] = useState('');
  const [reqQty, setReqQty] = useState(1);
  // Stock Consumption State
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<number | ''>('');
  const [stockQty, setStockQty] = useState(1);
  const [showStockForm, setShowStockForm] = useState(false);

  // Cierre de ticket y modal de reporte
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeMileage, setCloseMileage] = useState<number | ''>('');
  const [closeObservations, setCloseObservations] = useState('');
  const [submittingClose, setSubmittingClose] = useState(false);
  const [showClosureReportModal, setShowClosureReportModal] = useState(false);

  const fetchData = async () => {
    try {
      if (!id) return;
      setLoading(true);
      const [data, parts] = await Promise.all([
        workshopService.getRequestById(Number(id)),
        inventoryService.getSpareParts()
      ]);
      setRequest(data);
      setSpareParts(parts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !request) return;
    try {
      await workshopService.addLog(request.id, newNote);
      setNewNote('');
      fetchData();
    } catch (error) {
      console.error('Error adding log:', error);
    }
  };

  const handleAddRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqDesc.trim() || !request) return;
    try {
      await workshopService.addRequisition(request.id, reqDesc, reqQty);
      setShowReqForm(false);
      setReqDesc('');
      setReqQty(1);
      fetchData();
    } catch (error) {
      console.error('Error adding req:', error);
    }
  };


  const handleDeleteRequisition = async (reqId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta requisición?')) return;
    try {
      await workshopService.deleteRequisition(reqId);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar la requisición.');
      console.error('Error deleting req:', error);
    }
  };

  const handleConsumeStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartId || !request) return;
    try {
      await workshopService.addUsedPart(request.id, Number(selectedPartId), stockQty);
      setShowStockForm(false);
      setSelectedPartId('');
      setStockQty(1);
      fetchData();
    } catch (error) {
      alert('Error: Probablemente no hay stock suficiente.');
      console.error('Error consuming stock:', error);
    }
  };

  const handleRemoveUsedPart = async (usedPartId: number) => {
    if (!request) return;
    if (!confirm('¿Desea retirar este ítem del ticket? Si era un repuesto de almacén, se reintegrará al stock.')) return;
    try {
      await workshopService.removeUsedPart(request.id, usedPartId);
      fetchData();
    } catch (error) {
      console.error('Error removing used item:', error);
      alert('Error al retirar el ítem.');
    }
  };

  const handleOpenCloseModal = () => {
    if (!request) return;
    const currentKm = request.vehicle?.currentMileage || request.trailer?.currentMileage || '';
    setCloseMileage(currentKm);
    setCloseObservations(request.execution?.finalObservations || '');
    setShowCloseModal(true);
  };

  const handleConfirmClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;

    try {
      setSubmittingClose(true);
      const mileage = closeMileage !== '' ? Number(closeMileage) : undefined;
      await workshopService.executeService(request.id, {
        finalObservations: closeObservations.trim() || undefined,
        mileageAtService: mileage && !isNaN(mileage) ? mileage : undefined
      });
      setShowCloseModal(false);
      await fetchData();
      setShowClosureReportModal(true);
    } catch (error) {
      console.error('Error closing ticket:', error);
      alert('Error al cerrar el ticket.');
    } finally {
      setSubmittingClose(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-12 text-gray-500">
        <Loader2 className="animate-spin mr-2" size={32} />
        Cargando expediente del servicio...
      </div>
    );
  }

  if (!request) {
    return <div className="p-12 text-center text-red-500">No se encontró la solicitud.</div>;
  }

  const allUsedItems = request.execution?.usedSpareParts || [];
  const physicalParts = allUsedItems.filter(p => p.itemType !== 'S' && p.sparePart?.itemType !== 'Servicio');
  const externalServices = allUsedItems.filter(p => p.itemType === 'S' || p.sparePart?.itemType === 'Servicio');


  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/workshop')}
        className="text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 mb-4 transition-colors font-medium"
      >
        <ArrowLeft size={20} />
        Volver a la cola del taller
      </button>

      {/* Header Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Ticket #{request.id.toString().padStart(4, '0')}
            {request.status === 'Completado' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200"><CheckCircle2 size={14}/> Completado</span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><Clock size={14}/> En Proceso</span>
            )}
            {request.repairType === 'Auxilio Vial' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                🚨 Auxilio Vial
              </span>
            ) : request.repairType === 'Correctiva' ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300">
                Correctiva
              </span>
            ) : request.repairType === 'Preventiva / Correctiva' ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
                Ambas
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/60 dark:text-blue-300">
                Preventiva
              </span>
            )}
          </h1>
          <div className="text-gray-500 mt-2 flex gap-4 text-sm">
            <span>📅 {new Date(request.dateRequested).toLocaleDateString()}</span>
            <span>🚛 {request.vehicle?.licensePlate || request.trailer?.licensePlate || 'N/A'} ({request.vehicle?.brand || request.trailer?.type || ''})</span>
            <span><Wrench size={16} className="inline mr-1.5 text-gray-400" /> Mecánico: {request.mechanic?.name || 'Varios'}</span>
          </div>
          {request.roadsideLocation && (
            <div className="mt-3 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 p-2.5 rounded-lg flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded">
                📍 Ubicación Vial:
              </span>
              <span className="font-semibold">{request.roadsideLocation}</span>
            </div>
          )}
        </div>
        
        {request.status !== 'Completado' ? (
            <button 
              onClick={handleOpenCloseModal}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm cursor-pointer"
            >
              <CheckCircle2 size={18} />
              Concluir Servicio Definitivo
            </button>
          ) : (
            <button 
              onClick={() => setShowClosureReportModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm cursor-pointer"
            >
              <Printer size={18} />
              Ver Reporte de Cierre
            </button>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Progress & Requisitions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Progress Logs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
              <Text className="text-indigo-500" size={20}/>
              Bitácora de Progreso y Repuestos Utilizados
            </h2>
            
            {/* External Services Consumed List */}
            {externalServices.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Wrench size={14} className="text-amber-600" />
                  Servicios y Trabajos Externos Facturados ({externalServices.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {externalServices.map(usp => {
                     const supplier = usp.purchaseInvoiceDetail?.purchaseInvoice?.supplier?.name;
                     const invNum = usp.purchaseInvoiceDetail?.purchaseInvoice?.invoiceNumber;
                     return (
                       <div key={usp.id} className="bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-xl flex justify-between items-center animate-in fade-in zoom-in-95">
                          <div className="flex items-center gap-3">
                             <div className="bg-amber-500 text-white p-2 rounded-lg shadow-sm"><Wrench size={16}/></div>
                             <div>
                                <div className="text-sm font-bold text-amber-950 dark:text-amber-100 uppercase">{usp.description || usp.sparePart?.name || 'Servicio Externo'}</div>
                                <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                  {supplier ? `${supplier} (Fact. #${invNum})` : 'Servicio Facturado'}
                                </div>
                                <div className="text-xs font-bold text-amber-900 dark:text-amber-200 mt-0.5">
                                  ${(usp.unitCost || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} c/u
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xl font-black text-amber-700 dark:text-amber-300">x{usp.quantity}</div>
                            {request.status !== 'Completado' && (
                              <button 
                                onClick={() => handleRemoveUsedPart(usp.id)}
                                className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all"
                                title="Retirar del ticket"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                       </div>
                     );
                   })}
                </div>
              </div>
            )}

            {/* Physical Parts Consumed List */}
            {physicalParts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Box size={14} className="text-emerald-600" />
                  Repuestos Utilizados de Almacén ({physicalParts.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {physicalParts.map(usp => (
                     <div key={usp.id} className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-3 rounded-xl flex justify-between items-center animate-in fade-in zoom-in-95">
                        <div className="flex items-center gap-3">
                           <div className="bg-emerald-500 text-white p-2 rounded-lg shadow-sm"><Box size={16}/></div>
                           <div>
                              <div className="text-sm font-bold text-emerald-900 dark:text-emerald-100 uppercase">{usp.sparePart?.code || '---'}</div>
                              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{usp.description || formatSparePartName(usp.sparePart)}</div>
                              <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mt-0.5">
                                ${(usp.unitCost || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} c/u
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xl font-black text-emerald-600">x{usp.quantity}</div>
                          {request.status !== 'Completado' && (
                            <button 
                              onClick={() => handleRemoveUsedPart(usp.id)}
                              className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all"
                              title="Retirar y devolver a almacén"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}
            
            <div className="space-y-4 mb-6 relative before:absolute before:inset-0 before:-ml-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
              {(!request.logs || request.logs.length === 0) ? (
                <div className="text-gray-500 italic text-sm text-center py-4 relative z-10 bg-white dark:bg-gray-800">No hay entradas registradas aún.</div>
              ) : (
                request.logs.map(log => (
                  <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-indigo-100 dark:bg-indigo-900 text-indigo-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 mr-3 md:mr-0">
                        <CheckCircle2 size={14} />
                    </div>
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                      <div className="text-xs text-gray-500 mb-1">{new Date(log.createdAt).toLocaleString()}</div>
                      <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">{log.note}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {request.status !== 'Completado' && (
              <form onSubmit={handleAddLog} className="flex gap-2 isolate pt-4 border-t border-gray-100 dark:border-gray-700">
                <input 
                  type="text" required
                  value={newNote} onChange={e => setNewNote(e.target.value)}
                  placeholder="Ej. Se bajó la caja de velocidades para revisión..."
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
                  Anotar
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Original Issue & Requisitions */}
        <div className="space-y-6">
          
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-5">
            <h3 className="font-semibold text-amber-800 dark:text-amber-500 flex items-center gap-2 mb-2">
              <AlertCircle size={18} /> Fallo Reportado Original
            </h3>
            <p className="text-amber-900 dark:text-amber-400 text-sm leading-relaxed">
              {request.description}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="text-blue-500" size={18}/>
                Requisiciones
              </h2>
              {request.status !== 'Completado' && !showReqForm && (
                <button 
                  onClick={() => setShowReqForm(true)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                >
                  + Pedir Repuesto
                </button>
              )}
            </div>

            {showReqForm && (
              <form onSubmit={handleAddRequisition} className="mb-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre o Número de Parte</label>
                <input 
                  type="text" required
                  value={reqDesc} onChange={e => setReqDesc(e.target.value)}
                  className="w-full text-sm rounded border border-gray-300 dark:border-gray-600 px-2 py-1 mb-2 bg-white dark:bg-gray-800 outline-none"
                  placeholder="ej. Filtro Aire F150"
                />
                <div className="flex gap-2">
                   <div className="flex-1">
                     <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cant.</label>
                     <input 
                        type="number" min="1" required
                        value={reqQty} onChange={e => setReqQty(Number(e.target.value))}
                        className="w-full text-sm rounded border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-800 outline-none"
                      />
                   </div>
                   <div className="flex items-end gap-1">
                     <button type="submit" className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded font-medium">Pedir</button>
                     <button type="button" onClick={() => setShowReqForm(false)} className="bg-gray-200 text-gray-700 text-xs px-2 py-1.5 rounded font-medium">X</button>
                   </div>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {(!request.requisitions || request.requisitions.length === 0) ? (
                <p className="text-sm text-gray-500 italic text-center py-2">Sin repuestos solicitados a compras.</p>
              ) : (
                request.requisitions.map(req => (
                  <div key={req.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <div className="font-medium text-sm">{req.partNameOrDescription} <span className="text-gray-500 font-normal">x{req.quantity}</span></div>
                      <div className="text-xs text-gray-500">{new Date(req.dateRequested).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                        req.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' :
                        req.status === 'Aprobada' ? 'bg-blue-100 text-blue-700' :
                        req.status === 'Comprada' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {req.status}
                      </span>
                      {req.status === 'Pendiente' && (
                        <button 
                          onClick={() => handleDeleteRequisition(req.id)}
                          className="text-red-400 hover:text-red-600 transition-colors p-1"
                          title="Eliminar requisición"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Box className="text-emerald-500" size={18}/>
                Repuestos en Stock
              </h2>
              {request.status !== 'Completado' && !showStockForm && (
                <button 
                  onClick={() => setShowStockForm(true)}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded"
                >
                  + Usar de Almacén
                </button>
              )}
            </div>

            {showStockForm && (
              <form onSubmit={handleConsumeStock} className="mb-4 bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase mb-2">Seleccionar para Descontar</label>
                <div className="mb-3">
                  <SparePartSelector 
                    value={selectedPartId} 
                    spareParts={spareParts} 
                    onChange={val => setSelectedPartId(val)} 
                    placeholder="Escriba código o nombre..."
                  />
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="flex items-center bg-white dark:bg-gray-800 rounded border border-emerald-200 dark:border-emerald-700">
                      <button type="button" onClick={() => setStockQty(Math.max(1, stockQty-1))} className="p-2 text-emerald-600 hover:bg-emerald-50"><Minus size={16}/></button>
                      <input type="number" readOnly value={stockQty} className="w-12 text-center text-sm font-bold bg-transparent outline-none"/>
                      <button type="button" onClick={() => setStockQty(stockQty+1)} className="p-2 text-emerald-600 hover:bg-emerald-50"><Plus size={16}/></button>
                   </div>
                   <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded font-bold text-sm transition-transform active:scale-95 shadow-sm">
                      Registrar Salida
                   </button>
                   <button type="button" onClick={() => setShowStockForm(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
                </div>
              </form>
            )}

            <p className="text-xs text-gray-500 italic text-center">
              Selecciona repuestos que ya existen en inventario para registrar su uso inmediato.
            </p>
          </div>
        </div>

      </div>
    
      {/* Modal de Confirmación de Cierre del Ticket */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/60 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Concluir Servicio Definitivo</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ticket #{request.id.toString().padStart(4, '0')}</p>
                </div>
              </div>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmClose} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Kilometraje actual de la unidad ({request.vehicle?.licensePlate || request.trailer?.licensePlate || 'N/A'})
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="ej. 145200"
                  value={closeMileage}
                  onChange={e => setCloseMileage(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Este kilometraje actualizará el odómetro del vehículo en el catálogo de flota.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Conclusión técnica / Observaciones finales
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalles del trabajo final realizado, pruebas operativas, recomendaciones..."
                  value={closeObservations}
                  onChange={e => setCloseObservations(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingClose}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {submittingClose ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>Cerrar Ticket y Ver Reporte</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal del Reporte Oficial de Cierre */}
      {showClosureReportModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
                  <Printer size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Reporte Oficial de Cierre de Servicio
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ticket #{request.id.toString().padStart(4, '0')} &bull; {request.vehicle?.licensePlate || request.trailer?.licensePlate || 'Sin Placa'} &bull; Estatus: Completado
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(`/print-closure/${request.id}`, '_blank')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm shadow-indigo-600/20 active:scale-95 cursor-pointer"
                  title="Abrir en pestaña de impresión"
                >
                  <Printer size={15} />
                  <span>Imprimir / Abrir PDF</span>
                </button>

                <button
                  onClick={() => setShowClosureReportModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-xl transition-all cursor-pointer"
                  title="Cerrar vista previa"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded Print View iframe */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 overflow-hidden flex justify-center">
              <iframe
                src={`/print-closure/${request.id}`}
                title="Reporte de Cierre"
                className="w-full h-full rounded-xl bg-white border border-slate-200 shadow-sm"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:px-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
              <span>El servicio ha sido concluido exitosamente y el odómetro de la unidad fue actualizado.</span>
              <button
                onClick={() => setShowClosureReportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold transition-all cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>

          </div>
        </div>
      )}
</div>
  );
}


