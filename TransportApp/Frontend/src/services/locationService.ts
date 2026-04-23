import api from '../lib/api';

export interface Location {
  id: number;
  name: string;
  description?: string;
  warehouseId: number;
  warehouse?: { id: number; name: string };
  isActive: boolean;
}

export const locationService = {
  getLocations: async (warehouseId?: number): Promise<Location[]> => {
    const url = warehouseId ? `/locations?warehouseId=${warehouseId}` : '/locations';
    const response = await api.get<Location[]>(url);
    return response.data;
  },
  
  createLocation: async (location: Omit<Location, 'id' | 'isActive' | 'warehouse'>): Promise<Location> => {
    const response = await api.post<Location>('/locations', location);
    return response.data;
  },
  
  updateLocation: async (id: number, location: Location): Promise<void> => {
    await api.put(`/locations/${id}`, location);
  },
  
  deleteLocation: async (id: number): Promise<void> => {
    await api.delete(`/locations/${id}`);
  }
};
