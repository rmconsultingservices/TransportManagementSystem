import React, { useEffect, useState, useRef } from 'react';
import { FileText, Plus, Loader2, Save, X, Search, Edit, Trash, Upload, Download, AlertTriangle, RefreshCcw } from 'lucide-react';
import { purchasingService } from '../services/purchasingService';
import { inventoryService } from '../services/inventoryService';
import SparePartSelector from '../components/SparePartSelector';
import type { PurchaseInvoice, PurchaseInvoiceDetail, Supplier, SparePart } from '../types';

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [controlNumber, setControlNumber] = useState('');
  const [dateIssued, setDateIssued] = useState(new Date().toISOString().split('T')[0]);
  const [details, setDetails] = useState<Partial<PurchaseInvoiceDetail>[]>([]);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invData, supData, ptsData] = await Promise.all([
        purchasingService.getPurchaseInvoices(),
        purchasingService.getSuppliers(),
        inventoryService.getSpareParts()
      ]);
      setInvoices(invData);
      setSuppliers(supData);
      setParts(ptsData);
    } catch (error) {
      console.error('Error fetching invoices data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditingInvoiceId(null);
    setSupplierId('');
    setInvoiceNumber('');
    setControlNumber('');
    setDateIssued(new Date().toISOString().split('T')[0]);
    setDetails([]);
    setShowForm(false);
  };

  const handleEdit = (inv: PurchaseInvoice) => {
    if (inv.isCancelled) {
      alert('No se puede modificar una factura anulada.');
      return;
    }
    setEditingInvoiceId(inv.id);
    setSupplierId(inv.supplierId);
    setInvoiceNumber(inv.invoiceNumber);
    setControlNumber(inv.controlNumber || '');
    setDateIssued(inv.dateIssued.split('T')[0]);
    setDetails(inv.details?.map(d => ({ ...d })) || []);
    setShowForm(true);
  };

  const handleCancelInvoice = async (inv: PurchaseInvoice) => {
    if (inv.isCancelled) return;
    if (confirm(`¿Está seguro de que desea anular la factura ${inv.invoiceNumber}? El inventario será revertido.`)) {
      try {
        await purchasingService.cancelPurchaseInvoice(inv.id);
        alert('Factura anulada exitosamente.');
        fetchData();
      } catch (error) {
        console.error(error);
        alert('Error al anular la factura.');
      }
    }
  };

  const handleReactivateInvoice = async (inv: PurchaseInvoice) => {
    if (!inv.isCancelled) return;
    if (confirm(`¿Está seguro de que desea reactivar la factura ${inv.invoiceNumber}? El inventario será restituido.`)) {
      try {
        await purchasingService.reactivatePurchaseInvoice(inv.id);
        alert('Factura reactivada exitosamente.');
        fetchData();
      } catch (error) {
        console.error(error);
        alert('Error al reactivar la factura.');
      }
    }
  };

  const handleFileUpload = async (invoiceId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Por favor seleccione un archivo PDF válido.');
      return;
    }

    try {
      setUploadingId(invoiceId);
      await purchasingService.uploadInvoiceAttachment(invoiceId, file);
      alert('Factura PDF adjuntada correctamente.');
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al subir el archivo adjunto.');
    } finally {
      setUploadingId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addLine = () => {
    setDetails([...details, { sparePartId: 0, quantityReceived: 1, unitCost: 0, taxPercentage: 16 }]);
  };

  const removeLine = (index: number) => {
    const newDetails = [...details];
    newDetails.splice(index, 1);
    setDetails(newDetails);
  };

  const updateLine = (index: number, field: keyof PurchaseInvoiceDetail, value: any) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  const calculateTotals = () => {
    let sub = 0;
    let tax = 0;
    details.forEach(d => {
      const lineSub = (d.quantityReceived || 0) * (d.unitCost || 0);
      const lineTax = lineSub * ((d.taxPercentage || 0) / 100);
      sub += lineSub;
      tax += lineTax;
    });
    return { subTotal: sub, taxAmount: tax, total: sub + tax };
  };

  const totals = calculateTotals();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (supplierId === '' || !invoiceNumber || details.length === 0) {
        alert('Llene el encabezado y agregue al menos un renglón para guardar.');
        return;
    }

    const hasInvalidLine = details.some(d => !d.sparePartId || d.sparePartId === 0);
    if (hasInvalidLine) {
        alert('Por favor seleccione un artículo válido en cada renglón.');
        return;
    }

    try {
      const payload = {
        supplierId: Number(supplierId),
        invoiceNumber,
        controlNumber: controlNumber || undefined,
        dateIssued: new Date(dateIssued).toISOString(),
        paymentCondition: '001',
        details: details as PurchaseInvoiceDetail[]
      };

      if (editingInvoiceId) {
        await purchasingService.updatePurchaseInvoice(editingInvoiceId, payload as PurchaseInvoice);
        alert('Factura modificada e inventario actualizado exitosamente.');
      } else {
        await purchasingService.createPurchaseInvoice(payload);
        alert('Factura cargada e inventario actualizado exitosamente.');
      }
      
      resetForm();
      fetchData();
    } catch (error) {
       console.error('Error saving invoice:', error);
       alert('Error de conexión guardando la factura.');
    }
  };

  if (loading && invoices.length === 0) {
     return <div className="py-12 text-center text-gray-500 flex justify-center"><Loader2 className="animate-spin mr-2"/> Cargando módulo de facturación...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Facturas de Compra (CxP)</h2>
          <p className="text-sm text-gray-500">Gestión de facturas, adjuntos PDF e ingreso de mercancía.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => { resetForm(); setShowForm(true); addLine(); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} /> Cargar Nueva Factura
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-visible animate-in fade-in slide-in-from-top-4 relative">
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                 {editingInvoiceId ? 'Editar Factura' : 'Datos del Encabezado'}
               </h2>
               <button type="button" onClick={resetForm} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="md:col-span-1">
                 <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Proveedor</label>
                 <select required value={supplierId} onChange={e => setSupplierId(e.target.value === '' ? '' : Number(e.target.value))} className="w-full text-sm rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Seleccione...</option>
                    {suppliers.filter(s => s.isActive || s.id === supplierId).map(s => <option key={s.id} value={s.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{s.name}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Fecha Emisión</label>
                 <input type="date" required value={dateIssued} onChange={e => setDateIssued(e.target.value)} className="w-full text-sm rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800" />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nro. Factura</label>
                 <input type="text" required value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800" placeholder="Ej. 0001423"/>
               </div>
               <div>
                 <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nro. Control</label>
                 <input type="text" value={controlNumber} onChange={e => setControlNumber(e.target.value)} className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800" placeholder="Ej. 00-01235"/>
               </div>
             </div>
          </div>

          <div className="p-0 overflow-visible">
             <table className="w-full text-sm text-left whitespace-nowrap">
               <thead className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 uppercase font-semibold">
                 <tr>
                   <th className="px-4 py-3 w-10">Reng.</th>
                   <th className="px-4 py-3 min-w-[280px]">Artículo / Repuesto destino</th>
                   <th className="px-4 py-3 w-32">Cantidad</th>
                   <th className="px-4 py-3 w-40">Costo Unit. ($)</th>
                   <th className="px-4 py-3 w-24">% IVA</th>
                   <th className="px-4 py-3 w-32 text-right">Neto ($)</th>
                   <th className="px-4 py-3 w-16"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                 {details.map((d, index) => {
                    const lineNet = (d.quantityReceived || 0) * (d.unitCost || 0);
                    return (
                     <tr key={index} className="bg-white dark:bg-gray-900 group">
                       <td className="px-4 py-2 font-mono text-gray-400">{index + 1}</td>
                       <td className="px-4 py-2 min-w-[280px]">
                          <SparePartSelector
                            value={d.sparePartId || ''}
                            onChange={id => updateLine(index, 'sparePartId', id)}
                            spareParts={parts}
                            placeholder="-- Buscar Artículo en Inventario --"
                          />
                       </td>
                       <td className="px-4 py-2">
                         <input type="number" step="0.01" min="0.01" required value={d.quantityReceived} onChange={e => updateLine(index, 'quantityReceived', Number(e.target.value))} className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-650 focus:border-blue-500 focus:ring-0 px-0 py-1 text-sm dark:text-white"/>
                       </td>
                       <td className="px-4 py-2">
                         <input type="number" step="0.01" min="0" required value={d.unitCost} onChange={e => updateLine(index, 'unitCost', Number(e.target.value))} className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-650 focus:border-blue-500 focus:ring-0 px-0 py-1 text-sm dark:text-white"/>
                       </td>
                       <td className="px-4 py-2">
                         <select value={d.taxPercentage} onChange={e => updateLine(index, 'taxPercentage', Number(e.target.value))} className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-650 focus:border-blue-500 focus:ring-0 px-0 py-1 text-sm text-gray-500 dark:text-gray-300">
                           <option value={16}>16.00</option>
                           <option value={8}>8.00</option>
                           <option value={0}>0.00 (E)</option>
                         </select>
                       </td>
                       <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-gray-100">{lineNet.toFixed(2)}</td>
                       <td className="px-4 py-2 text-center">
                         <button type="button" onClick={() => removeLine(index)} className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
                       </td>
                     </tr>
                    )
                 })}
               </tbody>
             </table>
             <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
               <button type="button" onClick={addLine} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"><Plus size={16}/> Insertar Renglón</button>
             </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800/80 p-6 flex flex-col md:flex-row justify-between items-end border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 flex-1 w-full max-w-sm">
                Nota: Al guardar la factura, el inventario será modificado en función de las cantidades registradas.
            </div>
            
            <div className="w-64 space-y-2 text-sm mt-4 md:mt-0">
               <div className="flex justify-between text-gray-600"><span>Subtotal:</span> <span>${totals.subTotal.toFixed(2)}</span></div>
               <div className="flex justify-between text-gray-600"><span>I.V.A.:</span> <span>${totals.taxAmount.toFixed(2)}</span></div>
               <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white border-t border-gray-300 pt-2 mt-2">
                  <span>Total Factura:</span> <span>${totals.total.toFixed(2)}</span>
               </div>
               
               <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg mt-4 flex items-center justify-center gap-2 shadow-sm transition-colors">
                 <Save size={20}/> {editingInvoiceId ? 'Guardar Cambios' : 'Procesar y Totalizar'}
               </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="relative w-full md:w-80">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por Factura o Proveedor..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={(e) => {
                 if (uploadingId) handleFileUpload(uploadingId, e);
              }}
            />
          </div>

          {invoices.length === 0 ? (
            <div className="py-12 text-center text-gray-500 border border-dashed rounded-xl border-gray-300 dark:border-gray-700">No hay facturas registradas.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {invoices
                .filter(inv => {
                  const search = searchTerm.toLowerCase();
                  const invNum = inv.invoiceNumber.toLowerCase();
                  const supplier = inv.supplier?.name.toLowerCase() || '';
                  return invNum.includes(search) || supplier.includes(search);
                })
                .map(inv => (
                  <div key={inv.id} className={`border p-5 rounded-xl transition-shadow ${inv.isCancelled ? 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30' : 'border-gray-200 dark:border-gray-700 hover:shadow-md'}`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-150 dark:border-gray-700 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-lg ${inv.isCancelled ? 'text-red-800 line-through' : 'text-gray-900 dark:text-white'}`}>
                            Factura #{inv.invoiceNumber}
                          </span>
                          {inv.isCancelled && (
                            <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertTriangle size={12}/> ANULADA
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Proveedor: <span className="font-semibold text-gray-700 dark:text-gray-300">{inv.supplier?.name}</span> • 
                          Emisión: {new Date(inv.dateIssued).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Costo Total</div>
                          <div className={`text-xl font-bold ${inv.isCancelled ? 'text-red-600' : 'text-blue-600'}`}>${inv.totalAmount.toFixed(2)}</div>
                        </div>
                        
                        <div className="flex items-center gap-2 border-l pl-4 border-gray-200 dark:border-gray-700">
                          {inv.attachmentUrl ? (
                            <a 
                              href={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${inv.attachmentUrl}` : `http://localhost:5000${inv.attachmentUrl}`}
                              target="_blank" rel="noreferrer"
                              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors"
                              title="Ver PDF Adjunto"
                            >
                              <FileText size={18} />
                            </a>
                          ) : (
                            <button 
                              onClick={() => {
                                setUploadingId(inv.id);
                                setTimeout(() => fileInputRef.current?.click(), 0);
                              }}
                              disabled={uploadingId === inv.id || inv.isCancelled}
                              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-blue-600 disabled:opacity-50 transition-colors"
                              title="Subir Factura PDF"
                            >
                              {uploadingId === inv.id ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                            </button>
                          )}

                          {!inv.isCancelled && (
                            <>
                              <button 
                                onClick={() => handleEdit(inv)}
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors"
                                title="Editar Factura"
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={() => handleCancelInvoice(inv)}
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                                title="Anular Factura"
                              >
                                <Trash size={18} />
                              </button>
                            </>
                          )}
                          {inv.isCancelled && (
                            <button 
                              onClick={() => handleReactivateInvoice(inv)}
                              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-green-600 transition-colors"
                              title="Reactivar Factura"
                            >
                              <RefreshCcw size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
