import api from '../lib/api';
import type { SparePartCategory } from '../types/inventory';

export const sparePartCategoriesService = {
  getCategories: async (): Promise<SparePartCategory[]> => {
    const response = await api.get<SparePartCategory[]>('/sparepartcategories');
    return response.data;
  },
  
  createCategory: async (category: Omit<SparePartCategory, 'id' | 'isActive'>): Promise<SparePartCategory> => {
    const response = await api.post<SparePartCategory>('/sparepartcategories', category);
    return response.data;
  },
  
  updateCategory: async (id: number, category: SparePartCategory): Promise<void> => {
    await api.put(`/sparepartcategories/${id}`, category);
  },
  
  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/sparepartcategories/${id}`);
  }
};
