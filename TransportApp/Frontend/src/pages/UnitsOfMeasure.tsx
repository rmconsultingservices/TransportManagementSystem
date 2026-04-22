import { useState, useEffect } from 'react';
import { Settings, Plus, Loader2, Trash2 } from 'lucide-react';
import { unitsOfMeasureService } from '../services/unitsOfMeasureService';
import type { UnitOfMeasure } from '../types';

export default function UnitsOfMeasure() {
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const data = await unitsOfMeasureService.getUnits();
      setUnits(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !abbreviation.trim()) return;
    
    try {
      await unitsOfMeasureService.createUnit({ name, abbreviation, isActive: true });
      setName('');
      setAbbreviation('');
      fetchUnits();
    } catch (e) {
      console.error(e);
      alert('Error guardando la unidad');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro de eliminar esta unidad?')) return;
    try {
      await unitsOfMeasureService.deleteUnit(id);
      fetchUnits();
    } catch (e) {
      alert('Error eliminando. Asegúrese de que no esté en uso.');
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="text-blue-500 w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unidades de Medida</h1>
          <p className="text-gray-500">Configuración de unidades para el inventario</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:col-span-1 h-fit">
          <h2 className="text-lg font-semibold mb-4">Nueva Unidad</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 outline-none focus:border-blue-500" placeholder="Ej. Litros" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Abreviatura</label>
              <input type="text" value={abbreviation} onChange={e => setAbbreviation(e.target.value)} required
                className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 outline-none focus:border-blue-500" placeholder="Ej. Lts" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 flex justify-center items-center gap-2">
              <Plus size={18} /> Agregar
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 md:col-span-2 overflow-hidden">
           {loading ? (
             <div className="p-8 flex justify-center text-gray-500"><Loader2 className="animate-spin" /></div>
           ) : (
             <table className="w-full text-left">
               <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 text-sm">
                 <tr>
                   <th className="px-6 py-4 font-medium">Nombre</th>
                   <th className="px-6 py-4 font-medium">Abreviatura</th>
                   <th className="px-6 py-4 w-16 text-center">Acciones</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                 {units.map(u => (
                   <tr key={u.id}>
                     <td className="px-6 py-4">{u.name}</td>
                     <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">{u.abbreviation}</td>
                     <td className="px-6 py-4 text-center">
                       <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700">
                         <Trash2 size={18} />
                       </button>
                     </td>
                   </tr>
                 ))}
                 {units.length === 0 && (
                   <tr>
                     <td colSpan={3} className="px-6 py-8 text-center text-gray-400">No hay unidades registradas</td>
                   </tr>
                 )}
               </tbody>
             </table>
           )}
        </div>
      </div>
    </div>
  )
}
