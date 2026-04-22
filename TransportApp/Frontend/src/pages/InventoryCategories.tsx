import { useState, useEffect } from 'react';
import { Settings, Plus, Loader2, Trash2 } from 'lucide-react';
import { sparePartCategoriesService } from '../services/sparePartCategoriesService';
import type { SparePartCategory } from '../types';

export default function InventoryCategories() {
  const [categories, setCategories] = useState<SparePartCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await sparePartCategoriesService.getCategories();
      setCategories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sparePartCategoriesService.createCategory({ name, description });
      setName('');
      setDescription('');
      fetchCategories();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar categoría?')) {
      await sparePartCategoriesService.deleteCategory(id);
      fetchCategories();
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="text-amber-500" size={32} />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Categorías de Repuestos</h1>
          <p className="text-gray-500">Administra las etiquetas clasificatorias para el catálogo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2"><Plus size={18}/> Nueva Categoría</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-amber-500 outline-none" 
                  placeholder="Ej: Neumáticos" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-amber-500 outline-none" 
                  placeholder="(Opcional)" />
              </div>
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-md font-medium transition-colors">
                Guardar Categoría
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr><td colSpan={2} className="p-6 text-center text-gray-500"><Loader2 className="animate-spin mx-auto"/></td></tr>
                ) : categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{cat.name}</div>
                      <div className="text-sm text-gray-500">{cat.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(cat.id)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full">
                        <Trash2 size={18}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
