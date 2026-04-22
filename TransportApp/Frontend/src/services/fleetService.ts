import api from '../lib/api';
import type { Vehicle, Trailer } from '../types';

export const fleetService = {
  // Vehicles
  getVehicles: async (): Promise<Vehicle[]> => {
    const response = await api.get<Vehicle[]>('/vehicles');
    return response.data;
  },
  
  createVehicle: async (vehicle: Omit<Vehicle, 'id' | 'isActive'>): Promise<Vehicle> => {
    const response = await api.post<Vehicle>('/vehicles', vehicle);
    return response.data;
  },

  getVehicle: async (id: number): Promise<Vehicle> => {
    const response = await api.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  },
  
  updateVehicle: async (id: number, vehicle: Vehicle): Promise<void> => {
    await api.put(`/vehicles/${id}`, vehicle);
  },
  
  deleteVehicle: async (id: number): Promise<void> => {
    await api.delete(`/vehicles/${id}`);
  },

  // Trailers
  getTrailers: async (): Promise<Trailer[]> => {
    const response = await api.get<Trailer[]>('/trailers');
    return response.data;
  },

  createTrailer: async (trailer: Omit<Trailer, 'id' | 'isActive'>): Promise<Trailer> => {
    const response = await api.post<Trailer>('/trailers', trailer);
    return response.data;
  },

  getTrailer: async (id: number): Promise<Trailer> => {
    const response = await api.get<Trailer>(`/trailers/${id}`);
    return response.data;
  },

  updateTrailer: async (id: number, trailer: Trailer): Promise<void> => {
    await api.put(`/trailers/${id}`, trailer);
  },

  deleteTrailer: async (id: number): Promise<void> => {
    await api.delete(`/trailers/${id}`);
  }
};
