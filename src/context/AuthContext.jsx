import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { ROLES, normalizarRol } from '../constants/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [token, setToken] = useState(() => authService.getStoredToken());
  const [activeRole, setActiveRole] = useState(() => {
    const storedUser = authService.getStoredUser();
    const storedSimulatedRole = localStorage.getItem('simulated_role');
    if (storedSimulatedRole) return storedSimulatedRole;
    return storedUser ? normalizarRol(storedUser.rol || storedUser.role) : ROLES.ADMIN;
  });

  useEffect(() => {
    if (user) {
      const detectedRole = normalizarRol(user.rol || user.role);
      const simulated = localStorage.getItem('simulated_role');
      setActiveRole(simulated || detectedRole);
    }
  }, [user]);

  const login = async (credentials) => {
    const result = await authService.login(credentials);
    setUser(result.user);
    setToken(result.token);
    const role = normalizarRol(result.user?.rol || result.user?.role);
    setActiveRole(role);
    localStorage.removeItem('simulated_role');
    return result;
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('simulated_role');
    setUser(null);
    setToken(null);
    setActiveRole(ROLES.ADMIN);
  };

  /**
   * Permite alternar rápidamente entre modo Administrador y Cajero para pruebas/demos
   */
  const cambiarRolActivo = (nuevoRol) => {
    setActiveRole(nuevoRol);
    localStorage.setItem('simulated_role', nuevoRol);
  };

  const value = {
    user,
    token,
    activeRole,
    isAuthenticated: Boolean(token),
    isAdmin: activeRole === ROLES.ADMIN,
    isCajero: activeRole === ROLES.CAJERO,
    login,
    logout,
    cambiarRolActivo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
