import api from '../lib/api';
import type { User, Company } from '../store/authStore';

export interface AuditLog {
  id: number;
  tableName: string;
  recordId: string;
  action: string;
  timestamp: string;
  oldValues: string;
  newValues: string;
  systemUsername: string;
  windowsUsername: string;
  machineName: string;
}

export const adminService = {
  // Companies
  getCompanies: async (): Promise<Company[]> => {
    const response = await api.get<Company[]>('/companies');
    return response.data;
  },
  createCompany: async (company: Omit<Company, 'id'>): Promise<Company> => {
    const response = await api.post<Company>('/companies', company);
    return response.data;
  },
  updateCompany: async (id: number, company: Omit<Company, 'id'>): Promise<void> => {
    await api.put(`/companies/${id}`, { id, ...company });
  },
  deleteCompany: async (id: number): Promise<void> => {
    await api.delete(`/companies/${id}`);
  },

  // Users
  getUsers: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/users');
    return response.data;
  },
  createUser: async (user: any): Promise<User> => {
    const response = await api.post<User>('/users', user);
    return response.data;
  },
  assignCompany: async (userId: number, companyId: number): Promise<void> => {
    await api.post(`/users/${userId}/assign-company/${companyId}`);
  },
  removeCompany: async (userId: number, companyId: number): Promise<void> => {
    await api.delete(`/users/${userId}/remove-company/${companyId}`);
  },

  // Audit Logs
  getAuditLogs: async (table?: string, user?: string): Promise<AuditLog[]> => {
    const params = new URLSearchParams();
    if (table) params.append('table', table);
    if (user) params.append('user', user);
    const response = await api.get<AuditLog[]>(`/auditlogs?${params.toString()}`);
    return response.data;
  }
};
