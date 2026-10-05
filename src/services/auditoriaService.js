import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Servicio para consultar el registro de Auditoría de la base de datos MySQL (Solo ADMIN)
 */
export const auditoriaService = {
  /**
   * Obtiene la lista de eventos de auditoría registrados en la BD
   * @param {{ page?: number, limit?: number }} params
   */
  obtenerLogs: async ({ page = 1, limit = 50 } = {}) => {
    try {
      const response = await axiosClient.get(ENDPOINTS.AUDITORIA.BASE, {
        params: { page, limit },
      });
      const data = response.data;
      if (Array.isArray(data)) return { logs: data, total: data.length };
      if (data && Array.isArray(data.data)) {
        return {
          logs: data.data,
          total: data.meta?.total || data.data.length,
          page: data.meta?.page || page,
          last_page: data.meta?.last_page || 1,
        };
      }
      return { logs: [], total: 0 };
    } catch (error) {
      console.warn('Error al consultar auditoría en el backend:', error?.message);
      return { logs: [], total: 0 };
    }
  },
};

export default auditoriaService;
