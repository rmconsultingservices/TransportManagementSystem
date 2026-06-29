import api from '../lib/api';
import type { PhysicalInventory } from '../types/inventory';

export const physicalInventoryService = {
  getAll: async () => {
    const response = await api.get<PhysicalInventory[]>('/PhysicalInventories');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get<PhysicalInventory>(`/PhysicalInventories/${id}`);
    return response.data;
  },

  start: async (data: { description: string, warehouseId: number, locationId?: number }) => {
    const response = await api.post<PhysicalInventory>('/PhysicalInventories/start', data);
    return response.data;
  },

  updateResults: async (id: number, results: { sparePartId: number, realStock: number }[]) => {
    const response = await api.put(`/PhysicalInventories/${id}/results`, results);
    return response.data;
  },

  process: async (id: number, options: { zeroUncounted: boolean }) => {
    const response = await api.post<{ message: string, hasDifferences: boolean, adjustmentId?: number }>(`/PhysicalInventories/${id}/process`, options);
    return response.data;
  },

  cancel: async (id: number) => {
    const response = await api.post<{ message: string }>(`/PhysicalInventories/${id}/cancel`);
    return response.data;
  }
};
