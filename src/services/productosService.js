import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { CATEGORIAS_MAP } from './categoriasService';

export const productosService = {
  /**
   * Obtiene la lista de productos desde la Base de Datos a través de NestJS
   */
  obtenerProductos: async () => {
    try {
      const response = await axiosClient.get(ENDPOINTS.PRODUCTOS.BASE, {
        params: { limit: 100, page: 1 },
      });
      const data = response.data;
      let rawList = [];

      if (Array.isArray(data)) rawList = data;
      else if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) rawList = data.data;
        else if (Array.isArray(data.productos)) rawList = data.productos;
        else if (Array.isArray(data.result)) rawList = data.result;
      }

      if (rawList.length > 0) {
        return rawList.map((p) => {
          const idCat = p.id_categoria ?? p.categoria?.id ?? null;
          const nombreCat = p.categoria?.nombre || (idCat ? CATEGORIAS_MAP[idCat] : 'Sin Categoría') || 'General';
          const cant = Number(p.cantidad !== undefined && p.cantidad !== null ? p.cantidad : (p.stock ?? 0));

          return {
            id: p.id,
            nombre: p.nombre,
            precio: Number(p.precio) || 0,
            precio_venta: Number(p.precio) || 0,
            cantidad: cant,
            stock: cant,
            id_categoria: idCat,
            categoria: nombreCat,
            categoria_nombre: nombreCat,
            stock_minimo: Number(p.stock_minimo) || 5,
            codigo_barras: p.codigo_barras || p.codigo || '',
          };
        });
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
   * Columnas BD: { nombre, precio, cantidad, id_categoria }
   */
  crearProducto: async (producto) => {
    const cant = Number(producto.cantidad !== undefined && producto.cantidad !== '' ? producto.cantidad : producto.stock) || 0;
    const idCat = producto.id_categoria !== undefined && producto.id_categoria !== '' ? Number(producto.id_categoria) : null;

    const payload = {
      nombre: producto.nombre.trim(),
      precio: Number(producto.precio) || 0,
      cantidad: cant,
      stock: cant, // alias
      id_categoria: idCat,
    };

    try {
      const response = await axiosClient.post(ENDPOINTS.PRODUCTOS.BASE, payload);
      return response.data;
    } catch (error) {
      // Si el backend TypeORM espera la relación como objeto { categoria: { id: idCat } }
      if (error.response && error.response.status === 400 && idCat) {
        try {
          const fallbackPayload = {
            ...payload,
            categoria: { id: idCat },
          };
          delete fallbackPayload.id_categoria;
          const retryRes = await axiosClient.post(ENDPOINTS.PRODUCTOS.BASE, fallbackPayload);
          return retryRes.data;
        } catch (retryErr) {
          throw error;
        }
      }
      console.error('Error al registrar producto en NestJS:', error?.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Actualiza los datos de un producto existente
   */
  actualizarProducto: async (id, datos) => {
    const payload = {};
    if (datos.nombre) payload.nombre = datos.nombre.trim();
    if (datos.precio !== undefined && datos.precio !== '') payload.precio = Number(datos.precio);
    
    if (datos.cantidad !== undefined || datos.stock !== undefined) {
      const cant = Number(datos.cantidad !== undefined && datos.cantidad !== '' ? datos.cantidad : datos.stock);
      payload.cantidad = cant;
      payload.stock = cant;
    }

    if (datos.id_categoria !== undefined && datos.id_categoria !== '') {
      payload.id_categoria = Number(datos.id_categoria);
    }

    try {
      const response = await axiosClient.patch(ENDPOINTS.PRODUCTOS.BY_ID(id), payload);
      return response.data;
    } catch (patchError) {
      if (patchError.response && (patchError.response.status === 404 || patchError.response.status === 405)) {
        const putResponse = await axiosClient.put(ENDPOINTS.PRODUCTOS.BY_ID(id), payload);
        return putResponse.data;
      }
      console.error(`Error al actualizar el producto ${id}:`, patchError?.response?.data || patchError.message);
      throw patchError;
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
