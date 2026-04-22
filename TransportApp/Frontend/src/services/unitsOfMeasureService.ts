import api from '../lib/api';
import type { UnitOfMeasure } from '../types';

export const unitsOfMeasureService = {
  getUnits: async (includeInactive = false) => {
    const response = await api.get<UnitOfMeasure[]>(`/unitsofmeasure?includeInactive=${includeInactive}`);
    return response.data;
  },

  getUnit: async (id: number) => {
    const response = await api.get<UnitOfMeasure>(`/unitsofmeasure/${id}`);
    return response.data;
  },

  createUnit: async (unit: Partial<UnitOfMeasure>) => {
    const response = await api.post<UnitOfMeasure>('/unitsofmeasure', unit);
    return response.data;
  },

  updateUnit: async (id: number, unit: Partial<UnitOfMeasure>) => {
    const response = await api.put(`/unitsofmeasure/${id}`, unit);
    return response.data;
  },

  deleteUnit: async (id: number) => {
    const response = await api.delete(`/unitsofmeasure/${id}`);
    return response.data;
  }
};
