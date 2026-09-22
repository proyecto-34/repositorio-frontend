import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Catálogo de respaldo según el esquema exacto de la BD:
 * tabla: tienda_comunitaria.proveedores (id, nombre, contacto, direccion)
 */
export const PROVEEDORES_DEFAULT = [
  {
    id: 1,
    nombre: 'Distribuidora S.A.',
    contacto: '3001234567',
    direccion: 'Calle 123 #45-67',
  },
  {
    id: 2,
    nombre: 'Empresa Bogota',
    contacto: '43543453',
    direccion: 'calle 45 #2',
  },
];

export const proveedoresService = {
  /**
   * Obtiene la lista de proveedores desde la BD en NestJS
   */
  obtenerProveedores: async () => {
    try {
      const response = await axiosClient.get(ENDPOINTS.PROVEEDORES.BASE);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.proveedores)) return data.proveedores;
        if (Array.isArray(data.result)) return data.result;
      }
      return PROVEEDORES_DEFAULT;
    } catch (error) {
      console.warn('Usando proveedores locales de respaldo:', error.message);
      return PROVEEDORES_DEFAULT;
    }
  },

  /**
   * Obtiene un proveedor por ID
   */
  obtenerProveedorPorId: async (id) => {
    try {
      const response = await axiosClient.get(ENDPOINTS.PROVEEDORES.BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Error al obtener proveedor ${id}:`, error);
      throw error;
    }
  },

  /**
   * Registra un nuevo proveedor en la BD (DTO: nombre, contacto, direccion)
   */
  crearProveedor: async (proveedor) => {
    const payload = {
      nombre: (proveedor.nombre || '').trim(),
      contacto: (proveedor.contacto || '').trim(),
      direccion: (proveedor.direccion || '').trim(),
    };

    try {
      const response = await axiosClient.post(ENDPOINTS.PROVEEDORES.BASE, payload);
      return response.data;
    } catch (error) {
      console.error('Error al registrar proveedor en NestJS:', error);
      throw error;
    }
  },

  /**
   * Actualiza los datos de un proveedor en la BD
   */
  actualizarProveedor: async (id, datos) => {
    const payload = {
      nombre: (datos.nombre || '').trim(),
      contacto: (datos.contacto || '').trim(),
      direccion: (datos.direccion || '').trim(),
    };

    try {
      const response = await axiosClient.put(ENDPOINTS.PROVEEDORES.BY_ID(id), payload);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar proveedor ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un proveedor de la BD
   */
  eliminarProveedor: async (id) => {
    try {
      const response = await axiosClient.delete(ENDPOINTS.PROVEEDORES.BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar proveedor ${id}:`, error);
      throw error;
    }
  },
};

export default proveedoresService;
