import axios from 'axios';

// Create an Axios instance with base URL pointing to the .NET Backend
const api = axios.create({
  baseURL: 'http://localhost:5024/api', // Matches backend Properties/launchSettings.json
  // baseURL: 'https://eos-athletic-possible-yards.trycloudflare.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const selectedCompanyStr = localStorage.getItem('selectedCompany');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (selectedCompanyStr) {
    try {
      const companyData = JSON.parse(selectedCompanyStr);
      if (companyData && companyData.id) {
        config.headers['X-Company-Id'] = companyData.id.toString();
      }
    } catch (e) {
      // Ignored
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('companies');
      localStorage.removeItem('selectedCompany');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
