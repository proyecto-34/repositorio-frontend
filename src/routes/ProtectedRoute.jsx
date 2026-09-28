import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Guardián de rutas (Capa 2 de Seguridad):
 * - Si no está autenticado -> Redirige a /login.
 * - Si está autenticado pero no tiene el rol permitido -> Redirige a /forbidden (403).
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, hasAnyRole } = useAuth();
  const location = useLocation();

  // 1. Si no hay sesión activa, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Si la ruta exige roles específicos y el usuario no cuenta con ninguno de ellos
  if (allowedRoles && allowedRoles.length > 0) {
    const tieneAcceso = hasAnyRole(allowedRoles);
    if (!tieneAcceso) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
