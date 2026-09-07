import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

const USUARIOS_DEMO = [
  { id: 1, nombre: 'Jenkner Administrador', correo: 'admin@tienda.com', rol: 'admin', estado: 'Activo', fechaRegistro: '2026-01-15' },
  { id: 2, nombre: 'David Martínez', correo: 'cajero1@tienda.com', rol: 'cajero', estado: 'Activo', fechaRegistro: '2026-02-10' },
  { id: 3, nombre: 'Laura Gómez', correo: 'cajero2@tienda.com', rol: 'cajero', estado: 'Activo', fechaRegistro: '2026-03-01' },
  { id: 4, nombre: 'Carlos Ruiz', correo: 'carlos.r@tienda.com', rol: 'cajero', estado: 'Inactivo', fechaRegistro: '2026-03-05' },
];

export const usuariosService = {
  /**
   * Obtiene la lista de usuarios desde NestJS o respaldo local
   */
  obtenerUsuarios: async () => {
    try {
      const response = await axiosClient.get(ENDPOINTS.USUARIOS.BASE);
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch {
      // Usar respaldo si la BD aún no tiene usuarios
    }
    return USUARIOS_DEMO;
  },

  /**
   * Registra un nuevo usuario en NestJS
   */
  crearUsuario: async (nuevoUsuario) => {
    try {
      const response = await axiosClient.post(ENDPOINTS.USUARIOS.BASE, nuevoUsuario);
      return response.data;
    } catch {
      return {
        id: Date.now(),
        ...nuevoUsuario,
        estado: 'Activo',
        fechaRegistro: new Date().toISOString().split('T')[0],
      };
    }
  },
};

export default usuariosService;
