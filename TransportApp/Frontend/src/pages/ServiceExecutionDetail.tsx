import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workshopService } from '../services/workshopService';
import { inventoryService } from '../services/inventoryService';
import { ArrowLeft, Loader2, CheckCircle2, Clock, AlertCircle, ShoppingCart, Text, Box, Plus, Minus, X } from 'lucide-react';
import type { ServiceRequest, SparePart } from '../types';

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

  const handleCompleteFinal = async () => {
    if (!request) return;
    const mileageStr = prompt('Kilometraje actual de la gandola al finalizar todo el servicio:');
    if (!mileageStr) return;
    const mileage = Number(mileageStr);
    
    const finalObs = prompt('Conclusión general del servicio prestado:');

    try {
      await workshopService.executeService(request.id, {
        finalObservations: finalObs || undefined,
        mileageAtService: isNaN(mileage) ? undefined : mileage
      });
      alert('Ticket cerrado con éxito.');
      navigate('/workshop');
    } catch (error) {
      console.error('Error closing ticket:', error);
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
          </h1>
          <div className="text-gray-500 mt-2 flex gap-4 text-sm">
            <span>📅 {new Date(request.dateRequested).toLocaleDateString()}</span>
            <span>🚛 {request.vehicle?.licensePlate} ({request.vehicle?.brand})</span>
            <span>👨‍🔧 Mecánico: {request.mechanic?.name || 'Varios'}</span>
          </div>
        </div>
        
        {request.status !== 'Completado' && (
          <button 
            onClick={handleCompleteFinal}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
          >
            <CheckCircle2 size={18} />
            Concluir Servicio Definitivo
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
            
            {/* Parts Consumed List */}
            {request.execution?.usedSpareParts && request.execution.usedSpareParts.length > 0 && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                 {request.execution.usedSpareParts.map(usp => (
                   <div key={usp.id} className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-3 rounded-xl flex justify-between items-center animate-in fade-in zoom-in-95">
                      <div className="flex items-center gap-3">
                         <div className="bg-emerald-500 text-white p-2 rounded-lg"><Box size={16}/></div>
                         <div>
                            <div className="text-sm font-bold text-emerald-900 dark:text-emerald-100 uppercase">{usp.sparePart?.code}</div>
                            <div className="text-xs text-emerald-700 dark:text-emerald-400">{usp.sparePart?.name}</div>
                         </div>
                      </div>
                      <div className="text-xl font-black text-emerald-600">x{usp.quantity}</div>
                   </div>
                 ))}
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
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      req.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' :
                      req.status === 'Aprobada' ? 'bg-blue-100 text-blue-700' :
                      req.status === 'Comprada' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {req.status}
                    </span>
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
                <select 
                  required
                  value={selectedPartId} 
                  onChange={e => setSelectedPartId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-sm rounded border border-emerald-200 dark:border-emerald-700 px-3 py-2 mb-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                >
                  <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Seleccione repuesto...</option>
                  {spareParts.map(p => (
                    <option key={p.id} value={p.id} disabled={p.stockQuantity <= 0} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      {p.code} - {p.name} (Stock: {p.stockQuantity})
                    </option>
                  ))}
                </select>
                
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
    </div>
  );
}
