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
      let list = [];
      if (Array.isArray(data) && data.length > 0) list = data;
      else if (data && Array.isArray(data.data) && data.data.length > 0) list = data.data;

      if (list.length > 0) {
        list.forEach((c) => {
          if (c && c.id && c.nombre) {
            CATEGORIAS_MAP[c.id] = c.nombre;
            CATEGORIAS_MAP[String(c.id)] = c.nombre;
          }
        });
        return list;
      }
      return CATEGORIAS_DEFAULT;
    } catch (error) {
      try {
        const fallbackRes = await axiosClient.get('/categorias');
        if (Array.isArray(fallbackRes.data) && fallbackRes.data.length > 0) {
          fallbackRes.data.forEach((c) => {
            if (c && c.id && c.nombre) {
              CATEGORIAS_MAP[c.id] = c.nombre;
              CATEGORIAS_MAP[String(c.id)] = c.nombre;
            }
          });
          return fallbackRes.data;
        }
      } catch (e) {}
      return CATEGORIAS_DEFAULT;
    }
  },

  /**
   * Crea una nueva categoría en la Base de Datos a través de NestJS
   * @param {string} nombre - Nombre de la nueva categoría
   */
  crearCategoria: async (nombre) => {
    const nombreLimpio = String(nombre).trim();
    try {
      const response = await axiosClient.post(ENDPOINTS.PRODUCTOS.CATEGORIAS, {
        nombre: nombreLimpio,
      });
      const data = response.data;
      if (data && data.id) {
        CATEGORIAS_MAP[data.id] = data.nombre;
        CATEGORIAS_MAP[String(data.id)] = data.nombre;
      }
      return data;
    } catch (error) {
      try {
        const fallbackRes = await axiosClient.post('/categorias', {
          nombre: nombreLimpio,
        });
        const data = fallbackRes.data;
        if (data && data.id) {
          CATEGORIAS_MAP[data.id] = data.nombre;
          CATEGORIAS_MAP[String(data.id)] = data.nombre;
        }
        return data;
      } catch {
        throw error;
      }
    }
  },
};

export default categoriasService;
