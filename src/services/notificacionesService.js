import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

// Clave local para persistir cuáles notificaciones han sido leídas por el usuario
const STORAGE_KEY_LEIDAS = 'tienda_notificaciones_leidas';
// Clave local para persistir notificaciones descartadas/eliminadas
const STORAGE_KEY_DESCARTADAS = 'tienda_notificaciones_descartadas';

const obtenerIdsLeidasLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEIDAS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const guardarIdLeidaLocal = (id) => {
  try {
    const leidas = obtenerIdsLeidasLocal();
    if (!leidas.includes(id)) {
      leidas.push(id);
      localStorage.setItem(STORAGE_KEY_LEIDAS, JSON.stringify(leidas));
    }
  } catch {}
};

const guardarTodasLeidasLocal = (ids) => {
  try {
    const leidas = Array.from(new Set([...obtenerIdsLeidasLocal(), ...ids]));
    localStorage.setItem(STORAGE_KEY_LEIDAS, JSON.stringify(leidas));
  } catch {}
};

const obtenerIdsDescartadasLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DESCARTADAS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const guardarIdDescartadaLocal = (id) => {
  try {
    const descartadas = obtenerIdsDescartadasLocal();
    if (!descartadas.includes(id)) {
      descartadas.push(id);
      localStorage.setItem(STORAGE_KEY_DESCARTADAS, JSON.stringify(descartadas));
    }
  } catch {}
};

const guardarTodasDescartadasLocal = (ids) => {
  try {
    const descartadas = Array.from(new Set([...obtenerIdsDescartadasLocal(), ...ids]));
    localStorage.setItem(STORAGE_KEY_DESCARTADAS, JSON.stringify(descartadas));
  } catch {}
};

export const notificacionesService = {
  /**
   * Obtiene la lista de notificaciones 100% REALES desde el backend NestJS (Tabla `notificaciones`)
   * e integra automáticamente alertas en tiempo real si algún producto real en la BD tiene stock bajo o agotado.
   */
  obtenerNotificaciones: async (params = { limit: 60, page: 1 }) => {
    const idsLeidas = obtenerIdsLeidasLocal();
    const idsDescartadas = obtenerIdsDescartadasLocal();
    let lista = [];

    // 1. Obtener eventos reales de la tabla `notificaciones` de MySQL
    try {
      const response = await axiosClient.get(ENDPOINTS.NOTIFICACIONES.BASE, { params });
      const data = response.data;

      if (Array.isArray(data)) lista = data;
      else if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) lista = data.data;
        else if (Array.isArray(data.notificaciones)) lista = data.notificaciones;
        else if (Array.isArray(data.result)) lista = data.result;
      }
    } catch (error) {
      console.warn('Error al consultar notificaciones en BD:', error.message);
      lista = [];
    }

    // 2. Comprobar alertas de stock bajo o agotado en la tabla `productos` real
    let alertasStock = [];
    try {
      const respProductos = await axiosClient.get(ENDPOINTS.PRODUCTOS.BASE, {
        params: { limit: 100, page: 1 },
      });
      const prodData = respProductos.data;
      let rawProds = [];
      if (Array.isArray(prodData)) rawProds = prodData;
      else if (prodData && typeof prodData === 'object') {
        if (Array.isArray(prodData.data)) rawProds = prodData.data;
        else if (Array.isArray(prodData.productos)) rawProds = prodData.productos;
      }

      if (rawProds.length > 0) {
        rawProds.forEach((p) => {
          const stock = Number(p.cantidad !== undefined ? p.cantidad : (p.stock ?? 0));
          const stockMin = Number(p.stock_minimo || 5);
          if (stock === 0) {
            alertasStock.push({
              id: `stock-0-${p.id}`,
              mensaje: `🚫 Producto Agotado: "${p.nombre}" tiene 0 unidades en inventario.`,
              tipo: 'ALERTA',
              fecha: new Date().toISOString(),
              usuarioId: null,
            });
          } else if (stock <= stockMin) {
            alertasStock.push({
              id: `stock-low-${p.id}`,
              mensaje: `⚠️ Stock Bajo: "${p.nombre}" tiene solo ${stock} unidades (Mínimo: ${stockMin}).`,
              tipo: 'ALERTA',
              fecha: new Date().toISOString(),
              usuarioId: null,
            });
          }
        });
      }
    } catch {
      // Si la consulta falla, no inventamos alertas falsas
      alertasStock = [];
    }

    // Unir alertas de stock con las notificaciones de la BD
    const todas = [...alertasStock, ...lista];

    // Excluir notificaciones que el usuario ya descartó localmente
    const activas = todas.filter((n) => !idsDescartadas.includes(n.id));

    // Ordenar: primero las alertas no leídas y las más recientes
    const normalizadas = activas.map((n) => ({
      id: n.id,
      mensaje: n.mensaje || 'Evento del sistema',
      tipo: String(n.tipo || 'INFO').toUpperCase(),
      fecha: n.fecha || new Date().toISOString(),
      usuario_id: n.usuarioId || n.usuario_id || n.usuario?.id || null,
      usuario_nombre: n.usuario?.nombre || null,
      leida: idsLeidas.includes(n.id),
    }));

    return normalizadas.sort((a, b) => {
      if (a.tipo === 'ALERTA' && b.tipo !== 'ALERTA') return -1;
      if (b.tipo === 'ALERTA' && a.tipo !== 'ALERTA') return 1;
      return new Date(b.fecha) - new Date(a.fecha);
    });
  },

  /**
   * Filtra las notificaciones según el rol del usuario actual
   */
  filtrarPorRol: (notificaciones = [], activeRole = 'admin') => {
    if (!activeRole || activeRole === 'admin' || activeRole === 'supervisor') {
      return notificaciones;
    }

    const rol = String(activeRole).toLowerCase();

    return notificaciones.filter((n) => {
      const msg = (n.mensaje || '').toLowerCase();
      const tipo = (n.tipo || '').toUpperCase();

      if (rol === 'cajero') {
        return (
          tipo === 'ALERTA' ||
          msg.includes('venta') ||
          msg.includes('caja') ||
          msg.includes('pago') ||
          tipo === 'INFO'
        );
      }

      if (rol === 'contador') {
        return (
          msg.includes('venta') ||
          msg.includes('factura') ||
          msg.includes('compra') ||
          msg.includes('pago') ||
          tipo === 'INFO'
        );
      }

      return true;
    });
  },

  /**
   * Marca una notificación como leída
   */
  marcarComoLeida: async (id) => {
    guardarIdLeidaLocal(id);
    return true;
  },

  /**
   * Marca todas las notificaciones como leídas
   */
  marcarTodasComoLeidas: async (ids = []) => {
    guardarTodasLeidasLocal(ids);
    return true;
  },

  /**
   * Elimina/descarta una notificación y persiste el descarte en localStorage
   */
  eliminarNotificacion: async (id) => {
    guardarIdDescartadaLocal(id);
    return true;
  },

  /**
   * Descarta todas las notificaciones que ya han sido leídas
   */
  descartarLeidas: async (ids = []) => {
    guardarTodasDescartadasLocal(ids);
    return true;
  },
};

export default notificacionesService;
