import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

export const productosService = {
  /**
   * Obtiene la lista de productos desde la Base de Datos a través de NestJS
   */
  obtenerProductos: async () => {
    try {
      const response = await axiosClient.get(ENDPOINTS.PRODUCTOS.BASE);
      const data = response.data;

      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.productos)) return data.productos;
        if (Array.isArray(data.result)) return data.result;
      }
      return [];
    } catch (error) {
      console.error('Error al consultar productos en NestJS:', error);
      throw error;
    }
  },

  /**
   * Obtiene un producto por su ID
   */
  obtenerProductoPorId: async (id) => {
    try {
      const response = await axiosClient.get(ENDPOINTS.PRODUCTOS.BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el producto con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crea un nuevo producto en la base de datos
   * @param {Object} producto { nombre, descripcion, precio, stock, categoria, codigo_barras, stock_minimo, emoji }
   */
  crearProducto: async (producto) => {
    const payload = {
      nombre: producto.nombre.trim(),
      descripcion: producto.descripcion || producto.nombre,
      precio: Number(producto.precio) || 0,
      precio_venta: Number(producto.precio) || 0,
      stock: Number(producto.stock) || 0,
      stock_minimo: Number(producto.stock_minimo) || 5,
      categoria: producto.categoria || 'General',
      categoria_nombre: producto.categoria || 'General',
      codigo_barras: producto.codigo_barras || producto.codigo || '',
      codigo: producto.codigo_barras || producto.codigo || '',
      emoji: producto.emoji || '📦',
      activo: true,
    };

    try {
      const response = await axiosClient.post(ENDPOINTS.PRODUCTOS.BASE, payload);
      return response.data;
    } catch (error) {
      console.error('Error al registrar producto en NestJS:', error);
      throw error;
    }
  },

  /**
   * Actualiza los datos de un producto existente
   */
  actualizarProducto: async (id, datos) => {
    const payload = {
      ...datos,
      precio: datos.precio !== undefined ? Number(datos.precio) : undefined,
      stock: datos.stock !== undefined ? Number(datos.stock) : undefined,
      stock_minimo: datos.stock_minimo !== undefined ? Number(datos.stock_minimo) : undefined,
    };

    try {
      const response = await axiosClient.put(ENDPOINTS.PRODUCTOS.BY_ID(id), payload);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar el producto ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un producto de la base de datos
   */
  eliminarProducto: async (id) => {
    try {
      const response = await axiosClient.delete(ENDPOINTS.PRODUCTOS.BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar el producto ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene alertas de productos con stock bajo o crítico
   */
  obtenerAlertasStock: async () => {
    try {
      const response = await axiosClient.get(ENDPOINTS.PRODUCTOS.STOCK_ALERTAS);
      return response.data;
    } catch (error) {
      console.warn('Endpoint de alertas de stock no disponible o falló:', error.message);
      return [];
    }
  },
};

export default productosService;
