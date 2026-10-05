import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Servicio para gestión de Pagos conectado a la base de datos de NestJS
 */
export const pagosService = {
  /**
   * Registra un pago para una venta en la base de datos
   * @param {{ ventaId: number, metodo: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA', monto: number }} datos
   */
  crearPago: async ({ ventaId, metodo, monto }) => {
    // Normalizar método a los valores exactos aceptados por el backend DTO
    let metodoNormalizado = 'EFECTIVO';
    const m = String(metodo || '').toUpperCase().trim();
    if (m.includes('TARJETA') || m.includes('CARD') || m.includes('DATAFONO')) {
      metodoNormalizado = 'TARJETA';
    } else if (m.includes('NEQUI') || m.includes('TRANSF') || m.includes('DAVIPLATA') || m.includes('BANCO')) {
      metodoNormalizado = 'TRANSFERENCIA';
    }

    const payload = {
      ventaId: Number(ventaId),
      metodo: metodoNormalizado,
      monto: Number(monto),
    };

    try {
      const response = await axiosClient.post(ENDPOINTS.PAGOS.BASE, payload);
      return response.data;
    } catch (error) {
      console.error(`Error al registrar pago para la venta ${ventaId}:`, error?.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtiene el historial de pagos asociados a una venta específica
   * @param {number} ventaId
   * @returns {Promise<Array<{ id: number, ventaId: number, metodo: string, monto: number|string, fecha: string }>>}
   */
  obtenerPagosPorVenta: async (ventaId) => {
    try {
      const response = await axiosClient.get(ENDPOINTS.PAGOS.BY_VENTA_ID(ventaId));
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    } catch (error) {
      // Si la venta no tiene pagos registrados aún
      return [];
    }
  },
};

export default pagosService;
