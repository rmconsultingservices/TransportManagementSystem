import api from '../lib/api';
import type { SparePart } from '../types/inventory';

export const inventoryService = {
  getSpareParts: async (): Promise<SparePart[]> => {
    const response = await api.get<SparePart[]>('/spareparts');
    return response.data;
  },
  
  createSparePart: async (sparePart: Omit<SparePart, 'id' | 'isActive'>): Promise<SparePart> => {
    const response = await api.post<SparePart>('/spareparts', sparePart);
    return response.data;
  },
  
  updateSparePart: async (id: number, sparePart: SparePart): Promise<void> => {
    await api.put(`/spareparts/${id}`, sparePart);
  },
  
  deleteSparePart: async (id: number): Promise<void> => {
    await api.delete(`/spareparts/${id}`);
  },

  getSparePartHistory: async (id: number): Promise<any[]> => {
    const response = await api.get(`/spareparts/${id}/history`);
    return response.data;
  }
};
