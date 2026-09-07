/**
 * Definición y constantes de Roles del Sistema (RBAC)
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
  },
  [ROLES.CAJERO]: {
    label: 'Cajero POS',
    icon: '🛒',
    bg: '#065f46',
    color: '#d1fae5',
    border: '#10b981',
  },
};

/**
 * Normaliza cualquier variante de rol enviada por la BD / backend NestJS
 * Soporta strings, objetos ({ nombre: 'Administrador' }), IDs numéricos y arrays
 * @param {any} rol 
 * @returns {'admin' | 'cajero'}
 */
export const normalizarRol = (rol) => {
  if (!rol) return ROLES.ADMIN;

  // Si es un objeto relacional de TypeORM/Prisma (ej: { id: 1, nombre: 'Administrador' })
  if (typeof rol === 'object' && rol !== null) {
    if (Array.isArray(rol)) {
      rol = rol[0];
    }
    if (typeof rol === 'object' && rol !== null) {
      rol = rol.nombre || rol.name || rol.rol || rol.tipo || rol.descripcion || rol.id || '';
    }
  }

  // Si es un ID numérico (ej: 1 = Admin, 2 = Cajero)
  if (rol === 1 || rol === '1') return ROLES.ADMIN;
  if (rol === 2 || rol === '2') return ROLES.CAJERO;

  const rolLower = String(rol).toLowerCase().trim();

  if (
    rolLower.includes('caj') ||
    rolLower.includes('ventas') ||
    rolLower.includes('operador') ||
    rolLower.includes('empleado') ||
    rolLower.includes('cashier')
  ) {
    return ROLES.CAJERO;
  }

  if (
    rolLower.includes('admin') ||
    rolLower.includes('administrador') ||
    rolLower.includes('gerente') ||
    rolLower.includes('supervisor')
  ) {
    return ROLES.ADMIN;
  }

  return ROLES.ADMIN;
};

