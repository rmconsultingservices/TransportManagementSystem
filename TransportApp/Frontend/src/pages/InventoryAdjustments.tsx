import { useEffect, useState } from 'react';
import { PackagePlus, PlusCircle, Trash2, Pen } from 'lucide-react';
import { inventoryAdjustmentsService } from '../services/inventoryAdjustmentsService';
import { inventoryService } from '../services/inventoryService';
import type { SparePart, InventoryAdjustment } from '../types';

export default function InventoryAdjustments() {
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('Carga Inicial');
  const [details, setDetails] = useState<any[]>([]);

  const safeNumber = (val: any) => {
     const n = parseFloat(String(val).replace(/,/g, '.'));
     return isNaN(n) ? 0 : n;
  };

  const fetchData = async () => {
    try {
      const [adj, parts] = await Promise.all([
         inventoryAdjustmentsService.getAdjustments(),
         inventoryService.getSpareParts()
      ]);
      setAdjustments(adj);
      setSpareParts(parts);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addRow = () => {
     setDetails([...details, { type: 'ENTRADA', sparePartId: 0, quantity: '', unitCost: '' }]);
  };

  const removeRow = (index: number) => {
     setDetails(details.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: string, value: any) => {
     const newDetails = [...details];
     newDetails[index][field] = value;
     if (field === 'sparePartId') {
       const part = spareParts.find(p => p.id === value);
       if (part) {
          newDetails[index].unitCost = part.unitCost;
       }
     }
     setDetails(newDetails);
  };

  const handleEdit = (adj: InventoryAdjustment) => {
    setEditingId(adj.id!);
    setDate(new Date(adj.date).toISOString().split('T')[0]);
    setRemarks(adj.remarks);
    setDetails(adj.details?.map((d: any) => ({
       sparePartId: d.sparePartId,
       type: d.type.toUpperCase(),
       quantity: d.quantity,
       unitCost: d.unitCost,
       totalCost: Number(d.quantity) * Number(d.unitCost)
    })) || []);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de revertir y eliminar este ajuste?')) return;
    try {
      await inventoryAdjustmentsService.deleteAdjustment(id);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Error eliminando');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setDetails([]);
    setRemarks('Carga Inicial');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (details.length === 0 || details.some(d => d.sparePartId === 0)) {
      alert("Introduce items válidos.");
      return;
    }
    try {
      const payload = {
        date: new Date(date).toISOString(),
        remarks,
        details: details.map((d: any) => ({
            ...d,
            quantity: safeNumber(d.quantity),
            unitCost: safeNumber(d.unitCost)
        }))
      };
      
      if (editingId) {
        await inventoryAdjustmentsService.updateAdjustment(editingId, payload);
      } else {
        await inventoryAdjustmentsService.createAdjustment(payload);
      }
      resetForm();
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Error.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <PackagePlus className="text-blue-500" size={32} />
            Ajustes de Inventario
          </h1>
        </div>
        <button 
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {showForm ? 'Ver Historial' : 'Nuevo Ajuste'}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-md">
           <div className="grid grid-cols-2 gap-4 mb-6">
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                 <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo</label>
                 <input type="text" required value={remarks} onChange={e => setRemarks(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
           </div>

           <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6 block w-full bg-white dark:bg-gray-800">
              <table className="w-full text-left">
                 <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 text-xs border-b border-gray-200 dark:border-gray-700">
                    <tr>
                       <th className="px-4 py-3">Tipo</th>
                       <th className="px-4 py-3">Repuesto</th>
                       <th className="px-4 py-3 w-32">Cantidad</th>
                       <th className="px-4 py-3 w-32">Unidad</th>
                       <th className="px-4 py-3 w-40">Costo Unit.</th>
                       <th className="px-4 py-3 w-40">Costo Total</th>
                       <th className="px-4 py-3 w-16 text-center">
                         <PlusCircle size={18} className="mx-auto cursor-pointer text-blue-500" onClick={addRow}/>
                       </th>
                    </tr>
                 </thead>
                 <tbody>
                    {details.length === 0 ? (
                       <tr><td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">Vacío</td></tr>
                    ) : details.map((row, i) => (
                       <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                          <td className="px-3 py-2">
                             <select value={row.type} onChange={e => updateRow(i, 'type', e.target.value)} className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                <option value="ENTRADA" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">ENTRADA</option>
                                <option value="SALIDA" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">SALIDA</option>
                             </select>
                          </td>
                          <td className="px-3 py-2">
                             <select value={row.sparePartId} onChange={e => updateRow(i, 'sparePartId', Number(e.target.value))} required className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                <option value="0" disabled className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">-- Seleccione --</option>
                                {spareParts.map((p) => <option key={p.id} value={p.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{p.code} - {p.name}</option>)}
                             </select>
                          </td>
                          <td className="px-3 py-2">
                             <input type="text" value={row.quantity || ''} onChange={e => updateRow(i, 'quantity', e.target.value)} required className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 outline-none focus:border-blue-500 text-right bg-transparent dark:text-white" />
                          </td>
                          <td className="px-3 py-2 text-sm text-center text-gray-500 dark:text-gray-400">
                             {row.sparePartId ? (spareParts.find(p => p.id === row.sparePartId)?.unitOfMeasure?.abbreviation || 'UD') : 'UD'}
                          </td>
                          <td className="px-3 py-2 text-right">
                             <div className="relative">
                               <span className="absolute left-2 top-1.5 text-gray-400">$</span>
                               <input type="text" value={row.unitCost || ''} onChange={e => updateRow(i, 'unitCost', e.target.value)} required className="w-full pl-6 text-sm rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 outline-none focus:border-blue-500 text-right bg-transparent dark:text-white" />
                             </div>
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-gray-800 dark:text-gray-200">
                             ${(safeNumber(row.quantity) * safeNumber(row.unitCost)).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center">
                             <button type="button" onClick={() => removeRow(i)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 size={16}/></button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {editingId && <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg outline-none">Cancelar</button>}
              <button type="submit" disabled={details.length === 0} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-8 py-2 text-white rounded-lg outline-none font-bold">Guardar</button>
           </div>
        </form>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                 <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Obs</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                 </tr>
              </thead>
              <tbody>
                 {adjustments.map(adj => (
                    <tr key={adj.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-900/30 text-gray-900 dark:text-gray-200">
                       <td className="px-6 py-4 font-bold">#AJS-{adj.id}</td>
                       <td className="px-6 py-4">{new Date(adj.date).toLocaleDateString()}</td>
                       <td className="px-6 py-4">{adj.remarks}</td>
                       <td className="px-6 py-4 text-right flex justify-end gap-2">
                             <button onClick={() => handleEdit(adj)} className="p-2 text-blue-600 rounded-lg"><Pen size={18} /></button>
                             <button onClick={() => handleDelete(adj.id!)} className="p-2 text-red-600 rounded-lg"><Trash2 size={18} /></button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
}
