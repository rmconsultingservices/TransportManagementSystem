import api from '../lib/api';
import type { InventoryAdjustment } from '../types/inventory';

export const inventoryAdjustmentsService = {
  getAdjustments: async (): Promise<InventoryAdjustment[]> => {
    const response = await api.get<InventoryAdjustment[]>('/inventoryadjustments');
    return response.data;
  },
  
  createAdjustment: async (adjustment: Omit<InventoryAdjustment, 'id' | 'createdBy'>): Promise<InventoryAdjustment> => {
    const response = await api.post<InventoryAdjustment>('/inventoryadjustments', adjustment);
    return response.data;
  },

  updateAdjustment: async (id: number, adjustment: Omit<InventoryAdjustment, 'id' | 'createdBy'>): Promise<void> => {
    await api.put(`/inventoryadjustments/${id}`, { id, ...adjustment });
  },

  deleteAdjustment: async (id: number): Promise<void> => {
    await api.delete(`/inventoryadjustments/${id}`);
  }
};
