import api from '../lib/api';
import type { Driver, Mechanic } from '../types/staff';

export const staffService = {
  getDrivers: async (): Promise<Driver[]> => {
    const response = await api.get<Driver[]>('/drivers');
    return response.data;
  },
  createDriver: async (driver: Partial<Driver>): Promise<Driver> => {
    const response = await api.post<Driver>('/drivers', driver);
    return response.data;
  },

  getMechanics: async (): Promise<Mechanic[]> => {
    const response = await api.get<Mechanic[]>('/mechanics');
    return response.data;
  },
  createMechanic: async (mechanic: Partial<Mechanic>): Promise<Mechanic> => {
    const response = await api.post<Mechanic>('/mechanics', mechanic);
    return response.data;
  }
};
