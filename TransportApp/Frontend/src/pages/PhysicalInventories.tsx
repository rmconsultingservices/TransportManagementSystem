import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, PackageOpen, ClipboardList, AlertCircle, Play, Eye, FileText, FileDown } from 'lucide-react';
import type { PhysicalInventory } from '../types/inventory';
import { physicalInventoryService } from '../services/physicalInventoryService';
import { warehouseService, type Warehouse } from '../services/warehouseService';
import { locationService, type Location } from '../services/locationService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function PhysicalInventories() {
  const [inventories, setInventories] = useState<PhysicalInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  const [formData, setFormData] = useState({
    description: '',
    warehouseId: 0,
    locationId: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadInventories();
    loadWarehouses();
  }, []);

  const loadInventories = async () => {
    try {
      const data = await physicalInventoryService.getAll();
      setInventories(data);
    } catch (error) {
      toast.error('Error al cargar tomas de inventario');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const data = await warehouseService.getWarehouses();
      setWarehouses(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleWarehouseChange = async (warehouseId: number) => {
    setFormData({ ...formData, warehouseId, locationId: 0 });
    try {
      const data = await locationService.getLocations(warehouseId);
      setLocations(data);
    } catch (error) {
      setLocations([]);
    }
  };

  const handleStartInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || formData.warehouseId === 0) {
      toast.error('Por favor complete los campos requeridos');
      return;
    }

    try {
      const result = await physicalInventoryService.start({
        description: formData.description,
        warehouseId: formData.warehouseId,
        locationId: formData.locationId === 0 ? undefined : formData.locationId
      });
      toast.success('Toma de inventario iniciada con éxito');
      setIsModalOpen(false);
      navigate(`/inventory/physical/${result.id}`);
    } catch (error) {
      toast.error('Error al iniciar toma de inventario');
    }
  };

  const filteredInventories = inventories.filter(inv => 
    inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="text-indigo-600 dark:text-indigo-400" />
            Toma Física de Inventario
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Gestiona los conteos físicos de almacenes y ubicaciones
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} />
          <span>Nueva Toma Física</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por número o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Número</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Almacén / Ubicación</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha Inicio</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : filteredInventories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <ClipboardList size={48} className="text-gray-300 mb-2" />
                      <p>No se encontraron registros de tomas físicas.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInventories.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 dark:text-white">{inv.number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 dark:text-gray-300">{inv.description}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                          <PackageOpen size={14} className="text-gray-400" />
                          {inv.warehouse?.name}
                        </span>
                        {inv.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <MapPin size={12} />
                            {inv.location.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(inv.dateStarted).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        inv.status === 'PROCESSED' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {inv.status === 'PROCESSED' ? 'Procesado' : 'Iniciado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/inventory/physical/${inv.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center justify-end gap-1 w-full"
                      >
                        {inv.status === 'PROCESSED' ? <><Eye size={18} /> Ver</> : <><Play size={18} /> Continuar</>}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Start Inventory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="text-indigo-600" />
                Iniciar Toma Física
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <AlertCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleStartInventory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción / Motivo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ej. Inventario Anual 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Almacén <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.warehouseId}
                  onChange={e => handleWarehouseChange(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value={0}>Seleccione un almacén...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ubicación (Rack/Estante) <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <select
                  value={formData.locationId}
                  onChange={e => setFormData({...formData, locationId: Number(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  disabled={locations.length === 0}
                >
                  <option value={0}>Todas las ubicaciones...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Si selecciona una ubicación, el inventario se limitará solo a los artículos en ella.
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Iniciar Conteo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
