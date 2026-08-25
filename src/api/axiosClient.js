import axios from 'axios';

/**
 * Cliente Axios configurado para la API de NestJS
 * Prefijo global: /api/v1
 */
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de Peticiones: Inyecta el Token JWT en los headers
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Respuestas: Manejo global de errores HTTP
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si el backend responde con 401 (No autorizado o Token expirado)
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      
      // Limpiar datos de sesión
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirigir al login si no estamos ya allí
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
