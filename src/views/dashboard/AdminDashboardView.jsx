import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { usuariosService, USUARIOS_DEFAULT } from '../../services/usuariosService';
import { productosService } from '../../services/productosService';
import { facturacionService } from '../../services/facturacionService';
import proveedoresService, { PROVEEDORES_DEFAULT } from '../../services/proveedoresService';
import comprasService, { COMPRAS_DEFAULT } from '../../services/comprasService';
import ProveedoresTab from './admin/ProveedoresTab';
import ComprasTab from './admin/ComprasTab';
import { normalizarRol, ROLES, ROLES_DB, ROLE_BADGES, obtenerInfoRol } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import WeatherWidget from '../../components/WeatherWidget';

// Catálogo por defecto sin emojis
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

// Ventas contables iniciales
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
    isInventario, 
    isSupervisor 
  } = useAuth();

  // Pestaña inicial según rol
  const [tabActiva, setTabActiva] = useState(() => {
    if (isContador) return 'reportes';
    if (isInventario) return 'inventario';
    return 'inventario';
  });

  // --- ESTADO DE PROVEEDORES ---
  const [proveedores, setProveedores] = useState(PROVEEDORES_DEFAULT);
  const [cargandoProveedores, setCargandoProveedores] = useState(false);

  // --- ESTADO DE COMPRAS / ENTRADAS ---
  const [compras, setCompras] = useState(COMPRAS_DEFAULT);
  const [cargandoCompras, setCargandoCompras] = useState(false);
  const [proveedorParaNuevaCompra, setProveedorParaNuevaCompra] = useState(null);

  // --- ESTADO DE USUARIOS ---
  const [usuarios, setUsuarios] = useState(USUARIOS_DEFAULT);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
  const [modalNuevoUsuario, setModalNuevoUsuario] = useState(false);
  const [modalEditarUsuario, setModalEditarUsuario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  const [guardandoEdicionUsuario, setGuardandoEdicionUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    correo: '',
    contraseña: '',
    id_rol: 5,
    id_estado: 1,
  });
  const [formEditarUsuario, setFormEditarUsuario] = useState({
    nombre: '',
    correo: '',
    contraseña: '',
    id_rol: 5,
    id_estado: 1,
  });

  // --- ESTADO DE PRODUCTOS / INVENTARIO ---
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [busquedaProductos, setBusquedaProductos] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroStock, setFiltroStock] = useState('todos');
  const [modalNuevoProducto, setModalNuevoProducto] = useState(false);
  const [modalEditarProducto, setModalEditarProducto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [guardandoProducto, setGuardandoProducto] = useState(false);

  const [formularioProducto, setFormularioProducto] = useState({
    nombre: '',
    categoria: 'Abarrotes',
    precio: '',
    stock: '',
    stock_minimo: '5',
    codigo_barras: '',
  });

  // --- ESTADO DE REPORTES Y FACTURAS ---
  const [ventas, setVentas] = useState(VENTAS_DEFAULT);
  const [cargandoVentas, setCargandoVentas] = useState(false);
  const [busquedaFactura, setBusquedaFactura] = useState('');

  // Carga inicial
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
    else if (isInventario) setTabActiva('inventario');
  }, [activeRole, isContador, isInventario]);

  // --- MÉTODOS DE PROVEEDORES ---
  const cargarProveedores = async () => {
    setCargandoProveedores(true);
    try {
      const data = await proveedoresService.obtenerProveedores();
      if (Array.isArray(data) && data.length > 0) {
        setProveedores(data);
      }
    } catch (err) {
      console.warn('Error al cargar proveedores, usando lista local:', err.message);
    } finally {
      setCargandoProveedores(false);
    }
  };

  // --- MÉTODOS DE COMPRAS ---
  const cargarCompras = async () => {
    setCargandoCompras(true);
    try {
      const data = await comprasService.obtenerCompras();
      if (Array.isArray(data) && data.length > 0) {
        setCompras(data);
      }
    } catch (err) {
      console.warn('Error al cargar compras, usando lista local:', err.message);
    } finally {
      setCargandoCompras(false);
    }
  };

  const handleActualizarStockDesdeCompra = (itemsComprados) => {
    // Sincronizar el catálogo local para reflejar de inmediato el incremento de stock
    setProductos((prevProductos) =>
      prevProductos.map((prod) => {
        const itemComprado = itemsComprados.find((it) => it.id_producto === prod.id);
        if (itemComprado) {
          const nuevoStock = (Number(prod.stock) || 0) + Number(itemComprado.cantidad || 0);
          return { ...prod, stock: nuevoStock };
        }
        return prod;
      })
    );
  };

  const handleAbrirCompraConProveedor = (proveedor) => {
    setProveedorParaNuevaCompra(proveedor);
    setTabActiva('compras');
  };

  // --- MÉTODOS DE USUARIOS ---
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
      console.warn('Error al cargar usuarios de la BD, usando respaldo:', err.message);
      setUsuarios(USUARIOS_DEFAULT);
    } finally {
      setCargandoUsuarios(false);
    }
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    if (!nuevoUsuario.nombre || !nuevoUsuario.correo || !nuevoUsuario.contraseña) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    setCreandoUsuario(true);
    try {
      const creado = await usuariosService.crearUsuario(nuevoUsuario);
      toast.success(`Usuario "${nuevoUsuario.nombre}" registrado exitosamente en la BD`);

      const nuevoObj = creado?.data || creado || {
        id: usuarios.length > 0 ? Math.max(...usuarios.map((u) => Number(u.id) || 0)) + 1 : 1,
        ...nuevoUsuario,
      };
      setUsuarios([...usuarios, nuevoObj]);
      setModalNuevoUsuario(false);
      setNuevoUsuario({ nombre: '', correo: '', contraseña: '', id_rol: 5, id_estado: 1 });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al guardar el usuario en la BD';
      toast.error(`Error al crear usuario en BD: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
    } finally {
      setCreandoUsuario(false);
    }
  };

  const handleAbrirEditarUsuario = (u) => {
    setUsuarioEditando(u);
    setFormEditarUsuario({
      nombre: u.nombre || '',
      correo: u.correo || u.email || '',
      contraseña: '',
      id_rol: Number(u.id_rol ?? u.rol?.id ?? 5),
      id_estado: Number(u.id_estado ?? u.estado?.id ?? 1),
    });
    setModalEditarUsuario(true);
  };

  const handleGuardarEdicionUsuario = async (e) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    setGuardandoEdicionUsuario(true);
    try {
      await usuariosService.actualizarUsuario(usuarioEditando.id, formEditarUsuario);
      toast.success(`Usuario "${formEditarUsuario.nombre}" actualizado correctamente en la BD`);

      // Recargar la lista fresca directamente desde la BD
      await cargarUsuarios();
      setModalEditarUsuario(false);
      setUsuarioEditando(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al actualizar el usuario en la BD';
      toast.error(`No se pudo actualizar en BD: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
    } finally {
      setGuardandoEdicionUsuario(false);
    }
  };

  const handleEliminarUsuario = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar o desactivar al usuario "${nombre}"?`)) return;
    try {
      try {
        await usuariosService.eliminarUsuario(id);
      } catch (err) {}
      setUsuarios(usuarios.filter((u) => u.id !== id));
      toast.success(`Usuario "${nombre}" eliminado`);
    } catch (err) {
      toast.error('Error al eliminar usuario');
    }
  };

  // --- MÉTODOS DE PRODUCTOS ---
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
      console.warn('Usando catálogo inicial por fallback:', err.message);
      setProductos(PRODUCTOS_DEFAULT);
    } finally {
      setCargandoProductos(false);
    }
  };

  const handleAbrirCrearProducto = () => {
    setFormularioProducto({
      nombre: '',
      categoria: 'Abarrotes',
      precio: '',
      stock: '',
      stock_minimo: '5',
      codigo_barras: `770${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setModalNuevoProducto(true);
  };

  const handleGuardarNuevoProducto = async (e) => {
    e.preventDefault();
    if (!formularioProducto.nombre || !formularioProducto.precio || formularioProducto.stock === '') {
      toast.error('Por favor completa los campos requeridos del producto');
      return;
    }

    setGuardandoProducto(true);
    try {
      try {
        await productosService.crearProducto(formularioProducto);
        toast.success(`Producto "${formularioProducto.nombre}" guardado en la base de datos`);
      } catch (apiErr) {
        toast.info(`Producto "${formularioProducto.nombre}" agregado localmente`);
      }

      const nuevoProd = {
        id: productos.length > 0 ? Math.max(...productos.map(p => Number(p.id) || 0)) + 1 : 1,
        ...formularioProducto,
        precio: Number(formularioProducto.precio),
        stock: Number(formularioProducto.stock),
        stock_minimo: Number(formularioProducto.stock_minimo) || 5,
      };
      setProductos([nuevoProd, ...productos]);
      setModalNuevoProducto(false);
    } catch (err) {
      toast.error('Error al guardar el producto');
    } finally {
      setGuardandoProducto(false);
    }
  };

  const handleAbrirEditarProducto = (prod) => {
    setProductoSeleccionado(prod);
    setFormularioProducto({
      nombre: prod.nombre || '',
      categoria: prod.categoria || prod.categoria_nombre || 'General',
      precio: prod.precio || prod.precio_venta || '',
      stock: prod.stock !== undefined ? prod.stock : '',
      stock_minimo: prod.stock_minimo || '5',
      codigo_barras: prod.codigo_barras || prod.codigo || '',
    });
    setModalEditarProducto(true);
  };

  const handleGuardarEdicionProducto = async (e) => {
    e.preventDefault();
    if (!productoSeleccionado) return;

    setGuardandoProducto(true);
    try {
      try {
        await productosService.actualizarProducto(productoSeleccionado.id, formularioProducto);
        toast.success(`Producto "${formularioProducto.nombre}" actualizado en la BD`);
      } catch (apiErr) {
        toast.info(`Producto "${formularioProducto.nombre}" actualizado`);
      }

      setProductos(productos.map(p => 
        p.id === productoSeleccionado.id
          ? {
              ...p,
              ...formularioProducto,
              precio: Number(formularioProducto.precio),
              stock: Number(formularioProducto.stock),
              stock_minimo: Number(formularioProducto.stock_minimo) || 5,
            }
          : p
      ));
      setModalEditarProducto(false);
      setProductoSeleccionado(null);
    } catch (err) {
      toast.error('Error al actualizar el producto');
    } finally {
      setGuardandoProducto(false);
    }
  };

  const handleAjusteRapidoStock = async (prod, delta) => {
    const nuevoStock = Math.max(0, (Number(prod.stock) || 0) + delta);
    try {
      try {
        await productosService.actualizarProducto(prod.id, { stock: nuevoStock });
      } catch (err) {}
      setProductos(productos.map(p => p.id === prod.id ? { ...p, stock: nuevoStock } : p));
      toast.success(`Stock de ${prod.nombre}: ${nuevoStock} unidades`);
    } catch (err) {
      toast.error('No se pudo ajustar el stock');
    }
  };

  const handleEliminarProducto = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${nombre}" del catálogo?`)) return;
    try {
      try {
        await productosService.eliminarProducto(id);
      } catch (err) {}
      setProductos(productos.filter(p => p.id !== id));
      toast.success(`Producto "${nombre}" eliminado`);
    } catch (err) {
      toast.error('Error al eliminar producto');
    }
  };

  // --- MÉTODOS DE FACTURACIÓN Y REPORTES ---
  const cargarVentas = async () => {
    setCargandoVentas(true);
    try {
      const data = await facturacionService.obtenerVentas();
      if (Array.isArray(data) && data.length > 0) {
        setVentas(data);
      }
    } catch (err) {
      // Mantiene ventas iniciales
    } finally {
      setCargandoVentas(false);
    }
  };

  const handleDescargarFacturaPDF = (v) => {
    try {
      facturacionService.generarTicketPDF({
        numeroFactura: `FAC-${v.id}`,
        cajero: v.cajero || 'Cajero de Turno',
        cliente: { nombre: v.cliente || 'Consumidor Final', documento: v.documento || '222222222' },
        productos: v.items || [],
        total: v.total,
        metodoPago: v.metodo || 'Efectivo',
      });
      toast.success(`Factura #${v.id} descargada en PDF`);
    } catch (err) {
      toast.error('Error al generar PDF de la factura');
    }
  };

  // --- FILTRADOS ---
  const usuariosFiltrados = usuarios.filter((u) => {
    const q = busquedaUsuarios.toLowerCase();
    return (
      (u.nombre && u.nombre.toLowerCase().includes(q)) ||
      (u.correo && u.correo.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  const categoriasUnicas = ['Todas', ...new Set(productos.map(p => p.categoria || p.categoria_nombre || 'General'))];

  const productosFiltrados = productos.filter((p) => {
    const q = busquedaProductos.toLowerCase();
    const coincideTexto = (
      (p.nombre && p.nombre.toLowerCase().includes(q)) ||
      (p.codigo_barras && p.codigo_barras.toLowerCase().includes(q)) ||
      (p.codigo && p.codigo.toLowerCase().includes(q))
    );

    const cat = p.categoria || p.categoria_nombre || 'General';
    const coincideCat = filtroCategoria === 'Todas' || cat === filtroCategoria;

    const stockNum = Number(p.stock) || 0;
    const stockMin = Number(p.stock_minimo) || 5;

    let coincideStock = true;
    if (filtroStock === 'bajo') {
      coincideStock = stockNum <= stockMin && stockNum > 0;
    } else if (filtroStock === 'agotado') {
      coincideStock = stockNum === 0;
    }

    return coincideTexto && coincideCat && coincideStock;
  });

  const ventasFiltradas = ventas.filter((v) => {
    const q = busquedaFactura.toLowerCase();
    return (
      String(v.id).toLowerCase().includes(q) ||
      (v.cliente && v.cliente.toLowerCase().includes(q)) ||
      (v.metodo && v.metodo.toLowerCase().includes(q))
    );
  });

  // Métricas financieras calculadas
  const totalVentasBrutas = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const totalIvaRecaudado = Math.round(totalVentasBrutas * 0.19);
  const totalVentasNetas = totalVentasBrutas - totalIvaRecaudado;
  const ventasEfectivo = ventas.filter(v => v.metodo === 'Efectivo').reduce((acc, v) => acc + Number(v.total || 0), 0);
  const ventasNequi = ventas.filter(v => v.metodo === 'Nequi').reduce((acc, v) => acc + Number(v.total || 0), 0);
  const ventasTarjeta = ventas.filter(v => v.metodo === 'Tarjeta').reduce((acc, v) => acc + Number(v.total || 0), 0);

  // Métricas inventario y usuarios
  const totalProductos = productos.length;
  const productosBajoStock = productos.filter(p => (Number(p.stock) || 0) <= (Number(p.stock_minimo) || 5)).length;
  const valorTotalInventario = productos.reduce((acc, p) => acc + ((Number(p.precio) || 0) * (Number(p.stock) || 0)), 0);

  const totalAdmins = usuarios.filter((u) => normalizarRol(u.id_rol ?? u.rol ?? u.role) === ROLES.ADMIN).length;
  const totalContadores = usuarios.filter((u) => normalizarRol(u.id_rol ?? u.rol ?? u.role) === ROLES.CONTADOR).length;
  const totalInventarios = usuarios.filter((u) => normalizarRol(u.id_rol ?? u.rol ?? u.role) === ROLES.INVENTARIO).length;
  const totalSupervisores = usuarios.filter((u) => normalizarRol(u.id_rol ?? u.rol ?? u.role) === ROLES.SUPERVISOR).length;
  const totalCajeros = usuarios.filter((u) => normalizarRol(u.id_rol ?? u.rol ?? u.role) === ROLES.CAJERO).length;

  return (
    <div style={{
      maxWidth: '100%',
      width: '100%',
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '1.75rem'
    }}>
      {/* Tarjetas de Métricas Globales - Estilo Deep Indigo sin bordes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* KPI 1: Finanzas / Ventas */}
        {canViewReports && (
          <div 
            onClick={() => setTabActiva('reportes')}
            style={{
              background: tabActiva === 'reportes' ? '#1e273d' : '#151c2c',
              borderRadius: '16px',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
              border: 'none'
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Ingresos Totales (Ventas)
            </span>
            <h3 style={{ margin: 0, fontSize: '1.65rem', color: '#22c55e', fontWeight: 800 }}>
              ${totalVentasBrutas.toLocaleString('es-CO')}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#86efac' }}>
              {ventas.length} facturas emitidas
            </span>
          </div>
        )}

        {/* KPI 2: Inventario */}
        {canManageInventory && (
          <div 
            onClick={() => setTabActiva('inventario')}
            style={{
              background: tabActiva === 'inventario' ? '#1e273d' : '#151c2c',
              borderRadius: '16px',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
              border: 'none'
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Catálogo de Productos
            </span>
            <h3 style={{ margin: 0, fontSize: '1.65rem', color: '#8b5cf6', fontWeight: 800 }}>
              {cargandoProductos ? '...' : totalProductos}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
              Valor: ${valorTotalInventario.toLocaleString('es-CO')}
            </span>
          </div>
        )}

        {/* KPI 3: Alertas de Stock */}
        {canManageInventory && (
          <div 
            onClick={() => { setTabActiva('inventario'); setFiltroStock('bajo'); }}
            style={{
              background: '#151c2c',
              borderRadius: '16px',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
              border: 'none'
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Alertas de Stock
            </span>
            <h3 style={{ margin: 0, fontSize: '1.65rem', color: productosBajoStock > 0 ? '#f59e0b' : '#22c55e', fontWeight: 800 }}>
              {productosBajoStock}
            </h3>
            <span style={{ fontSize: '0.75rem', color: productosBajoStock > 0 ? '#fbbf24' : '#86efac' }}>
              {productosBajoStock > 0 ? 'Requieren reposición' : 'Stock en nivel óptimo'}
            </span>
          </div>
        )}

        {/* KPI 4: Proveedores */}
        {canManageSuppliers && (
          <div 
            onClick={() => setTabActiva('proveedores')}
            style={{
              background: tabActiva === 'proveedores' ? '#1e273d' : '#151c2c',
              borderRadius: '16px',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
              border: 'none'
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Proveedores
            </span>
            <h3 style={{ margin: 0, fontSize: '1.65rem', color: '#38bdf8', fontWeight: 800 }}>
              {cargandoProveedores ? '...' : proveedores.length}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#7dd3fc' }}>
              {proveedores.filter(p => p.activo !== false).length} aliados activos
            </span>
          </div>
        )}

        {/* KPI 5: Usuarios */}
        {canManageUsers && (
          <div 
            onClick={() => setTabActiva('usuarios')}
            style={{
              background: tabActiva === 'usuarios' ? '#1e273d' : '#151c2c',
              borderRadius: '16px',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
              border: 'none'
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Usuarios en BD
            </span>
            <h3 style={{ margin: 0, fontSize: '1.65rem', color: '#c4b5fd', fontWeight: 800 }}>
              {cargandoUsuarios ? '...' : usuarios.length}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Admin: {totalAdmins} &middot; Contador: {totalContadores} &middot; Bodega: {totalInventarios} &middot; Cajero: {totalCajeros}
            </span>
          </div>
        )}
      </div>

      {/* Selector de Pestañas - Limpio y sin bordes */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        paddingBottom: '0.25rem',
        flexWrap: 'wrap'
      }}>
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
              boxShadow: tabActiva === 'inventario' ? '0 4px 14px rgba(139, 92, 246, 0.4)' : 'none'
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
              boxShadow: tabActiva === 'compras' ? '0 4px 14px rgba(34, 197, 94, 0.4)' : 'none'
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
              boxShadow: tabActiva === 'proveedores' ? '0 4px 14px rgba(56, 189, 248, 0.4)' : 'none'
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
              boxShadow: tabActiva === 'reportes' ? '0 4px 14px rgba(139, 92, 246, 0.4)' : 'none'
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
              boxShadow: tabActiva === 'usuarios' ? '0 4px 14px rgba(139, 92, 246, 0.4)' : 'none'
            }}
          >
            Usuarios y Roles
          </button>
        )}
      </div>

      {/* ================= CONTENIDO DE LAS PESTAÑAS ================= */}

      {/* 1. SECCIÓN DE REPORTES FINANCIEROS */}
      {tabActiva === 'reportes' && canViewReports && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2.4fr) minmax(320px, 1fr)',
          gap: '1.75rem',
          alignItems: 'start'
        }}>
          {/* Historial de Facturas */}
          <div style={{
            background: '#151c2c',
            borderRadius: '18px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            border: 'none',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800 }}>
                  Registro Contable y Facturación
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                  Detalle de ingresos brutos, IVA recaudado y comprobantes emitidos
                </p>
              </div>

              <button
                type="button"
                onClick={cargarVentas}
                style={{
                  background: '#1e273d',
                  color: '#cbd5e1',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  transition: 'background 0.2s ease'
                }}
              >
                {cargandoVentas ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>

            {/* Tarjetas de Métricas Contables */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              <div style={{ background: '#0b0f19', padding: '14px', borderRadius: '12px', border: 'none' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ventas Netas</span>
                <strong style={{ color: '#8b5cf6', fontSize: '1.2rem', fontWeight: 800 }}>${totalVentasNetas.toLocaleString('es-CO')}</strong>
              </div>
              <div style={{ background: '#0b0f19', padding: '14px', borderRadius: '12px', border: 'none' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>IVA Recaudado (19%)</span>
                <strong style={{ color: '#f59e0b', fontSize: '1.2rem', fontWeight: 800 }}>${totalIvaRecaudado.toLocaleString('es-CO')}</strong>
              </div>
              <div style={{ background: '#0b0f19', padding: '14px', borderRadius: '12px', border: 'none' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Facturado</span>
                <strong style={{ color: '#22c55e', fontSize: '1.2rem', fontWeight: 800 }}>${totalVentasBrutas.toLocaleString('es-CO')}</strong>
              </div>
            </div>

            {/* Buscador de Facturas */}
            <div style={{
              background: '#0b0f19',
              borderRadius: '10px',
              padding: '0 14px',
              border: 'none'
            }}>
              <input
                type="text"
                placeholder="Buscar factura por Nro, Cliente o Método de Pago..."
                value={busquedaFactura}
                onChange={(e) => setBusquedaFactura(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 0',
                  width: '100%',
                  outline: 'none',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            {/* Tabla de Facturas sin bordes feos */}
            <div style={{ borderRadius: '12px', overflowX: 'auto', background: '#0b0f19', border: 'none' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(30, 39, 61, 0.4)', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Nro. Factura</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Fecha</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Cliente</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Método</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Total</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>Comprobante</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                        No hay facturas registradas.
                      </td>
                    </tr>
                  ) : (
                    ventasFiltradas.map((v, idx) => (
                      <tr key={v.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(21, 28, 44, 0.4)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#c4b5fd' }}>
                          FAC-{v.id}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '0.8rem' }}>
                          {new Date(v.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#f8fafc', fontWeight: 600 }}>
                          {v.cliente || 'Consumidor Final'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            background: 'rgba(139, 92, 246, 0.15)',
                            color: '#c4b5fd',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {v.metodo || 'Efectivo'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#22c55e' }}>
                          ${Number(v.total).toLocaleString('es-CO')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDescargarFacturaPDF(v)}
                            style={{
                              background: '#1e273d',
                              color: '#c4b5fd',
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: 700
                            }}
                          >
                            Descargar PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Columna Derecha: Métodos de Pago & Clima */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
              background: '#151c2c',
              borderRadius: '18px',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              border: 'none',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
            }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 800 }}>
                Desglose por Método de Pago
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0b0f19', padding: '12px 14px', borderRadius: '10px' }}>
                  <strong style={{ color: '#22c55e' }}>Efectivo</strong>
                  <span style={{ fontWeight: 800, color: '#f8fafc' }}>${ventasEfectivo.toLocaleString('es-CO')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0b0f19', padding: '12px 14px', borderRadius: '10px' }}>
                  <strong style={{ color: '#c4b5fd' }}>Nequi / Transferencia</strong>
                  <span style={{ fontWeight: 800, color: '#f8fafc' }}>${ventasNequi.toLocaleString('es-CO')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0b0f19', padding: '12px 14px', borderRadius: '10px' }}>
                  <strong style={{ color: '#38bdf8' }}>Tarjeta Débito/Crédito</strong>
                  <span style={{ fontWeight: 800, color: '#f8fafc' }}>${ventasTarjeta.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>

            <WeatherWidget />
          </div>
        </div>
      )}

      {/* 2. SECCIÓN DE INVENTARIO */}
      {tabActiva === 'inventario' && canManageInventory && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2.5fr) minmax(320px, 1fr)',
          gap: '1.75rem',
          alignItems: 'start'
        }}>
          {/* Tabla de Productos */}
          <div style={{
            background: '#151c2c',
            borderRadius: '18px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            border: 'none',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800 }}>
                  Catálogo de Productos y Existencias
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                  Control de stock, precios y reposición ({productos.length} productos)
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={cargarProductos}
                  disabled={cargandoProductos}
                  style={{
                    background: '#1e273d',
                    color: '#cbd5e1',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    cursor: cargandoProductos ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.82rem'
                  }}
                >
                  {cargandoProductos ? 'Cargando...' : 'Recargar'}
                </button>

                <button
                  type="button"
                  onClick={handleAbrirCrearProducto}
                  style={{
                    background: '#8b5cf6',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)'
                  }}
                >
                  + Nuevo Producto
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{
                flex: 1,
                minWidth: '220px',
                background: '#0b0f19',
                borderRadius: '10px',
                padding: '0 14px',
                border: 'none'
              }}>
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o código..."
                  value={busquedaProductos}
                  onChange={(e) => setBusquedaProductos(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', padding: '10px 0', width: '100%', outline: 'none', fontSize: '0.88rem' }}
                />
              </div>

              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                style={{ background: '#0b0f19', border: 'none', color: '#cbd5e1', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem' }}
              >
                {categoriasUnicas.map(cat => (
                  <option key={cat} value={cat}>{cat === 'Todas' ? 'Todas las categorías' : cat}</option>
                ))}
              </select>

              <select
                value={filtroStock}
                onChange={(e) => setFiltroStock(e.target.value)}
                style={{ background: '#0b0f19', border: 'none', color: '#cbd5e1', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem' }}
              >
                <option value="todos">Todos los niveles</option>
                <option value="bajo">Bajo Stock</option>
                <option value="agotado">Agotados</option>
              </select>
            </div>

            {/* Tabla de Productos sin bordes */}
            <div style={{ borderRadius: '12px', overflowX: 'auto', background: '#0b0f19', border: 'none' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(30, 39, 61, 0.4)', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Producto</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Categoría</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Precio</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Stock</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargandoProductos ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: '#c4b5fd' }}>
                        Consultando catálogo en la BD...
                      </td>
                    </tr>
                  ) : productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                        No se encontraron productos.
                      </td>
                    </tr>
                  ) : (
                    productosFiltrados.map((prod, idx) => {
                      const stockNum = Number(prod.stock) || 0;
                      const stockMin = Number(prod.stock_minimo) || 5;
                      const esAgotado = stockNum === 0;
                      const esBajo = stockNum <= stockMin && stockNum > 0;

                      return (
                        <tr key={prod.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(21, 28, 44, 0.4)' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc' }}>{prod.nombre}</div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Cód: {prod.codigo_barras || prod.codigo || `ID-${prod.id}`}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                              {prod.categoria || prod.categoria_nombre || 'General'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: '#22c55e' }}>
                            ${(Number(prod.precio) || Number(prod.precio_venta) || 0).toLocaleString('es-CO')}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                background: esAgotado ? 'rgba(239, 68, 68, 0.2)' : esBajo ? 'rgba(245, 158, 11, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                color: esAgotado ? '#f87171' : esBajo ? '#fbbf24' : '#4ade80',
                                padding: '3px 9px',
                                borderRadius: '10px',
                                fontSize: '0.78rem',
                                fontWeight: 700
                              }}>
                                {esAgotado ? 'Agotado' : esBajo ? `${stockNum} un. (Bajo)` : `${stockNum} un.`}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleAjusteRapidoStock(prod, 1)}
                                style={{ background: '#1e273d', color: '#fff', border: 'none', width: '24px', height: '24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 800 }}
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAjusteRapidoStock(prod, -1)}
                                style={{ background: '#1e273d', color: '#fff', border: 'none', width: '24px', height: '24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 800 }}
                              >
                                -
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleAbrirEditarProducto(prod)}
                                style={{ background: '#1e273d', color: '#c4b5fd', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminarProducto(prod.id, prod.nombre)}
                                style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Columna Derecha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <WeatherWidget />

            {(isAdmin || isSupervisor) && (
              <div style={{
                background: '#151c2c',
                borderRadius: '18px',
                padding: '1.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                border: 'none',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
              }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 800 }}>
                  Acceso Rápido POS
                </h4>
                <button
                  onClick={onAbrirPos}
                  style={{
                    background: '#8b5cf6',
                    color: '#fff',
                    border: 'none',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)'
                  }}
                >
                  Abrir Terminal Cajero POS
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SECCIÓN DE USUARIOS */}
      {tabActiva === 'usuarios' && canManageUsers && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2.3fr) minmax(320px, 1fr)',
          gap: '1.75rem',
          alignItems: 'start'
        }}>
          {/* Contenedor de la Tabla de Usuarios */}
          <div style={{
            background: '#151c2c',
            borderRadius: '18px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            border: 'none',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800 }}>
                  Usuarios Registrados en la Base de Datos
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                  Gestión y roles de usuarios ({usuarios.length} registros)
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={cargarUsuarios}
                  disabled={cargandoUsuarios}
                  style={{ background: '#1e273d', color: '#cbd5e1', border: 'none', padding: '8px 14px', borderRadius: '10px', cursor: cargandoUsuarios ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                >
                  {cargandoUsuarios ? 'Cargando...' : 'Recargar'}
                </button>

                <button
                  type="button"
                  onClick={() => setModalNuevoUsuario(true)}
                  style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)' }}
                >
                  + Nuevo Usuario
                </button>
              </div>
            </div>

            {/* Buscador */}
            <div style={{ background: '#0b0f19', borderRadius: '10px', padding: '0 14px', border: 'none' }}>
              <input
                type="text"
                placeholder="Buscar usuario por nombre o correo..."
                value={busquedaUsuarios}
                onChange={(e) => setBusquedaUsuarios(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', padding: '10px 0', width: '100%', outline: 'none', fontSize: '0.88rem' }}
              />
            </div>

            {/* Tabla de Usuarios */}
            <div style={{ borderRadius: '12px', overflowX: 'auto', background: '#0b0f19', border: 'none' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(30, 39, 61, 0.4)', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px', width: '50px', fontWeight: 700 }}># ID</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Nombre</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Correo Electrónico</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Rol (id_rol)</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>Estado</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargandoUsuarios ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: '#c4b5fd' }}>
                        Consultando usuarios en la base de datos...
                      </td>
                    </tr>
                  ) : usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((u, idx) => {
                      const idRolNum = Number(u.id_rol ?? u.rol?.id ?? (typeof u.rol === 'number' ? u.rol : 5));
                      const idEstadoNum = Number(u.id_estado ?? u.estado?.id ?? (typeof u.estado === 'number' ? u.estado : 1));
                      const infoRol = obtenerInfoRol(idRolNum);

                      return (
                        <tr key={u.id || u.correo} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(21, 28, 44, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '12px 14px', color: '#c4b5fd', fontWeight: 800 }}>#{u.id}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#f8fafc' }}>{u.nombre || u.email || 'Sin nombre'}</td>
                          <td style={{ padding: '12px 14px', color: '#94a3b8' }}>
                            <span style={{ color: '#c4b5fd', background: 'rgba(139, 92, 246, 0.1)', padding: '3px 8px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                              {u.correo || u.email}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              background: 'rgba(139, 92, 246, 0.18)',
                              color: '#c4b5fd',
                              padding: '4px 10px',
                              borderRadius: '10px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {infoRol.icon} {infoRol.label} (#{idRolNum})
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <span style={{
                              background: idEstadoNum === 1 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: idEstadoNum === 1 ? '#4ade80' : '#f87171',
                              padding: '3px 9px',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              {idEstadoNum === 1 ? 'Activo (1)' : 'Inactivo (2)'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleAbrirEditarUsuario(u)}
                                style={{ background: '#1e273d', color: '#c4b5fd', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminarUsuario(u.id, u.nombre)}
                                style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <WeatherWidget />
          </div>
        </div>
      )}

      {/* 4. SECCIÓN DE ENTRADAS Y COMPRAS A PROVEEDORES */}
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

      {/* 5. SECCIÓN DE PROVEEDORES */}
      {tabActiva === 'proveedores' && canManageSuppliers && (
        <ProveedoresTab
          proveedores={proveedores}
          cargando={cargandoProveedores}
          onRecargar={cargarProveedores}
          onAbrirNuevaCompraConProveedor={handleAbrirCompraConProveedor}
          canManage={canManageSuppliers}
        />
      )}

      {/* MODAL: Crear Nuevo Producto */}
      {modalNuevoProducto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 15, 25, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{ backgroundColor: '#151c2c', border: 'none', borderRadius: '18px', padding: '1.75rem', width: '100%', maxWidth: '480px', color: '#f8fafc', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                Registrar Nuevo Producto
              </h3>
              <button onClick={() => setModalNuevoProducto(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}>✕</button>
            </div>
            <form onSubmit={handleGuardarNuevoProducto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Nombre del Producto *</label>
                <input type="text" value={formularioProducto.nombre} onChange={(e) => setFormularioProducto({ ...formularioProducto, nombre: e.target.value })} required style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Categoría *</label>
                  <select value={formularioProducto.categoria} onChange={(e) => setFormularioProducto({ ...formularioProducto, categoria: e.target.value })} style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }}>
                    <option value="Abarrotes">Abarrotes</option>
                    <option value="Lácteos">Lácteos</option>
                    <option value="Granos">Granos</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Huevos">Huevos</option>
                    <option value="Panadería">Panadería</option>
                    <option value="Aseo">Aseo</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Cód. Barras</label>
                  <input type="text" value={formularioProducto.codigo_barras} onChange={(e) => setFormularioProducto({ ...formularioProducto, codigo_barras: e.target.value })} style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Precio (COP) *</label>
                  <input type="number" value={formularioProducto.precio} onChange={(e) => setFormularioProducto({ ...formularioProducto, precio: e.target.value })} required min="1" style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Stock Inicial *</label>
                  <input type="number" value={formularioProducto.stock} onChange={(e) => setFormularioProducto({ ...formularioProducto, stock: e.target.value })} required min="0" style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModalNuevoProducto(false)} style={{ background: '#1e273d', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" disabled={guardandoProducto} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Crear Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Producto */}
      {modalEditarProducto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 15, 25, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{ backgroundColor: '#151c2c', border: 'none', borderRadius: '18px', padding: '1.75rem', width: '100%', maxWidth: '480px', color: '#f8fafc', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                Editar Producto
              </h3>
              <button onClick={() => setModalEditarProducto(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}>✕</button>
            </div>
            <form onSubmit={handleGuardarEdicionProducto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Nombre *</label>
                <input type="text" value={formularioProducto.nombre} onChange={(e) => setFormularioProducto({ ...formularioProducto, nombre: e.target.value })} required style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Precio (COP) *</label>
                  <input type="number" value={formularioProducto.precio} onChange={(e) => setFormularioProducto({ ...formularioProducto, precio: e.target.value })} required min="1" style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Stock *</label>
                  <input type="number" value={formularioProducto.stock} onChange={(e) => setFormularioProducto({ ...formularioProducto, stock: e.target.value })} required min="0" style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModalEditarProducto(false)} style={{ background: '#1e273d', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" disabled={guardandoProducto} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Crear Nuevo Usuario en BD */}
      {modalNuevoUsuario && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 15, 25, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{ backgroundColor: '#151c2c', border: 'none', borderRadius: '18px', padding: '1.75rem', width: '100%', maxWidth: '460px', color: '#f8fafc', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Registrar Usuario en BD
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>tienda_comunitaria.usuarios</span>
              </div>
              <button onClick={() => setModalNuevoUsuario(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 700 }}>✕</button>
            </div>
            <form onSubmit={handleCrearUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Nombre *</label>
                <input type="text" placeholder="Ej. Carlos Mendoza" value={nuevoUsuario.nombre} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })} required style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Correo Electrónico (correo) *</label>
                <input type="email" placeholder="usuario@gmail.com" value={nuevoUsuario.correo} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })} required style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Contraseña (contraseña) *</label>
                <input type="password" placeholder="••••••••" value={nuevoUsuario.contraseña} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, contraseña: e.target.value })} required style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Rol (id_rol)</label>
                  <select value={nuevoUsuario.id_rol} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, id_rol: Number(e.target.value) })} style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }}>
                    {ROLES_DB.map((r) => (
                      <option key={r.id} value={r.id}>{r.nombre} (id: {r.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Estado (id_estado)</label>
                  <select value={nuevoUsuario.id_estado} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, id_estado: Number(e.target.value) })} style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }}>
                    <option value={1}>1 - Activo</option>
                    <option value={2}>2 - Inactivo</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModalNuevoUsuario(false)} style={{ background: '#1e273d', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" disabled={creandoUsuario} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>{creandoUsuario ? 'Guardando...' : 'Guardar en BD'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Usuario en BD */}
      {modalEditarUsuario && usuarioEditando && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 15, 25, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{ backgroundColor: '#151c2c', border: 'none', borderRadius: '18px', padding: '1.75rem', width: '100%', maxWidth: '460px', color: '#f8fafc', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Editar Usuario #{usuarioEditando.id}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Modificar rol, estado o datos</span>
              </div>
              <button onClick={() => setModalEditarUsuario(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 700 }}>✕</button>
            </div>
            <form onSubmit={handleGuardarEdicionUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Nombre *</label>
                <input type="text" value={formEditarUsuario.nombre} onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, nombre: e.target.value })} required style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Correo Electrónico *</label>
                <input type="email" value={formEditarUsuario.correo} onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, correo: e.target.value })} required style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Rol (id_rol)</label>
                  <select value={formEditarUsuario.id_rol} onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, id_rol: Number(e.target.value) })} style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }}>
                    {ROLES_DB.map((r) => (
                      <option key={r.id} value={r.id}>{r.nombre} (id: {r.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Estado (id_estado)</label>
                  <select value={formEditarUsuario.id_estado} onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, id_estado: Number(e.target.value) })} style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }}>
                    <option value={1}>1 - Activo</option>
                    <option value={2}>2 - Inactivo</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModalEditarUsuario(false)} style={{ background: '#1e273d', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" disabled={guardandoEdicionUsuario} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>{guardandoEdicionUsuario ? 'Guardando...' : 'Guardar Cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardView;
