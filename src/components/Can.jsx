import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Componente <Can> (Equivalente a la directiva v-can de Vue)
 * Oculta o renderiza elementos del DOM según el rol o permiso del usuario activo.
 * 
 * Ejemplos de uso:
 * 1. Por Roles:
 *    <Can roles={['admin', 'supervisor']}>
 *      <button>Crear Usuario</button>
 *    </Can>
 * 
 * 2. Por Acción y Recurso:
 *    <Can do="create" on="proveedores">
 *      <button>Nuevo Proveedor</button>
 *    </Can>
 */
export const Can = ({ roles, do: action, on: subject, children, fallback = null }) => {
  const { hasAnyRole, hasPermission } = useAuth();

  // 1. Verificación directa por lista de roles
  if (roles) {
    const tieneRol = hasAnyRole(roles);
    return tieneRol ? <>{children}</> : fallback;
  }

  // 2. Verificación por acción y recurso (ej: do="delete" on="usuarios")
  if (action && subject) {
    const tienePermiso = hasPermission(action, subject);
    return tienePermiso ? <>{children}</> : fallback;
  }

  return <>{children}</>;
};

export default Can;
