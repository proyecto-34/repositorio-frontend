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

    // Decodificar payload de JWT en caso de que el backend guarde el rol/datos ahi
    let jwtPayload = null;
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        jwtPayload = JSON.parse(jsonPayload);
      } catch {
        jwtPayload = null;
      }
    }

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
        user = null;
      }
    }

    // Si aún no tenemos user completo, construimos a partir del token JWT y payload
    if (!user) {
      user = {
        email: payload.email,
        nombre: jwtPayload?.nombre || jwtPayload?.name || payload.email.split('@')[0],
        rol: jwtPayload?.rol || jwtPayload?.role || jwtPayload?.roles || 'admin',
      };
    } else {
      // Asegurar que el rol esté explícito en el objeto user
      user.rol = user.rol || user.role || user.id_rol || jwtPayload?.rol || jwtPayload?.role || 'admin';
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
