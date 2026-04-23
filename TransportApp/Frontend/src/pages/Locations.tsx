import { useEffect, useState } from 'react';
import { MapPin, Plus, Loader2, Trash2 } from 'lucide-react';
import { locationService, type Location } from '../services/locationService';
import { warehouseService, type Warehouse } from '../services/warehouseService';

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [warehouseId, setWarehouseId] = useState<number>(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [locData, whData] = await Promise.all([
        locationService.getLocations(),
        warehouseService.getWarehouses()
      ]);
      setLocations(locData);
      setWarehouses(whData);
      if (whData.length > 0) setWarehouseId(whData[0].id);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (warehouseId <= 0) return alert('Seleccione un almacén válido.');
    try {
      const payload = {
        name,
        description: description || undefined,
        warehouseId
      };
      
      if (editingId) {
         await locationService.updateLocation(editingId, { ...payload, id: editingId, isActive: true });
      } else {
         await locationService.createLocation(payload);
      }

      setShowForm(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta ubicación?')) {
      try {
        await locationService.deleteLocation(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting location:', error);
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    if (warehouses.length > 0) setWarehouseId(warehouses[0].id);
  };

  const handleEdit = (loc: Location) => {
     setEditingId(loc.id);
     setName(loc.name);
     setDescription(loc.description || '');
     setWarehouseId(loc.warehouseId);
     setShowForm(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <MapPin className="text-amber-500" size={32} />
            Gestión de Ubicaciones (Racks)
          </h1>
          <p className="text-gray-500 mt-1">Configura estantes, racks o pasillos para cada almacén.</p>
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
          {showForm ? 'Cancelar' : 'Añadir Ubicación'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-semibold mb-6 text-amber-600 dark:text-amber-500 flex items-center gap-2">
            {editingId ? 'Editar Ubicación' : 'Registrar Nueva Ubicación'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Almacén Perteneciente</label>
              <select 
                value={warehouseId} onChange={e => setWarehouseId(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
              >
                {warehouses.length === 0 && <option value="0">Sin almacenes</option>}
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre (Rack / Estante)</label>
              <input 
                type="text" required
                value={name} onChange={e => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="ej. Pasillo 3 - Rack B"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
              <input 
                type="text"
                value={description} onChange={e => setDescription(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Opcional"
              />
            </div>

            <div className="md:col-span-3 flex justify-end mt-2">
              <button 
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-2 rounded-md font-medium transition-colors"
              >
                Guardar Ubicación
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
                <th className="px-6 py-4">Almacén</th>
                <th className="px-6 py-4">Ubicación</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Cargando ubicaciones...
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No hay ubicaciones registradas.
                  </td>
                </tr>
              ) : (
                locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">
                      {loc.warehouse?.name || 'Desconocido'}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{loc.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{loc.description || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleEdit(loc)}
                          className="text-amber-600 hover:text-amber-800 p-2 rounded-full hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                          title="Editar"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(loc.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Eliminar"
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
