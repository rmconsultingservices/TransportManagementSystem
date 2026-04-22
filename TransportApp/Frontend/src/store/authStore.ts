import { create } from 'zustand';

export interface User {
  id: number;
  username: string;
  fullName: string;
  isSuperAdmin: boolean;
}

export interface Company {
  id: number;
  name: string;
  rif: string;
  logoUrl?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  companies: Company[];
  selectedCompany: Company | null;
  
  setAuth: (token: string, user: User, companies: Company[]) => void;
  setSelectedCompany: (company: Company) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  companies: JSON.parse(localStorage.getItem('companies') || '[]'),
  selectedCompany: JSON.parse(localStorage.getItem('selectedCompany') || 'null'),

  setAuth: (token, user, companies) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('companies', JSON.stringify(companies));

    // Auto-select company if they only have one
    let selectedCompany = null;
    if (companies.length == 1) {
       selectedCompany = companies[0];
       localStorage.setItem('selectedCompany', JSON.stringify(selectedCompany));
    }

    set({ token, user, companies, selectedCompany });
  },

  setSelectedCompany: (company) => {
    localStorage.setItem('selectedCompany', JSON.stringify(company));
    set({ selectedCompany: company });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('companies');
    localStorage.removeItem('selectedCompany');
    set({ token: null, user: null, companies: [], selectedCompany: null });
  }
}));
