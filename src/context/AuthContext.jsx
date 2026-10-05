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
    return storedUser ? normalizarRol(storedUser.id_rol || storedUser.rol || storedUser.role) : ROLES.ADMIN;
  });

  useEffect(() => {
    if (user) {
      const detectedRole = normalizarRol(user.id_rol || user.rol || user.role);
      const simulated = localStorage.getItem('simulated_role');
      setActiveRole(simulated || detectedRole);
    }
  }, [user]);

  const login = async (credentials) => {
    const result = await authService.login(credentials);
    setUser(result.user);
    setToken(result.token);
    const role = normalizarRol(result.user?.id_rol || result.user?.rol || result.user?.role);
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
   * Permite alternar dinámicamente entre cualquiera de los roles disponibles
   */
  const cambiarRolActivo = (nuevoRol) => {
    setActiveRole(nuevoRol);
    localStorage.setItem('simulated_role', nuevoRol);
  };

  // Permisos según el rol activo
  const isAdmin = activeRole === ROLES.ADMIN;
  const isContador = activeRole === ROLES.CONTADOR;
  const isSupervisor = activeRole === ROLES.SUPERVISOR;
  const isCajero = activeRole === ROLES.CAJERO;

  // Matrices de permisos
  const canManageUsers = isAdmin || isSupervisor;
  const canManageInventory = isAdmin || isSupervisor;
  const canSell = isAdmin || isCajero || isSupervisor;
  const canViewReports = isAdmin || isContador || isSupervisor;
  const canManageSuppliers = isAdmin || isSupervisor;
  const canManagePurchases = isAdmin || isSupervisor; // Solo Admin y Supervisor pueden registrar compras
  const canViewPurchases = isAdmin || isSupervisor || isContador; // Contador solo consulta

  /**
   * Capa 3: Verificación de roles (hasAnyRole / hasAnyAuthority)
   * @param {string|string[]} rolesRequeridos
   * @returns {boolean}
   */
  const hasAnyRole = (rolesRequeridos) => {
    if (!rolesRequeridos) return true;
    const lista = Array.isArray(rolesRequeridos) ? rolesRequeridos : [rolesRequeridos];
    if (lista.length === 0) return true;
    const normReq = lista.map((r) => normalizarRol(r));
    return normReq.includes(activeRole);
  };

  /**
   * Capa 5: Verificación granular de acciones y recursos (Matriz de Permisos)
   * @param {string} action - ej: 'view', 'create', 'edit', 'delete'
   * @param {string} subject - ej: 'usuarios', 'inventario', 'proveedores', 'compras', 'reportes', 'ventas'
   * @returns {boolean}
   */
  const hasPermission = (action, subject) => {
    if (isAdmin) return true; // Admin tiene bypass total

    const sub = (subject || '').toLowerCase();
    const act = (action || '').toLowerCase();

    if (sub === 'usuarios') return canManageUsers;
    if (sub === 'inventario' || sub === 'productos') {
      if (act === 'view' || act === 'read') return true;
      return canManageInventory;
    }
    if (sub === 'proveedores') return canManageSuppliers;
    if (sub === 'compras' || sub === 'entradas') {
      if (act === 'view' || act === 'read' || act === 'consultar') return canViewPurchases;
      return canManagePurchases;
    }
    if (sub === 'reportes' || sub === 'balance') return canViewReports;
    if (sub === 'ventas' || sub === 'caja' || sub === 'pos') {
      if (act === 'view' || act === 'read' || act === 'consultar') return canViewReports || canSell;
      return canSell;
    }

    return false;
  };

  const value = {
    user,
    token,
    activeRole,
    isAuthenticated: Boolean(token),
    isAdmin,
    isContador,
    isSupervisor,
    isCajero,
    canManageUsers,
    canManageInventory,
    canSell,
    canViewReports,
    canManageSuppliers,
    canManagePurchases,
    canViewPurchases,
    hasAnyRole,
    hasPermission,
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
