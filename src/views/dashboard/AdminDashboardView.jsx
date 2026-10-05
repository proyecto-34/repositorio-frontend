import React, { useState, useEffect } from 'react';
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

export const AdminDashboardView = ({ user, onOpenFactura, onAbrirPos }) => {
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
  } = useAuth();

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

      // Obtener el método de pago real desde la tabla de pagos para cada venta
      const ventasConMetodo = await Promise.all(
        rawList.map(async (v) => {
          let metodo = v.metodo;
          if (!metodo) {
            try {
              const pagos = await pagosService.obtenerPagosPorVenta(v.id);
              if (Array.isArray(pagos) && pagos.length > 0) {
                metodo = pagos[0].metodo;
              }
            } catch {
              metodo = 'EFECTIVO';
            }
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
        })
      );

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

  return (
    <div className="admin-dashboard-container">
      {/* Tarjetas de Métricas Globales */}
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

      {/* Selector de Pestañas */}
      <div className="admin-tabs-bar">
        {(canManageInventory || canViewInventory) && (
          <button
            type="button"
            onClick={() => setTabActiva('inventario')}
            className={`admin-tab-btn ${tabActiva === 'inventario' ? 'active purple' : ''}`}
          >
            Inventario & Productos
          </button>
        )}

        {(canManagePurchases || canViewPurchases) && (
          <button
            type="button"
            onClick={() => setTabActiva('compras')}
            className={`admin-tab-btn ${tabActiva === 'compras' ? 'active green' : ''}`}
          >
            Entradas & Compras
          </button>
        )}

        {(canManageSuppliers || canViewSuppliers) && (
          <button
            type="button"
            onClick={() => setTabActiva('proveedores')}
            className={`admin-tab-btn ${tabActiva === 'proveedores' ? 'active blue' : ''}`}
          >
            Proveedores
          </button>
        )}

        {canViewReports && (
          <button
            type="button"
            onClick={() => setTabActiva('reportes')}
            className={`admin-tab-btn ${tabActiva === 'reportes' ? 'active purple' : ''}`}
          >
            Reportes Financieros & Balance
          </button>
        )}

        {canManageUsers && (
          <button
            type="button"
            onClick={() => setTabActiva('usuarios')}
            className={`admin-tab-btn ${tabActiva === 'usuarios' ? 'active purple' : ''}`}
          >
            Usuarios y Roles
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => setTabActiva('auditoria')}
            className={`admin-tab-btn ${tabActiva === 'auditoria' ? 'active blue' : ''}`}
          >
            Auditoría del Sistema
          </button>
        )}
      </div>

      {/* Contenido Modular según Pestaña Activa */}
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
    </div>
  );
};

export default AdminDashboardView;
