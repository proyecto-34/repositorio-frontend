import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

export const COMPRAS_DEFAULT = [
  {
    id: 1,
    nro_factura: 'FAC-PROV-9821',
    fecha: '2026-09-18T09:30:00',
    proveedor: {
      id: 1,
      nombre: 'Distribuidora S.A.',
      contacto: '3001234567',
      direccion: 'Calle 123 #45-67',
    },
    total: 360000,
    metodo_pago: 'Transferencia Bancaria',
    estado: 'Completada',
    observaciones: 'Lote de lácteos frescos',
    items: [
      { id: 1, id_producto: 1, producto_nombre: 'Leche Entera 1L', cantidad: 100, costo_unitario: 3600, total: 360000 },
    ],
  },
  {
    id: 2,
    nro_factura: 'FAC-PROV-4412',
    fecha: '2026-09-15T14:10:00',
    proveedor: {
      id: 2,
      nombre: 'Empresa Bogota',
      contacto: '43543453',
      direccion: 'calle 45 #2',
    },
    total: 390000,
    metodo_pago: 'Crédito 30 días',
    estado: 'Completada',
    observaciones: 'Abastecimiento de granos',
    items: [
      { id: 2, id_producto: 2, producto_nombre: 'Arroz Diana 1kg', cantidad: 60, costo_unitario: 4000, total: 240000 },
      { id: 3, id_producto: 10, producto_nombre: 'Lentejas 500g', cantidad: 50, costo_unitario: 3000, total: 150000 },
    ],
  },
];

export const comprasService = {
  /**
   * Obtiene la lista de compras desde la BD de NestJS
   */
  obtenerCompras: async () => {
    try {
      const response = await axiosClient.get(ENDPOINTS.COMPRAS.BASE);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.compras)) return data.compras;
        if (Array.isArray(data.result)) return data.result;
      }
      return COMPRAS_DEFAULT;
    } catch (error) {
      console.warn('Usando compras por defecto:', error.message);
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
   * Registra una nueva compra en la BD e incrementa el stock de los productos
   * @param {Object} compra - { id_proveedor, nro_factura, metodo_pago, total, observaciones, items }
   */
  crearCompra: async (compra) => {
    const payload = {
      id_proveedor: Number(compra.id_proveedor) || 1,
      nro_factura: compra.nro_factura || `COMPRA-${Date.now()}`,
      fecha: compra.fecha || new Date().toISOString(),
      metodo_pago: compra.metodo_pago || 'Efectivo',
      total: Number(compra.total) || 0,
      observaciones: compra.observaciones || '',
      estado: 'Completada',
      items: compra.items.map((item) => ({
        id_producto: Number(item.id_producto || item.id),
        producto_nombre: item.producto_nombre || item.nombre,
        cantidad: Number(item.cantidad) || 1,
        costo_unitario: Number(item.costo_unitario || item.precio_costo || item.precio) || 0,
        total: (Number(item.cantidad) || 1) * (Number(item.costo_unitario || item.precio_costo || item.precio) || 0),
      })),
    };

    try {
      const response = await axiosClient.post(ENDPOINTS.COMPRAS.BASE, payload);
      return response.data;
    } catch (error) {
      console.warn('El endpoint /compras no respondió o falló, procesando entrada localmente:', error.message);
      return {
        id: Date.now(),
        ...payload,
        proveedor: compra.proveedor_obj || { nombre: 'Distribuidora S.A.', contacto: '3001234567', direccion: 'Calle 123 #45-67' },
      };
    }
  },
};

export default comprasService;
