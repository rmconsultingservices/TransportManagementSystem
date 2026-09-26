import React, { useEffect, useState, useRef } from 'react';
import { 
  FileText, Plus, Loader2, Save, X, Search, Edit, Trash, Upload, Download, 
  AlertTriangle, RefreshCcw, DollarSign, CheckCircle2, ShoppingCart, 
  Truck, Building2, Calendar, CreditCard, ChevronDown, ChevronUp, FileSpreadsheet, 
  ExternalLink, Layers, Wrench
} from 'lucide-react';
import { purchasingService } from '../services/purchasingService';
import { inventoryService } from '../services/inventoryService';
import SparePartSelector from '../components/SparePartSelector';
import { formatSparePartName } from '../types';
import UnitSelector from '../components/UnitSelector';
import ExpensesSheetModal from './ExpensesSheetModal';
import type { 
  PurchaseInvoice, 
  PurchaseInvoiceDetail, 
  Supplier, 
  SparePart, 
  PurchaseOrder 
} from '../types';

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'CXP' | 'PAGADO'>('all');
  const [exportingExcel, setExportingExcel] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  
  const [selectedPOId, setSelectedPOId] = useState<number | ''>('');
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [controlNumber, setControlNumber] = useState('');
  const [dateIssued, setDateIssued] = useState(new Date().toISOString().split('T')[0]);
  const [details, setDetails] = useState<Partial<PurchaseInvoiceDetail>[]>([]);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);

  // Expanded card rows
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<number[]>([]);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<PurchaseInvoice | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Cargar facturas y proveedores de forma prioritaria para desplegar la lista de inmediato
      const [invData, supData] = await Promise.all([
        purchasingService.getPurchaseInvoices(),
        purchasingService.getSuppliers()
      ]);
      setInvoices(invData || []);
      setSuppliers(supData || []);
      setLoading(false);

      // Cargar repuestos y órdenes de compra en segundo plano para el formulario/modal
      Promise.all([
        inventoryService.getSpareParts(),
        purchasingService.getPurchaseOrders()
      ]).then(([ptsData, poData]) => {
        setParts(ptsData || []);
        setPurchaseOrders(poData || []);
      }).catch(err => {
        console.warn('Error al cargar datos auxiliares en segundo plano:', err);
      });
    } catch (error) {
      console.error('Error fetching invoices data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditingInvoiceId(null);
    setSelectedPOId('');
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
    setSelectedPOId(inv.purchaseOrderId || '');
    setSupplierId(inv.supplierId);
    setInvoiceNumber(inv.invoiceNumber);
    setControlNumber(inv.controlNumber || '');
    setDateIssued(inv.dateIssued ? inv.dateIssued.split('T')[0] : new Date().toISOString().split('T')[0]);
    setDetails(inv.details?.map(d => ({ ...d })) || []);
    setShowForm(true);
  };

  // Cargar ítems automáticamente al seleccionar una Orden de Compra
  const handleSelectPurchaseOrder = (poId: number | '') => {
    setSelectedPOId(poId);
    if (!poId) return;

    const po = purchaseOrders.find(p => p.id === Number(poId));
    if (!po) return;

    // Set supplier from PO
    setSupplierId(po.supplierId);

    // If PO has details, pre-populate invoice items
    if (po.details && po.details.length > 0) {
      const newLines: Partial<PurchaseInvoiceDetail>[] = po.details.map(d => {
        const req = d.purchaseRequisition;
        const sr = req?.serviceRequest;
        const veh = sr?.vehicle;
        const trailer = sr?.trailer;

        // Try to match spare part by description if available
        let matchedPartId = 0;
        if (req?.partNameOrDescription) {
          const match = parts.find(p => 
            p.name.toLowerCase() === req.partNameOrDescription.toLowerCase() ||
            p.code.toLowerCase() === req.partNameOrDescription.toLowerCase() ||
            formatSparePartName(p).toLowerCase() === req.partNameOrDescription.toLowerCase()
          );
          if (match) matchedPartId = match.id;
        }

        const matchedPart = parts.find(p => p.id === matchedPartId);
        const isPartService = matchedPart?.itemType === 'Servicio';
        const isTextService = req?.partNameOrDescription?.toLowerCase().includes('servicio') || req?.partNameOrDescription?.toLowerCase().includes('trabajo') || false;

        return {
          sparePartId: matchedPartId,
          description: req?.partNameOrDescription || 'Artículo OC',
          quantityReceived: d.quantityOrdered || 1,
          unitCost: d.unitPrice || 0,
          taxPercentage: 16,
          unitOfMeasureId: d.unitOfMeasureId || req?.unitOfMeasureId,
          purchaseOrderDetailId: d.id,
          purchaseRequisitionId: d.purchaseRequisitionId,
          purchaseRequisition: req,
          vehicleId: veh?.id || null,
          vehicle: veh,
          trailerId: trailer?.id || null,
          trailer: trailer,
          itemType: (isPartService || isTextService) ? 'S' : 'C'
        };
      });

      setDetails(newLines);
    }
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
    setDetails([...details, { 
      sparePartId: 0, 
      quantityReceived: 1, 
      unitCost: 0, 
      taxPercentage: 16,
      itemType: 'C',
      description: '' 
    }]);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingInvoice) return;
    if (!supplierId) {
      alert('Por favor seleccione un proveedor.');
      return;
    }
    if (!invoiceNumber.trim()) {
      alert('Por favor ingrese el número de factura.');
      return;
    }
    if (details.length === 0) {
      alert('Debe agregar al menos un artículo a la factura.');
      return;
    }

    for (const d of details) {
      if ((!d.sparePartId || d.sparePartId === 0) && (!d.description || !d.description.trim())) {
        alert('Cada renglón debe tener un artículo de inventario o una descripción válida.');
        return;
      }
      if ((d.quantityReceived || 0) <= 0) {
        alert('La cantidad recibida de cada artículo debe ser mayor a 0.');
        return;
      }
    }

    const totals = calculateTotals();
    const payload: Partial<PurchaseInvoice> = {
      supplierId: Number(supplierId),
      purchaseOrderId: selectedPOId ? Number(selectedPOId) : null,
      invoiceNumber: invoiceNumber.trim(),
      controlNumber: controlNumber.trim() || undefined,
      dateIssued: new Date(dateIssued).toISOString(),
      paymentCondition: '001',
      subTotal: totals.subTotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.total,
      details: details.map(d => ({
        sparePartId: (d.sparePartId && Number(d.sparePartId) > 0) ? Number(d.sparePartId) : null,
        unitOfMeasureId: d.unitOfMeasureId || undefined,
        quantityReceived: Number(d.quantityReceived),
        unitCost: Number(d.unitCost),
        taxPercentage: Number(d.taxPercentage || 0),
        purchaseOrderDetailId: d.purchaseOrderDetailId || null,
        purchaseRequisitionId: d.purchaseRequisitionId || null,
        vehicleId: d.vehicleId || null,
        trailerId: d.trailerId || null,
        itemType: d.itemType || 'C',
        description: d.description || undefined
      })) as PurchaseInvoiceDetail[]
    };

    try {
      setIsSavingInvoice(true);
      if (editingInvoiceId) {
        await purchasingService.updatePurchaseInvoice(editingInvoiceId, {
          ...payload,
          id: editingInvoiceId
        } as PurchaseInvoice);
        alert('Factura actualizada exitosamente.');
      } else {
        await purchasingService.createPurchaseInvoice(payload);
        alert('Factura cargada e inventario actualizado exitosamente.');
      }
      
      resetForm();
      fetchData();
    } catch (error: any) {
       console.error('Error saving invoice:', error);
         let errorMsg = 'Error guardando la factura.';
         if (typeof error?.response?.data === 'string') {
           errorMsg = error.response.data;
         } else if (error?.response?.data?.message) {
           errorMsg = error.response.data.message;
         } else if (error?.response?.data?.errors) {
           errorMsg = Object.values(error.response.data.errors).flat().join('\n');
         } else if (error?.response?.data?.title) {
           errorMsg = error.response.data.title;
         }
       alert(errorMsg);
    } finally {
       setIsSavingInvoice(false);
    }
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (inv: PurchaseInvoice) => {
    setPayingInvoice(inv);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod(inv.paymentMethod || 'Transferencia');
    setPaymentReference(inv.paymentReference || '');
    
    // Remaining balance
    const remaining = Math.max(0, inv.totalAmount - (inv.amountPaid || 0));
    setPaymentAmount(remaining > 0 ? remaining : inv.totalAmount);
    setPaymentModalOpen(true);
  };

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice || !paymentAmount || Number(paymentAmount) <= 0) {
      alert('Por favor ingrese un monto de pago válido.');
      return;
    }

    try {
      setSubmittingPayment(true);
      await purchasingService.recordPayment(payingInvoice.id, {
        paymentDate: new Date(paymentDate).toISOString(),
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
        amountPaid: Number(paymentAmount)
      });
      alert('Pago registrado exitosamente.');
      setPaymentModalOpen(false);
      setPayingInvoice(null);
      fetchData();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error al registrar el pago de la factura.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Export Expenses Excel Sheet (Client Exact Format)
  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const blob = await purchasingService.exportExpensesExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Registro_Gastos_Compras_TRANSPORMETALS_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Error generando el archivo Excel de compras y gastos.');
    } finally {
      setExportingExcel(false);
    }
  };

  // Toggle invoice details expansion
  const toggleExpand = (id: number) => {
    setExpandedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const totals = calculateTotals();

  // Pending purchase orders available for linking
  const availablePOs = purchaseOrders.filter(po => 
    po.status !== 'Anulada' && po.status !== 'Completada'
  );

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const search = searchTerm.toLowerCase();
    const invNum = inv.invoiceNumber.toLowerCase();
    const supplier = inv.supplier?.name.toLowerCase() || '';
    const matchSearch = invNum.includes(search) || supplier.includes(search);

    const isPaid = inv.paymentStatus?.toUpperCase() === 'PAGADO';
    if (statusFilter === 'CXP') return matchSearch && !isPaid;
    if (statusFilter === 'PAGADO') return matchSearch && isPaid;
    return matchSearch;
  });

  if (loading && invoices.length === 0) {
     return (
       <div className="py-12 text-center text-gray-500 flex justify-center items-center gap-2">
         <Loader2 className="animate-spin text-indigo-600" size={24}/>
         <span>Cargando módulo de facturación y compras...</span>
       </div>
     );
  }

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="text-indigo-600" size={24} />
            Facturas de Compra y Cuentas por Pagar (CxP)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Vinculación de órdenes de compra, ingreso a inventario, control de pagos (CXP vs Pagado) y reporte ejecutivo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botón Exportar Excel Idéntico al Cliente */}
          <button
            onClick={() => setShowExpensesModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
            title="Ver en pantalla el registro consolidado de gastos y exportar a Excel"
          >
            <FileSpreadsheet size={16} />
            <span>Ver Registro de Gastos</span>
          </button>

          {!showForm && (
            <button 
              onClick={() => { resetForm(); setShowForm(true); addLine(); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm shadow-indigo-600/20 cursor-pointer"
            >
              <Plus size={16} /> Cargar Nueva Factura
            </button>
          )}
        </div>
      </div>

      {/* FORMULARIO DE FACTURA CON CARGA DESDE ORDEN DE COMPRA */}
      {showForm ? (
        <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-visible animate-in fade-in slide-in-from-top-4 relative">
          
          {/* Banner de Vinculación con Orden de Compra */}
          <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 rounded-t-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    Automatización 1-Clic
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Cargar datos desde una Orden de Compra aprobada
                  </h3>
                </div>
              </div>

              <div className="w-full sm:w-80">
                <select
                  value={selectedPOId}
                  onChange={(e) => handleSelectPurchaseOrder(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-xs font-semibold rounded-xl border border-indigo-200 dark:border-indigo-800 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                >
                  <option value="">-- Sin Orden de Compra (Carga Directa) --</option>
                  {availablePOs.map(po => (
                    <option key={po.id} value={po.id}>
                      {po.orderNumber} • {po.supplier?.name} (${po.orderTotal.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {selectedPOId && (
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-2">
                ✓ Ítems, cantidades, costos, requisición y vehículos precargados automáticamente. La Orden de Compra se marcará como completada al guardar.
              </p>
            )}
          </div>

          <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                 {editingInvoiceId ? 'Editar Factura' : 'Datos del Encabezado'}
               </h2>
               <button type="button" onClick={resetForm} className="text-gray-400 hover:text-red-500 cursor-pointer">
                 <X size={20}/>
               </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="md:col-span-1">
                 <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Proveedor</label>
                 <select 
                   required 
                   value={supplierId} 
                   onChange={e => setSupplierId(e.target.value === '' ? '' : Number(e.target.value))} 
                   className="w-full text-xs font-medium rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                 >
                    <option value="" disabled>Seleccione proveedor...</option>
                    {suppliers.filter(s => s.isActive || s.id === supplierId).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Fecha Emisión</label>
                 <input 
                   type="date" 
                   required 
                   value={dateIssued} 
                   onChange={e => setDateIssued(e.target.value)} 
                   className="w-full text-xs font-medium rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" 
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Nro. Factura</label>
                 <input 
                   type="text" 
                   required 
                   value={invoiceNumber} 
                   onChange={e => setInvoiceNumber(e.target.value)} 
                   className="w-full text-xs font-medium rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" 
                   placeholder="Ej. 0001423"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Nro. Control</label>
                 <input 
                   type="text" 
                   value={controlNumber} 
                   onChange={e => setControlNumber(e.target.value)} 
                   className="w-full text-xs font-medium rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" 
                   placeholder="Ej. 00-01235"
                 />
               </div>
             </div>
          </div>

          <div className="p-0 overflow-x-auto min-h-[380px] pb-44">
             <table className="w-full text-xs text-left whitespace-nowrap">
               <thead className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 uppercase font-bold">
                 <tr>
                   <th className="px-4 py-3 w-10">Reng.</th>
                   <th className="px-4 py-3 w-20">Tipo</th>
                   <th className="px-4 py-3 min-w-[280px]">Artículo / Descripción</th>
                   <th className="px-4 py-3 min-w-[180px]">Destino (Vehículo / Req)</th>
                   <th className="px-4 py-3 w-28">Unidad</th>
                   <th className="px-4 py-3 w-24">Cantidad</th>
                   <th className="px-4 py-3 w-32">Costo Unit. ($)</th>
                   <th className="px-4 py-3 w-20">% IVA</th>
                   <th className="px-4 py-3 w-28 text-right">Neto ($)</th>
                   <th className="px-4 py-3 w-12"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                 {details.map((d, index) => {
                    const lineNet = (d.quantityReceived || 0) * (d.unitCost || 0);
                    const veh = d.vehicle;
                    const req = d.purchaseRequisition;
                    return (
                     <tr key={index} className="bg-white dark:bg-gray-900 group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                       <td className="px-4 py-2 font-mono text-gray-400">{index + 1}</td>
                       
                       {/* Tipo: Compra de repuesto ('C') vs Servicio ('S') */}
                       <td className="px-4 py-2">
                         <select
                           value={d.itemType || 'C'}
                           onChange={e => updateLine(index, 'itemType', e.target.value)}
                           className="bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 dark:text-gray-300"
                         >
                           <option value="C">C (Compra)</option>
                           <option value="S">S (Servicio)</option>
                         </select>
                       </td>

                       {/* Artículo o Descripción */}
                       <td className="px-4 py-2 min-w-[280px] relative">
                         {d.itemType === 'S' ? (
                           <input
                             type="text"
                             value={d.description || ''}
                             onChange={e => updateLine(index, 'description', e.target.value)}
                             placeholder="Descripción del servicio (ej. Reparación de radiador)"
                             className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-0 px-1 py-1 text-xs text-gray-900 dark:text-white font-medium"
                             required
                           />
                         ) : (
                           <div className="space-y-1">
                             <SparePartSelector
                               value={d.sparePartId || ''}
                               onChange={id => {
                                 updateLine(index, 'sparePartId', id);
                                 const part = parts.find(p => p.id === id);
                                 if (part) {
                                   if (!d.unitCost) updateLine(index, 'unitCost', part.unitCost || 0);
                                   if (part.unitOfMeasureId && !d.unitOfMeasureId) updateLine(index, 'unitOfMeasureId', part.unitOfMeasureId);
                                   if (part.itemType === 'Servicio') {
                                     updateLine(index, 'itemType', 'S');
                                     if (!d.description) updateLine(index, 'description', part.name);
                                   }
                                 }
                               }}
                               spareParts={parts}
                               placeholder="-- Buscar en Catálogo de Repuestos --"
                             />
                             {d.description && !d.sparePartId && (
                               <div className="text-[10px] text-slate-400 italic">
                                 Texto original OC: {d.description}
                               </div>
                             )}
                           </div>
                         )}
                       </td>

                       {/* Destino (Vehículo / Req) */}
                       <td className="px-4 py-2 min-w-[180px]">
                         <div className="text-xs">
                           {veh ? (
                             <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-mono">
                               <Truck size={12} /> {veh.licensePlate} {veh.fleetOwner ? `(${veh.fleetOwner.name})` : ''}
                             </span>
                           ) : (
                             <span className="text-slate-400 italic text-[11px]">Stock Almacén</span>
                           )}
                           {req && (
                             <span className="text-[10px] text-slate-500 block font-mono">
                               Req: R.{req.id}
                             </span>
                           )}
                         </div>
                       </td>

                       {/* Unidad de Medida */}
                       <td className="px-4 py-2 min-w-[110px]">
                          <UnitSelector
                            sparePartId={d.sparePartId || ''}
                            spareParts={parts}
                            value={d.unitOfMeasureId || ''}
                            onChange={id => updateLine(index, 'unitOfMeasureId', id)}
                          />
                       </td>

                       {/* Cantidad */}
                       <td className="px-4 py-2">
                         <input 
                           type="number" 
                           step="0.01" 
                           min="0.01" 
                           required 
                           value={d.quantityReceived} 
                           onChange={e => updateLine(index, 'quantityReceived', Number(e.target.value))} 
                           className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-0 px-1 py-1 text-xs text-right font-mono font-bold dark:text-white"
                         />
                       </td>

                       {/* Costo Unitario */}
                       <td className="px-4 py-2">
                         <input 
                           type="number" 
                           step="0.01" 
                           min="0" 
                           required 
                           value={d.unitCost} 
                           onChange={e => updateLine(index, 'unitCost', Number(e.target.value))} 
                           className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-0 px-1 py-1 text-xs text-right font-mono font-bold dark:text-white"
                         />
                       </td>

                       {/* % IVA */}
                       <td className="px-4 py-2">
                         <select 
                           value={d.taxPercentage} 
                           onChange={e => updateLine(index, 'taxPercentage', Number(e.target.value))} 
                           className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-0 px-1 py-1 text-xs text-gray-600 dark:text-gray-300"
                         >
                           <option value={16}>16%</option>
                           <option value={8}>8%</option>
                           <option value={0}>0% (E)</option>
                         </select>
                       </td>

                       {/* Neto */}
                       <td className="px-4 py-2 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                         ${lineNet.toFixed(2)}
                       </td>

                       {/* Eliminar fila */}
                       <td className="px-4 py-2 text-center">
                         <button 
                           type="button" 
                           onClick={() => removeLine(index)} 
                           className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                         >
                           <X size={15}/>
                         </button>
                       </td>
                     </tr>
                    );
                 })}
               </tbody>
             </table>
          </div>

          {/* Pie del formulario con totales y botón agregar renglón */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center">
            <button 
              type="button" 
              onClick={addLine}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15}/> Agregar Otro Renglón
            </button>
            
            <div className="w-72 space-y-2 text-xs mt-4 md:mt-0 font-medium">
               <div className="flex justify-between text-gray-600 dark:text-gray-400">
                 <span>Subtotal:</span> <span className="font-mono">${totals.subTotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-gray-600 dark:text-gray-400">
                 <span>I.V.A.:</span> <span className="font-mono">${totals.taxAmount.toFixed(2)}</span>
               </div>
               <div className="flex justify-between font-black text-base text-gray-900 dark:text-white border-t border-gray-300 dark:border-gray-700 pt-2 mt-2">
                  <span>Total Factura:</span> <span className="font-mono text-indigo-600 dark:text-indigo-400">${totals.total.toFixed(2)}</span>
               </div>
               
               <button 
                  type="submit" 
                  disabled={isSavingInvoice}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl mt-3 flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  {isSavingInvoice ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{editingInvoiceId ? 'Guardando...' : 'Procesando e ingresando stock...'}</span>
                    </>
                  ) : (
                    <>
                      <Save size={16}/> 
                      <span>{editingInvoiceId ? 'Guardar Cambios' : 'Procesar Factura y Actualizar Stock'}</span>
                    </>
                  )}
                </button>
            </div>
          </div>
        </form>
      ) : (
        /* VISTA LISTA DE FACTURAS CON STATUS CXP / PAGADO */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          
          {/* Controles de Búsqueda y Filtros de Estatus */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input 
                type="text" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Buscar por Nº factura o proveedor..." 
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-slate-50 dark:bg-gray-900/80 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium" 
              />
            </div>

            {/* Toggle Filtro CXP / PAGADO */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todas ({invoices.length})
              </button>
              <button
                onClick={() => setStatusFilter('CXP')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'CXP'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                <span>CXP ({invoices.filter(i => i.paymentStatus?.toUpperCase() !== 'PAGADO').length})</span>
              </button>
              <button
                onClick={() => setStatusFilter('PAGADO')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'PAGADO'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>Pagadas ({invoices.filter(i => i.paymentStatus?.toUpperCase() === 'PAGADO').length})</span>
              </button>
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

          {filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs italic border border-dashed rounded-xl border-gray-300 dark:border-gray-700">
              No se encontraron facturas con los criterios seleccionados.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map(inv => {
                const isPaid = inv.paymentStatus?.toUpperCase() === 'PAGADO';
                const isExpanded = expandedInvoiceIds.includes(inv.id);
                const remaining = Math.max(0, inv.totalAmount - (inv.amountPaid || 0));

                return (
                  <div 
                    key={inv.id} 
                    className={`border rounded-2xl transition-all ${
                      inv.isCancelled 
                        ? 'border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30' 
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:shadow-sm'
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      
                      {/* Lado Izquierdo: Datos de Factura y Proveedor */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className={`font-mono font-black text-base ${inv.isCancelled ? 'text-red-800 line-through' : 'text-slate-900 dark:text-white'}`}>
                            #{inv.invoiceNumber}
                          </span>

                          {/* Badge ESTATUS EXACTO AL CLIENTE: CXP o PAGADO */}
                          {inv.isCancelled ? (
                            <span className="bg-red-100 text-red-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-red-200">
                              <AlertTriangle size={11}/> ANULADA
                            </span>
                          ) : isPaid ? (
                            <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                              PAGADO
                            </span>
                          ) : (
                            <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                              CXP
                            </span>
                          )}

                          {/* Badge de Orden de Compra si existe */}
                          {inv.purchaseOrder && (
                            <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <ShoppingCart size={11} /> OC: {inv.purchaseOrder.orderNumber}
                            </span>
                          )}

                          {inv.controlNumber && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              (Control: {inv.controlNumber})
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {inv.supplier?.name}
                          </span>
                          <span>•</span>
                          <span>Emisión: {inv.dateIssued ? new Date(inv.dateIssued).toLocaleDateString('es-ES') : '—'}</span>
                          <span>•</span>
                          <span>{inv.details?.length ?? 0} {inv.details?.length === 1 ? 'ítem' : 'ítems'}</span>
                        </div>

                        {/* Datos de Pago si está pagado o abonado */}
                        {inv.paymentDate && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2 pt-0.5">
                            <CheckCircle2 size={12} />
                            <span>
                              Liquidado el {new Date(inv.paymentDate).toLocaleDateString('es-ES')} 
                              {inv.paymentMethod ? ` • ${inv.paymentMethod}` : ''} 
                              {inv.paymentReference ? ` (Ref: ${inv.paymentReference})` : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Lado Derecho: Totales y Botones de Acción */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Factura</div>
                          <div className={`text-lg font-black font-mono ${inv.isCancelled ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                            ${inv.totalAmount.toFixed(2)}
                          </div>
                          {!isPaid && !inv.isCancelled && remaining > 0 && remaining < inv.totalAmount && (
                            <div className="text-[10px] font-bold text-amber-600 font-mono">
                              Resta: ${remaining.toFixed(2)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Botón Registrar Pago (Sólo si no está pagada totalmente) */}
                          {!inv.isCancelled && !isPaid && (
                            <button
                              onClick={() => handleOpenPaymentModal(inv)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 dark:bg-indigo-950/60 dark:hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-indigo-200 dark:border-indigo-800 cursor-pointer shadow-sm"
                              title="Registrar pago a esta factura (cambia de CXP a PAGADO)"
                            >
                              <CreditCard size={13} />
                              <span>Registrar Pago</span>
                            </button>
                          )}

                          {/* Ver PDF Adjunto */}
                          {inv.attachmentUrl ? (
                            <a 
                              href={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${inv.attachmentUrl}` : `http://localhost:5000${inv.attachmentUrl}`}
                              target="_blank" rel="noreferrer"
                              className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                              title="Ver PDF Adjunto"
                            >
                              <FileText size={15} />
                            </a>
                          ) : (
                            <button 
                              onClick={() => {
                                setUploadingId(inv.id);
                                setTimeout(() => fileInputRef.current?.click(), 0);
                              }}
                              disabled={uploadingId === inv.id || inv.isCancelled}
                              className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-indigo-600 disabled:opacity-50 transition-colors cursor-pointer"
                              title="Subir Factura PDF"
                            >
                              {uploadingId === inv.id ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                            </button>
                          )}

                          {!inv.isCancelled && (
                            <>
                              <button 
                                onClick={() => handleEdit(inv)}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                title="Editar Factura"
                              >
                                <Edit size={15} />
                              </button>
                              <button 
                                onClick={() => handleCancelInvoice(inv)}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Anular Factura"
                              >
                                <Trash size={15} />
                              </button>
                            </>
                          )}
                          {inv.isCancelled && (
                            <button 
                              onClick={() => handleReactivateInvoice(inv)}
                              className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-green-600 transition-colors cursor-pointer"
                              title="Reactivar Factura"
                            >
                              <RefreshCcw size={15} />
                            </button>
                          )}

                          {/* Toggle Desglose de Ítems */}
                          <button
                            onClick={() => toggleExpand(inv.id)}
                            className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                            title={isExpanded ? 'Ocultar renglones' : 'Ver renglones comprados'}
                          >
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Desglose Expandible de Renglones */}
                    {isExpanded && inv.details && inv.details.length > 0 && (
                      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4 rounded-b-2xl animate-in fade-in">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[10px] font-bold">
                              <th className="pb-2">Reng.</th>
                              <th className="pb-2">Tipo</th>
                              <th className="pb-2">Descripción</th>
                              <th className="pb-2">Destino / Empresa</th>
                              <th className="pb-2 text-center">Cant.</th>
                              <th className="pb-2 text-right">C.U ($)</th>
                              <th className="pb-2 text-right">Total ($)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
                            {inv.details.map((d, dIdx) => {
                              const desc = d.description || formatSparePartName(d.sparePart) || 'Artículo';
                              const veh = d.vehicle;
                              const trailer = d.trailer;
                              const req = d.purchaseRequisition;
                              const lineTotal = d.quantityReceived * d.unitCost;
                              return (
                                <tr key={d.id || dIdx} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                                  <td className="py-2 text-slate-400 font-mono text-[11px]">{dIdx + 1}</td>
                                  <td className="py-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                      d.itemType === 'S' 
                                        ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300' 
                                        : 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300'
                                    }`}>
                                      {d.itemType === 'S' ? 'S (Servicio)' : 'C (Compra)'}
                                    </span>
                                  </td>
                                  <td className="py-2 font-semibold text-slate-800 dark:text-slate-200">
                                    {desc}
                                    {d.sparePart?.model && <span className="text-slate-400 text-[11px] ml-1.5">• Mod: {d.sparePart.model}</span>}
                                    {d.sparePart?.brand && <span className="text-slate-400 text-[11px] ml-1.5">• Marca: {d.sparePart.brand}</span>}
                                  </td>
                                  <td className="py-2 text-slate-600 dark:text-slate-400">
                                    {veh ? (
                                      <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                        {veh.licensePlate} {veh.fleetOwner ? `• ${veh.fleetOwner.name}` : ''}
                                      </span>
                                    ) : trailer ? (
                                      <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                        Remolque {trailer.licensePlate} {trailer.fleetOwner ? `• ${trailer.fleetOwner.name}` : ''}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic">Stock Almacén</span>
                                    )}
                                    {req && <span className="text-slate-400 font-mono text-[10px] ml-2">Req: R.{req.id}</span>}
                                  </td>
                                  <td className="py-2 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                                    {d.quantityReceived}
                                  </td>
                                  <td className="py-2 text-right font-mono text-slate-600 dark:text-slate-400">
                                    ${d.unitCost.toFixed(2)}
                                  </td>
                                  <td className="py-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                                    ${lineTotal.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL REGISTRAR PAGO (CXP -> PAGADO) */}
      {paymentModalOpen && payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95">
            <button
              onClick={() => { setPaymentModalOpen(false); setPayingInvoice(null); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <CreditCard size={22} />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Cuentas por Pagar (CXP)
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Registrar Pago de Factura
                </h3>
              </div>
            </div>

            {/* Resumen Factura */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 mb-5 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Factura:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">#{payingInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Proveedor:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{payingInvoice.supplier?.name}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="text-slate-500 font-medium">Monto Total:</span>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">${payingInvoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Fecha de Pago
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Forma de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Efectivo $">Efectivo ($ USD)</option>
                  <option value="Efectivo Bs">Efectivo (Bs.)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nº de Referencia / Banco
                </label>
                <input
                  type="text"
                  placeholder="Ej. Banesco 0134 - Ref 982341"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Monto a Pagar ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setPaymentModalOpen(false); setPayingInvoice(null); }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {submittingPayment ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  <span>Confirmar Pago</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {/* Modal Interactivo de Registro de Gastos */}
      <ExpensesSheetModal
        isOpen={showExpensesModal}
        onClose={() => setShowExpensesModal(false)}
      />
    </div>
  );
}
