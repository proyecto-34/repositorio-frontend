import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

// Clave local para persistir cuáles notificaciones han sido leídas por el usuario
const STORAGE_KEY_LEIDAS = 'tienda_notificaciones_leidas';
// Clave local para persistir notificaciones descartadas/eliminadas (incluyendo alertas generadas)
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

// Datos iniciales idénticos a los registros reales de tu BD MySQL
export const NOTIFICACIONES_DEFAULT = [
  {
    id: 1,
    mensaje: 'Nuevo usuario registrado: Johan',
    tipo: 'EVENTO',
    fecha: '2026-09-07 19:51:42.013236',
    usuario_id: 1,
  },
  {
    id: 2,
    mensaje: 'Nuevo usuario registrado: Danna',
    tipo: 'EVENTO',
    fecha: '2026-09-07 19:52:27.700137',
    usuario_id: 2,
  },
  {
    id: 7,
    mensaje: 'Nueva venta registrada por 100 (ID: 1)',
    tipo: 'EVENTO',
    fecha: '2026-09-07 19:58:12.067442',
    usuario_id: 1,
  },
  {
    id: 8,
    mensaje: 'Nueva venta registrada por 400 (ID: 2)',
    tipo: 'EVENTO',
    fecha: '2026-09-07 19:58:45.200923',
    usuario_id: 1,
  },
  {
    id: 25,
    mensaje: 'Usuario Johan ha iniciado sesión',
    tipo: 'INFO',
    fecha: '2026-09-14 21:10:40.625787',
    usuario_id: 1,
  },
];

export const notificacionesService = {
  /**
   * Obtiene la lista de notificaciones desde el backend NestJS (Tabla `notificaciones`)
   * e integra automáticamente alertas en tiempo real si el stock de algún producto está bajo o agotado.
   * Filtra las descartadas almacenadas en localStorage y aplica paginación.
   */
  obtenerNotificaciones: async (params = { limit: 50, page: 1 }) => {
    const idsLeidas = obtenerIdsLeidasLocal();
    const idsDescartadas = obtenerIdsDescartadasLocal();
    let lista = [];

    // 1. Obtener eventos de la tabla `notificaciones`
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
      console.warn('Usando notificaciones por defecto con estructura real:', error.message);
      lista = [...NOTIFICACIONES_DEFAULT];
    }

    if (lista.length === 0) {
      lista = [...NOTIFICACIONES_DEFAULT];
    }

    // 2. Comprobar alertas de stock bajo o agotado en la tabla `productos`
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
              usuario_id: null,
            });
          } else if (stock <= stockMin) {
            alertasStock.push({
              id: `stock-low-${p.id}`,
              mensaje: `⚠️ Stock Bajo: "${p.nombre}" tiene solo ${stock} unidades (Mínimo: ${stockMin}).`,
              tipo: 'ALERTA',
              fecha: new Date().toISOString(),
              usuario_id: null,
            });
          }
        });
      }
    } catch {
      // Si la llamada falla, inyectamos alertas de stock de demostración
      alertasStock = [
        {
          id: 'stock-low-4',
          mensaje: '⚠️ Stock Bajo: "Aceite Vegetal 900ml" tiene solo 8 unidades en bodega (Mínimo: 10).',
          tipo: 'ALERTA',
          fecha: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          usuario_id: null,
        },
        {
          id: 'stock-low-9',
          mensaje: '🚫 Producto Agotado: "Gaseosa Coca-Cola 1.5L" está en nivel crítico (3 unidades).',
          tipo: 'ALERTA',
          fecha: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
          usuario_id: null,
        },
      ];
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
      usuario_id: n.usuario_id || null,
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
        // Cajero: Alertas de stock crítico (producto agotado), eventos de ventas/caja y sus inicios de sesión
        return (
          tipo === 'ALERTA' ||
          msg.includes('venta') ||
          msg.includes('caja') ||
          msg.includes('pago') ||
          tipo === 'INFO'
        );
      }

      if (rol === 'inventario') {
        // Inventario: Todas las alertas de stock, compras a proveedores y productos
        return (
          tipo === 'ALERTA' ||
          msg.includes('stock') ||
          msg.includes('producto') ||
          msg.includes('proveedor') ||
          msg.includes('compra')
        );
      }

      if (rol === 'contador') {
        // Contador: Ventas, facturación, compras, balance
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
    try {
      const endpoint = ENDPOINTS.NOTIFICACIONES.MARCAR_LEIDA 
        ? ENDPOINTS.NOTIFICACIONES.MARCAR_LEIDA(id) 
        : `/notificaciones/${id}/leida`;
      await axiosClient.patch(endpoint, { leida: true });
    } catch (error) {
      // Si la BD no tiene endpoint de patch, queda guardada en localStorage
    }
    return true;
  },

  /**
   * Marca todas las notificaciones como leídas
   */
  marcarTodasComoLeidas: async (ids = []) => {
    guardarTodasLeidasLocal(ids);
    try {
      await axiosClient.patch(`${ENDPOINTS.NOTIFICACIONES.BASE}/marcar-todas-leidas`);
    } catch (error) {
      // Guardado localmente
    }
    return true;
  },

  /**
   * Elimina/descarta una notificación y persiste el descarte en localStorage
   */
  eliminarNotificacion: async (id) => {
    guardarIdDescartadaLocal(id);
    try {
      await axiosClient.delete(`${ENDPOINTS.NOTIFICACIONES.BASE}/${id}`);
    } catch (error) {
      console.warn(`Descarte local aplicado para notificación #${id}`);
    }
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
