/**
 * Definición y constantes de Roles del Sistema (RBAC)
 * Mapeo directo con las tablas de la base de datos p_tienda_comunitaria.usuarios
 */
export const ROLES = {
  ADMIN: 'admin',
  CAJERO: 'cajero',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.CAJERO]: 'Cajero',
};

export const ROLE_BADGES = {
  [ROLES.ADMIN]: {
    label: 'Administrador',
    icon: '👑',
    bg: '#4338ca',
    color: '#e0e7ff',
    border: '#6366f1',
    id_rol: 1,
  },
  [ROLES.CAJERO]: {
    label: 'Cajero POS',
    icon: '🛒',
    bg: '#065f46',
    color: '#d1fae5',
    border: '#10b981',
    id_rol: 5,
  },
};

/**
 * Normaliza cualquier variante de rol enviada por la BD / backend NestJS
 * En la BD:
 * id_rol = 1 -> Administrador (Admin Inicial, Luis, Johan)
 * id_rol = 5 -> Cajero POS (Johan Arteaga, Carlos Pérez)
 * @param {any} rol 
 * @returns {'admin' | 'cajero'}
 */
export const normalizarRol = (rol) => {
  if (rol === undefined || rol === null) return ROLES.ADMIN;

  // Si es un objeto relacional de TypeORM/Prisma (ej: { id: 1, id_rol: 1, nombre: 'Admin Inicial' })
  if (typeof rol === 'object' && rol !== null) {
    if (Array.isArray(rol)) {
      rol = rol[0];
    }
    if (typeof rol === 'object' && rol !== null) {
      rol = rol.id_rol ?? rol.rol ?? rol.role ?? rol.id ?? rol.nombre ?? rol.name ?? '';
    }
  }

  // Mapeo exacto por ID de la base de datos
  const rolNum = Number(rol);
  if (rolNum === 1) return ROLES.ADMIN;
  if (rolNum === 5 || rolNum === 2 || rolNum === 3) return ROLES.CAJERO;

  const rolLower = String(rol).toLowerCase().trim();

  if (
    rolLower.includes('caj') ||
    rolLower.includes('ventas') ||
    rolLower.includes('operador') ||
    rolLower.includes('empleado') ||
    rolLower.includes('cashier') ||
    rolLower === '5'
  ) {
    return ROLES.CAJERO;
  }

  if (
    rolLower.includes('admin') ||
    rolLower.includes('administrador') ||
    rolLower.includes('gerente') ||
    rolLower.includes('supervisor') ||
    rolLower === '1'
  ) {
    return ROLES.ADMIN;
  }

  return ROLES.ADMIN;
};

export const obtenerEtiquetaRol = (id_rol) => {
  const norm = normalizarRol(id_rol);
  return norm === ROLES.ADMIN ? '👑 Administrador (Rol #1)' : '🛒 Cajero POS (Rol #5)';
};
