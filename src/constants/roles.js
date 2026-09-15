/**
 * Definición y constantes de los 5 Roles del Sistema (RBAC)
 * Mapeo 1:1 con la tabla `tienda_comunitaria.roles` de la Base de Datos:
 * #1: ADMIN
 * #2: CONTADOR
 * #3: INVENTARIO
 * #4: SUPERVISOR
 * #5: CAJERO
 */
export const ROLES = {
  ADMIN: 'admin',
  CONTADOR: 'contador',
  INVENTARIO: 'inventario',
  SUPERVISOR: 'supervisor',
  CAJERO: 'cajero',
};

export const ROLES_DB = [
  { id: 1, key: ROLES.ADMIN, nombre: 'ADMIN', label: 'Administrador', icon: '👑' },
  { id: 2, key: ROLES.CONTADOR, nombre: 'CONTADOR', label: 'Contador', icon: '📊' },
  { id: 3, key: ROLES.INVENTARIO, nombre: 'INVENTARIO', label: 'Inventario / Bodega', icon: '📦' },
  { id: 4, key: ROLES.SUPERVISOR, nombre: 'SUPERVISOR', label: 'Supervisor', icon: '🛡️' },
  { id: 5, key: ROLES.CAJERO, nombre: 'CAJERO', label: 'Cajero POS', icon: '🛒' },
];

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.CONTADOR]: 'Contador',
  [ROLES.INVENTARIO]: 'Inventario',
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.CAJERO]: 'Cajero POS',
};

export const ROLE_BADGES = {
  [ROLES.ADMIN]: {
    label: 'ADMIN',
    nombreCompleto: 'Administrador',
    icon: '👑',
    bg: '#4338ca',
    color: '#e0e7ff',
    border: '#6366f1',
    id_rol: 1,
  },
  [ROLES.CONTADOR]: {
    label: 'CONTADOR',
    nombreCompleto: 'Contador',
    icon: '📊',
    bg: '#0369a1',
    color: '#e0f2fe',
    border: '#38bdf8',
    id_rol: 2,
  },
  [ROLES.INVENTARIO]: {
    label: 'INVENTARIO',
    nombreCompleto: 'Inventario / Bodega',
    icon: '📦',
    bg: '#b45309',
    color: '#fef3c7',
    border: '#f59e0b',
    id_rol: 3,
  },
  [ROLES.SUPERVISOR]: {
    label: 'SUPERVISOR',
    nombreCompleto: 'Supervisor',
    icon: '🛡️',
    bg: '#7e22ce',
    color: '#fae8ff',
    border: '#a855f7',
    id_rol: 4,
  },
  [ROLES.CAJERO]: {
    label: 'CAJERO',
    nombreCompleto: 'Cajero POS',
    icon: '🛒',
    bg: '#065f46',
    color: '#d1fae5',
    border: '#10b981',
    id_rol: 5,
  },
};

/**
 * Normaliza cualquier variante de rol enviada por la BD o el backend NestJS
 * Mapeo directo por ID y por nombre según tabla `tienda_comunitaria.roles`
 * @param {any} rol 
 * @returns {'admin' | 'contador' | 'inventario' | 'supervisor' | 'cajero'}
 */
export const normalizarRol = (rol) => {
  if (rol === undefined || rol === null) return ROLES.ADMIN;

  // Si es un objeto relacional (ej: { id: 1, nombre: 'ADMIN' })
  if (typeof rol === 'object' && rol !== null) {
    if (Array.isArray(rol)) {
      rol = rol[0];
    }
    if (typeof rol === 'object' && rol !== null) {
      rol = rol.id_rol ?? rol.id ?? rol.nombre ?? rol.rol ?? rol.role ?? rol.name ?? '';
    }
  }

  // Mapeo por ID numérico de la tabla `tienda_comunitaria.roles`
  const rolNum = Number(rol);
  if (rolNum === 1) return ROLES.ADMIN;
  if (rolNum === 2) return ROLES.CONTADOR;
  if (rolNum === 3) return ROLES.INVENTARIO;
  if (rolNum === 4) return ROLES.SUPERVISOR;
  if (rolNum === 5) return ROLES.CAJERO;

  // Mapeo por Texto
  const rolStr = String(rol).toUpperCase().trim();

  if (rolStr.includes('ADMIN')) return ROLES.ADMIN;
  if (rolStr.includes('CONTADOR') || rolStr.includes('CONTAB')) return ROLES.CONTADOR;
  if (rolStr.includes('INVENTARIO') || rolStr.includes('BODEGA') || rolStr.includes('ALMACEN')) return ROLES.INVENTARIO;
  if (rolStr.includes('SUPERVISOR') || rolStr.includes('SUPER')) return ROLES.SUPERVISOR;
  if (rolStr.includes('CAJERO') || rolStr.includes('CAJA') || rolStr.includes('POS') || rolStr.includes('VENTA')) return ROLES.CAJERO;

  return ROLES.ADMIN;
};

export const obtenerInfoRol = (id_rol) => {
  const norm = normalizarRol(id_rol);
  return ROLE_BADGES[norm] || ROLE_BADGES[ROLES.ADMIN];
};

export default ROLES;
