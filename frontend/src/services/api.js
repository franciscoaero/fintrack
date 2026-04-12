import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Server responded with error status
      throw error.response.data?.error || { message: 'Erro do servidor' };
    } else if (error.request) {
      // Request was made but no response received
      throw { message: 'Erro de conexão. Verifique sua internet.' };
    }
    // Something else happened
    throw { message: 'Erro inesperado.' };
  }
);

export default api;
