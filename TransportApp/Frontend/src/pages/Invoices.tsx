import { useEffect, useState } from 'react';
import { FileText, Plus, Loader2, Save, X } from 'lucide-react';
import { purchasingService } from '../services/purchasingService';
import { inventoryService } from '../services/inventoryService';
import type { PurchaseInvoice, PurchaseInvoiceDetail, Supplier, SparePart } from '../types';

export default function Invoices() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [controlNumber, setControlNumber] = useState('');
  const [dateIssued, setDateIssued] = useState(new Date().toISOString().split('T')[0]);
  
  // Invoice Lines
  const [details, setDetails] = useState<Partial<PurchaseInvoiceDetail>[]>([]);

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

    try {
      await purchasingService.createPurchaseInvoice({
        supplierId: Number(supplierId),
        invoiceNumber,
        controlNumber: controlNumber || undefined,
        dateIssued: new Date(dateIssued).toISOString(),
        paymentCondition: '001',
        details: details as PurchaseInvoiceDetail[]
      });
      alert('Factura cargada e Inventario actualizado exitosamente.');
      setShowForm(false);
      
      // Cleanup
      setSupplierId(''); setInvoiceNumber(''); setControlNumber(''); setDetails([]);
      fetchData();
    } catch (error) {
       console.error('Error saving invoice:', error);
       alert('Error de conexión guardando la factura.');
    }
  };

  if (loading && invoices.length === 0) {
     return <div className="p-8 text-center text-gray-500 flex justify-center mt-12"><Loader2 className="animate-spin mr-2"/> Cargando módulo de facturación...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="text-blue-600" size={32} />
            Facturas de Compra (Almacén)
          </h1>
          <p className="text-gray-500 mt-1">Ingreso de mercancía e insumos al stock principal del inventario.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => { setShowForm(true); if (details.length === 0) addLine(); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} /> Cargar Nueva Factura
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden mb-8 animate-in fade-in slide-in-from-top-4 relative">
          
          {/* Header Section (Master) */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Datos del Encabezado</h2>
               <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="md:col-span-1">
                 <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Proveedor</label>
                 <select required value={supplierId} onChange={e => setSupplierId(e.target.value === '' ? '' : Number(e.target.value))} className="w-full text-sm rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Seleccione...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{s.name}</option>)}
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
                 <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nº Control</label>
                 <input type="text" value={controlNumber} onChange={e => setControlNumber(e.target.value)} className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800" placeholder="Ej. 00-01235"/>
               </div>
             </div>
          </div>

          {/* Details Section (Grid) */}
          <div className="p-0 overflow-x-auto">
             <table className="w-full text-sm text-left whitespace-nowrap">
               <thead className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 uppercase font-semibold">
                 <tr>
                   <th className="px-4 py-3 w-10">Reng.</th>
                   <th className="px-4 py-3 min-w-[250px]">Artículo / Repuesto destino</th>
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
                       <td className="px-4 py-2">
                          <select required value={d.sparePartId} onChange={e => updateLine(index, 'sparePartId', Number(e.target.value))} className="w-full bg-transparent border-0 border-b border-dashed border-gray-300 focus:border-blue-500 focus:ring-0 px-0 py-1 text-sm text-blue-800 font-medium dark:text-blue-400">
                            <option value={0} disabled className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">-- Buscar Artículo en Inventario --</option>
                            {parts.map(p => <option key={p.id} value={p.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{p.code ? `[${p.code}] ` : ''}{p.name}</option>)}
                          </select>
                       </td>
                       <td className="px-4 py-2">
                         <input type="number" step="0.01" min="0.01" required value={d.quantityReceived} onChange={e => updateLine(index, 'quantityReceived', Number(e.target.value))} className="w-full bg-transparent border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 px-0 py-1 text-sm"/>
                       </td>
                       <td className="px-4 py-2">
                         <input type="number" step="0.01" min="0" required value={d.unitCost} onChange={e => updateLine(index, 'unitCost', Number(e.target.value))} className="w-full bg-transparent border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 px-0 py-1 text-sm"/>
                       </td>
                       <td className="px-4 py-2">
                         <select value={d.taxPercentage} onChange={e => updateLine(index, 'taxPercentage', Number(e.target.value))} className="w-full bg-transparent border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 px-0 py-1 text-sm text-gray-500 dark:text-gray-300">
                           <option value={16} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">16.00</option>
                           <option value={8} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">8.00</option>
                           <option value={0} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">0.00 (E)</option>
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

          {/* Totals & Footer */}
          <div className="bg-gray-100 dark:bg-gray-800/80 p-6 flex flex-col md:flex-row justify-between items-end border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 flex-1 w-full max-w-sm">
                Nota: Al totalizar la factura, las cantidades listadas se sumarán de inmediato al stock físico disponible en el inventario para su consumo en taller.
            </div>
            
            <div className="w-64 space-y-2 text-sm mt-4 md:mt-0">
               <div className="flex justify-between text-gray-600"><span>Subtotal:</span> <span>${totals.subTotal.toFixed(2)}</span></div>
               <div className="flex justify-between text-gray-600"><span>I.V.A.:</span> <span>${totals.taxAmount.toFixed(2)}</span></div>
               <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white border-t border-gray-300 pt-2 mt-2">
                  <span>Total Factura:</span> <span>${totals.total.toFixed(2)}</span>
               </div>
               
               <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg mt-4 flex items-center justify-center gap-2 shadow-sm transition-colors">
                 <Save size={20}/> Procesar y Totalizar
               </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white border border-gray-200 border-dashed rounded-xl">No hay facturas registradas en el período.</div>
          ) : invoices.map(inv => (
             <div key={inv.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
                <div className="absolute top-0 right-0 p-3 text-blue-100 group-hover:text-blue-500 transition-colors">
                  <FileText size={48} className="opacity-20 translate-x-2 -translate-y-2"/>
                </div>
                
                <h3 className="text-xl font-black text-gray-900 mb-1">FACT - {inv.invoiceNumber}</h3>
                <div className="text-sm font-semibold text-blue-800 mb-4">{inv.supplier?.name}</div>
                
                <div className="space-y-1.5 text-sm text-gray-600 mb-6">
                  <div className="flex justify-between"><span>Registrada:</span> <span className="font-medium text-gray-900">{new Date(inv.dateIssued).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span>Líneas (Items):</span> <span className="font-medium text-gray-900">{inv.details?.length || 0}</span></div>
                  <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-1.5 mt-1.5">
                    <span>Monto Total:</span> <span>${inv.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
