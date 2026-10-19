import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  History,
  Search,
  Lock,
  Menu,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import NotificationBell from '../../components/NotificationBell';
import ThemeToggle from '../../components/ThemeToggle';
import FontSizeToggle from '../../components/FontSizeToggle';
import { usuariosService } from '../../services/usuariosService';
import { productosService } from '../../services/productosService';
import { facturacionService } from '../../services/facturacionService';
import proveedoresService from '../../services/proveedoresService';
import comprasService from '../../services/comprasService';
import pagosService from '../../services/pagosService';
import { normalizarRol, ROLES } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';

import DashboardKpis from './admin/DashboardKpis';
import InventarioTab from './admin/InventarioTab';
import ComprasTab from './admin/ComprasTab';
import ProveedoresTab from './admin/ProveedoresTab';
import ReportesTab from './admin/ReportesTab';
import UsuariosTab from './admin/UsuariosTab';
import AuditoriaTab from './admin/AuditoriaTab';
import '../../styles/admin-dashboard.css';

export const AdminDashboardView = ({ user, onOpenFactura, onAbrirPos, onLogout }) => {
  const {
    activeRole,
    canManageUsers,
    canManageInventory,
    canViewInventory,
    canViewReports,
    canManageSuppliers,
    canViewSuppliers,
    canManagePurchases,
    canViewPurchases,
    isAdmin,
    isContador,
    isSupervisor,
    logout,
  } = useAuth();

  // Estados de interfaz: Sidebar desplegable y búsqueda global
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [busquedaGlobal, setBusquedaGlobal] = useState('');

  // Pestaña inicial según rol
  const [tabActiva, setTabActiva] = useState(() => {
    if (isContador) return 'reportes';
    return 'inventario';
  });

  // Filtro de stock controlado para cuando se da clic en la tarjeta KPI
  const [filtroStockInventario, setFiltroStockInventario] = useState('todos');

  // Estados de datos (100% reales de la Base de Datos)
  const [proveedores, setProveedores] = useState([]);
  const [cargandoProveedores, setCargandoProveedores] = useState(false);

  const [compras, setCompras] = useState([]);
  const [cargandoCompras, setCargandoCompras] = useState(false);
  const [proveedorParaNuevaCompra, setProveedorParaNuevaCompra] = useState(null);

  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);

  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  const [ventas, setVentas] = useState([]);
  const [cargandoVentas, setCargandoVentas] = useState(false);

  // Carga inicial según permisos del rol activo
  useEffect(() => {
    if (canManageUsers) cargarUsuarios();
    if (canManageInventory || canViewInventory || canManagePurchases || canViewPurchases) cargarProductos();
    if (canViewReports) cargarVentas();
    if (canManageSuppliers || canViewSuppliers) cargarProveedores();
    if (canManagePurchases || canViewPurchases) cargarCompras();
  }, [activeRole]);

  // Sincronizar pestaña si el rol cambia
  useEffect(() => {
    if (isContador) setTabActiva('reportes');
  }, [activeRole, isContador]);

  // Consultas a los servicios (Datos Reales de la BD)
  const cargarProveedores = async () => {
    setCargandoProveedores(true);
    try {
      const data = await proveedoresService.obtenerProveedores();
      setProveedores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error al cargar proveedores:', err.message);
      setProveedores([]);
    } finally {
      setCargandoProveedores(false);
    }
  };

  const cargarCompras = async () => {
    setCargandoCompras(true);
    try {
      const data = await comprasService.obtenerCompras();
      setCompras(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error al cargar compras:', err.message);
      setCompras([]);
    } finally {
      setCargandoCompras(false);
    }
  };

  const cargarUsuarios = async () => {
    setCargandoUsuarios(true);
    try {
      const data = await usuariosService.obtenerUsuarios();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error al cargar usuarios de la BD:', err.message);
      setUsuarios([]);
    } finally {
      setCargandoUsuarios(false);
    }
  };

  const cargarProductos = async () => {
    setCargandoProductos(true);
    try {
      const data = await productosService.obtenerProductos();
      const lista = Array.isArray(data) ? data : [];
      setProductos(lista);
      return lista;
    } catch (err) {
      console.warn('Error al consultar productos de la BD:', err.message);
      setProductos([]);
      return [];
    } finally {
      setCargandoProductos(false);
    }
  };

  const cargarVentas = async () => {
    setCargandoVentas(true);
    try {
      const response = await facturacionService.obtenerVentas();
      let rawList = [];
      if (Array.isArray(response)) rawList = response;
      else if (response && Array.isArray(response.data)) rawList = response.data;
      else if (response && Array.isArray(response.ventas)) rawList = response.ventas;

      // Mapeo optimizado en memoria O(N): sin disparar peticiones HTTP N+1
      const ventasConMetodo = rawList.map((v) => {
        let metodo = v.metodo || v.medio_pago || v.pago?.metodo;
        if (!metodo && Array.isArray(v.pagos) && v.pagos.length > 0) {
          metodo = v.pagos[0].metodo;
        }
        if (!metodo) {
          metodo = 'EFECTIVO';
        }

        let docCliente = '222222222222';
        if (v.documento && typeof v.documento === 'string' && v.documento.trim()) {
          docCliente = v.documento.trim();
        } else if (typeof v.cliente === 'string' && v.cliente.trim() && !v.cliente.includes('[object Object]')) {
          docCliente = v.cliente.trim();
        } else if (v.cliente && typeof v.cliente === 'object') {
          docCliente = v.cliente.documento || v.cliente.cedula || v.cliente.nit || '222222222222';
        }
        if (docCliente === 'Consumidor Final') {
          docCliente = '222222222222';
        }

        let nomCajero = 'Cajero POS';
        if (typeof v.cajero === 'string' && v.cajero.trim()) {
          nomCajero = v.cajero.trim();
        } else if (v.cajero && typeof v.cajero === 'object') {
          nomCajero = v.cajero.nombre || v.cajero.name || v.cajero.email || 'Cajero POS';
        }

        return {
          id: v.id,
          fecha: v.fecha || new Date().toISOString(),
          cliente: docCliente,
          documento: docCliente,
          cajero: nomCajero,
          total: Number(v.total) || 0,
          metodo: metodo || 'EFECTIVO',
          items: (v.detalles || v.items || []).map((d) => ({
            id: d.id,
            nombre: d.producto?.nombre || d.producto || d.nombre || 'Producto',
            cantidad: Number(d.cantidad) || 1,
            precio: Number(d.producto?.precio || d.precio_unitario || d.precio || 0),
            total: Number(d.subtotal || d.total || 0),
          })),
        };
      });

      setVentas(ventasConMetodo);
    } catch (err) {
      console.warn('Error al cargar ventas de la BD:', err.message);
      setVentas([]);
    } finally {
      setCargandoVentas(false);
    }
  };

  const handleActualizarStockDesdeCompra = async (itemsComprados) => {
    await cargarProductos();
  };

  const handleAbrirCompraConProveedor = (proveedor) => {
    setProveedorParaNuevaCompra(proveedor);
    setTabActiva('compras');
  };

  // Cálculos para KPIs 100% reales
  const totalVentasBrutas = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const totalProductos = productos.length;
  const productosBajoStock = productos.filter((p) => (Number(p.stock) || 0) <= (Number(p.stock_minimo) || 5)).length;
  const valorTotalInventario = productos.reduce((acc, p) => acc + (Number(p.precio) || 0) * (Number(p.stock) || 0), 0);

  const rolesCounts = {
    admins: usuarios.filter((u) => normalizarRol(u.id_rol ?? u.rol?.id ?? u.rol) === ROLES.ADMIN).length,
    cajeros: usuarios.filter((u) => normalizarRol(u.id_rol ?? u.rol?.id ?? u.rol) === ROLES.CAJERO).length,
    supervisores: usuarios.filter((u) => normalizarRol(u.id_rol ?? u.rol?.id ?? u.rol) === ROLES.SUPERVISOR).length,
    contadores: usuarios.filter((u) => normalizarRol(u.id_rol ?? u.rol?.id ?? u.rol) === ROLES.CONTADOR).length,
  };

  const handleNavClick = (tabKey) => {
    setTabActiva(tabKey);
    setMobileSidebarOpen(false);
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: true,
      onClick: () => handleNavClick('inventario'),
      active: tabActiva === 'inventario' && filtroStockInventario === 'todos',
    },
    {
      id: 'inventario',
      label: 'Inventario & Productos',
      icon: Package,
      visible: canManageInventory || canViewInventory,
      onClick: () => handleNavClick('inventario'),
      active: tabActiva === 'inventario',
    },
    {
      id: 'compras',
      label: 'Entradas & Compras',
      icon: ShoppingCart,
      visible: canManagePurchases || canViewPurchases,
      onClick: () => handleNavClick('compras'),
      active: tabActiva === 'compras',
    },
    {
      id: 'proveedores',
      label: 'Proveedores',
      icon: Users,
      visible: canManageSuppliers || canViewSuppliers,
      onClick: () => handleNavClick('proveedores'),
      active: tabActiva === 'proveedores',
    },
    {
      id: 'reportes',
      label: 'Finanzas',
      icon: DollarSign,
      visible: canViewReports,
      onClick: () => handleNavClick('reportes'),
      active: tabActiva === 'reportes',
    },
    {
      id: 'usuarios',
      label: 'Usuarios & Roles',
      icon: Users,
      visible: canManageUsers,
      onClick: () => handleNavClick('usuarios'),
      active: tabActiva === 'usuarios',
    },
    {
      id: 'auditoria',
      label: 'Historial',
      icon: History,
      visible: isAdmin,
      onClick: () => handleNavClick('auditoria'),
      active: tabActiva === 'auditoria',
    },
  ];

  return (
    <div className={`admin-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
      {/* Telón de fondo móvil */}
      {mobileSidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Menú Desplegable Lateral Izquierdo */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <span className="admin-brand-dot" />
            <span className="admin-brand-title">Tienda Comunitaria</span>
          </div>
          <button
            type="button"
            className="admin-sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expandir menú' : 'Plegar menú'}
            aria-label="Plegar o desplegar menú"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {menuItems
            .filter((item) => item.visible)
            .map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className={`admin-sidebar-item ${item.active ? 'active' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="admin-sidebar-icon">
                    <IconComp size={18} />
                  </span>
                  <span className="admin-sidebar-label">{item.label}</span>
                </button>
              );
            })}
        </nav>
      </aside>

      {/* Contenedor Principal (Barra Superior + Métricas + Módulo Activo) */}
      <div className="admin-main-wrapper">
        {/* Barra Superior */}
        <header className="admin-top-bar">
          <div className="admin-top-bar-left">
            <button
              type="button"
              className="admin-sidebar-toggle-btn admin-mobile-menu-trigger"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              title="Abrir menú"
              aria-label="Abrir menú lateral"
            >
              <Menu size={20} />
            </button>

            <span className="admin-pos-badge">POS CLOUD</span>

            <div className="admin-global-search-box">
              <Search size={16} className="admin-global-search-icon" />
              <input
                type="text"
                placeholder="Búsqueda global..."
                value={busquedaGlobal}
                onChange={(e) => setBusquedaGlobal(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-top-bar-right">
            <div className="admin-utilities-strip">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('tc_lock_screen'))}
                className="admin-btn-lock"
                title="Bloquear pantalla ahora (Seguridad de Caja)"
                aria-label="Bloquear pantalla"
              >
                <Lock size={15} />
              </button>

              <FontSizeToggle />
              <ThemeToggle />

              {(activeRole === ROLES.ADMIN || activeRole === ROLES.SUPERVISOR) && (
                <NotificationBell />
              )}
            </div>

            <div className="admin-user-pill">
              <UserIcon size={14} style={{ color: 'var(--text-muted)' }} />
              <span>{user?.nombre || user?.email?.split('@')[0] || 'David'}</span>
            </div>

            <button
              type="button"
              onClick={onLogout || logout}
              className="admin-btn-logout"
            >
              Salir
            </button>
          </div>
        </header>

        {/* Cuerpo del Dashboard con Métricas y Módulo Activo */}
        <main className="admin-body-content">
          {/* Tarjetas de Métricas Globales (KPIs) */}
          <DashboardKpis
            tabActiva={tabActiva}
            setTabActiva={setTabActiva}
            filtroStock={filtroStockInventario}
            onSeleccionarFiltroStock={(filtro) => {
              setFiltroStockInventario(filtro);
              setTabActiva('inventario');
            }}
            canViewReports={canViewReports}
            canManageInventory={canManageInventory}
            canViewInventory={canViewInventory}
            canManageSuppliers={canManageSuppliers}
            canViewSuppliers={canViewSuppliers}
            canManageUsers={canManageUsers}
            totalVentasBrutas={totalVentasBrutas}
            ventasCount={ventas.length}
            totalProductos={totalProductos}
            cargandoProductos={cargandoProductos}
            valorTotalInventario={valorTotalInventario}
            productosBajoStock={productosBajoStock}
            proveedoresCount={proveedores.length}
            proveedoresActivosCount={proveedores.length}
            cargandoProveedores={cargandoProveedores}
            usuariosCount={usuarios.length}
            cargandoUsuarios={cargandoUsuarios}
            rolesCounts={rolesCounts}
          />

          {/* SIN DOBLE BOTÓN: La navegación se realiza únicamente desde el menú lateral izquierdo */}

          {/* Contenido Modular según Menú Activo */}
          {tabActiva === 'inventario' && (canManageInventory || canViewInventory) && (
            <InventarioTab
              productos={productos}
              cargando={cargandoProductos}
              onRecargar={cargarProductos}
              onAbrirPos={onAbrirPos}
              isAdmin={isAdmin}
              isSupervisor={isSupervisor}
              filtroStock={filtroStockInventario}
              setFiltroStock={setFiltroStockInventario}
              busquedaGlobal={busquedaGlobal}
            />
          )}

          {tabActiva === 'compras' && (canManagePurchases || canViewPurchases) && (
            <ComprasTab
              compras={compras}
              proveedores={proveedores}
              productos={productos}
              cargando={cargandoCompras}
              onRecargar={cargarCompras}
              onRecargarProductos={cargarProductos}
              onActualizarStock={handleActualizarStockDesdeCompra}
              canManage={canManagePurchases}
              proveedorInicial={proveedorParaNuevaCompra}
            />
          )}

          {tabActiva === 'proveedores' && (canManageSuppliers || canViewSuppliers) && (
            <ProveedoresTab
              proveedores={proveedores}
              cargando={cargandoProveedores}
              onRecargar={cargarProveedores}
              onAbrirNuevaCompraConProveedor={handleAbrirCompraConProveedor}
              canManage={canManageSuppliers}
            />
          )}

          {tabActiva === 'reportes' && canViewReports && (
            <ReportesTab
              ventas={ventas}
              cargando={cargandoVentas}
              onRecargar={cargarVentas}
            />
          )}

          {tabActiva === 'usuarios' && canManageUsers && (
            <UsuariosTab
              usuarios={usuarios}
              cargando={cargandoUsuarios}
              onRecargar={cargarUsuarios}
            />
          )}

          {tabActiva === 'auditoria' && isAdmin && (
            <AuditoriaTab />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardView;
