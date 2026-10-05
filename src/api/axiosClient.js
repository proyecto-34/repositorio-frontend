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
      const isLoggingOrPublic = url.includes('/auth/login') || currentPath === '/login' || currentPath === '/';
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');

      // Solo mostramos alerta si el usuario tenía sesión activa y no está en proceso de logout o en login
      if (!isLoggingOrPublic && storedToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');

        toast.error('Tu sesión ha expirado o el token es inválido. Inicia sesión nuevamente.');

        setTimeout(() => {
          window.location.href = '/login';
        }, 800);
      }
    }

    // Error 403: Prohibido / Sin privilegios de rol
    // Solo mostrar notificación de error en acciones directas de mutación (POST, PUT, PATCH, DELETE)
    // Las peticiones GET en segundo plano o de componentes informativos no deben generar spam de alertas
    if (status === 403) {
      const method = (error.config?.method || 'get').toLowerCase();
      const isMutation = ['post', 'put', 'patch', 'delete'].includes(method);

      if (isMutation) {
        toast.error('No tienes permisos suficientes para realizar esta acción (Error 403)');
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
