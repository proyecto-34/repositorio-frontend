import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { CATEGORIAS_MAP, inferirCategoriaPorNombre } from './categoriasService';

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
          // 1. Extraer el ID real de categoría de la BD
          const idCat =
            p.id_categoria ??
            p.categoria_id ??
            p.categoriaId ??
            p.idCategoria ??
            (typeof p.categoria === 'object' && p.categoria !== null ? (p.categoria.id ?? p.categoria.id_categoria) : (typeof p.categoria === 'number' ? p.categoria : null));

          // 2. Extraer el Nombre real de categoría de la BD
          let nombreCat = '';
          if (p.categoria && typeof p.categoria === 'object') {
            nombreCat = p.categoria.nombre || p.categoria.name || '';
          } else if (typeof p.categoria === 'string' && p.categoria.trim() !== '') {
            nombreCat = p.categoria.trim();
          } else if (p.categoria_nombre || p.nombre_categoria) {
            nombreCat = p.categoria_nombre || p.nombre_categoria;
          }

          // 3. Si viene el ID numérico pero no el objeto relación, mapear por el ID exacto de la BD
          if (!nombreCat && idCat !== null && idCat !== undefined) {
            nombreCat = CATEGORIAS_MAP[idCat] || CATEGORIAS_MAP[Number(idCat)];
          }

          // 4. Si la fila en MySQL no tiene categoría asignada
          if (!nombreCat) {
            nombreCat = 'Sin Categoría';
          }

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
   */
  crearProducto: async (producto) => {
    const cant = Number(producto.cantidad !== undefined && producto.cantidad !== '' ? producto.cantidad : producto.stock) || 0;
    const idCat = Number(producto.id_categoria ?? producto.categoria_id ?? producto.categoriaId ?? producto.categoria?.id ?? 1) || 1;

    // Payload con compatibilidad de nombres de clave para el DTO de NestJS
    const payload = {
      nombre: producto.nombre.trim(),
      precio: Number(producto.precio) || 0,
      cantidad: cant,
      id_categoria: idCat,
      categoria_id: idCat,
      categoriaId: idCat,
      categoria: idCat,
    };
    if (producto.codigo_barras && producto.codigo_barras.trim() !== '') {
      payload.codigo_barras = producto.codigo_barras.trim();
    }

    try {
      const response = await axiosClient.post(ENDPOINTS.PRODUCTOS.BASE, payload);
      return response.data;
    } catch (error) {
      // Si el backend TypeORM espera la relación estrictamente como objeto { categoria: { id: idCat } }
      if (idCat) {
        try {
          const fallbackPayload = {
            nombre: producto.nombre.trim(),
            precio: Number(producto.precio) || 0,
            cantidad: cant,
            categoria: { id: idCat },
          };
          if (producto.codigo_barras && producto.codigo_barras.trim() !== '') {
            fallbackPayload.codigo_barras = producto.codigo_barras.trim();
          }
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
   * Actualiza los datos de un producto existente en la BD (NestJS)
   */
  actualizarProducto: async (id, datos) => {
    const cant = Number(datos.cantidad !== undefined && datos.cantidad !== '' ? datos.cantidad : datos.stock);
    const idCat = datos.id_categoria !== undefined && datos.id_categoria !== '' ? Number(datos.id_categoria) : undefined;
    
    // Payload limpio con nombres alternativos para el DTO de NestJS
    const payload = {};
    if (datos.nombre) payload.nombre = datos.nombre.trim();
    if (datos.precio !== undefined && datos.precio !== '') payload.precio = Number(datos.precio);
    if (!isNaN(cant)) payload.cantidad = cant;
    if (idCat !== undefined) {
      payload.id_categoria = idCat;
      payload.categoria_id = idCat;
      payload.categoriaId = idCat;
      payload.categoria = idCat;
    }
    if (datos.codigo_barras && datos.codigo_barras.trim() !== '') {
      payload.codigo_barras = datos.codigo_barras.trim();
    }

    // 1. Intento primario: PATCH
    try {
      const response = await axiosClient.patch(ENDPOINTS.PRODUCTOS.BY_ID(id), payload);
      return response.data;
    } catch (patchError) {
      // 2. Si falló por formato de relación (TypeORM esperando { categoria: { id } })
      if (idCat !== undefined) {
        try {
          const relationPayload = { ...payload, categoria: { id: idCat } };
          delete relationPayload.id_categoria;
          delete relationPayload.categoria_id;
          delete relationPayload.categoriaId;
          const retryPatch = await axiosClient.patch(ENDPOINTS.PRODUCTOS.BY_ID(id), relationPayload);
          return retryPatch.data;
        } catch (relationErr) {
          // Continuar con otros fallbacks si es necesario
        }
      }

      // 3. Si el endpoint solo acepta PUT
      try {
        const putResponse = await axiosClient.put(ENDPOINTS.PRODUCTOS.BY_ID(id), payload);
        return putResponse.data;
      } catch (putError) {
        console.error(`Error al actualizar producto #${id}:`, patchError?.response?.data || patchError.message);
        throw patchError;
      }
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
