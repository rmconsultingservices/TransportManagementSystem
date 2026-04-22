import { useEffect, useState } from 'react';
import { ShoppingCart, Building2, Plus, Loader2, DollarSign, CheckCircle2, Factory, Printer, Search, Calendar, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { purchasingService } from '../services/purchasingService';
import type { PurchaseRequisition, Supplier, PurchaseOrder } from '../types';

export default function Purchasing() {
  const [activeTab, setActiveTab] = useState<'requisitions' | 'orders' | 'suppliers'>('requisitions');
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Supplier Form
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supCode, setSupCode] = useState('');
  const [supRif, setSupRif] = useState('');
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Quoting State
  const [quotingReqId, setQuotingReqId] = useState<number | null>(null);
  const [quoteSupplierId, setQuoteSupplierId] = useState<number | ''>('');
  const [quotePrice, setQuotePrice] = useState<number | ''>('');
  const [quoteNotes, setQuoteNotes] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqData, supData, poData] = await Promise.all([
        purchasingService.getRequisitions(),
        purchasingService.getSuppliers(),
        purchasingService.getPurchaseOrders()
      ]);
      setRequisitions(reqData);
      setSuppliers(supData);
      setPurchaseOrders(poData);
    } catch (error) {
      console.error('Error fetching procurement data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await purchasingService.createSupplier({
        code: supCode || undefined,
        taxId: supRif || undefined,
        name: supName,
        contactName: supContact || undefined,
        phoneNumber: supPhone || undefined,
        address: supAddress || undefined,
        isActive: true
      });
      setShowSupplierForm(false);
      setSupCode(''); setSupRif(''); setSupName(''); setSupContact(''); setSupPhone(''); setSupAddress('');
      fetchData();
    } catch (error) {
      console.error('Error creating supplier:', error);
    }
  };

  const handleAddQuote = async (e: React.FormEvent, reqId: number) => {
    e.preventDefault();
    if (quoteSupplierId === '' || quotePrice === '') return;
    try {
      await purchasingService.addQuotation(reqId, {
        supplierId: Number(quoteSupplierId),
        unitPrice: Number(quotePrice),
        notes: quoteNotes || undefined
      });
      setQuotingReqId(null);
      setQuoteSupplierId(''); setQuotePrice(''); setQuoteNotes('');
      fetchData();
    } catch (error) {
      console.error('Error adding quote:', error);
    }
  };

  const handleSelectQuote = async (reqId: number, quoteId: number) => {
    try {
      await purchasingService.selectQuotation(reqId, quoteId);
      alert('Cotización Aprobada. Queda lista para ser agrupada en la próxima Orden de Compra de ese proveedor.');
      fetchData();
    } catch (error) {
       console.error('Error selecting quote:', error);
    }
  };

  const handleGeneratePO = async (supplierId: number) => {
    // Find all un-ordered requisitions for this supplier
    const pendingReqsForSupplier = requisitions.filter(r => 
      r.status === 'Comprada' && 
      !purchaseOrders.some(po => po.details?.some(d => d.purchaseRequisitionId === r.id)) &&
      r.quotations?.some(q => q.supplierId === supplierId && q.isSelected)
    );

    if (pendingReqsForSupplier.length === 0) {
      alert('No hay cotizaciones aprobadas pendientes para este proveedor.');
      return;
    }

    try {
      const ids = pendingReqsForSupplier.map(r => r.id);
      await purchasingService.generateFromRequisitions(supplierId, ids);
      alert(`Orden de Compra generada con éxito por ${ids.length} renglones.`);
      fetchData();
      setActiveTab('orders');
    } catch (error) {
      console.error('Error generating PO:', error);
      alert('Hubo un error al generar la orden de compra.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ShoppingCart className="text-emerald-600" size={32} />
            Compras y Requisiciones
          </h1>
          <p className="text-gray-500 mt-1">Gestión de proveedores, cotizaciones y órdenes de compra de taller.</p>
        </div>
        {activeTab === 'suppliers' && (
          <button 
            onClick={() => setShowSupplierForm(!showSupplierForm)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} /> Añadir Proveedor
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 font-medium text-sm">
        <button
          className={`px-6 py-3 transition-colors border-b-2 ${
            activeTab === 'requisitions' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
          onClick={() => { setActiveTab('requisitions'); setShowSupplierForm(false); }}
        >
          Buzón de Requisiciones
        </button>
        <button
          className={`px-6 py-3 transition-colors border-b-2 ${
            activeTab === 'orders' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
          onClick={() => { setActiveTab('orders'); setShowSupplierForm(false); }}
        >
          Órdenes de Compra
        </button>
        <button
          className={`px-6 py-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'suppliers' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('suppliers')}
        >
           Directorio de Proveedores
        </button>
      </div>

      {showSupplierForm && activeTab === 'suppliers' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
             <Building2 size={24} /> Registrar Nuevo Proveedor de Insumos
          </h2>
          <form onSubmit={handleCreateSupplier} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código Interno</label>
              <input type="text" value={supCode} onChange={e => setSupCode(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ej. PRV-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RIF</label>
              <input type="text" value={supRif} onChange={e => setSupRif(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ej. J-12345678-9" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razón Social</label>
              <input type="text" required value={supName} onChange={e => setSupName(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contacto Principal</label>
              <input type="text" value={supContact} onChange={e => setSupContact(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
              <input type="text" value={supPhone} onChange={e => setSupPhone(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
              <input type="text" value={supAddress} onChange={e => setSupAddress(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button type="submit" className="bg-emerald-600 text-white px-8 py-2 rounded-md font-medium">Guardar Proveedor</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-500"><Loader2 className="animate-spin mx-auto mb-2" size={32} />Cargando datos del módulo de compras...</div>
      ) : activeTab === 'suppliers' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500">No hay proveedores registrados.</div>
          ) : suppliers.map(sup => (
              <div key={sup.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-emerald-100 text-emerald-600 p-3 rounded-lg"><Factory size={24} /></div>
                  <div>
                    <h3 className="font-bold text-gray-900">{sup.code ? `[${sup.code}] ` : ''}{sup.name}</h3>
                    <div className="text-sm text-gray-500 mt-1">Contacto: {sup.contactName || 'N/A'}</div>
                    <div className="text-sm text-gray-500">Tlf: {sup.phoneNumber || 'N/A'}</div>
                    {sup.taxId && <div className="text-xs text-gray-400 mt-0.5">RIF: {sup.taxId}</div>}
                    {sup.address && <div className="text-xs text-gray-400 mt-0.5" title={sup.address}>Dir: {sup.address.length > 25 ? sup.address.substring(0,25) + '...' : sup.address}</div>}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      ) : activeTab === 'orders' ? (
        <div className="space-y-6">
          {/* Pending to Generate Orders List */}
          {suppliers.map(sup => {
            const pendingReqs = requisitions.filter(r => 
              r.status === 'Comprada' && 
              !purchaseOrders.some(po => po.details?.some(d => d.purchaseRequisitionId === r.id)) &&
              r.quotations?.some(q => q.supplierId === sup.id && q.isSelected)
            );
            
            if (pendingReqs.length === 0) return null;

            return (
              <div key={`pending-${sup.id}`} className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                <div>
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                    <Factory size={18}/>
                    Cotizaciones aprobadas para {sup.name}
                  </h4>
                  <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                    Hay <strong>{pendingReqs.length}</strong> cotización(es) lista(s) para ser agrupadas en una nueva documento.
                  </p>
                </div>
                <button 
                  onClick={() => handleGeneratePO(sup.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-lg shadow transition-colors whitespace-nowrap"
                >
                  Generar Orden de Compra
                </button>
              </div>
            );
          })}

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 flex-1">Registro Histórico de Órdenes</h3>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por # Orden, Proveedor o Fecha..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
          
          <div className="space-y-4">
          {purchaseOrders.filter(po => {
            const search = searchTerm.toLowerCase();
            const orderNum = po.orderNumber.toLowerCase();
            const supplier = po.supplier?.name.toLowerCase() || '';
            const date = new Date(po.dateCreated).toLocaleDateString().toLowerCase();
            return orderNum.includes(search) || supplier.includes(search) || date.includes(search);
          }).length === 0 ? (
            <div className="bg-white py-12 text-center rounded border border-gray-200 text-gray-500">No se encontraron órdenes que coincidan con la búsqueda.</div>
          ) : purchaseOrders.filter(po => {
            const search = searchTerm.toLowerCase();
            const orderNum = po.orderNumber.toLowerCase();
            const supplier = po.supplier?.name.toLowerCase() || '';
            const date = new Date(po.dateCreated).toLocaleDateString().toLowerCase();
            return orderNum.includes(search) || supplier.includes(search) || date.includes(search);
          }).map(po => (
             <div key={po.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                   <div>
                     <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                       Orden {po.orderNumber}
                       <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                          po.status === 'Pendiente por Recibir' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          'bg-gray-100 text-gray-800'
                       }`}>
                         {po.status}
                       </span>
                     </h3>
                     <div className="text-sm text-gray-500 mt-1">
                       Proveedor: <span className="font-semibold text-gray-700">{po.supplier?.name}</span>
                     </div>
                   </div>
                   <div className="text-right flex flex-col items-end gap-2">
                     <div className="flex flex-col items-end">
                       <div className="text-xs text-gray-500 mb-1">Total OC</div>
                       <div className="text-2xl font-bold text-emerald-600">${po.orderTotal.toFixed(2)}</div>
                     </div>
                     <Link 
                       to={`/print/order/${po.id}`}
                       className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                     >
                       <Printer size={16} /> Imprimir
                     </Link>
                   </div>
                </div>
                <div className="text-sm space-y-2">
                   {po.details?.map(d => (
                     <div key={d.id} className="flex justify-between py-1 border-b border-gray-50 last:border-0 text-gray-600">
                       <span>{d.quantityOrdered}x {d.purchaseRequisition?.partNameOrDescription || 'Repuesto Genérico'}</span>
                       <span className="font-medium">${(d.quantityOrdered * d.unitPrice).toFixed(2)}</span>
                     </div>
                   ))}
                </div>
             </div>
          ))}
        </div>
        </div>
      ) : (
        <div className="space-y-6">
          {requisitions.length === 0 ? (
            <div className="bg-white py-12 text-center rounded border border-gray-200 text-gray-500">Buzón de requisiciones vacío. No hay requerimientos del taller.</div>
          ) : requisitions.map(req => (
            <div key={req.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
               <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between md:items-center gap-4">
                 <div>
                   <div className="flex items-center gap-3 mb-1">
                     <span className="font-bold text-gray-900 text-lg">Requisición #{req.id.toString().padStart(4, '0')}</span>
                     <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                        req.status === 'Pendiente' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        req.status === 'Cotizando' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        req.status === 'Comprada' ? 'bg-green-100 text-green-800 border-green-200' :
                        'bg-gray-100 text-gray-800'
                     }`}>
                       {req.status}
                     </span>
                   </div>
                   <div className="text-sm text-gray-600 mb-2">
                     Repuesto: <strong className="text-indigo-600 text-base">{req.partNameOrDescription}</strong> (Cant: {req.quantity})
                   </div>
                   
                   {req.serviceRequest && (
                     <div className="bg-white border border-gray-200 rounded-md p-3 mb-2 shadow-sm">
                       <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                         Motivo de la Solicitud (OT #{req.serviceRequestId})
                         <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">{req.serviceRequest.repairType}</span>
                       </div>
                       <p className="text-sm text-gray-700 italic">"{req.serviceRequest.description}"</p>
                     </div>
                   )}

                   <div className="text-xs text-gray-500 mt-1">
                     Vehículo: {req.serviceRequest?.vehicle?.licensePlate || req.serviceRequest?.trailer?.licensePlate || 'Unidad desconocida'} • Solicitado el {new Date(req.dateRequested).toLocaleDateString()}
                   </div>
                 </div>
                 {req.status !== 'Comprada' && quotingReqId !== req.id && (
                   <button 
                     onClick={() => setQuotingReqId(req.id)}
                     className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm whitespace-nowrap"
                   >
                     + Ingresar Cotización
                   </button>
                 )}
               </div>

               {/* Quotations Form */}
               {quotingReqId === req.id && (
                 <div className="p-5 bg-blue-50/50 border-b border-gray-100">
                   <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-800"><DollarSign size={16}/> Nueva Cotización</h4>
                   <form onSubmit={(e) => handleAddQuote(e, req.id)} className="flex flex-wrap gap-4 items-end">
                     <div className="flex-1 min-w-[200px]">
                       <label className="block text-xs text-gray-600 mb-1">Proveedor</label>
                       <select required value={quoteSupplierId} onChange={e => setQuoteSupplierId(e.target.value === '' ? '' : Number(e.target.value))} className="w-full text-sm rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                         <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Seleccione proveedor...</option>
                         {suppliers.map(s => <option key={s.id} value={s.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{s.name}</option>)}
                       </select>
                     </div>
                     <div className="w-32">
                       <label className="block text-xs text-gray-600 mb-1">Precio Unit. ($)</label>
                       <input type="number" step="0.01" required value={quotePrice} onChange={e => setQuotePrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full text-sm rounded border border-gray-300 px-3 py-2 bg-white" placeholder="0.00"/>
                     </div>
                     <div className="flex-1 min-w-[200px]">
                       <label className="block text-xs text-gray-600 mb-1">Notas (Opcional)</label>
                       <input type="text" value={quoteNotes} onChange={e => setQuoteNotes(e.target.value)} className="w-full text-sm rounded border border-gray-300 px-3 py-2 bg-white" placeholder="Ej. Original GM, Entrega 3 días..."/>
                     </div>
                     <div className="flex gap-2">
                       <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium">Registrar Cotización</button>
                       <button type="button" onClick={() => setQuotingReqId(null)} className="text-gray-500 text-sm px-2">Cancelar</button>
                     </div>
                   </form>
                 </div>
               )}

               {/* Quotes List */}
               {req.quotations && req.quotations.length > 0 && (
                 <div className="p-5">
                   <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Cuadro Comparativo de Presupuestos ({req.quotations.length})</h4>
                   <div className="space-y-2">
                     {req.quotations.map(quote => (
                       <div key={quote.id} className={`flex justify-between items-center p-3 rounded-lg border ${
                         quote.isSelected 
                          ? 'bg-green-50 border-green-200' 
                          : req.status === 'Comprada' ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200'
                       }`}>
                         <div className="flex-1">
                           <div className="font-semibold text-gray-900">{quote.supplier?.name || `Prov #${quote.supplierId}`}</div>
                           {quote.notes && <div className="text-xs text-gray-500 italic mt-0.5">{quote.notes}</div>}
                         </div>
                         <div className="text-right flex items-center gap-4">
                           <div className="text-lg font-bold text-gray-900">
                             ${quote.unitPrice.toFixed(2)}
                             <span className="block text-[10px] text-gray-500 font-normal uppercase mt-0.5">Precio Unidad</span>
                           </div>
                           <div className="text-xl font-bold text-emerald-600">
                             ${(quote.unitPrice * req.quantity).toFixed(2)}
                             <span className="block text-[10px] text-gray-500 font-normal uppercase mt-0.5">Costo Total</span>
                           </div>
                           
                           {req.status !== 'Comprada' && (
                             <button 
                               onClick={() => handleSelectQuote(req.id, quote.id)}
                               className="ml-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded text-sm font-medium transition-colors border border-emerald-300"
                             >
                               Elegir y Comprar
                             </button>
                           )}
                           {quote.isSelected && (
                             <div className="ml-4 flex items-center gap-1 text-green-700 text-sm font-bold bg-green-200 px-3 py-1.5 rounded">
                               <CheckCircle2 size={16}/> Compra Aprobada
                             </div>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
