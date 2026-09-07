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
 * Normaliza cualquier variante de rol enviada por el backend NestJS
 * @param {string} rol 
 * @returns {'admin' | 'cajero'}
 */
export const normalizarRol = (rol) => {
  if (!rol) return ROLES.ADMIN; // Por defecto para desarrollo
  const rolLower = String(rol).toLowerCase().trim();

  if (rolLower.includes('admin') || rolLower.includes('administrador') || rolLower.includes('gerente')) {
    return ROLES.ADMIN;
  }
  if (rolLower.includes('caj') || rolLower.includes('ventas') || rolLower.includes('operador') || rolLower.includes('empleado')) {
    return ROLES.CAJERO;
  }

  return ROLES.ADMIN;
};
