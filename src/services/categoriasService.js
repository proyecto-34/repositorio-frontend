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
  '1': 'Granos',
  '2': 'Pasta',
  '3': 'Salsas',
  '4': 'lacteos',
};

/**
 * Infiere la categoría según las 4 categorías existentes en MySQL:
 * #1: Granos
 * #2: Pasta
 * #3: Salsas
 * #4: lacteos
 */
export const inferirCategoriaPorNombre = (nombre = '') => {
  const n = String(nombre).toLowerCase().trim();
  if (
    n.includes('arroz') ||
    n.includes('frijol') ||
    n.includes('fríjol') ||
    n.includes('lenteja') ||
    n.includes('arveja') ||
    n.includes('garbanzo') ||
    n.includes('maiz') ||
    n.includes('maíz') ||
    n.includes('grano')
  ) {
    return { id: 1, nombre: 'Granos' };
  }
  if (
    n.includes('pasta') ||
    n.includes('espagueti') ||
    n.includes('fideo') ||
    n.includes('macarron') ||
    n.includes('doria')
  ) {
    return { id: 2, nombre: 'Pasta' };
  }
  if (
    n.includes('salsa') ||
    n.includes('fruco') ||
    n.includes('mayonesa') ||
    n.includes('mostaza') ||
    n.includes('tomate') ||
    n.includes('aderezo')
  ) {
    return { id: 3, nombre: 'Salsas' };
  }
  if (
    n.includes('leche') ||
    n.includes('queso') ||
    n.includes('yogur') ||
    n.includes('yogurt') ||
    n.includes('mantequilla') ||
    n.includes('crema') ||
    n.includes('lacteo') ||
    n.includes('lácteo')
  ) {
    return { id: 4, nombre: 'lacteos' };
  }
  return { id: 1, nombre: 'Granos' };
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
      try {
        const fallbackRes = await axiosClient.get('/categorias');
        if (Array.isArray(fallbackRes.data) && fallbackRes.data.length > 0) return fallbackRes.data;
      } catch (e) {}
      return CATEGORIAS_DEFAULT;
    }
  },
};

export default categoriasService;
