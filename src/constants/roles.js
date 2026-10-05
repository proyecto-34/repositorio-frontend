/**
 * Definición y constantes de los 4 Roles del Sistema (RBAC)
 * Sincronizado 1:1 con la tabla `tienda_comunitaria.roles` de MySQL:
 * #1: ADMIN
 * #2: CAJERO
 * #3: SUPERVISOR
 * #4: CONTADOR
 */
export const ROLES = {
  ADMIN: 'admin',
  CAJERO: 'cajero',
  SUPERVISOR: 'supervisor',
  CONTADOR: 'contador',
};

export const ROLES_DB = [
  { id: 1, key: ROLES.ADMIN, nombre: 'ADMIN', label: 'Administrador', icon: '👑' },
  { id: 2, key: ROLES.CAJERO, nombre: 'CAJERO', label: 'Cajero POS', icon: '🛒' },
  { id: 3, key: ROLES.SUPERVISOR, nombre: 'SUPERVISOR', label: 'Supervisor', icon: '🛡️' },
  { id: 4, key: ROLES.CONTADOR, nombre: 'CONTADOR', label: 'Contador', icon: '📊' },
];

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.CAJERO]: 'Cajero POS',
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.CONTADOR]: 'Contador',
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
  [ROLES.CAJERO]: {
    label: 'CAJERO',
    nombreCompleto: 'Cajero POS',
    icon: '🛒',
    bg: '#065f46',
    color: '#d1fae5',
    border: '#10b981',
    id_rol: 2,
  },
  [ROLES.SUPERVISOR]: {
    label: 'SUPERVISOR',
    nombreCompleto: 'Supervisor',
    icon: '🛡️',
    bg: '#7e22ce',
    color: '#fae8ff',
    border: '#a855f7',
    id_rol: 3,
  },
  [ROLES.CONTADOR]: {
    label: 'CONTADOR',
    nombreCompleto: 'Contador',
    icon: '📊',
    bg: '#0369a1',
    color: '#e0f2fe',
    border: '#38bdf8',
    id_rol: 4,
  },
};

/**
 * Normaliza cualquier variante de rol enviada por la BD o el backend NestJS
 * Mapeo directo por ID y por nombre según tabla `tienda_comunitaria.roles`
 * @param {any} rol 
 * @returns {'admin' | 'cajero' | 'supervisor' | 'contador'}
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
  if (rolNum === 2) return ROLES.CAJERO;
  if (rolNum === 3) return ROLES.SUPERVISOR;
  if (rolNum === 4) return ROLES.CONTADOR;

  // Mapeo por Texto
  const rolStr = String(rol).toUpperCase().trim();

  if (rolStr.includes('ADMIN')) return ROLES.ADMIN;
  if (rolStr.includes('CAJERO') || rolStr.includes('CAJA') || rolStr.includes('POS') || rolStr.includes('VENTA')) return ROLES.CAJERO;
  if (rolStr.includes('SUPERVISOR') || rolStr.includes('SUPER')) return ROLES.SUPERVISOR;
  if (rolStr.includes('CONTADOR') || rolStr.includes('CONTAB')) return ROLES.CONTADOR;

  return ROLES.ADMIN;
};

export const obtenerInfoRol = (id_rol) => {
  const norm = normalizarRol(id_rol);
  return ROLE_BADGES[norm] || ROLE_BADGES[ROLES.ADMIN];
};

export default ROLES;
