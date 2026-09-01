import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Servicio de Autenticación
 * Maneja las peticiones de inicio de sesión, registro y sesión con NestJS
 */
export const authService = {
  /**
   * Petición de login contra la API
   * @param {Object} credentials - { email, password } o { username, password }
   * @returns {Promise<Object>} Datos del backend (token y usuario)
   */
  login: async (credentials) => {
    const response = await axiosClient.post(ENDPOINTS.AUTH.LOGIN, credentials);
    const data = response.data;

    // Extraer token y usuario soportando diferentes formatos comunes en NestJS
    const token = data.access_token || data.token || data.accessToken;
    const user = data.user || data.usuario || { email: credentials.email || credentials.username };

    if (token) {
      localStorage.setItem('token', token);
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }

    return { token, user, raw: data };
  },

  /**
   * Cierra la sesión activa
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Obtiene el usuario autenticado desde el almacenamiento local
   */
  getStoredUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  /**
   * Obtiene el token JWT actual
   */
  getStoredToken: () => {
    return localStorage.getItem('token');
  },

  /**
   * Verifica si hay una sesión activa
   */
  isAuthenticated: () => {
    return Boolean(localStorage.getItem('token'));
  },
};

export default authService;
