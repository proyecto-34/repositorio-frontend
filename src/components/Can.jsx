import React from 'react';
import { useAuth } from '../context/AuthContext';


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


