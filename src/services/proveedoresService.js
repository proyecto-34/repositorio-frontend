import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

export const proveedoresService = {
  /**
   * Obtiene la lista de proveedores desde la BD en NestJS (tienda_comunitaria.proveedores)
   */
  obtenerProveedores: async () => {
    try {
      const response = await axiosClient.get(ENDPOINTS.PROVEEDORES.BASE, {
        params: { limit: 100, page: 1 },
      });
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.proveedores)) return data.proveedores;
        if (Array.isArray(data.result)) return data.result;
      }
      return [];
    } catch (error) {
      console.warn('Error al consultar proveedores de la BD:', error.message);
      return [];
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
   * Actualiza los datos de un proveedor en la BD (soporta PATCH y PUT)
   */
  actualizarProveedor: async (id, datos) => {
    const payload = {};
    if (datos.nombre) payload.nombre = (datos.nombre || '').trim();
    if (datos.contacto !== undefined) payload.contacto = (datos.contacto || '').trim();
    if (datos.direccion !== undefined) payload.direccion = (datos.direccion || '').trim();

    try {
      const response = await axiosClient.patch(ENDPOINTS.PROVEEDORES.BY_ID(id), payload);
      return response.data;
    } catch (patchError) {
      if (patchError.response && (patchError.response.status === 404 || patchError.response.status === 405)) {
        const putResponse = await axiosClient.put(ENDPOINTS.PROVEEDORES.BY_ID(id), payload);
        return putResponse.data;
      }
      console.error(`Error al actualizar proveedor ${id}:`, patchError);
      throw patchError;
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
