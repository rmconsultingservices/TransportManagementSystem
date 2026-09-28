import { useEffect, useState } from 'react';
import { 
  ShoppingCart, Building2, Plus, Loader2, DollarSign, CheckCircle2, 
  Factory, Printer, Search, Calendar, Filter, MoreVertical, Edit, 
  Trash, Download, Star, Users, Check, X, FileText, 
  BarChart3, Zap, Award 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { purchasingService } from '../services/purchasingService';
import type { PurchaseRequisition, Supplier, PurchaseOrder } from '../types';
import InvoicesTab from '../components/InvoicesTab';

export default function Purchasing() {
  const [activeTab, setActiveTab] = useState<'requisitions' | 'orders' | 'invoices' | 'suppliers'>('requisitions');
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Supplier Form (Creation)
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supCode, setSupCode] = useState('');
  const [supRif, setSupRif] = useState('');
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Supplier Redesign States
  const [supSearch, setSupSearch] = useState('');
  const [supStatusFilter, setSupStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  // Edit Supplier Modal
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCode, setEditCode] = useState('');
  const [editRif, setEditRif] = useState('');
  const [editName, setEditName] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Quotation Request Selection
  const [selectedReqIds, setSelectedReqIds] = useState<number[]>([]);

  // Bulk Quotation Modal State
  const [showBulkQuoteModal, setShowBulkQuoteModal] = useState(false);
  const [bulkSupplierId, setBulkSupplierId] = useState<number | ''>('');
  const [bulkGeneralNotes, setBulkGeneralNotes] = useState('');
  const [bulkItems, setBulkItems] = useState<Array<{
    requisitionId: number;
    partName: string;
    otNumber?: number;
    unitPlate?: string;
    unitDesc?: string;
    quantityRequested: number;
    included: boolean;
    quantity: number;
    unitPrice: number | '';
    notes: string;
  }>>([]);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  // Requisitions Filter State ('pending' | 'approved' | 'all')
  const [reqFilterStatus, setReqFilterStatus] = useState<'pending' | 'approved' | 'all'>('pending');

  // Comparative Matrix Modal State
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareFilterOt, setCompareFilterOt] = useState<string>('all');
  const [compareFilterStatus, setCompareFilterStatus] = useState<'pending' | 'approved' | 'all'>('pending');
  const [isSubmittingCompare, setIsSubmittingCompare] = useState(false);

  // Quoting State
  const [quotingReqId, setQuotingReqId] = useState<number | null>(null);
  const [quoteSupplierId, setQuoteSupplierId] = useState<number | ''>('');
  const [quotePrice, setQuotePrice] = useState<number | ''>('');
  const [quoteQuantity, setQuoteQuantity] = useState<number | ''>('');
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

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = () => setOpenActionMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
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
        email: supEmail || undefined,
        address: supAddress || undefined,
        isActive: true
      });
      setShowSupplierForm(false);
      setSupCode(''); setSupRif(''); setSupName(''); setSupContact(''); setSupPhone(''); setSupEmail(''); setSupAddress('');
      fetchData();
      alert('Proveedor registrado con éxito.');
    } catch (error) {
      console.error('Error creating supplier:', error);
      alert('Error al registrar el proveedor.');
    }
  };

  const handleOpenEditModal = (sup: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSupplier(sup);
    setEditCode(sup.code || '');
    setEditRif(sup.taxId || '');
    setEditName(sup.name || '');
    setEditContact(sup.contactName || '');
    setEditPhone(sup.phoneNumber || '');
    setEditEmail(sup.email || '');
    setEditAddress(sup.address || '');
    setEditIsActive(sup.isActive);
    setShowEditModal(true);
    setOpenActionMenuId(null);
  };

  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    try {
      const updated: Supplier = {
        ...editingSupplier,
        code: editCode || undefined,
        taxId: editRif || undefined,
        name: editName,
        contactName: editContact || undefined,
        phoneNumber: editPhone || undefined,
        email: editEmail || undefined,
        address: editAddress || undefined,
        isActive: editIsActive
      };
      await purchasingService.updateSupplier(editingSupplier.id, updated);
      setShowEditModal(false);
      setEditingSupplier(null);
      fetchData();
      alert('Proveedor actualizado con éxito.');
    } catch (error) {
      console.error('Error updating supplier:', error);
      alert('Error al actualizar el proveedor.');
    }
  };

  const handleDisableSupplier = async (sup: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Está seguro de que desea inhabilitar al proveedor "${sup.name}"?`)) {
      try {
        await purchasingService.deleteSupplier(sup.id);
        fetchData();
        alert('Proveedor inhabilitado con éxito.');
      } catch (error) {
        console.error('Error disabling supplier:', error);
        alert('Error al inhabilitar el proveedor.');
      }
    }
  };

  const handleEnableSupplier = async (sup: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated: Supplier = {
        ...sup,
        isActive: true
      };
      await purchasingService.updateSupplier(sup.id, updated);
      fetchData();
      alert('Proveedor habilitado con éxito.');
    } catch (error) {
      console.error('Error enabling supplier:', error);
      alert('Error al habilitar el proveedor.');
    }
  };

  // Open quote entry form and set default split quantity
  const handleOpenQuotingForm = (req: PurchaseRequisition) => {
    setQuotingReqId(req.id);
    const alreadyQuotedQty = req.quotations?.reduce((acc, q) => acc + (q.quantity || 0), 0) || 0;
    const remaining = Math.max(1, req.quantity - alreadyQuotedQty);
    setQuoteQuantity(remaining);
  };

  const handleAddQuote = async (e: React.FormEvent, reqId: number) => {
    e.preventDefault();
    if (quoteSupplierId === '' || quotePrice === '' || quoteQuantity === '') return;
    try {
      await purchasingService.addQuotation(reqId, {
        supplierId: Number(quoteSupplierId),
        unitPrice: Number(quotePrice),
        quantity: Number(quoteQuantity),
        notes: quoteNotes || undefined
      });
      setQuotingReqId(null);
      setQuoteSupplierId(''); setQuotePrice(''); setQuoteQuantity(''); setQuoteNotes('');
      fetchData();
    } catch (error) {
      console.error('Error adding quote:', error);
    }
  };

  const handleToggleSelectReq = (id: number) => {
    setSelectedReqIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllReqs = () => {
    if (selectedReqIds.length === requisitions.length) {
      setSelectedReqIds([]);
    } else {
      setSelectedReqIds(requisitions.map(r => r.id));
    }
  };

  const handlePrintQuotationRequests = (reqIdsToPrint?: number[], specificServiceRequestId?: number) => {
    if (reqIdsToPrint && reqIdsToPrint.length > 0 && specificServiceRequestId) {
      window.open(`/print/quotation-request/${specificServiceRequestId}?reqIds=${reqIdsToPrint.join(',')}`, '_blank');
      return;
    }

    const ids = reqIdsToPrint && reqIdsToPrint.length > 0 ? reqIdsToPrint : selectedReqIds;
    if (ids.length === 0) return;

    // Group selected requisitions by serviceRequestId
    const selectedList = requisitions.filter(r => ids.includes(r.id));
    const byTicket: { [ticketId: number]: number[] } = {};
    selectedList.forEach(r => {
      const tId = r.serviceRequestId || 0;
      if (!byTicket[tId]) byTicket[tId] = [];
      byTicket[tId].push(r.id);
    });

    const ticketIds = Object.keys(byTicket);
    if (ticketIds.length === 0) return;

    ticketIds.forEach(tId => {
      const reqList = byTicket[Number(tId)].join(',');
      window.open(`/print/quotation-request/${tId}?reqIds=${reqList}`, '_blank');
    });
  };

  const handleOpenBulkQuoteModal = () => {
    const sourceReqs = selectedReqIds.length > 0 
      ? requisitions.filter(r => selectedReqIds.includes(r.id))
      : requisitions.filter(r => r.status !== 'Comprada');

    if (sourceReqs.length === 0) {
      alert('No hay requisiciones disponibles para cotizar.');
      return;
    }

    const items = sourceReqs.map(r => ({
      requisitionId: r.id,
      partName: r.partNameOrDescription,
      otNumber: r.serviceRequestId,
      unitPlate: r.serviceRequest?.vehicle?.licensePlate || r.serviceRequest?.trailer?.licensePlate || 'N/A',
      unitDesc: r.serviceRequest?.vehicle?.brand || r.serviceRequest?.trailer?.type || '',
      quantityRequested: r.quantity,
      included: true,
      quantity: r.quantity,
      unitPrice: '' as number | '',
      notes: ''
    }));

    setBulkItems(items);
    setBulkSupplierId('');
    setBulkGeneralNotes('');
    setShowBulkQuoteModal(true);
  };

  const updateBulkItem = (index: number, field: string, value: any) => {
    setBulkItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleToggleAllBulkItems = (checked: boolean) => {
    setBulkItems(prev => prev.map(item => ({ ...item, included: checked })));
  };

  const handleSubmitBulkQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkSupplierId) {
      alert('Por favor seleccione un proveedor para la cotización.');
      return;
    }

    const activeItems = bulkItems.filter(item => 
      item.included && 
      item.unitPrice !== '' && 
      Number(item.unitPrice) > 0
    );

    if (activeItems.length === 0) {
      alert('Debe cotizar al menos un repuesto ingresando un precio unitario mayor a 0.');
      return;
    }

    try {
      setIsSubmittingBulk(true);
      const promises = activeItems.map(item => {
        const itemNote = [bulkGeneralNotes, item.notes].filter(Boolean).join(' - ');
        return purchasingService.addQuotation(item.requisitionId, {
          supplierId: Number(bulkSupplierId),
          unitPrice: Number(item.unitPrice),
          quantity: Number(item.quantity) || item.quantityRequested,
          notes: itemNote || undefined
        });
      });

      await Promise.all(promises);

      alert(`Se registraron exitosamente ${activeItems.length} cotizaciones para el proveedor.`);
      setShowBulkQuoteModal(false);
      setSelectedReqIds([]);
      await fetchData();
    } catch (error) {
      console.error('Error submitting bulk quotes:', error);
      alert('Ocurrió un error al registrar las cotizaciones.');
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleSelectAllForSupplier = async (supplierId: number) => {
    try {
      setIsSubmittingCompare(true);
      const targetReqs = (selectedReqIds.length > 0 
        ? requisitions.filter(r => selectedReqIds.includes(r.id))
        : requisitions
      ).filter(r => {
        if (compareFilterOt === 'all') return true;
        return r.serviceRequestId === Number(compareFilterOt);
      });

      const actions: Promise<void>[] = [];

      targetReqs.forEach(req => {
        const quotes = req.quotations || [];
        const targetQuote = quotes.find(q => q.supplierId === supplierId);
        if (targetQuote) {
          // Deselect other selected quotes
          quotes.forEach(q => {
            if (q.id !== targetQuote.id && q.isSelected) {
              actions.push(purchasingService.selectQuotation(req.id, q.id));
            }
          });
          // Select target quote if not already selected
          if (!targetQuote.isSelected) {
            actions.push(purchasingService.selectQuotation(req.id, targetQuote.id));
          }
        }
      });

      if (actions.length === 0) {
        alert('Las cotizaciones de este proveedor ya se encuentran seleccionadas.');
        setIsSubmittingCompare(false);
        return;
      }

      await Promise.all(actions);
      await fetchData();
    } catch (error) {
      console.error('Error selecting supplier quotes:', error);
      alert('Ocurrió un error al seleccionar las cotizaciones del proveedor.');
    } finally {
      setIsSubmittingCompare(false);
    }
  };

  const handleSelectLowestPrices = async () => {
    try {
      setIsSubmittingCompare(true);
      const targetReqs = (selectedReqIds.length > 0 
        ? requisitions.filter(r => selectedReqIds.includes(r.id))
        : requisitions
      ).filter(r => {
        if (compareFilterOt === 'all') return true;
        return r.serviceRequestId === Number(compareFilterOt);
      });

      const actions: Promise<void>[] = [];

      targetReqs.forEach(req => {
        const quotes = (req.quotations || []).filter(q => q.unitPrice > 0);
        if (quotes.length === 0) return;

        const minPrice = Math.min(...quotes.map(q => q.unitPrice));
        const lowestQuote = quotes.find(q => q.unitPrice === minPrice) || quotes[0];

        // Deselect other quotes
        quotes.forEach(q => {
          if (q.id !== lowestQuote.id && q.isSelected) {
            actions.push(purchasingService.selectQuotation(req.id, q.id));
          }
        });

        // Select lowest quote
        if (!lowestQuote.isSelected) {
          actions.push(purchasingService.selectQuotation(req.id, lowestQuote.id));
        }
      });

      if (actions.length === 0) {
        alert('No se encontraron cotizaciones con precio para seleccionar.');
        setIsSubmittingCompare(false);
        return;
      }

      await Promise.all(actions);
      await fetchData();
    } catch (error) {
      console.error('Error selecting lowest quotes:', error);
      alert('Ocurrió un error al seleccionar los menores precios.');
    } finally {
      setIsSubmittingCompare(false);
    }
  };

  const handleToggleCellQuote = async (req: PurchaseRequisition, quote: any) => {
    try {
      setIsSubmittingCompare(true);
      const actions: Promise<void>[] = [];

      if (quote.isSelected) {
        actions.push(purchasingService.selectQuotation(req.id, quote.id));
      } else {
        // Deselect any other quote currently selected for this requisition
        (req.quotations || []).forEach(q => {
          if (q.id !== quote.id && q.isSelected) {
            actions.push(purchasingService.selectQuotation(req.id, q.id));
          }
        });
        actions.push(purchasingService.selectQuotation(req.id, quote.id));
      }

      await Promise.all(actions);
      await fetchData();
    } catch (error) {
      console.error('Error toggling quote:', error);
      alert('Error al actualizar la selección de la cotización.');
    } finally {
      setIsSubmittingCompare(false);
    }
  };

  const handleSelectQuote = async (reqId: number, quoteId: number) => {
    try {
      await purchasingService.selectQuotation(reqId, quoteId);
      alert('Selección de cotización actualizada para esta requisición.');
      fetchData();
    } catch (error) {
       console.error('Error selecting quote:', error);
    }
  };

  const handleGeneratePO = async (supplierId: number) => {
    const pendingReqsForSupplier = requisitions.filter(r => 
      r.status === 'Comprada' && 
      !purchaseOrders.some(po => po.supplierId === supplierId && po.details?.some(d => d.purchaseRequisitionId === r.id)) &&
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

  // Deterministic ratings for design authenticity
  const getSupplierRating = (sup: Supplier) => {
    const base = 4.0;
    const variance = ((sup.id * 7) % 11) * 0.1;
    return Number((base + variance).toFixed(1));
  };

  // Dynamic values for KPIs
  const activeSups = suppliers.filter(s => s.isActive);
  const totalSuppliersCount = suppliers.length;
  const activeSuppliersCount = activeSups.length;
  const activePercentage = totalSuppliersCount > 0 ? Math.round((activeSuppliersCount / totalSuppliersCount) * 100) : 0;
  
  // Rating Average calculation
  const avgRating = activeSups.length > 0
    ? (activeSups.reduce((acc, s) => acc + getSupplierRating(s), 0) / activeSups.length).toFixed(1)
    : '4.8';

  // New this month count (simulated dynamically based on data size)
  const newThisMonth = Math.max(1, Math.min(12, Math.round(activeSuppliersCount * 0.12)));

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter(sup => {
    const matchesSearch = 
      sup.name.toLowerCase().includes(supSearch.toLowerCase()) ||
      (sup.code || '').toLowerCase().includes(supSearch.toLowerCase()) ||
      (sup.taxId || '').toLowerCase().includes(supSearch.toLowerCase()) ||
      (sup.contactName || '').toLowerCase().includes(supSearch.toLowerCase()) ||
      (sup.phoneNumber || '').toLowerCase().includes(supSearch.toLowerCase()) ||
      (sup.address || '').toLowerCase().includes(supSearch.toLowerCase());

    const matchesStatus = 
      supStatusFilter === 'all' ? true :
      supStatusFilter === 'active' ? sup.isActive : !sup.isActive;

    return matchesSearch && matchesStatus;
  });

  // Paginated suppliers
  const totalFilteredRows = filteredSuppliers.length;
  const totalPages = Math.ceil(totalFilteredRows / rowsPerPage) || 1;
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const startRow = totalFilteredRows > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const endRow = Math.min(currentPage * rowsPerPage, totalFilteredRows);

  // Excel (CSV UTF-8 BOM) Export
  const handleExportExcel = () => {
    const headers = ['CÓDIGO', 'RIF', 'RAZÓN SOCIAL', 'CONTACTO', 'TELÉFONO', 'DIRECCIÓN', 'CALIFICACIÓN', 'ESTADO'];
    const rows = filteredSuppliers.map(sup => [
      sup.code || 'N/A',
      sup.taxId || 'N/A',
      sup.name || '',
      sup.contactName || 'N/A',
      sup.phoneNumber || 'N/A',
      sup.address || 'N/A',
      getSupplierRating(sup),
      sup.isActive ? 'Activo' : 'Inactivo'
    ]);
    
    // Use semicolon separation and double quotes for Excel regional settings compatibility
    const csvContent = "\uFEFF" // UTF-8 BOM
      + [headers.join(';'), ...rows.map(row => row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(';'))].join('\r\n');
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_proveedores_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto print:p-0 print:max-w-full">
      {/* Printable Report Header */}
      <div className="hidden print:block mb-8 border-b-2 border-gray-300 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reporte de Proveedores</h1>
            <p className="text-gray-500 mt-1">Análisis detallado de la cadena de suministro y socios logísticos.</p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <div>Generado el: {new Date().toLocaleDateString()}</div>
            <div>Sistema de Gestión de Transporte</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8 print:hidden">
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
            <Plus size={20} /> Registrar Proveedor
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 font-medium text-sm print:hidden">
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
            activeTab === 'invoices' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
          onClick={() => { setActiveTab('invoices'); setShowSupplierForm(false); }}
        >
          Facturas de Compra
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 mb-8 animate-in fade-in slide-in-from-top-4 print:hidden">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
             <Building2 size={24} /> Registrar Nuevo Proveedor de Insumos
          </h2>
          <form onSubmit={handleCreateSupplier} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código Interno</label>
              <input type="text" value={supCode} onChange={e => setSupCode(e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ej. PRV-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RIF</label>
              <input type="text" value={supRif} onChange={e => setSupRif(e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ej. J-12345678-9" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razón Social</label>
              <input type="text" required value={supName} onChange={e => setSupName(e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contacto Principal</label>
              <input type="text" value={supContact} onChange={e => setSupContact(e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
              <input type="text" value={supPhone} onChange={e => setSupPhone(e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="+58..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
              <input type="email" value={supEmail} onChange={e => setSupEmail(e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="ejemplo@correo.com" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
              <input type="text" value={supAddress} onChange={e => setSupAddress(e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Av. Principal..." />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3">
              <button type="button" onClick={() => setShowSupplierForm(false)} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium">Cancelar</button>
              <button type="submit" className="bg-emerald-600 text-white px-8 py-2 rounded-lg font-medium shadow">Guardar Proveedor</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-500 print:hidden"><Loader2 className="animate-spin mx-auto mb-2" size={32} />Cargando datos del módulo de compras...</div>
      ) : activeTab === 'suppliers' ? (
        <div className="space-y-6">
          {/* Report KPI Header Block */}
          <div className="bg-transparent mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reporte de Proveedores</h2>
                <p className="text-sm text-gray-500">Análisis detallado de la cadena de suministro y socios logísticos.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => window.print()}
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                  <FileText size={18} /> Exportar PDF
                </button>
                <button 
                  onClick={handleExportExcel}
                  className="bg-[#2e5b88] hover:bg-[#204467] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Download size={18} /> Descargar CSV
                </button>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-500 uppercase text-[11px] font-bold tracking-wider mb-2">
                  <span>Total Proveedores</span>
                  <Users size={18} className="text-[#2e5b88]" />
                </div>
                <div className="flex items-baseline mt-1">
                  <h3 className="text-3xl font-extrañold text-gray-900 dark:text-white">{totalSuppliersCount}</h3>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-500 uppercase text-[11px] font-bold tracking-wider mb-2">
                  <span>Proveedores Activos</span>
                  <CheckCircle2 size={18} className="text-emerald-500" />
                </div>
                <div className="flex items-baseline mt-1 gap-2">
                  <h3 className="text-3xl font-extrañold text-gray-900 dark:text-white">{activeSuppliersCount}</h3>
                  <span className="text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">{activePercentage}%</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-500 uppercase text-[11px] font-bold tracking-wider mb-2">
                  <span>Nuevos (Este Mes)</span>
                  <Calendar size={18} className="text-blue-500" />
                </div>
                <div className="flex items-baseline mt-1 gap-2">
                  <h3 className="text-3xl font-extrañold text-gray-900 dark:text-white">{newThisMonth}</h3>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded uppercase">NEW</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-500 uppercase text-[11px] font-bold tracking-wider mb-2">
                  <span>Calificación Promedio</span>
                  <Star size={18} className="text-amber-500 fill-amber-500" />
                </div>
                <div className="flex items-baseline mt-1 gap-1">
                  <h3 className="text-3xl font-extrañold text-gray-900 dark:text-white">{avgRating}</h3>
                  <span className="text-gray-400 text-sm font-medium">/5</span>
                </div>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
              <div className="relative flex-1 w-full">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" 
                  value={supSearch}
                  onChange={e => { setSupSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Buscar por código, RIF, razón social, contacto, tlf..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              <div className="flex gap-3 w-full md:w-auto items-center">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <Filter size={14} /> Estado:
                </div>
                <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 p-0.5 bg-gray-50 dark:bg-gray-900 overflow-hidden text-xs">
                  <button 
                    onClick={() => { setSupStatusFilter('all'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${supStatusFilter === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => { setSupStatusFilter('active'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${supStatusFilter === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                  >
                    Activos
                  </button>
                  <button 
                    onClick={() => { setSupStatusFilter('inactive'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${supStatusFilter === 'inactive' ? 'bg-gray-200 dark:bg-gray-600/55 text-gray-700 dark:text-gray-305 shadow-sm border border-gray-300/40 dark:border-none' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                  >
                    Inactivos
                  </button>
                </div>
              </div>
            </div>

            {/* List view (Table) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden print:border-none print:shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-[11px] font-extrañold uppercase tracking-wider text-gray-400">
                      <th className="py-4 px-6">Código</th>
                      <th className="py-4 px-6">RIF</th>
                      <th className="py-4 px-6">Razón Social</th>
                      <th className="py-4 px-6">Contacto</th>
                      <th className="py-4 px-6">Teléfono</th>
                      <th className="py-4 px-6">Dirección</th>
                      <th className="py-4 px-6 text-center">Calificación</th>
                      <th className="py-4 px-6 text-center print:hidden">Estado</th>
                      <th className="py-4 px-6 text-right print:hidden">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 dark:divide-gray-700 text-sm">
                    {paginatedSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-gray-500">No se encontraron proveedores.</td>
                      </tr>
                    ) : (
                      paginatedSuppliers.map(sup => (
                        <tr key={sup.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/25 transition-colors group">
                          <td className="py-4 px-6 font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{sup.code || 'N/A'}</td>
                          <td className="py-4 px-6 text-gray-600 dark:text-gray-300 whitespace-nowrap">{sup.taxId || 'N/A'}</td>
                          <td className="py-4 px-6 font-extrañold text-gray-950 dark:text-white max-w-[200px] truncate">{sup.name}</td>
                          <td className="py-4 px-6 text-gray-600 dark:text-gray-400">{sup.contactName || 'N/A'}</td>
                          <td className="py-4 px-6 text-gray-600 dark:text-gray-400 whitespace-nowrap">{sup.phoneNumber || 'N/A'}</td>
                          <td className="py-4 px-6 text-gray-400 dark:text-gray-500 max-w-[220px] truncate" title={sup.address}>{sup.address || 'N/A'}</td>
                          <td className="py-4 px-6 text-center">
                            <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded text-xs font-bold border border-amber-200/50">
                              <Star size={12} className="fill-amber-500 text-amber-500" />
                              {getSupplierRating(sup)}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center print:hidden">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sup.isActive ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                              {sup.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right relative print:hidden">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setOpenActionMenuId(openActionMenuId === sup.id ? null : sup.id); }}
                              className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openActionMenuId === sup.id && (
                              <div className="absolute right-6 top-10 w-44 bg-white dark:bg-gray-850 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-30 py-1.5 text-left animate-in fade-in duration-100">
                                <button 
                                  onClick={(e) => handleOpenEditModal(sup, e)}
                                  className="w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-2 text-xs font-semibold"
                                >
                                  <Edit size={14} /> Editar Proveedor
                                </button>
                                {sup.isActive ? (
                                  <button 
                                    onClick={(e) => handleDisableSupplier(sup, e)}
                                    className="w-full px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-2 text-xs font-semibold"
                                  >
                                    <Trash size={14} /> Inhabilitar
                                  </button>
                                ) : (
                                  <button 
                                    onClick={(e) => handleEnableSupplier(sup, e)}
                                    className="w-full px-4 py-2 hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center gap-2 text-xs font-semibold"
                                  >
                                    <Check size={14} /> Habilitar
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              {totalPages > 1 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                  <div className="text-xs font-semibold text-gray-500">
                    Mostrando {startRow}-{endRow} de {totalFilteredRows} proveedores
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 disabled:opacity-50 hover:bg-gray-50"
                    >
                      &lt;
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 rounded transition ${currentPage === page ? 'bg-indigo-600 text-white' : 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50'}`}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 disabled:opacity-50 hover:bg-gray-50"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="space-y-6">
          {/* Pending to Generate Orders List */}
          {suppliers.map(sup => {
            const pendingReqs = requisitions.filter(r => 
              r.status === 'Comprada' && 
              !purchaseOrders.some(po => po.supplierId === sup.id && po.details?.some(d => d.purchaseRequisitionId === r.id)) &&
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

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Órdenes Emitidas</h3>
              <div className="relative w-full md:w-80">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar por # Orden, Proveedor o Fecha..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            {purchaseOrders.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No hay órdenes de compra emitidas.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {purchaseOrders
                  .filter(po => {
                    const search = searchTerm.toLowerCase();
                    const orderNum = po.orderNumber.toLowerCase();
                    const supplier = po.supplier?.name.toLowerCase() || '';
                    const date = new Date(po.dateCreated).toLocaleDateString();
                    return orderNum.includes(search) || supplier.includes(search) || date.includes(search);
                  })
                  .map(po => {
                    const requisitionsInPO = requisitions.filter(r => 
                      po.details?.some(d => d.purchaseRequisitionId === r.id)
                    );

                    return (
                      <div key={po.id} className="border border-gray-200 dark:border-gray-700 p-5 rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-150 dark:border-gray-700 pb-3 mb-3">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-900 dark:text-white text-lg">Orden {po.orderNumber}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                po.status === 'Emitida' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {po.status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Proveedor: <span className="font-semibold text-gray-700 dark:text-gray-300">{po.supplier?.name}</span>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-4">
                            <div>
                              <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Costo Total</div>
                              <div className="text-xl font-bold text-emerald-600">${po.orderTotal.toFixed(2)}</div>
                            </div>
                            <Link 
                              to={`/print/order/${po.id}`}
                              target="_blank"
                              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-emerald-600 hover:border-emerald-300 dark:hover:bg-gray-700/50 transition-colors shadow-sm"
                            >
                              <Printer size={18} />
                            </Link>
                          </div>
                        </div>

                        <div className="space-y-2 mt-4">
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Detalles de la Compra</div>
                          {requisitionsInPO.map(r => (
                            <div key={`po-req-${r.id}`} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-150 dark:border-gray-800 flex justify-between items-center text-sm">
                              <div>
                                <span className="font-semibold text-gray-800 dark:text-gray-300">{r.partNameOrDescription}</span>
                                <span className="text-xs text-gray-500 block">Req #{r.id.toString().padStart(4, '0')} • Solicitado por: {r.serviceRequest?.vehicle?.licensePlate || 'Taller'}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-gray-900 dark:text-white">Cant: {po.details?.find(d => d.purchaseRequisitionId === r.id)?.quantityOrdered || r.quantity}</span>
                                <span className="text-xs text-gray-500 block">PU: ${(po.details?.find(d => d.purchaseRequisitionId === r.id)?.unitPrice || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'invoices' ? (
        <InvoicesTab />
      ) : (
        <div className="space-y-6">
          {requisitions.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No hay requisiciones de taller pendientes.</div>
          ) : (
            <>
              {/* Batch Action Bar for Quotation Requests */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Status Filter Tabs */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setReqFilterStatus('pending')}
                      className={`px-3 py-1.5 rounded-lg transition font-bold ${
                        reqFilterStatus === 'pending'
                          ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      Pendientes de Aprobación ({requisitions.filter(r => !r.quotations?.some(q => q.isSelected) && r.status !== 'Comprada').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReqFilterStatus('all')}
                      className={`px-3 py-1.5 rounded-lg transition font-medium ${
                        reqFilterStatus === 'all'
                          ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      Todas ({requisitions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReqFilterStatus('approved')}
                      className={`px-3 py-1.5 rounded-lg transition font-medium ${
                        reqFilterStatus === 'approved'
                          ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      Aprobadas ({requisitions.filter(r => r.quotations?.some(q => q.isSelected) || r.status === 'Comprada').length})
                    </button>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input 
                      type="checkbox" 
                      checked={requisitions.length > 0 && selectedReqIds.length === requisitions.length}
                      onChange={handleSelectAllReqs}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Seleccionar todos ({requisitions.length})</span>
                  </label>
                  {selectedReqIds.length > 0 && (
                    <span className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                      {selectedReqIds.length} seleccionado{selectedReqIds.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={selectedReqIds.length === 0}
                    onClick={() => handlePrintQuotationRequests()}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm ${
                      selectedReqIds.length > 0
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                    title="Imprime la hoja de solicitud de cotización para los ítems seleccionados"
                  >
                    <Printer size={16} /> 
                    Imprimir Solicitud de Cotización {selectedReqIds.length > 0 ? `(${selectedReqIds.length})` : ''}
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenBulkQuoteModal}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                    title="Cargar cotización de un proveedor para múltiples requisiciones simultáneamente"
                  >
                    <DollarSign size={16} />
                    Cargar Cotización de Proveedor {selectedReqIds.length > 0 ? `(${selectedReqIds.length})` : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCompareFilterOt('all');
                      setShowCompareModal(true);
                    }}
                    className="bg-[#2e5b88] hover:bg-[#204467] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                    title="Comparar ofertas recibidas de los proveedores y elegir ganadores en lote"
                  >
                    <BarChart3 size={16} />
                    Cuadro Comparativo {selectedReqIds.length > 0 ? `(${selectedReqIds.length})` : ''}
                  </button>
                  {selectedReqIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedReqIds([])}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1"
                    >
                      Limpiar selección
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
              {(() => {
                const displayedReqs = requisitions.filter(r => {
                  const isApproved = r.status === 'Comprada' || r.quotations?.some(q => q.isSelected);
                  if (reqFilterStatus === 'pending') return !isApproved;
                  if (reqFilterStatus === 'approved') return isApproved;
                  return true;
                });

                if (displayedReqs.length === 0) {
                  return (
                    <div className="py-12 text-center text-gray-400 italic bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      {reqFilterStatus === 'pending'
                        ? 'No hay requisiciones pendientes por aprobar cotización.'
                        : reqFilterStatus === 'approved'
                          ? 'No hay requisiciones con cotizaciones aprobadas aún.'
                          : 'No hay requisiciones registradas.'}
                    </div>
                  );
                }

                return displayedReqs.map(req => {
                const totalSelectedQty = req.quotations?.filter(q => q.isSelected).reduce((acc, q) => acc + (q.quantity || 0), 0) || 0;
                
                return (
                  <div 
                    key={req.id} 
                    className={`bg-white dark:bg-gray-800 rounded-xl border transition-all ${
                      selectedReqIds.includes(req.id)
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md' 
                        : 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'
                    } overflow-hidden flex flex-col justify-between`}
                  >
                    <div className="p-6 flex flex-col md:flex-row justify-between items-start gap-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-start gap-3">
                        <input 
                          type="checkbox"
                          checked={selectedReqIds.includes(req.id)}
                          onChange={() => handleToggleSelectReq(req.id)}
                          className="w-5 h-5 mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          title="Seleccionar para imprimir solicitud de cotización"
                        />
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-bold text-gray-900 dark:text-white text-lg">Requisición #{req.id.toString().padStart(4, '0')}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                             req.status === 'Pendiente' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                             req.status === 'Cotizando' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                             req.status === 'Comprada' ? 'bg-green-100 text-green-800 border-green-200' :
                             'bg-gray-100 text-gray-800'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Repuesto: <strong className="text-indigo-600 dark:text-indigo-400 text-base">{req.partNameOrDescription}</strong> (Cant Solicitada: {req.quantity}) 
                          {totalSelectedQty > 0 && <span className="text-emerald-600 font-bold ml-2">(Cant Aprobada: {totalSelectedQty}/{req.quantity})</span>}
                        </div>
                        
                        {req.serviceRequest && (
                          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 mb-2 shadow-sm">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                              Motivo de la Solicitud (OT #{req.serviceRequestId})
                              <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-350 px-1.5 py-0.5 rounded text-[10px]">{req.serviceRequest.repairType}</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-355 italic">"{req.serviceRequest.description}"</p>
                          </div>
                        )}

                        <div className="text-xs text-gray-500 mt-1">
                          Vehículo: {req.serviceRequest?.vehicle?.licensePlate || req.serviceRequest?.trailer?.licensePlate || 'Unidad de Flota'} • Solicitado el {new Date(req.dateRequested).toLocaleDateString()}
                        </div>
                      </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 self-end md:self-start">
                        <button
                          type="button"
                          onClick={() => {
                            if (req.serviceRequestId) {
                              handlePrintQuotationRequests([req.id], req.serviceRequestId);
                            }
                          }}
                          className="bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 px-3.5 py-2 rounded-md font-medium text-sm transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                          title="Imprimir hoja de cotización para este repuesto"
                        >
                          <Printer size={15} /> Imprimir Solicitud
                        </button>
                        {quotingReqId !== req.id && (
                          <button 
                            onClick={() => handleOpenQuotingForm(req)}
                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-650 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm whitespace-nowrap"
                          >
                            + Ingresar Cotización
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quotations Form */}
                    {quotingReqId === req.id && (
                      <div className="p-5 bg-blue-50/50 dark:bg-blue-950/20 border-b border-gray-100 dark:border-gray-800">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-400"><DollarSign size={16}/> Nueva Cotización</h4>
                        <form onSubmit={(e) => handleAddQuote(e, req.id)} className="flex flex-wrap gap-4 items-end">
                          <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Proveedor</label>
                            <select required value={quoteSupplierId} onChange={e => setQuoteSupplierId(e.target.value === '' ? '' : Number(e.target.value))} className="w-full text-sm rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                              <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Seleccione proveedor...</option>
                              {suppliers.filter(s => s.isActive).map(s => <option key={s.id} value={s.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{s.name}</option>)}
                            </select>
                          </div>
                          <div className="w-24">
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Cantidad</label>
                            <input type="number" min="1" max={req.quantity} required value={quoteQuantity} onChange={e => setQuoteQuantity(e.target.value === '' ? '' : Number(e.target.value))} className="w-full text-sm rounded border border-gray-300 dark:border-gray-605 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="1"/>
                          </div>
                          <div className="w-32">
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Precio Unit. ($)</label>
                            <input type="number" step="0.01" required value={quotePrice} onChange={e => setQuotePrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full text-sm rounded border border-gray-300 dark:border-gray-605 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="0.00"/>
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Notas (Opcional)</label>
                            <input type="text" value={quoteNotes} onChange={e => setQuoteNotes(e.target.value)} className="w-full text-sm rounded border border-gray-300 dark:border-gray-605 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Ej. Original GM, Entrega 3 días..."/>
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
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Cuadro Comparativo de Presupuestos ({req.quotations.length})</h4>
                        <div className="space-y-2">
                          {req.quotations.map(quote => (
                            <div key={quote.id} className={`flex justify-between items-center p-3 rounded-lg border ${
                              quote.isSelected 
                               ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' 
                               : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                            }`}>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 dark:text-white">{quote.supplier?.name || `Prov #${quote.supplierId}`}</div>
                                {quote.notes && <div className="text-xs text-gray-500 italic mt-0.5">{quote.notes}</div>}
                              </div>
                              <div className="text-right flex items-center gap-4">
                                <div className="text-xs text-gray-500 font-semibold dark:text-gray-400">
                                  Cant: <span className="font-bold text-gray-900 dark:text-white">{quote.quantity || 1}</span> und.
                                </div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                  ${quote.unitPrice.toFixed(2)}
                                  <span className="block text-[10px] text-gray-500 font-normal uppercase mt-0.5">Precio Unidad</span>
                                </div>
                                <div className="text-xl font-bold text-emerald-600">
                                  ${(quote.unitPrice * (quote.quantity || 1)).toFixed(2)}
                                  <span className="block text-[10px] text-gray-500 font-normal uppercase mt-0.5">Costo Total</span>
                                </div>
                                
                                {(() => {
                                  const hasAnyApproved = req.quotations?.some(q => q.isSelected);
                                  const isAnotherApproved = !quote.isSelected && hasAnyApproved;
                                  return (
                                    <button 
                                      disabled={isAnotherApproved}
                                      onClick={() => handleSelectQuote(req.id, quote.id)}
                                      className={`ml-4 px-3 py-1.5 rounded text-sm font-medium transition-colors border ${
                                        quote.isSelected
                                          ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 cursor-pointer'
                                          : isAnotherApproved
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50'
                                            : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-300 cursor-pointer'
                                      }`}
                                      title={isAnotherApproved ? 'Ya existe una cotización aprobada para este repuesto. Deselecciónela primero si desea cambiar.' : ''}
                                    >
                                      {quote.isSelected ? 'Deseleccionar' : 'Elegir y Comprar'}
                                    </button>
                                  );
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
              })()}
            </div>
            </>
          )}
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditModal && editingSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 print:hidden">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-150 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrañold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit className="text-[#2e5b88]" size={24} /> Editar Proveedor: {editingSupplier.name}
              </h2>
              <button 
                onClick={() => { setShowEditModal(false); setEditingSupplier(null); }}
                className="text-gray-400 hover:text-gray-650 dark:hover:text-gray-300 transition p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateSupplier} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-750 dark:text-gray-300 mb-1">Código Interno</label>
                <input 
                  type="text" 
                  value={editCode} 
                  onChange={e => setEditCode(e.target.value)} 
                  className="w-full rounded border border-gray-300 dark:border-gray-650 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" 
                  placeholder="Ej. PRV-001" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-750 dark:text-gray-300 mb-1">RIF</label>
                <input 
                  type="text" 
                  value={editRif} 
                  onChange={e => setEditRif(e.target.value)} 
                  className="w-full rounded border border-gray-300 dark:border-gray-655 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" 
                  placeholder="Ej. J-12345678-9" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-750 dark:text-gray-300 mb-1">Razón Social</label>
                <input 
                  type="text" 
                  required 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  className="w-full rounded border border-gray-300 dark:border-gray-650 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-950 dark:text-white" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-750 dark:text-gray-300 mb-1">Contacto Principal</label>
                <input 
                  type="text" 
                  value={editContact} 
                  onChange={e => setEditContact(e.target.value)} 
                  className="w-full rounded border border-gray-300 dark:border-gray-650 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-750 dark:text-gray-300 mb-1">Teléfono</label>
                <input 
                  type="text" 
                  value={editPhone} 
                  onChange={e => setEditPhone(e.target.value)} 
                  className="w-full rounded border border-gray-300 dark:border-gray-650 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" 
                  placeholder="+58..." 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-750 dark:text-gray-300 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={editEmail} 
                  onChange={e => setEditEmail(e.target.value)} 
                  className="w-full rounded border border-gray-300 dark:border-gray-650 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" 
                  placeholder="ejemplo@correo.com" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-750 dark:text-gray-300 mb-1">Dirección</label>
                <input 
                  type="text" 
                  value={editAddress} 
                  onChange={e => setEditAddress(e.target.value)} 
                  className="w-full rounded border border-gray-300 dark:border-gray-655 px-3 py-2 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" 
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-150 dark:border-gray-750">
                <input 
                  type="checkbox" 
                  id="editIsActive"
                  checked={editIsActive} 
                  onChange={e => setEditIsActive(e.target.checked)} 
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition cursor-pointer" 
                />
                <label htmlFor="editIsActive" className="text-sm font-bold text-gray-800 dark:text-gray-250 select-none cursor-pointer flex flex-col">
                  <span>Proveedor Activo / Habilitado</span>
                  <span className="text-xs font-medium text-gray-400 mt-0.5 font-semibold">Los proveedores inactivos no aparecerán en la selección de nuevas cotizaciones.</span>
                </label>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-gray-100 dark:border-gray-750 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowEditModal(false); setEditingSupplier(null); }}
                  className="bg-gray-100 dark:bg-gray-750 text-gray-700 dark:text-gray-200 hover:bg-gray-200 px-5 py-2 rounded-xl text-sm font-bold transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-indigo-650 hover:bg-indigo-700 text-white px-7 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/20 transition"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Carga Masiva de Cotización por Proveedor */}
      {showBulkQuoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 print:hidden">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-5xl w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                  <DollarSign className="text-emerald-600 dark:text-emerald-400" size={24} />
                  Cargar Cotización por Proveedor
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ingresa los precios y condiciones recibidas de un mismo proveedor para múltiples repuestos en un solo paso.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowBulkQuoteModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitBulkQuote} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Supplier & General Terms Header */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                  <div className="md:col-span-6">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                      Proveedor / Casa Comercial <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={bulkSupplierId}
                      onChange={e => setBulkSupplierId(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="" disabled>-- Seleccione el proveedor que cotizó --</option>
                      {suppliers.filter(s => s.isActive).map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.taxId ? `(${s.taxId})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-6">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                      Condiciones Generales de la Oferta (Opcional)
                    </label>
                    <input 
                      type="text"
                      value={bulkGeneralNotes}
                      onChange={e => setBulkGeneralNotes(e.target.value)}
                      placeholder="Ej. Crédito 15 días, entrega inmediata, validez 7 días..."
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
                      <span>Repuestos a Cotizar</span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-mono">
                        {bulkItems.length}
                      </span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => handleToggleAllBulkItems(true)} 
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                      >
                        Marcar todos
                      </button>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <button 
                        type="button" 
                        onClick={() => handleToggleAllBulkItems(false)} 
                        className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                      >
                        Desmarcar todos
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 uppercase tracking-wider font-bold text-[10px] border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-3 py-2.5 w-10 text-center">Inc.</th>
                          <th className="px-4 py-2.5">Artículo / Requisición</th>
                          <th className="px-3 py-2.5 w-24 text-center">Cant. Req.</th>
                          <th className="px-3 py-2.5 w-28 text-center">Cant. Cotizada</th>
                          <th className="px-3 py-2.5 w-32 text-center">Precio Unit. ($)</th>
                          <th className="px-3 py-2.5 w-28 text-right">Subtotal ($)</th>
                          <th className="px-3 py-2.5 min-w-[160px]">Marca / Nota Ítem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {bulkItems.map((item, idx) => {
                          const subtotal = item.included && item.unitPrice !== '' && Number(item.unitPrice) > 0
                            ? (Number(item.quantity) || item.quantityRequested) * Number(item.unitPrice)
                            : 0;

                          return (
                            <tr 
                              key={item.requisitionId}
                              className={`transition-colors ${
                                item.included 
                                  ? 'bg-white dark:bg-gray-800 hover:bg-slate-50/60 dark:hover:bg-slate-700/40' 
                                  : 'bg-gray-50/70 dark:bg-gray-900/50 opacity-60'
                              }`}
                            >
                              <td className="px-3 py-2.5 text-center">
                                <input 
                                  type="checkbox"
                                  checked={item.included}
                                  onChange={e => updateBulkItem(idx, 'included', e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="font-bold text-gray-900 dark:text-white text-xs">
                                  {item.partName}
                                </div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                                  <span>Req #{item.requisitionId.toString().padStart(4, '0')}</span>
                                  <span>&bull;</span>
                                  <span>OT #{item.otNumber}</span>
                                  <span>&bull;</span>
                                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{item.unitPlate}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center font-mono text-gray-500 dark:text-gray-400">
                                {item.quantityRequested} und.
                              </td>
                              <td className="px-3 py-2.5">
                                <input 
                                  type="number"
                                  min="1"
                                  disabled={!item.included}
                                  value={item.quantity}
                                  onChange={e => updateBulkItem(idx, 'quantity', Number(e.target.value))}
                                  className="w-full text-center rounded border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="relative">
                                  <span className="absolute left-2 top-1 text-gray-400 text-xs">$</span>
                                  <input 
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    disabled={!item.included}
                                    placeholder="0.00"
                                    value={item.unitPrice}
                                    onChange={e => updateBulkItem(idx, 'unitPrice', e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full text-right rounded border border-gray-300 dark:border-gray-600 pl-5 pr-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-right font-mono font-bold text-xs">
                                {subtotal > 0 ? (
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    ${subtotal.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600">$0.00</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5">
                                <input 
                                  type="text"
                                  disabled={!item.included}
                                  placeholder="Ej. Marca, disp. 2 días..."
                                  value={item.notes}
                                  onChange={e => updateBulkItem(idx, 'notes', e.target.value)}
                                  className="w-full rounded border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/60 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Ítems con precio: </span>
                    <strong className="text-gray-900 dark:text-white font-bold">
                      {bulkItems.filter(i => i.included && i.unitPrice !== '' && Number(i.unitPrice) > 0).length}
                    </strong> de {bulkItems.length}
                  </div>
                  <div className="border-l border-gray-300 dark:border-gray-600 h-4"></div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Total Cotización: </span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-black font-mono">
                      ${bulkItems.reduce((acc, item) => {
                        if (item.included && item.unitPrice !== '' && Number(item.unitPrice) > 0) {
                          return acc + (Number(item.quantity) || item.quantityRequested) * Number(item.unitPrice);
                        }
                        return acc;
                      }, 0).toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowBulkQuoteModal(false)}
                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmittingBulk || !bulkSupplierId || bulkItems.filter(i => i.included && i.unitPrice !== '' && Number(i.unitPrice) > 0).length === 0}
                    className={`px-6 py-2 rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2 ${
                      isSubmittingBulk || !bulkSupplierId || bulkItems.filter(i => i.included && i.unitPrice !== '' && Number(i.unitPrice) > 0).length === 0
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20 cursor-pointer'
                    }`}
                  >
                    {isSubmittingBulk ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Registrando Cotizaciones...
                      </>
                    ) : (
                      <>
                        <Check size={14} /> Registrar Cotizaciones ({bulkItems.filter(i => i.included && i.unitPrice !== '' && Number(i.unitPrice) > 0).length})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Modal Cuadro Comparativo General de Proveedores */}
      {showCompareModal && (() => {
        const compareBaseReqs = selectedReqIds.length > 0 
          ? requisitions.filter(r => selectedReqIds.includes(r.id))
          : requisitions;

        const availableOts = Array.from(new Set(compareBaseReqs.map(r => r.serviceRequestId).filter(Boolean))) as number[];

        const activeCompareReqs = compareBaseReqs.filter(r => {
          if (compareFilterOt !== 'all' && r.serviceRequestId !== Number(compareFilterOt)) {
            return false;
          }
          const isApproved = r.status === 'Comprada' || r.quotations?.some(q => q.isSelected);
          if (compareFilterStatus === 'pending') return !isApproved;
          if (compareFilterStatus === 'approved') return isApproved;
          return true;
        });

        // Unique suppliers in this comparison
        const supplierMap = new Map<number, Supplier>();
        activeCompareReqs.forEach(r => {
          r.quotations?.forEach(q => {
            if (q.supplierId) {
              const sup = q.supplier || suppliers.find(s => s.id === q.supplierId) || { id: q.supplierId, name: `Prov #${q.supplierId}`, isActive: true };
              supplierMap.set(q.supplierId, sup);
            }
          });
        });
        const compareSuppliers = Array.from(supplierMap.values());

        // Approved summary
        const approvedCount = activeCompareReqs.filter(r => r.quotations?.some(q => q.isSelected)).length;
        const approvedTotalAmount = activeCompareReqs.reduce((acc, r) => {
          const selectedQ = r.quotations?.find(q => q.isSelected);
          if (selectedQ) {
            return acc + (selectedQ.unitPrice * (selectedQ.quantity || r.quantity));
          }
          return acc;
        }, 0);

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 print:hidden">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-7xl w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200 flex flex-col max-h-[94vh] overflow-hidden">
              
              {/* Header */}
              <div className="p-5 px-6 border-b border-gray-100 dark:border-gray-700 flex flex-wrap justify-between items-center gap-4 bg-slate-50/70 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      Cuadro Comparativo de Presupuestos
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                        {activeCompareReqs.length} {activeCompareReqs.length === 1 ? 'repuesto' : 'repuestos'}
                      </span>
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Evalúa ofertas por proveedor, compara precios y aprueba todas las cotizaciones con 1 clic.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Filter Toggle */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setCompareFilterStatus('pending')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                        compareFilterStatus === 'pending'
                          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                      }`}
                    >
                      Solo Pendientes de Aprobación
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompareFilterStatus('all')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                        compareFilterStatus === 'all'
                          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                      }`}
                    >
                      Ver Todas
                    </button>
                  </div>

                  {/* OT Filter */}
                  {availableOts.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Filtrar por OT:</span>
                      <select
                        value={compareFilterOt}
                        onChange={e => setCompareFilterOt(e.target.value)}
                        className="text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Todas las OTs ({availableOts.length})</option>
                        {availableOts.map(ot => (
                          <option key={ot} value={ot.toString()}>OT #{ot}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Best price quick action */}
                  <button
                    type="button"
                    disabled={isSubmittingCompare || compareSuppliers.length === 0}
                    onClick={handleSelectLowestPrices}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                    title="Selecciona automáticamente la cotización más económica disponible para cada repuesto"
                  >
                    <Zap size={14} className="fill-white" />
                    ⚡ Seleccionar Menor Precio por Ítem
                  </button>

                  <button 
                    type="button"
                    onClick={() => setShowCompareModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Matrix Body */}
              <div className="flex-1 overflow-auto p-6">
                {compareSuppliers.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <BarChart3 className="mx-auto mb-3 opacity-30" size={48} />
                    <p className="font-semibold text-base">No hay cotizaciones registradas para estas requisiciones.</p>
                    <p className="text-xs mt-1">Usa el botón "Cargar Cotización de Proveedor" para ingresar las ofertas recibidas.</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full border-collapse text-left text-xs">
                      {/* Table Header: Column per Supplier */}
                      <thead className="bg-slate-100 dark:bg-slate-900 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          {/* Left sticky header: Requisition info */}
                          <th className="p-4 w-72 min-w-[280px] bg-slate-100 dark:bg-slate-900 border-r border-gray-200 dark:border-gray-700 align-top">
                            <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Artículo Solicitado / Destino
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1">
                              Mostrando {activeCompareReqs.length} requerimientos
                            </div>
                          </th>

                          {/* Column for each Quoting Supplier */}
                          {compareSuppliers.map(sup => {
                            // Calculate total for this supplier in visible requisitions
                            const supQuotes = activeCompareReqs.flatMap(r => 
                              (r.quotations || []).filter(q => q.supplierId === sup.id)
                            );
                            const totalQuoted = supQuotes.reduce((acc, q) => acc + (q.unitPrice * (q.quantity || 1)), 0);
                            const quotedCount = supQuotes.length;
                            const isAllSelected = quotedCount > 0 && supQuotes.every(q => q.isSelected);

                            return (
                              <th key={sup.id} className="p-4 min-w-[230px] border-r border-gray-200 dark:border-gray-700 last:border-r-0 align-top bg-white dark:bg-gray-800/80">
                                <div className="flex flex-col justify-between h-full gap-2.5">
                                  <div>
                                    <div className="font-extrabold text-sm text-gray-900 dark:text-white uppercase truncate" title={sup.name}>
                                      {sup.name}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                      {sup.taxId || 'Sin RIF'} &bull; <strong className="text-gray-600 dark:text-gray-300">{quotedCount} de {activeCompareReqs.length}</strong> cotizados
                                    </div>
                                    <div className="mt-1 text-xs">
                                      <span className="text-gray-500 text-[10px] uppercase font-semibold">Total Oferta: </span>
                                      <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                                        ${totalQuoted.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Select All Button for this Supplier */}
                                  <button
                                    type="button"
                                    disabled={isSubmittingCompare || quotedCount === 0}
                                    onClick={() => handleSelectAllForSupplier(sup.id)}
                                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                                      isAllSelected
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                    }`}
                                    title={`Aprobar todas las cotizaciones de ${sup.name}`}
                                  >
                                    <Award size={14} />
                                    {isAllSelected ? '✅ Todo Seleccionado' : 'Elegir Todo de este Prov.'}
                                  </button>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      {/* Table Rows: Each Requisition */}
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {activeCompareReqs.map(req => {
                          const validQuotes = (req.quotations || []).filter(q => q.unitPrice > 0);
                          const minPrice = validQuotes.length > 0 
                            ? Math.min(...validQuotes.map(q => q.unitPrice)) 
                            : null;
                          const selectedQuote = (req.quotations || []).find(q => q.isSelected);

                          return (
                            <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                              {/* Left Column: Requisition Details */}
                              <td className="p-4 bg-slate-50/40 dark:bg-slate-900/40 border-r border-gray-200 dark:border-gray-700">
                                <div className="font-bold text-gray-900 dark:text-white text-sm">
                                  {req.partNameOrDescription}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-1.5">
                                  <span className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                    Cant: {req.quantity} und.
                                  </span>
                                  <span>&bull;</span>
                                  <span>Req #{req.id.toString().padStart(4, '0')}</span>
                                  <span>&bull;</span>
                                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                    {req.serviceRequest?.vehicle?.licensePlate || req.serviceRequest?.trailer?.licensePlate || 'Flota'}
                                  </span>
                                </div>
                                {selectedQuote ? (
                                  <div className="mt-2 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Aprobado: {selectedQuote.supplier?.name || `Prov #${selectedQuote.supplierId}`} (${selectedQuote.unitPrice.toFixed(2)})
                                  </div>
                                ) : (
                                  <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                    ⏳ Pendiente por elegir
                                  </div>
                                )}
                              </td>

                              {/* Supplier Columns */}
                              {compareSuppliers.map(sup => {
                                const quote = (req.quotations || []).find(q => q.supplierId === sup.id);
                                if (!quote) {
                                  return (
                                    <td key={sup.id} className="p-4 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 bg-gray-50/30 dark:bg-gray-900/20 text-gray-400 italic text-[11px]">
                                      -- No cotizó --
                                    </td>
                                  );
                                }

                                const isLowest = minPrice !== null && quote.unitPrice === minPrice;
                                const isSelected = quote.isSelected;

                                return (
                                  <td 
                                    key={sup.id} 
                                    className={`p-4 border-r border-gray-200 dark:border-gray-700 last:border-r-0 transition-colors ${
                                      isSelected 
                                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30' 
                                        : 'bg-white dark:bg-gray-800'
                                    }`}
                                  >
                                    <div className="flex flex-col justify-between h-full gap-2">
                                      <div>
                                        <div className="flex items-center justify-between gap-1 mb-1">
                                          <div className="text-base font-extrabold text-gray-900 dark:text-white font-mono">
                                            ${quote.unitPrice.toFixed(2)}
                                          </div>
                                          {isLowest && (
                                            <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase">
                                              ⭐ Mejor Precio
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-medium">
                                          Total: <strong className="text-gray-700 dark:text-gray-300 font-mono">${(quote.unitPrice * (quote.quantity || req.quantity)).toFixed(2)}</strong> ({quote.quantity || req.quantity} und.)
                                        </div>
                                        {quote.notes && (
                                          <div className="text-[10px] text-gray-500 dark:text-gray-400 italic mt-1 line-clamp-2" title={quote.notes}>
                                            "{quote.notes}"
                                          </div>
                                        )}
                                      </div>

                                      {/* Cell Action Button */}
                                      {(() => {
                                        const hasAnyApproved = (req.quotations || []).some(q => q.isSelected);
                                        const isAnotherApproved = !isSelected && hasAnyApproved;
                                        return (
                                          <button
                                            type="button"
                                            disabled={isSubmittingCompare || isAnotherApproved}
                                            onClick={() => handleToggleCellQuote(req, quote)}
                                            className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                              isSelected
                                                ? 'bg-emerald-600 hover:bg-red-600 text-white shadow-xs group/btn cursor-pointer'
                                                : isAnotherApproved
                                                  ? 'bg-gray-100 dark:bg-gray-800/60 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50'
                                                  : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 dark:bg-slate-700/60 dark:hover:bg-emerald-950/50 dark:text-slate-200 border border-slate-200 dark:border-slate-600 cursor-pointer'
                                            }`}
                                            title={isAnotherApproved ? 'Ya existe una cotización aprobada para este repuesto.' : ''}
                                          >
                                            {isSelected ? (
                                              <>
                                                <span className="group-hover/btn:hidden flex items-center gap-1"><CheckCircle2 size={13} /> Aprobado</span>
                                                <span className="hidden group-hover/btn:inline">Deseleccionar</span>
                                              </>
                                            ) : (
                                              <>Elegir y Comprar</>
                                            )}
                                          </button>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>

                      {/* Footer Totals Row */}
                      <tfoot className="bg-slate-100 dark:bg-slate-900 border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                        <tr>
                          <td className="p-4 bg-slate-100 dark:bg-slate-900 border-r border-gray-200 dark:border-gray-700">
                            <div className="text-xs uppercase font-extrabold text-gray-700 dark:text-gray-300">
                              Total Cotizado por Proveedor
                            </div>
                            <div className="text-[10px] text-gray-500 font-normal">
                              Suma de todos los ítems ofertados
                            </div>
                          </td>

                          {compareSuppliers.map(sup => {
                            const supQuotes = activeCompareReqs.flatMap(r => 
                              (r.quotations || []).filter(q => q.supplierId === sup.id)
                            );
                            const total = supQuotes.reduce((acc, q) => acc + (q.unitPrice * (q.quantity || 1)), 0);
                            return (
                              <td key={sup.id} className="p-4 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                                <div className="text-base font-extrabold text-gray-900 dark:text-white font-mono">
                                  ${total.toFixed(2)}
                                </div>
                                <div className="text-[10px] text-gray-500 font-medium">
                                  {supQuotes.length} de {activeCompareReqs.length} ítems
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-900/70 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Progreso de Selección: </span>
                    <strong className="text-gray-900 dark:text-white font-bold">{approvedCount}</strong> de {activeCompareReqs.length} aprobados
                  </div>
                  <div className="border-l border-gray-300 dark:border-gray-600 h-4"></div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Presupuesto Aprobado: </span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-black font-mono">
                      ${approvedTotalAmount.toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowCompareModal(false)}
                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-5 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cerrar Cuadro Comparativo
                  </button>
                  {approvedCount > 0 && (
                    <button 
                      type="button"
                      onClick={() => {
                        setShowCompareModal(false);
                        setActiveTab('orders');
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-900/20 transition flex items-center gap-2 cursor-pointer"
                    >
                      <ShoppingCart size={15} /> Ver Órdenes de Compra ({approvedCount} ítems listos)
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
