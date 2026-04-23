import api from '../lib/api';

export interface Warehouse {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export const warehouseService = {
  getWarehouses: async (): Promise<Warehouse[]> => {
    const response = await api.get<Warehouse[]>('/warehouses');
    return response.data;
  },
  
  createWarehouse: async (warehouse: Omit<Warehouse, 'id' | 'isActive'>): Promise<Warehouse> => {
    const response = await api.post<Warehouse>('/warehouses', warehouse);
    return response.data;
  },
  
  updateWarehouse: async (id: number, warehouse: Warehouse): Promise<void> => {
    await api.put(`/warehouses/${id}`, warehouse);
  },
  
  deleteWarehouse: async (id: number): Promise<void> => {
    await api.delete(`/warehouses/${id}`);
  }
};
