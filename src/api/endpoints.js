/**
 * Endpoints organizados según los módulos del backend NestJS
 */
export const ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
  },

  // Usuarios y Roles
  USUARIOS: {
    BASE: '/usuarios',
    BY_ID: (id) => `/usuarios/${id}`,
    ROLES: '/usuarios/roles',
    ESTADOS: '/usuarios/estados',
  },

  // Productos e Inventario
  PRODUCTOS: {
    BASE: '/productos',
    BY_ID: (id) => `/productos/${id}`,
    CATEGORIAS: '/productos/categorias',
    STOCK_ALERTAS: '/productos/alertas-stock',
  },

  // Proveedores
  PROVEEDORES: {
    BASE: '/proveedores',
    BY_ID: (id) => `/proveedores/${id}`,
  },

  // Compras a Proveedores
  COMPRAS: {
    BASE: '/compras',
    BY_ID: (id) => `/compras/${id}`,
  },

  // Ventas (Punto de Venta POS)
  VENTAS: {
    BASE: '/ventas',
    BY_ID: (id) => `/ventas/${id}`,
    CIERRE_CAJA: '/ventas/cierre-caja',
  },

  // Pagos
  PAGOS: {
    BASE: '/pagos',
    BY_ID: (id) => `/pagos/${id}`,
  },

  // Facturación
  FACTURACION: {
    BASE: '/facturacion',
    BY_ID: (id) => `/facturacion/${id}`,
    DESCARGAR_PDF: (id) => `/facturacion/${id}/pdf`,
  },

  // Reportes
  REPORTES: {
    VENTAS: '/reportes/ventas',
    INVENTARIO: '/reportes/inventario',
    BALANCE: '/reportes/balance',
  },

  // Notificaciones
  NOTIFICACIONES: {
    BASE: '/notificaciones',
    MARCAR_LEIDA: (id) => `/notificaciones/${id}/leida`,
  },

  // Auditoría
  AUDITORIA: {
    BASE: '/auditoria',
  },
};
