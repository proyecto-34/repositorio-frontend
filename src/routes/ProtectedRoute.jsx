import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles';

/**
 * Guardián de rutas que verifica autenticación y permisos de rol.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, activeRole } = useAuth();
  const location = useLocation();

  // Si no está autenticado, redirigir al login y guardar la ruta que intentaba visitar
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si se especifican roles permitidos y el rol actual no está en la lista
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(activeRole)) {
    // Si es cajero, devolver al cajero. Si no, al admin dashboard.
    if (activeRole === ROLES.CAJERO) {
      return <Navigate to="/cajero" replace />;
    } else {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
