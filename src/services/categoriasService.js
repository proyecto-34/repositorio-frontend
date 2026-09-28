import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

export const CATEGORIAS_DEFAULT = [
  { id: 1, nombre: 'Granos' },
  { id: 2, nombre: 'Pasta' },
  { id: 3, nombre: 'Salsas' },
  { id: 4, nombre: 'lacteos' },
];

export const CATEGORIAS_MAP = {
  1: 'Granos',
  2: 'Pasta',
  3: 'Salsas',
  4: 'lacteos',
};

export const categoriasService = {
  /**
   * Obtiene la lista de categorías desde la BD de NestJS
   */
  obtenerCategorias: async () => {
    try {
      const response = await axiosClient.get(ENDPOINTS.PRODUCTOS.CATEGORIAS || '/categorias');
      const data = response.data;
      if (Array.isArray(data) && data.length > 0) return data;
      if (data && Array.isArray(data.data) && data.data.length > 0) return data.data;
      return CATEGORIAS_DEFAULT;
    } catch (error) {
      console.warn('Usando catálogo de categorías por defecto:', error.message);
      return CATEGORIAS_DEFAULT;
    }
  },
};

export default categoriasService;
