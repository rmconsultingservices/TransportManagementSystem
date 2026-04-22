import api from '../lib/api';
import type { MaintenanceOrder } from '../types';

export const maintenanceService = {
  getMaintenanceOrders: async (params?: { vehicleId?: number, trailerId?: number }) => {
    const response = await api.get<MaintenanceOrder[]>('/maintenanceorders', { params });
    return response.data;
  },

  getOrderById: async (id: number) => {
    const response = await api.get<MaintenanceOrder>(`/maintenanceorders/${id}`);
    return response.data;
  },

  createOrder: async (order: Partial<MaintenanceOrder>) => {
    const response = await api.post<MaintenanceOrder>('/maintenanceorders', order);
    return response.data;
  },

  deleteOrder: async (id: number) => {
    await api.delete(`/maintenanceorders/${id}`);
  }
};
