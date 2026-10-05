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

  // Matrices de permisos granulares
  // 1. Usuarios: Ninguno para supervisor (solo ADMIN)
  const canManageUsers = isAdmin;

  // 2. Inventario/Productos: Supervisor solo puede VER
  const canManageInventory = isAdmin;
  const canViewInventory = isAdmin || isSupervisor;

  // 3. Punto de Venta (POS): Supervisor Ninguno (solo Admin y Cajero)
  const canSell = isAdmin || isCajero;

  // 4. Reportes (PDF diario): Supervisor puede VER
  const canViewReports = isAdmin || isContador || isSupervisor;

  // 5. Proveedores: Supervisor solo puede VER
  const canManageSuppliers = isAdmin;
  const canViewSuppliers = isAdmin || isSupervisor;

  // 6. Compras/Entradas: Supervisor solo puede VER (igual que Contador)
  const canManagePurchases = isAdmin;
  const canViewPurchases = isAdmin || isSupervisor || isContador;

  // 7. Notificaciones y alertas de stock: Supervisor puede VER
  const canViewNotifications = isAdmin || isSupervisor;

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

    // 1. Usuarios: solo admin
    if (sub === 'usuarios') return canManageUsers;

    // 2. Inventario y productos: supervisor solo ver
    if (sub === 'inventario' || sub === 'productos' || sub === 'categorias') {
      if (act === 'view' || act === 'read' || act === 'consultar') return canViewInventory;
      return canManageInventory;
    }

    // 3. Proveedores: supervisor solo ver
    if (sub === 'proveedores') {
      if (act === 'view' || act === 'read' || act === 'consultar') return canViewSuppliers;
      return canManageSuppliers;
    }

    // 4. Compras y entradas: supervisor y contador solo ver
    if (sub === 'compras' || sub === 'entradas') {
      if (act === 'view' || act === 'read' || act === 'consultar') return canViewPurchases;
      return canManagePurchases;
    }

    // 5. Reportes y balances: supervisor, contador y admin pueden ver
    if (sub === 'reportes' || sub === 'balance') return canViewReports;

    // 6. Ventas y POS: supervisor no puede vender
    if (sub === 'ventas' || sub === 'caja' || sub === 'pos') {
      if (act === 'view' || act === 'read' || act === 'consultar') return canViewReports;
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
    canViewInventory,
    canSell,
    canViewReports,
    canManageSuppliers,
    canViewSuppliers,
    canManagePurchases,
    canViewPurchases,
    canViewNotifications,
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
