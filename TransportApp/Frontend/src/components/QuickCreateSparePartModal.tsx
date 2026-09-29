import React, { useState, useEffect } from 'react';
import { X, Package, Wrench, Loader2, Check } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { sparePartCategoriesService } from '../services/sparePartCategoriesService';
import { unitsOfMeasureService } from '../services/unitsOfMeasureService';
import { warehouseService, type Warehouse } from '../services/warehouseService';
import type { SparePart, SparePartCategory, UnitOfMeasure } from '../types';

interface QuickCreateSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPart: SparePart) => void;
  initialName?: string;
  initialItemType?: 'Producto' | 'Servicio';
  initialCost?: number;
  initialUnitId?: number;
}

export default function QuickCreateSparePartModal({
  isOpen,
  onClose,
  onSuccess,
  initialName = '',
  initialItemType = 'Producto',
  initialCost = 0,
  initialUnitId
}: QuickCreateSparePartModalProps) {
  const [name, setName] = useState(initialName);
  const [code, setCode] = useState('');
  const [itemType, setItemType] = useState<'Producto' | 'Servicio'>(initialItemType);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [unitOfMeasureId, setUnitOfMeasureId] = useState<number | ''>(initialUnitId || '');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [unitCost, setUnitCost] = useState<number>(initialCost);
  
  const [categories, setCategories] = useState<SparePartCategory[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setCode('');
      setItemType(initialItemType);
      setBrand('');
      setModel('');
      setUnitCost(initialCost);
      setUnitOfMeasureId(initialUnitId || '');

      setLoadingData(true);
      Promise.all([
        sparePartCategoriesService.getCategories().catch(() => []),
        unitsOfMeasureService.getUnits().catch(() => []),
        warehouseService.getWarehouses().catch(() => [])
      ]).then(([catData, unitData, whData]) => {
        setCategories(catData || []);
        const activeUnits = (unitData || []).filter((u: UnitOfMeasure) => u.isActive);
        setUnits(activeUnits);
        setWarehouses(whData || []);
        
        if (whData && whData.length > 0 && !warehouseId) {
          setWarehouseId(whData[0].id);
        }

        // Set default unit if not set
        if (!initialUnitId && activeUnits.length > 0) {
          const defaultUnd = activeUnits.find(u => u.abbreviation?.toUpperCase() === 'UND' || u.name?.toUpperCase().includes('UNIDAD')) || activeUnits[0];
          if (defaultUnd) {
            setUnitOfMeasureId(defaultUnd.id);
          }
        }
      }).finally(() => {
        setLoadingData(false);
      });
    }
  }, [isOpen, initialName, initialItemType, initialCost, initialUnitId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingrese el nombre del repuesto o servicio.');
      return;
    }

    try {
      setIsSaving(true);
      const payload: any = {
        name: name.trim(),
        code: code.trim() || '',
        itemType,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        unitCost: Number(unitCost) || 0,
        stockQuantity: 0,
        minimumStock: 0,
        registrationDate: new Date().toISOString(),
        isActive: true,
        sparePartUnits: []
      };

      let selectedUnit = units.find(u => u.id === Number(unitOfMeasureId));
      if (!selectedUnit && units.length > 0) {
        selectedUnit = units.find(u => u.abbreviation?.toUpperCase() === 'UND' || u.name?.toUpperCase().includes('UNIDAD')) || units[0];
      }

      if (selectedUnit) {
        payload.unitOfMeasureId = selectedUnit.id;
      } else if (unitOfMeasureId && Number(unitOfMeasureId) > 0) {
        payload.unitOfMeasureId = Number(unitOfMeasureId);
      }

      if (categoryId && Number(categoryId) > 0) {
        payload.categoryId = Number(categoryId);
      }
      if (warehouseId && Number(warehouseId) > 0) {
        payload.warehouseId = Number(warehouseId);
      }

      const created = await inventoryService.createSparePart(payload);
      
      // Ensure unitOfMeasure object is attached even if backend returned it null
      if (selectedUnit && (!created.unitOfMeasure || !created.unitOfMeasure.id)) {
        created.unitOfMeasure = selectedUnit;
        created.unitOfMeasureId = selectedUnit.id;
      }

      onSuccess(created);
      onClose();
    } catch (error: any) {
      console.error('Error al crear repuesto rápido:', error);
      alert('Ocurrió un error al crear el repuesto: ' + (error?.response?.data?.message || error?.message || 'Error desconocido'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                Carga Rápida de Repuesto / Servicio
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Se agregará al catálogo maestro y se asignará automáticamente a esta fila
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo de Ítem */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Tipo de Registro
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setItemType('Producto')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  itemType === 'Producto'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <Package size={15} /> Producto Físico (Repuesto)
              </button>
              <button
                type="button"
                onClick={() => setItemType('Servicio')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  itemType === 'Servicio'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <Wrench size={15} /> Servicio Externo
              </button>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Nombre o Descripción <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. FILTRO DE ACEITE PRIMARIO"
              className="w-full text-xs font-medium rounded-xl border border-gray-300 dark:border-gray-600 px-3.5 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>

          {/* Código y Costo Referencial */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Código / Nro de Parte <span className="text-gray-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Auto-generado si se deja vacío"
                className="w-full text-xs font-medium rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Costo Unit. Ref. ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={e => setUnitCost(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-xs font-medium rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono"
              />
            </div>
          </div>

          {/* Marca y Modelo (Opcionales) */}
          {itemType === 'Producto' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Marca <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="Ej. Donaldson, Bosch, etc."
                  className="w-full text-xs font-medium rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Modelo / Referencia <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder="Ej. P550388"
                  className="w-full text-xs font-medium rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Unidad de Medida y Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Unidad de Medida
              </label>
              <select
                value={unitOfMeasureId}
                onChange={e => setUnitOfMeasureId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs font-medium rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
              >
                {units.length === 0 && <option value="">Cargando unidades...</option>}
                {units.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.abbreviation})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Categoría
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs font-medium rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
              >
                <option value="">-- Sin categoría --</option>
                {categories.filter(c => c.isActive).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Almacén (si es producto físico) */}
          {itemType === 'Producto' && warehouses.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Almacén Asignado
              </label>
              <select
                value={warehouseId}
                onChange={e => setWarehouseId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs font-medium rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
              >
                {warehouses.filter(w => w.isActive).map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Guardar y Asignar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
