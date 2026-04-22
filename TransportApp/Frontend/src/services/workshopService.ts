import api from '../lib/api';
import type { ServiceRequest, ServiceExecution } from '../types/workshop';

export const workshopService = {
  getRequests: async (): Promise<ServiceRequest[]> => {
    const response = await api.get<ServiceRequest[]>('/servicerequests');
    return response.data;
  },

  getRequestById: async (id: number): Promise<ServiceRequest> => {
    const response = await api.get<ServiceRequest>(`/servicerequests/${id}`);
    return response.data;
  },

  createRequest: async (request: Partial<ServiceRequest>): Promise<ServiceRequest> => {
    const response = await api.post<ServiceRequest>('/servicerequests', request);
    return response.data;
  },

  assignMechanic: async (id: number, mechanicId: number): Promise<void> => {
    await api.put(`/servicerequests/${id}/AssignMechanic`, { mechanicId });
  },

  addLog: async (id: number, note: string): Promise<void> => {
    await api.post(`/servicerequests/${id}/Logs`, { note });
  },

  addRequisition: async (id: number, partNameOrDescription: string, quantity: number): Promise<void> => {
    await api.post(`/servicerequests/${id}/Requisitions`, { partNameOrDescription, quantity });
  },

  addUsedPart: async (id: number, sparePartId: number, quantity: number): Promise<void> => {
    await api.post(`/servicerequests/${id}/UsedParts`, { sparePartId, quantity });
  },

  executeService: async (id: number, execution: Partial<ServiceExecution>): Promise<void> => {
    await api.post(`/servicerequests/${id}/Execute`, execution);
  }
};
