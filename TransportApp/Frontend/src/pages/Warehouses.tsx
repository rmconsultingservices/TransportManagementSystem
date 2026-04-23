import { useEffect, useState } from 'react';
import { Warehouse as WarehouseIcon, Plus, Loader2, Trash2, X } from 'lucide-react';
import { warehouseService, type Warehouse } from '../services/warehouseService';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const data = await warehouseService.getWarehouses();
      setWarehouses(data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        description: description || undefined
      };
      
      if (editingId) {
         await warehouseService.updateWarehouse(editingId, { ...payload, id: editingId, isActive: true });
      } else {
         await warehouseService.createWarehouse(payload);
      }

      setShowForm(false);
      resetForm();
      fetchWarehouses();
    } catch (error) {
      console.error('Error saving warehouse:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este almacén? Se podría perder la referencia de los repuestos almacenados.')) {
      try {
        await warehouseService.deleteWarehouse(id);
        fetchWarehouses();
      } catch (error) {
        console.error('Error deleting warehouse:', error);
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
  };

  const handleEdit = (wh: Warehouse) => {
     setEditingId(wh.id);
     setName(wh.name);
     setDescription(wh.description || '');
     setShowForm(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <WarehouseIcon className="text-amber-500" size={32} />
            Gestión de Almacenes
          </h1>
          <p className="text-gray-500 mt-1">Administra los espacios físicos de inventario.</p>
        </div>
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
          {showForm ? 'Cancelar' : 'Añadir Almacén'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-semibold mb-6 text-amber-600 dark:text-amber-500 flex items-center gap-2">
            {editingId ? 'Editar Almacén' : 'Registrar Nuevo Almacén'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Almacén</label>
              <input 
                type="text" required
                value={name} onChange={e => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="ej. Almacén Central"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción / Notas</label>
              <input 
                type="text"
                value={description} onChange={e => setDescription(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="ej. Zona Norte"
              />
            </div>

            <div className="md:col-span-2 flex justify-end mt-2">
              <button 
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-2 rounded-md font-medium transition-colors"
              >
                Guardar Almacén
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Nombre de Almacén</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Cargando almacenes...
                  </td>
                </tr>
              ) : warehouses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No hay almacenes registrados.
                  </td>
                </tr>
              ) : (
                warehouses.map((wh) => (
                  <tr key={wh.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-gray-500">{wh.id}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{wh.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{wh.description || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleEdit(wh)}
                          className="text-amber-600 hover:text-amber-800 p-2 rounded-full hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                          title="Editar Almacén"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(wh.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Eliminar almacén"
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
    </div>
  );
}
