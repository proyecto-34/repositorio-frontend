import axios from 'axios';
import { toast } from 'sonner';

/**
 * Cliente Axios configurado para la API de NestJS
 * Prefijo global: /api/v1
 * Capa 4 de Seguridad: Inyección automática de Bearer Token y captura centralizada de 401/403
 */
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de Peticiones: Inyecta el Token JWT Bearer
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Respuestas: Manejo global de errores HTTP (401 / 403)
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response ? error.response.status : null;
    const url = error.config?.url || '';
    const currentPath = window.location.pathname;

    // Error 401: No autenticado o Token expirado
    if (status === 401) {
      // Si el error ocurrió durante el intento de login, dejamos que el formulario de login maneje el mensaje
      if (!url.includes('/auth/login')) {
        // Limpiar tokens y sesión
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');

        toast.error('Tu sesión ha expirado o el token es inválido. Inicia sesión nuevamente.');

        // Redirigir al login si no estamos en login
        if (currentPath !== '/login') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 800);
        }
      }
    }

    // Error 403: Prohibido / Sin privilegios de rol
    if (status === 403) {
      toast.error('No tienes permisos suficientes para realizar esta acción (Error 403)');
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
