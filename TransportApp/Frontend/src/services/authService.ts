import api from '../lib/api';

export const authService = {
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
  adminChangePassword: async (userId: number, newPassword: string) => {
    const response = await api.post(`/auth/admin-change-password/${userId}`, { newPassword });
    return response.data;
  }
};
