import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

export const COMPRAS_DEFAULT = [
  {
    id: 1,
    fecha: '2026-09-07T19:57:48.000Z',
    total: 350000,
    proveedor: {
      id: 1,
      nombre: 'Distribuidora S.A.',
      contacto: '3001234567',
      direccion: 'Calle 123 #45-67',
    },
    items: [
      {
        id: 1,
        id_producto: 1,
        producto_nombre: 'frijol',
        cantidad: 100,
        costo_unitario: 3500,
        subtotal: 350000,
        total: 350000,
      },
    ],
  },
];

export const comprasService = {
  /**
   * Obtiene la lista de compras desde la BD de NestJS
   */
  obtenerCompras: async () => {
    try {
      const response = await axiosClient.get(ENDPOINTS.COMPRAS.BASE, {
        params: { limit: 100, page: 1 },
      });
      const data = response.data;
      let rawList = [];

      if (Array.isArray(data)) rawList = data;
      else if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) rawList = data.data;
        else if (Array.isArray(data.compras)) rawList = data.compras;
        else if (Array.isArray(data.result)) rawList = data.result;
      }

      if (rawList.length > 0) {
        return rawList.map((c) => {
          const detallesNormalizados = (c.detalles || c.items || []).map((d) => ({
            id: d.id,
            id_producto: d.producto?.id || d.id_producto,
            producto_nombre: d.producto?.nombre || d.producto_nombre || 'Producto',
            cantidad: Number(d.cantidad) || 1,
            costo_unitario: d.cantidad && d.subtotal ? Number(d.subtotal) / Number(d.cantidad) : Number(d.costo_unitario || d.subtotal || 0),
            subtotal: Number(d.subtotal || d.total || 0),
            total: Number(d.subtotal || d.total || 0),
          }));

          return {
            id: c.id,
            fecha: c.fecha || new Date().toISOString(),
            total: Number(c.total) || 0,
            nro_factura: `COMPRA-${c.id}`,
            id_proveedor: c.proveedor?.id || c.id_proveedor,
            proveedor: c.proveedor || {
              id: c.id_proveedor,
              nombre: 'Proveedor General',
              contacto: '',
              direccion: '',
            },
            items: detallesNormalizados,
            detalles: detallesNormalizados,
          };
        });
      }
      return COMPRAS_DEFAULT;
    } catch (error) {
      console.warn('Usando compras de respaldo:', error.message);
      return COMPRAS_DEFAULT;
    }
  },

  /**
   * Obtiene el detalle de una compra por su ID
   */
  obtenerCompraPorId: async (id) => {
    try {
      const response = await axiosClient.get(ENDPOINTS.COMPRAS.BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Error al obtener compra ${id}:`, error);
      throw error;
    }
  },

  /**
   * Registra una nueva compra en la BD e incrementa el stock automáticamente en NestJS
   * DTO exacto: { id_proveedor: number, total: number, detalles: [{ id_producto, cantidad, subtotal }] }
   */
  crearCompra: async (compra) => {
    const detallesFormateados = (compra.detalles || compra.items || []).map((item) => ({
      id_producto: Number(item.id_producto || item.id),
      cantidad: Number(item.cantidad) || 1,
      subtotal: Number(item.subtotal || item.total || (Number(item.cantidad || 1) * Number(item.costo_unitario || item.precio || 0))),
    }));

    const payload = {
      id_proveedor: Number(compra.id_proveedor) || 1,
      total: Number(compra.total) || detallesFormateados.reduce((acc, d) => acc + d.subtotal, 0),
      detalles: detallesFormateados,
    };

    try {
      const response = await axiosClient.post(ENDPOINTS.COMPRAS.BASE, payload);
      return response.data;
    } catch (error) {
      console.error('Error al registrar compra en NestJS:', error?.response?.data || error.message);
      throw error;
    }
  },
};

export default comprasService;
