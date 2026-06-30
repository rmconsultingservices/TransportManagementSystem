import { useEffect, useState } from 'react';
import { PackageOpen, Plus, Loader2, Trash2, AlertTriangle, FileClock, X, ArrowUpRight, ArrowDownRight, Search, Printer, MapPin, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryService } from '../services/inventoryService';
import type { SparePart } from '../types';

export default function Inventory() {
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [itemType, setItemType] = useState('Producto');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [unitOfMeasureId, setUnitOfMeasureId] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [lifeSpanKm, setLifeSpanKm] = useState<number | ''>('');
  const [lifeSpanMonths, setLifeSpanMonths] = useState<number | ''>('');
  const [registrationDate, setRegistrationDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  const [warehouseId, setWarehouseId] = useState<number>(0);
  const [locationId, setLocationId] = useState<number>(0);

  // Kardex details
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPart, setHistoryPart] = useState<SparePart | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printFilters, setPrintFilters] = useState({
    warehouseFrom: '',
    warehouseTo: '',
    rackFrom: '',
    rackTo: '',
    stockFilter: 'all'
  });

  const filteredParts = spareParts.filter(part => {
    const search = searchTerm.toLowerCase();
    return (
      part.name.toLowerCase().includes(search) ||
      part.code.toLowerCase().includes(search) ||
      (part.location?.name || '').toLowerCase().includes(search) ||
      (part.category?.name || '').toLowerCase().includes(search)
    );
  });

  const fetchSparePartsAndCategories = async () => {
    try {
      setLoading(true);
      const [partsData, catData, unitsData, whData] = await Promise.all([
         inventoryService.getSpareParts(),
         import('../services/sparePartCategoriesService').then(m => m.sparePartCategoriesService.getCategories()),
         import('../services/unitsOfMeasureService').then(m => m.unitsOfMeasureService.getUnits()),
         import('../services/warehouseService').then(m => m.warehouseService.getWarehouses())
      ]);
      setSpareParts(partsData);
      setCategories(catData);
      setUnits(unitsData);
      setWarehouses(whData);
      if (catData.length > 0) setCategoryId(catData[0].id);
      if (unitsData.length > 0) setUnitOfMeasureId(unitsData[0].id);
      if (whData.length > 0) {
        setWarehouseId(whData[0].id);
        fetchLocations(whData[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async (wId: number) => {
    try {
      const locData = await import('../services/locationService').then(m => m.locationService.getLocations(wId));
      setLocations(locData);
      if (locData.length > 0) setLocationId(locData[0].id);
      else setLocationId(0);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  useEffect(() => {
    if (warehouseId > 0) {
      fetchLocations(warehouseId);
    }
  }, [warehouseId]);

  useEffect(() => {
    fetchSparePartsAndCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        itemType,
        code,
        name,
        estimatedLifeSpanKm: lifeSpanKm === '' ? undefined : Number(lifeSpanKm),
        estimatedLifeSpanMonths: lifeSpanMonths === '' ? undefined : Number(lifeSpanMonths),
        registrationDate: new Date(registrationDate).toISOString(),
        isActive: true
      };
      if (categoryId > 0) payload.categoryId = categoryId;
      if (unitOfMeasureId > 0) payload.unitOfMeasureId = unitOfMeasureId;
      if (warehouseId > 0) payload.warehouseId = warehouseId;
      if (locationId > 0) payload.locationId = locationId;
      
      if (editingId) {
         payload.id = editingId;
         const existingPart = spareParts.find(p => p.id === editingId);
         if (existingPart) {
            payload.stockQuantity = existingPart.stockQuantity;
            payload.unitCost = existingPart.unitCost;
         }
         await inventoryService.updateSparePart(editingId, payload as any);
      } else {
         payload.stockQuantity = 0;
         payload.unitCost = 0;
         const created = await inventoryService.createSparePart(payload);
         payload.id = created.id;
      }

      if (imageFile && payload.id) {
         await inventoryService.uploadImage(payload.id, imageFile);
      }

      toast.success(editingId ? 'Componente actualizado' : 'Componente registrado');
      setShowForm(false);
      resetForm();
      fetchSparePartsAndCategories();
    } catch (error: any) {
      console.error('Error saving item:', error);
      alert('Error al guardar el componente: ' + (error.response?.data?.message || error.response?.data || error.message));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este repuesto?')) {
      try {
        await inventoryService.deleteSparePart(id);
        toast.success('Componente eliminado');
        fetchSparePartsAndCategories();
      } catch (error: any) {
        console.error('Error al eliminar repuesto:', error);
        alert('Error al eliminar: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setImageFile(null);
    setPreviewUrl(null);
    setItemType('Producto');
    setCode('');
    setName('');
    if (units.length > 0) setUnitOfMeasureId(units[0].id);
    else setUnitOfMeasureId(0);
    if (categories.length > 0) setCategoryId(categories[0].id);
    else setCategoryId(0);
    if (warehouses.length > 0) setWarehouseId(warehouses[0].id);
    else setWarehouseId(0);
    if (locations.length > 0) setLocationId(locations[0].id);
    else setLocationId(0);
    setLifeSpanKm('');
    setLifeSpanMonths('');
    setRegistrationDate(new Date().toISOString().split('T')[0]);
  };

  const handleEdit = (part: SparePart) => {
     setEditingId(part.id);
     setItemType(part.itemType || 'Producto');
     setCode(part.code);
     setName(part.name);
     setUnitOfMeasureId(part.unitOfMeasureId || 0);
     setCategoryId(part.categoryId || 0);
     setWarehouseId(part.warehouseId || 0);
     setLocationId(part.locationId || 0);
     setLifeSpanKm(part.estimatedLifeSpanKm ?? '');
     setLifeSpanMonths(part.estimatedLifeSpanMonths ?? '');
     const dateStr = part.registrationDate ? new Date(part.registrationDate).toISOString().split('T')[0] : '';
     setRegistrationDate(dateStr && !dateStr.startsWith('0001') ? dateStr : new Date().toISOString().split('T')[0]);
     setImageFile(null);
     setPreviewUrl(part.imageUrl ? `http://localhost:5024${part.imageUrl}` : null);
     setShowForm(true);
  };

  const loadHistory = async (part: SparePart) => {
    setHistoryPart(part);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const data = await inventoryService.getSparePartHistory(part.id);
      setHistoryData(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };
  const printableParts = spareParts.filter(part => {
    const warehouse = part.warehouse?.name || 'Sin Almacén';
    const rack = part.location?.name || 'Sin Rack';
    const stock = part.stockQuantity || 0;

    const matchesWarehouse = (!printFilters.warehouseFrom || warehouse >= printFilters.warehouseFrom) &&
                             (!printFilters.warehouseTo || warehouse <= printFilters.warehouseTo);
    
    const matchesRack = (!printFilters.rackFrom || rack >= printFilters.rackFrom) &&
                        (!printFilters.rackTo || rack <= printFilters.rackTo);

    const matchesStock = printFilters.stockFilter === 'all' ? true :
                         printFilters.stockFilter === 'greater' ? stock > 0 :
                         printFilters.stockFilter === 'equal' ? stock === 0 : true;

    return matchesWarehouse && matchesRack && matchesStock;
  });

  const totalItemsPrint = printableParts.length;
  const totalValuePrint = printableParts.reduce((sum, part) => sum + ((part.stockQuantity || 0) * (part.unitCost || 0)), 0);

  const groupedParts = printableParts.reduce((acc, part) => {
    const locName = part.warehouse?.name || 'Sin Almacén';
    const rackName = part.location?.name || 'Sin Rack';
    const key = `Ubicación: ${locName} (${rackName})`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(part);
    return acc;
  }, {} as Record<string, SparePart[]>);

  const uniqueWarehouses = Array.from(new Set(spareParts.map(p => p.warehouse?.name || 'Sin Almacén'))).sort();
  const uniqueRacks = Array.from(new Set(spareParts.map(p => p.location?.name || 'Sin Rack'))).sort();

  return (
    <>
    <div className="p-8 max-w-7xl mx-auto print:hidden">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <PackageOpen className="text-amber-500" size={32} />
            Catálogo de Repuestos
          </h1>
          <p className="text-gray-500 mt-1">Configura la vida útil para el mantenimiento predictivo.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowPrintModal(true)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Printer size={20} />
            Imprimir Reporte
          </button>
          <button 
            onClick={() => {
               if(showForm) {
                 setShowForm(false);
                 resetForm();
               } else {
                 resetForm();
                 setShowForm(true);
               }
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} />
            {showForm ? 'Cancelar' : 'Añadir Repuesto'}
          </button>
        </div>
      </div>

      {showForm && <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 mb-8 animate-in fade-in slide-in-from-top-4">
            <h2 className="text-xl font-semibold mb-6 text-amber-600 dark:text-amber-500 flex items-center gap-2">
              {editingId ? 'Editar Componente' : 'Registrar Nuevo Componente'}
            </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código SSR</label>
              <input 
                type="text" required
                value={code} onChange={e => setCode(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="ej. FIL-ACE-01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Registro</label>
              <input 
                type="date" required
                value={registrationDate} onChange={e => setRegistrationDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Repuesto</label>
              <input 
                type="text" required
                value={name} onChange={e => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="ej. Filtro de Aceite Sintético Avanzado"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidad de Medida</label>
              <select 
                  value={unitOfMeasureId} onChange={e => setUnitOfMeasureId(Number(e.target.value))} required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value={0} disabled>Seleccione una unidad</option>
                  {units.length === 0 && <option value="0" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Sin Unidades</option>}
                  {units.map(u => <option key={u.id} value={u.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{u.name} ({u.abbreviation})</option>)}
                </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
              <select 
                  value={categoryId} onChange={e => setCategoryId(Number(e.target.value))} required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value={0} disabled>Seleccione una categoría</option>
                  {categories.length === 0 && <option value="0" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Sin Categorías</option>}
                  {categories.map(c => <option key={c.id} value={c.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{c.name}</option>)}
                </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Almacén</label>
              <select 
                  value={warehouseId} onChange={e => setWarehouseId(Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value={0} disabled>Seleccione un almacén</option>
                  {warehouses.length === 0 && <option value="0" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Sin Almacenes</option>}
                  {warehouses.map(w => <option key={w.id} value={w.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{w.name}</option>)}
                </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ubicación (Rack/Estante)</label>
              <select 
                  value={locationId} onChange={e => setLocationId(Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value={0} disabled>Seleccione una ubicación</option>
                  {locations.length === 0 && <option value="0" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Sin Ubicaciones</option>}
                  {locations.map(l => <option key={l.id} value={l.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{l.name}</option>)}
                </select>
            </div>
            
            {/* Predictive Maintenance Fields */}
            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-200 dark:border-amber-700/50 relative">
               <label className="block text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                 <AlertTriangle size={16} /> Vida Útil Estimada (KM)
               </label>
               <input 
                 type="number" min="0" step="1"
                 value={lifeSpanKm} onChange={e => setLifeSpanKm(e.target.value === '' ? '' : parseInt(e.target.value))}
                 className="w-full rounded-md border border-amber-300 dark:border-amber-600 px-3 py-2 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                 placeholder="Opcional. ej. 15000"
               />
               <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">Se usará para alertar sobre próximos cambios.</p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-200 dark:border-amber-700/50 relative">
               <label className="block text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                 <AlertTriangle size={16} /> Vida Útil Estimada (Meses)
               </label>
               <input 
                 type="number" min="0" step="1"
                 value={lifeSpanMonths} onChange={e => setLifeSpanMonths(e.target.value === '' ? '' : parseInt(e.target.value))}
                 className="w-full rounded-md border border-amber-300 dark:border-amber-600 px-3 py-2 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                 placeholder="Opcional. ej. 6"
               />
               <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">Desechable por tiempo caducado.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700/50 relative">
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagen Referencial</label>
               {previewUrl && (
                  <div className="mb-3">
                     <img src={previewUrl} alt="Preview" className="h-32 w-32 object-cover rounded-md border border-gray-300" />
                  </div>
               )}
               <input 
                 type="file" accept="image/*"
                 onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                       setImageFile(e.target.files[0]);
                       setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                    }
                 }}
                 className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
               />
            </div>

            <div className="lg:col-span-3 flex justify-end mt-2">
              <button 
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-2 rounded-md font-medium transition-colors"
              >
                Guardar Repuesto en Catálogo
              </button>
            </div>
          </form>
        </div>
      }

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por código, nombre o rack..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="text-sm text-gray-500">
          Mostrando <span className="font-bold text-gray-900 dark:text-white">{filteredParts.length}</span> de <span className="font-bold text-gray-900 dark:text-white">{spareParts.length}</span> repuestos
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Imagen</th>
                <th className="px-6 py-4">Código / Nombre</th>
                <th className="px-6 py-4">Stock Físico (Pzas)</th>
                <th className="px-6 py-4">Costo Prom. Unit</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Cargando catálogo...
                  </td>
                </tr>
              ) : filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron repuestos para tu búsqueda.' : 'Catálogo vacío. Añade repuestos para activar las predicciones de mantenimiento.'}
                  </td>
                </tr>
              ) : (
                filteredParts.map((part) => (
                  <tr key={part.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group" onClick={() => loadHistory(part)}>
                    <td className="px-6 py-4">
                      {part.imageUrl ? (
                        <img src={`http://localhost:5024${part.imageUrl}`} alt={part.name} className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600">
                          <PackageOpen className="text-gray-400" size={24} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {part.code} 
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                           {part.category?.name || 'Varios'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ml-1 ${part.itemType === 'Servicio' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'}`}>
                           {part.itemType || 'Producto'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{part.name}</div>
                      {(part.warehouse || part.location) && (
                        <div className="text-xs text-amber-600 dark:text-amber-500 mt-1 flex items-center gap-1">
                          <PackageOpen size={12} />
                          {part.warehouse?.name || 'Sin almacén'} / {part.location?.name || 'Sin rack'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-2xl font-black ${
                          part.stockQuantity > 5 ? 'text-emerald-600' : 
                          part.stockQuantity > 0 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                         {part.stockQuantity} <span className="text-sm font-medium text-gray-500">{part.unitOfMeasure?.abbreviation || '-'}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ml-1 ${part.itemType === 'Servicio' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'}`}>
                           {part.itemType || 'Producto'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-gray-800 dark:text-gray-200 font-medium text-lg">${part.unitCost.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => loadHistory(part)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-2 text-sm font-medium"
                          title="Ver Movimientos (Kardex)"
                        >
                          <FileClock size={16} /> Kardex
                        </button>
                        <button 
                          onClick={() => handleEdit(part)}
                          className="text-amber-600 hover:text-amber-800 p-2 rounded-full hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                          title="Editar Repuesto"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(part.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Eliminar repuesto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kardex Modal */}
      {showHistoryModal && historyPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
             
             {/* Header */}
             <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
               <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <FileClock className="text-blue-500"/> Kardex de Inventario
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Historial del Componente <strong className="text-gray-800 dark:text-gray-200">{historyPart.code} - {historyPart.name}</strong></p>
               </div>
               <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-red-500 p-2"><X size={24}/></button>
             </div>

             {/* Content / Body */}
             <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4 rounded-xl flex items-center justify-between">
                      <span className="text-emerald-800 font-semibold text-sm">Stock Físico Actual:</span>
                      <span className="text-3xl font-black text-emerald-600">{historyPart.stockQuantity}</span>
                   </div>
                   <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl flex items-center justify-between">
                      <span className="text-blue-800 font-semibold text-sm">Costo Promedio Unitario:</span>
                      <span className="text-3xl font-black text-blue-600">${historyPart.unitCost.toFixed(2)}</span>
                   </div>
                </div>

                {historyLoading ? (
                   <div className="py-12 flex justify-center text-gray-400"><Loader2 className="animate-spin" size={32}/></div>
                ) : historyData.length === 0 ? (
                   <div className="py-12 text-center text-gray-500 border border-dashed rounded-xl border-gray-200 dark:border-gray-700">No hay movimientos registrados para este repuesto.</div>
                ) : (
                   <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <table className="w-full text-sm text-left">
                         <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase font-bold text-xs">
                            <tr>
                               <th className="px-4 py-3">Fecha</th>
                               <th className="px-4 py-3">Tipo de Mov.</th>
                               <th className="px-4 py-3">Comprobante</th>
                               <th className="px-4 py-3">Origen / Destino</th>
                               <th className="px-4 py-3 text-right">Cantidad</th>
                               <th className="px-4 py-3 text-right">Costo C/U</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {historyData.map((mov, i) => (
                               <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 bg-white dark:bg-gray-900">
                                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-200">{new Date(mov.date).toLocaleDateString()}</td>
                                  <td className="px-4 py-3">
                                     {mov.type === 'ENTRADA' ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold"><ArrowDownRight size={14}/> ENTRADA</span>
                                     ) : (
                                        <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full text-xs font-bold"><ArrowUpRight size={14}/> SALIDA / CONSUMO</span>
                                     )}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">{mov.reference}</td>
                                  <td className="px-4 py-3 text-gray-600">{mov.source}</td>
                                  <td className={`px-4 py-3 text-right font-black ${mov.type === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                     {mov.type === 'ENTRADA' ? '+' : '-'}{mov.quantity}
                                  </td>
                                  <td className="px-4 py-3 text-right text-gray-500 font-medium">
                                     {mov.type === 'ENTRADA' ? `$${mov.unitCost.toFixed(2)}` : '---'}
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
               )}
             </div>

          </div>
        </div>
      )}

      {/* Modal de Filtros para Impresión */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Printer className="text-amber-500" size={24} /> Opciones de Reporte
              </h3>
              <button onClick={() => setShowPrintModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Almacén (Desde)</label>
                  <select 
                    value={printFilters.warehouseFrom}
                    onChange={(e) => setPrintFilters({...printFilters, warehouseFrom: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Cualquiera</option>
                    {uniqueWarehouses.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Almacén (Hasta)</label>
                  <select 
                    value={printFilters.warehouseTo}
                    onChange={(e) => setPrintFilters({...printFilters, warehouseTo: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Cualquiera</option>
                    {uniqueWarehouses.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rack (Desde)</label>
                  <select 
                    value={printFilters.rackFrom}
                    onChange={(e) => setPrintFilters({...printFilters, rackFrom: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Cualquiera</option>
                    {uniqueRacks.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rack (Hasta)</label>
                  <select 
                    value={printFilters.rackTo}
                    onChange={(e) => setPrintFilters({...printFilters, rackTo: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Cualquiera</option>
                    {uniqueRacks.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Existencia</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'greater', label: '> 0' },
                    { id: 'equal', label: '= 0' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setPrintFilters({...printFilters, stockFilter: opt.id})}
                      className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                        printFilters.stockFilter === opt.id 
                        ? 'bg-amber-500 border-amber-500 text-white shadow-md' 
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button 
                onClick={() => setShowPrintModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
              <button 
                onClick={() => {
                  setShowPrintModal(false);
                  setTimeout(() => window.print(), 100);
                }}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={18} /> Generar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Reporte de Impresión (Solo visible al imprimir) */}
    <div className="hidden print:block bg-white text-black p-8 font-sans">
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <h1 className="text-4xl font-bold text-gray-900">Inventario Actual</h1>
        <div className="text-right">
          <p className="text-gray-500 font-medium">Fecha: {new Date().toLocaleDateString()}</p>
          <p className="text-gray-500 font-medium">Estado: <span className="text-emerald-600">VERIFICADO</span></p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-center">
          <p className="text-gray-500 font-medium text-sm mb-1">Total de Artículos (SKUs)</p>
          <p className="text-4xl font-black text-gray-900">{totalItemsPrint.toLocaleString()}</p>
          <div className="mt-2 flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-tight">
             <TrendingUp size={14} /> +12% vs el mes pasado
          </div>
        </div>
        <div className="bg-blue-600 rounded-lg p-5 flex flex-col justify-center text-white relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-2 translate-y-2">
             <Printer size={80} />
          </div>
          <p className="text-blue-100 font-medium text-sm mb-1 relative z-10">Valor Total de Inventario</p>
          <p className="text-4xl font-black relative z-10">${totalValuePrint.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className="mt-2 flex items-center gap-2 text-blue-100 font-bold text-xs uppercase tracking-tight relative z-10">
             <FileClock size={14} /> Actualizado hace 2 horas
          </div>
        </div>
      </div>

      {Object.entries(groupedParts).map(([groupKey, parts]) => (
        <div key={groupKey} className="mb-10 page-break-inside-avoid">
          <div className="flex items-center gap-2 mb-4 justify-center relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative bg-white px-4 text-gray-500 font-semibold flex items-center gap-2 text-lg">
              <MapPin size={20} /> {groupKey}
            </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-2 py-3 w-32">Código de Artículo</th>
                <th className="px-2 py-3">Nombre del Artículo</th>
                <th className="px-2 py-3 text-center w-20">Cantidad</th>
                <th className="px-2 py-3 text-right w-24">Costo Unitario</th>
                <th className="px-2 py-3 text-right w-28">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parts.map(part => {
                const total = (part.stockQuantity || 0) * (part.unitCost || 0);
                return (
                  <tr key={part.id} className="border-b border-gray-50">
                    <td className="px-2 py-3 font-bold text-blue-600 text-[11px]">#{part.code}</td>
                    <td className="px-2 py-3 font-bold text-gray-900 text-[11px] leading-tight break-words">{part.name}</td>
                    <td className="px-2 py-3 text-center">
                       <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded text-[10px] font-bold ${
                         part.stockQuantity > 10 ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                         part.stockQuantity > 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-red-50 text-red-700 border border-red-100'
                       }`}>
                         {part.stockQuantity}
                       </span>
                    </td>
                    <td className="px-2 py-3 text-right font-medium text-gray-600 text-[11px]">${(part.unitCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-2 py-3 text-right font-bold text-gray-900 text-[11px]">${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
      
      <div className="mt-12 pt-8 border-t border-gray-200 text-xs text-gray-400 flex justify-between font-medium">
         <span>© 2026 TransportApp • Documento: INV2026-5-99</span>
         <div className="flex gap-4">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div> ESTADO: VERIFICADO</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-400"></div> SINCRONIZADO: {new Date().toLocaleTimeString()}</span>
         </div>
      </div>
    </div>
    </>
  );
}
