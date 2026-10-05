import React, { useState, useEffect } from 'react';
import { usuariosService, USUARIOS_DEFAULT } from '../../services/usuariosService';
import { productosService } from '../../services/productosService';
import { facturacionService } from '../../services/facturacionService';
import proveedoresService, { PROVEEDORES_DEFAULT } from '../../services/proveedoresService';
import comprasService, { COMPRAS_DEFAULT } from '../../services/comprasService';
import { normalizarRol, ROLES } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';

import DashboardKpis from './admin/DashboardKpis';
import InventarioTab from './admin/InventarioTab';
import ComprasTab from './admin/ComprasTab';
import ProveedoresTab from './admin/ProveedoresTab';
import ReportesTab from './admin/ReportesTab';
import UsuariosTab from './admin/UsuariosTab';

const PRODUCTOS_DEFAULT = [
  { id: 1, nombre: 'Leche Entera 1L', categoria: 'Lácteos', precio: 4200, stock: 24, stock_minimo: 10, codigo_barras: '7701001' },
  { id: 2, nombre: 'Arroz Diana 1kg', categoria: 'Granos', precio: 4800, stock: 40, stock_minimo: 15, codigo_barras: '7701002' },
  { id: 3, nombre: 'Huevos AA x Unidad', categoria: 'Huevos', precio: 600, stock: 120, stock_minimo: 30, codigo_barras: '7701003' },
  { id: 4, nombre: 'Aceite Vegetal 900ml', categoria: 'Abarrotes', precio: 9500, stock: 8, stock_minimo: 10, codigo_barras: '7701004' },
  { id: 5, nombre: 'Pan Tajado Bimbo', categoria: 'Panadería', precio: 6500, stock: 5, stock_minimo: 8, codigo_barras: '7701005' },
  { id: 6, nombre: 'Café Sello Rojo 250g', categoria: 'Bebidas', precio: 7800, stock: 30, stock_minimo: 10, codigo_barras: '7701006' },
  { id: 7, nombre: 'Azúcar Morena 1kg', categoria: 'Abarrotes', precio: 4300, stock: 25, stock_minimo: 10, codigo_barras: '7701007' },
  { id: 8, nombre: 'Jabón Rey x Unidad', categoria: 'Aseo', precio: 2500, stock: 50, stock_minimo: 15, codigo_barras: '7701008' },
  { id: 9, nombre: 'Gaseosa Coca-Cola 1.5L', categoria: 'Bebidas', precio: 5500, stock: 3, stock_minimo: 10, codigo_barras: '7701009' },
  { id: 10, nombre: 'Lentejas 500g', categoria: 'Granos', precio: 3800, stock: 35, stock_minimo: 12, codigo_barras: '7701010' },
];

const VENTAS_DEFAULT = [
  { id: '1001', fecha: '2026-09-13T10:30:00', cliente: 'Carlos Ramírez', documento: '1098765432', cajero: 'Cajero POS', total: 45000, metodo: 'Efectivo', items: [{ nombre: 'Leche Entera 1L', cantidad: 3, precio: 4200, total: 12600 }, { nombre: 'Arroz Diana 1kg', cantidad: 4, precio: 4800, total: 19200 }, { nombre: 'Aceite Vegetal 900ml', cantidad: 1, precio: 9500, total: 9500 }] },
  { id: '1002', fecha: '2026-09-13T11:15:00', cliente: 'Consumidor Final', documento: '222222222', cajero: 'Cajero POS', total: 28600, metodo: 'Nequi', items: [{ nombre: 'Pan Tajado Bimbo', cantidad: 2, precio: 6500, total: 13000 }, { nombre: 'Café Sello Rojo 250g', cantidad: 2, precio: 7800, total: 15600 }] },
  { id: '1003', fecha: '2026-09-13T12:05:00', cliente: 'María Rodríguez', documento: '52345678', cajero: 'Cajero POS', total: 64200, metodo: 'Tarjeta', items: [{ nombre: 'Huevos AA x Unidad', cantidad: 30, precio: 600, total: 18000 }, { nombre: 'Aceite Vegetal 900ml', cantidad: 2, precio: 9500, total: 19000 }, { nombre: 'Azúcar Morena 1kg', cantidad: 3, precio: 4300, total: 12900 }, { nombre: 'Gaseosa Coca-Cola 1.5L', cantidad: 2, precio: 5500, total: 11000 }] },
  { id: '1004', fecha: '2026-09-13T13:40:00', cliente: 'Juan Arteaga', documento: '1004567890', cajero: 'Cajero POS', total: 19800, metodo: 'Efectivo', items: [{ nombre: 'Lentejas 500g', cantidad: 2, precio: 3800, total: 7600 }, { nombre: 'Jabón Rey x Unidad', cantidad: 3, precio: 2500, total: 7500 }, { nombre: 'Leche Entera 1L', cantidad: 1, precio: 4200, total: 4200 }] },
];

export const AdminDashboardView = ({ user, onOpenFactura, onAbrirPos }) => {
  const {
    activeRole,
    canManageUsers,
    canManageInventory,
    canViewReports,
    canManageSuppliers,
    canManagePurchases,
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

  // Estados de datos
  const [proveedores, setProveedores] = useState(PROVEEDORES_DEFAULT);
  const [cargandoProveedores, setCargandoProveedores] = useState(false);

  const [compras, setCompras] = useState(COMPRAS_DEFAULT);
  const [cargandoCompras, setCargandoCompras] = useState(false);
  const [proveedorParaNuevaCompra, setProveedorParaNuevaCompra] = useState(null);

  const [usuarios, setUsuarios] = useState(USUARIOS_DEFAULT);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);

  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  const [ventas, setVentas] = useState(VENTAS_DEFAULT);
  const [cargandoVentas, setCargandoVentas] = useState(false);

  // Carga inicial según permisos del rol activo
  useEffect(() => {
    if (canManageUsers) cargarUsuarios();
    if (canManageInventory) cargarProductos();
    if (canViewReports) cargarVentas();
    if (canManageSuppliers) cargarProveedores();
    if (canManagePurchases) cargarCompras();
  }, [activeRole]);

  // Sincronizar pestaña si el rol cambia
  useEffect(() => {
    if (isContador) setTabActiva('reportes');
  }, [activeRole, isContador]);

  // Consultas a los servicios
  const cargarProveedores = async () => {
    setCargandoProveedores(true);
    try {
      const data = await proveedoresService.obtenerProveedores();
      if (Array.isArray(data)) setProveedores(data);
    } catch (err) {
      console.warn('Error al cargar proveedores:', err.message);
    } finally {
      setCargandoProveedores(false);
    }
  };

  const cargarCompras = async () => {
    setCargandoCompras(true);
    try {
      const data = await comprasService.obtenerCompras();
      if (Array.isArray(data) && data.length > 0) setCompras(data);
    } catch (err) {
      console.warn('Error al cargar compras:', err.message);
    } finally {
      setCargandoCompras(false);
    }
  };

  const cargarUsuarios = async () => {
    setCargandoUsuarios(true);
    try {
      const data = await usuariosService.obtenerUsuarios();
      if (Array.isArray(data) && data.length > 0) {
        setUsuarios(data);
      } else {
        setUsuarios(USUARIOS_DEFAULT);
      }
    } catch (err) {
      console.warn('Error al cargar usuarios de la BD:', err.message);
      setUsuarios(USUARIOS_DEFAULT);
    } finally {
      setCargandoUsuarios(false);
    }
  };

  const cargarProductos = async () => {
    setCargandoProductos(true);
    try {
      const data = await productosService.obtenerProductos();
      if (Array.isArray(data) && data.length > 0) {
        setProductos(data);
      } else {
        setProductos(PRODUCTOS_DEFAULT);
      }
    } catch (err) {
      console.warn('Usando catálogo por fallback:', err.message);
      setProductos(PRODUCTOS_DEFAULT);
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

      if (rawList.length > 0) {
        setVentas(
          rawList.map((v) => ({
            id: v.id,
            fecha: v.fecha || new Date().toISOString(),
            cliente: v.cliente || 'Consumidor Final',
            documento: v.documento || '222222222',
            cajero: v.cajero?.nombre || v.cajero || 'Cajero POS',
            total: Number(v.total) || 0,
            metodo: v.metodo || 'Efectivo',
            items: v.detalles || v.items || [],
          }))
        );
      }
    } catch (err) {
      console.warn('Error al cargar ventas de la BD:', err.message);
    } finally {
      setCargandoVentas(false);
    }
  };

  const handleActualizarStockDesdeCompra = async (itemsComprados) => {
    setProductos((prevProductos) =>
      prevProductos.map((prod) => {
        const itemComprado = itemsComprados.find((it) => it.id_producto === prod.id);
        if (itemComprado) {
          const nuevoStock = (Number(prod.stock) || 0) + Number(itemComprado.cantidad || 0);
          return { ...prod, stock: nuevoStock, cantidad: nuevoStock };
        }
        return prod;
      })
    );
    await cargarProductos();
  };

  const handleAbrirCompraConProveedor = (proveedor) => {
    setProveedorParaNuevaCompra(proveedor);
    setTabActiva('compras');
  };

  // Cálculos para KPIs
  const totalVentasBrutas = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const totalProductos = productos.length;
  const productosBajoStock = productos.filter((p) => (Number(p.stock) || 0) <= (Number(p.stock_minimo) || 5)).length;
  const valorTotalInventario = productos.reduce((acc, p) => acc + (Number(p.precio) || 0) * (Number(p.stock) || 0), 0);

  const rolesCounts = {
    admins: usuarios.filter((u) => normalizarRol(u.id_rol ?? u.rol ?? u.role) === ROLES.ADMIN).length,
    contadores: usuarios.filter((u) => normalizarRol(u.id_rol ?? u.rol ?? u.role) === ROLES.CONTADOR).length,
    supervisores: usuarios.filter((u) => normalizarRol(u.id_rol ?? u.rol ?? u.role) === ROLES.SUPERVISOR).length,
    cajeros: usuarios.filter((u) => normalizarRol(u.id_rol ?? u.rol ?? u.role) === ROLES.CAJERO).length,
  };

  return (
    <div
      style={{
        maxWidth: '100%',
        width: '100%',
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
      }}
    >
      {/* Tarjetas de Métricas Globales */}
      <DashboardKpis
        tabActiva={tabActiva}
        setTabActiva={setTabActiva}
        onSeleccionarFiltroStock={(filtro) => {
          setFiltroStockInventario(filtro);
          setTabActiva('inventario');
        }}
        canViewReports={canViewReports}
        canManageInventory={canManageInventory}
        canManageSuppliers={canManageSuppliers}
        canManageUsers={canManageUsers}
        totalVentasBrutas={totalVentasBrutas}
        ventasCount={ventas.length}
        totalProductos={totalProductos}
        cargandoProductos={cargandoProductos}
        valorTotalInventario={valorTotalInventario}
        productosBajoStock={productosBajoStock}
        proveedoresCount={proveedores.length}
        proveedoresActivosCount={proveedores.filter((p) => p.activo !== false).length}
        cargandoProveedores={cargandoProveedores}
        usuariosCount={usuarios.length}
        cargandoUsuarios={cargandoUsuarios}
        rolesCounts={rolesCounts}
      />

      {/* Selector de Pestañas */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          paddingBottom: '0.25rem',
          flexWrap: 'wrap',
        }}
      >
        {canManageInventory && (
          <button
            type="button"
            onClick={() => setTabActiva('inventario')}
            style={{
              background: tabActiva === 'inventario' ? '#8b5cf6' : '#151c2c',
              color: tabActiva === 'inventario' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              boxShadow: tabActiva === 'inventario' ? '0 4px 14px rgba(139, 92, 246, 0.4)' : 'none',
            }}
          >
            Inventario & Productos
          </button>
        )}

        {canManagePurchases && (
          <button
            type="button"
            onClick={() => setTabActiva('compras')}
            style={{
              background: tabActiva === 'compras' ? '#22c55e' : '#151c2c',
              color: tabActiva === 'compras' ? '#0b0f19' : '#94a3b8',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              boxShadow: tabActiva === 'compras' ? '0 4px 14px rgba(34, 197, 94, 0.4)' : 'none',
            }}
          >
            Entradas & Compras
          </button>
        )}

        {canManageSuppliers && (
          <button
            type="button"
            onClick={() => setTabActiva('proveedores')}
            style={{
              background: tabActiva === 'proveedores' ? '#38bdf8' : '#151c2c',
              color: tabActiva === 'proveedores' ? '#0b0f19' : '#94a3b8',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              boxShadow: tabActiva === 'proveedores' ? '0 4px 14px rgba(56, 189, 248, 0.4)' : 'none',
            }}
          >
            Proveedores
          </button>
        )}

        {canViewReports && (
          <button
            type="button"
            onClick={() => setTabActiva('reportes')}
            style={{
              background: tabActiva === 'reportes' ? '#8b5cf6' : '#151c2c',
              color: tabActiva === 'reportes' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              boxShadow: tabActiva === 'reportes' ? '0 4px 14px rgba(139, 92, 246, 0.4)' : 'none',
            }}
          >
            Reportes Financieros & Balance
          </button>
        )}

        {canManageUsers && (
          <button
            type="button"
            onClick={() => setTabActiva('usuarios')}
            style={{
              background: tabActiva === 'usuarios' ? '#8b5cf6' : '#151c2c',
              color: tabActiva === 'usuarios' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              boxShadow: tabActiva === 'usuarios' ? '0 4px 14px rgba(139, 92, 246, 0.4)' : 'none',
            }}
          >
            Usuarios y Roles
          </button>
        )}
      </div>

      {/* Contenido Modular según Pestaña Activa */}
      {tabActiva === 'inventario' && canManageInventory && (
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

      {tabActiva === 'compras' && canManagePurchases && (
        <ComprasTab
          compras={compras}
          proveedores={proveedores}
          productos={productos}
          cargando={cargandoCompras}
          onRecargar={cargarCompras}
          onActualizarStock={handleActualizarStockDesdeCompra}
          canManage={canManagePurchases}
          proveedorInicial={proveedorParaNuevaCompra}
        />
      )}

      {tabActiva === 'proveedores' && canManageSuppliers && (
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
    </div>
  );
};

export default AdminDashboardView;
