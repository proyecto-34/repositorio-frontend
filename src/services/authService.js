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
    const correoVal = (credentials.correo || credentials.email || credentials.username || '').trim();
    const contrasenaVal = credentials.contraseña || credentials.contrasena || credentials.password || '';

    // El DTO de NestJS requiere 'correo' y 'contraseña'
    const payload = {
      correo: correoVal,
      contraseña: contrasenaVal,
      contrasena: contrasenaVal,
      email: correoVal,
      password: contrasenaVal,
    };

    const response = await axiosClient.post(ENDPOINTS.AUTH.LOGIN, payload);
    const data = response.data;

    // Extraer token soportando diferentes convenciones de NestJS
    const token =
      data.access_token ||
      data.accessToken ||
      data.token ||
      data.jwt ||
      data.data?.token ||
      data.data?.access_token;

    // Extraer datos del usuario de la base de datos
    let user =
      data.user ||
      data.usuario ||
      data.data?.user ||
      data.data?.usuario ||
      null;

    if (token) {
      localStorage.setItem('token', token);
    }

    // Si el backend no envió el objeto user directamente pero tenemos token, intentamos consultar su perfil
    if (!user && token) {
      try {
        const profileRes = await axiosClient.get(ENDPOINTS.AUTH.PROFILE);
        user = profileRes.data?.user || profileRes.data?.usuario || profileRes.data;
      } catch {
        user = { email: payload.email, rol: 'Usuario' };
      }
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
