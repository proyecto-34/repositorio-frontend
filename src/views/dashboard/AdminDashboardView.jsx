import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Search, 
  CheckCircle, 
  XCircle, 
  Plus, 
  X,
  Receipt,
  RefreshCw,
  Database,
  Edit2,
  Trash2,
  Boxes,
  Tag,
  DollarSign,
  Layers,
  ArrowUpRight,
  Filter,
  BarChart3,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { usuariosService } from '../../services/usuariosService';
import { productosService } from '../../services/productosService';
import { facturacionService } from '../../services/facturacionService';
import { normalizarRol, ROLES, ROLES_DB, ROLE_BADGES, obtenerInfoRol } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import WeatherWidget from '../../components/WeatherWidget';

// Catálogo por defecto
const PRODUCTOS_DEFAULT = [
  { id: 1, nombre: 'Leche Entera 1L', categoria: 'Lácteos', precio: 4200, stock: 24, stock_minimo: 10, codigo_barras: '7701001', emoji: '🥛' },
  { id: 2, nombre: 'Arroz Diana 1kg', categoria: 'Granos', precio: 4800, stock: 40, stock_minimo: 15, codigo_barras: '7701002', emoji: '🍚' },
  { id: 3, nombre: 'Huevos AA x Unidad', categoria: 'Huevos', precio: 600, stock: 120, stock_minimo: 30, codigo_barras: '7701003', emoji: '🥚' },
  { id: 4, nombre: 'Aceite Vegetal 900ml', categoria: 'Abarrotes', precio: 9500, stock: 8, stock_minimo: 10, codigo_barras: '7701004', emoji: '🌻' },
  { id: 5, nombre: 'Pan Tajado Bimbo', categoria: 'Panadería', precio: 6500, stock: 5, stock_minimo: 8, codigo_barras: '7701005', emoji: '🍞' },
  { id: 6, nombre: 'Café Sello Rojo 250g', categoria: 'Bebidas', precio: 7800, stock: 30, stock_minimo: 10, codigo_barras: '7701006', emoji: '☕' },
  { id: 7, nombre: 'Azúcar Morena 1kg', categoria: 'Abarrotes', precio: 4300, stock: 25, stock_minimo: 10, codigo_barras: '7701007', emoji: '🥣' },
  { id: 8, nombre: 'Jabón Rey x Unidad', categoria: 'Aseo', precio: 2500, stock: 50, stock_minimo: 15, codigo_barras: '7701008', emoji: '🧼' },
  { id: 9, nombre: 'Gaseosa Coca-Cola 1.5L', categoria: 'Bebidas', precio: 5500, stock: 3, stock_minimo: 10, codigo_barras: '7701009', emoji: '🥤' },
  { id: 10, nombre: 'Lentejas 500g', categoria: 'Granos', precio: 3800, stock: 35, stock_minimo: 12, codigo_barras: '7701010', emoji: '🍲' },
];

// Ventas contables de ejemplo inicial
const VENTAS_DEFAULT = [
  { id: '1001', fecha: '2026-09-13T10:30:00', cliente: 'Carlos Ramírez', documento: '1098765432', cajero: 'Cajero POS', total: 45000, metodo: 'Efectivo', items: [{ nombre: 'Leche Entera 1L', cantidad: 3, precio: 4200, total: 12600 }, { nombre: 'Arroz Diana 1kg', cantidad: 4, precio: 4800, total: 19200 }, { nombre: 'Aceite Vegetal 900ml', cantidad: 1, precio: 9500, total: 9500 }] },
  { id: '1002', fecha: '2026-09-13T11:15:00', cliente: 'Consumidor Final', documento: '222222222', cajero: 'Cajero POS', total: 28600, metodo: 'Nequi', items: [{ nombre: 'Pan Tajado Bimbo', cantidad: 2, precio: 6500, total: 13000 }, { nombre: 'Café Sello Rojo 250g', cantidad: 2, precio: 7800, total: 15600 }] },
  { id: '1003', fecha: '2026-09-13T12:05:00', cliente: 'María Rodríguez', documento: '52345678', cajero: 'Cajero POS', total: 64200, metodo: 'Tarjeta', items: [{ nombre: 'Huevos AA x Unidad', cantidad: 30, precio: 600, total: 18000 }, { nombre: 'Aceite Vegetal 900ml', cantidad: 2, precio: 9500, total: 19000 }, { nombre: 'Azúcar Morena 1kg', cantidad: 3, precio: 4300, total: 12900 }, { nombre: 'Gaseosa Coca-Cola 1.5L', cantidad: 2, precio: 5500, total: 11000 }] },
  { id: '1004', fecha: '2026-09-13T13:40:00', cliente: 'Juan Arteaga', documento: '1004567890', cajero: 'Cajero POS', total: 19800, metodo: 'Efectivo', items: [{ nombre: 'Lentejas 500g', cantidad: 2, precio: 3800, total: 7600 }, { nombre: 'Jabón Rey x Unidad', cantidad: 3, precio: 2500, total: 7500 }, { nombre: 'Leche Entera 1L', cantidad: 1, precio: 4200, total: 4200 }] },
];

export const AdminDashboardView = ({ user, onOpenFactura, onAbrirPos }) => {
  const { activeRole, canManageUsers, canManageInventory, canViewReports, isAdmin, isContador, isInventario, isSupervisor } = useAuth();

  // Pestaña inicial según rol
  const [tabActiva, setTabActiva] = useState(() => {
    if (isContador) return 'reportes';
    if (isInventario) return 'inventario';
    return 'inventario';
  });

  // --- ESTADO DE USUARIOS ---
  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [errorCargaUsuarios, setErrorCargaUsuarios] = useState(null);
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
  const [modalNuevoUsuario, setModalNuevoUsuario] = useState(false);
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    correo: '',
    contraseña: '',
    id_rol: 5,
    id_estado: 1,
  });

  // --- ESTADO DE PRODUCTOS / INVENTARIO ---
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorCargaProductos, setErrorCargaProductos] = useState(null);
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
    emoji: '📦',
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
  }, [activeRole]);

  // Sincronizar pestaña si el rol cambia
  useEffect(() => {
    if (isContador) setTabActiva('reportes');
    else if (isInventario) setTabActiva('inventario');
  }, [activeRole, isContador, isInventario]);

  // --- MÉTODOS DE USUARIOS ---
  const cargarUsuarios = async () => {
    setCargandoUsuarios(true);
    setErrorCargaUsuarios(null);
    try {
      const data = await usuariosService.obtenerUsuarios();
      setUsuarios(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al conectar con la BD de NestJS';
      setErrorCargaUsuarios(msg);
      toast.error(`Error al cargar usuarios de la BD: ${msg}`);
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
      await usuariosService.crearUsuario(nuevoUsuario);
      toast.success(`Usuario ${nuevoUsuario.nombre} creado exitosamente en la BD`);
      setModalNuevoUsuario(false);
      setNuevoUsuario({ nombre: '', correo: '', contraseña: '', id_rol: 5, id_estado: 1 });
      await cargarUsuarios();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'No se pudo guardar el usuario en la BD';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setCreandoUsuario(false);
    }
  };

  // --- MÉTODOS DE PRODUCTOS ---
  const cargarProductos = async () => {
    setCargandoProductos(true);
    setErrorCargaProductos(null);
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
      emoji: '📦',
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
      emoji: prod.emoji || '📦',
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
      maxWidth: '1300px',
      width: '100%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      {/* Tarjetas de Métricas Globales según permisos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {/* KPI 1: Finanzas / Ventas (visible para Admin, Contador, Supervisor) */}
        {canViewReports && (
          <div 
            onClick={() => setTabActiva('reportes')}
            style={{
              background: tabActiva === 'reportes' ? 'linear-gradient(135deg, #064e3b, #022c22)' : 'linear-gradient(135deg, #1e293b, #0f172a)',
              border: tabActiva === 'reportes' ? '1px solid #10b981' : '1px solid #334155',
              borderRadius: '14px',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Ingresos Totales (Ventas)</span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', color: '#34d399', fontWeight: 800 }}>
                ${totalVentasBrutas.toLocaleString('es-CO')}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>
                {ventas.length} facturas emitidas
              </span>
            </div>
            <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '10px', borderRadius: '10px', color: '#34d399' }}>
              <TrendingUp size={24} />
            </div>
          </div>
        )}

        {/* KPI 2: Inventario (visible para Admin, Inventario, Supervisor) */}
        {canManageInventory && (
          <div 
            onClick={() => setTabActiva('inventario')}
            style={{
              background: tabActiva === 'inventario' ? 'linear-gradient(135deg, #0c4a6e, #082f49)' : 'linear-gradient(135deg, #1e293b, #0f172a)',
              border: tabActiva === 'inventario' ? '1px solid #38bdf8' : '1px solid #334155',
              borderRadius: '14px',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Catálogo de Productos</span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', color: '#38bdf8', fontWeight: 800 }}>
                {cargandoProductos ? '...' : totalProductos}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Valor: ${valorTotalInventario.toLocaleString('es-CO')}
              </span>
            </div>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '10px', borderRadius: '10px', color: '#38bdf8' }}>
              <Package size={24} />
            </div>
          </div>
        )}

        {/* KPI 3: Alertas de Stock */}
        {canManageInventory && (
          <div 
            onClick={() => { setTabActiva('inventario'); setFiltroStock('bajo'); }}
            style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              border: productosBajoStock > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid #334155',
              borderRadius: '14px',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Alertas de Stock</span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', color: productosBajoStock > 0 ? '#f59e0b' : '#34d399', fontWeight: 800 }}>
                {productosBajoStock}
              </h3>
              <span style={{ fontSize: '0.75rem', color: productosBajoStock > 0 ? '#f87171' : '#34d399' }}>
                {productosBajoStock > 0 ? 'Requieren reposición' : 'Stock en nivel óptimo'}
              </span>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '10px', color: '#f59e0b' }}>
              <AlertTriangle size={24} />
            </div>
          </div>
        )}

        {/* KPI 4: Usuarios (solo visible para Admin y Supervisor) */}
        {canManageUsers && (
          <div 
            onClick={() => setTabActiva('usuarios')}
            style={{
              background: tabActiva === 'usuarios' ? 'linear-gradient(135deg, #312e81, #1e1b4b)' : 'linear-gradient(135deg, #1e293b, #0f172a)',
              border: tabActiva === 'usuarios' ? '1px solid #6366f1' : '1px solid #334155',
              borderRadius: '14px',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Usuarios en BD</span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', color: '#818cf8', fontWeight: 800 }}>
                {cargandoUsuarios ? '...' : usuarios.length}
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                👑 {totalAdmins} &middot; 📊 {totalContadores} &middot; 📦 {totalInventarios} &middot; 🛡️ {totalSupervisores} &middot; 🛒 {totalCajeros}
              </span>
            </div>
            <div style={{ background: 'rgba(129, 140, 248, 0.1)', padding: '10px', borderRadius: '10px', color: '#818cf8' }}>
              <Users size={24} />
            </div>
          </div>
        )}
      </div>

      {/* Selector de Pestañas Filtradas por Rol Estricto */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #334155',
        paddingBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {canManageInventory && (
          <button
            type="button"
            onClick={() => setTabActiva('inventario')}
            style={{
              background: tabActiva === 'inventario' ? '#0284c7' : '#1e293b',
              color: tabActiva === 'inventario' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Boxes size={18} /> Inventario & Productos
          </button>
        )}

        {canViewReports && (
          <button
            type="button"
            onClick={() => setTabActiva('reportes')}
            style={{
              background: tabActiva === 'reportes' ? '#059669' : '#1e293b',
              color: tabActiva === 'reportes' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <BarChart3 size={18} /> Reportes Financieros & Balance
          </button>
        )}

        {canManageUsers && (
          <button
            type="button"
            onClick={() => setTabActiva('usuarios')}
            style={{
              background: tabActiva === 'usuarios' ? '#4f46e5' : '#1e293b',
              color: tabActiva === 'usuarios' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Users size={18} /> Usuarios y Roles (BD)
          </button>
        )}
      </div>

      {/* ================= CONTENIDO DE LAS PESTAÑAS ================= */}

      {/* 1. SECCIÓN DE REPORTES FINANCIEROS (CONTADOR Y ADMIN) */}
      {tabActiva === 'reportes' && canViewReports && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2.3fr) minmax(300px, 1fr)',
          gap: '1.5rem',
          alignItems: 'start'
        }}>
          {/* Columna Izquierda: Historial de Facturas y Desglose */}
          <div style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={20} color="#34d399" /> Registro Contable y Facturación
                </h3>
                <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                  Detalle de ingresos brutos, IVA recaudado y comprobantes emitidos
                </p>
              </div>

              <button
                type="button"
                onClick={cargarVentas}
                style={{
                  background: '#334155',
                  color: '#cbd5e1',
                  border: 'none',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={14} className={cargandoVentas ? 'spin' : ''} />
                Actualizar
              </button>
            </div>

            {/* Tarjetas de Métricas Contables */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Ventas Netas (Sin IVA)</span>
                <strong style={{ color: '#38bdf8', fontSize: '1.1rem' }}>${totalVentasNetas.toLocaleString('es-CO')}</strong>
              </div>
              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>IVA Recaudado (19%)</span>
                <strong style={{ color: '#f59e0b', fontSize: '1.1rem' }}>${totalIvaRecaudado.toLocaleString('es-CO')}</strong>
              </div>
              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Total Facturado</span>
                <strong style={{ color: '#34d399', fontSize: '1.1rem' }}>${totalVentasBrutas.toLocaleString('es-CO')}</strong>
              </div>
            </div>

            {/* Buscador de Facturas */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#0f172a',
              border: '1px solid #475569',
              borderRadius: '8px',
              padding: '0 12px',
              gap: '8px'
            }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Buscar factura por Nro, Cliente o Método de Pago..."
                value={busquedaFactura}
                onChange={(e) => setBusquedaFactura(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 0',
                  width: '100%',
                  outline: 'none',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Tabla de Facturas */}
            <div style={{ border: '1px solid #334155', borderRadius: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Nro. Factura</th>
                    <th style={{ padding: '10px 12px' }}>Fecha</th>
                    <th style={{ padding: '10px 12px' }}>Cliente</th>
                    <th style={{ padding: '10px 12px' }}>Método</th>
                    <th style={{ padding: '10px 12px' }}>Total</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Comprobante</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No hay facturas registradas.
                      </td>
                    </tr>
                  ) : (
                    ventasFiltradas.map((v) => (
                      <tr key={v.id} style={{ borderTop: '1px solid #334155' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#38bdf8' }}>
                          FAC-{v.id}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '0.8rem' }}>
                          {new Date(v.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#f8fafc', fontWeight: 600 }}>
                          {v.cliente || 'Consumidor Final'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            background: v.metodo === 'Efectivo' ? 'rgba(52, 211, 153, 0.15)' : v.metodo === 'Nequi' ? 'rgba(192, 132, 252, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                            color: v.metodo === 'Efectivo' ? '#34d399' : v.metodo === 'Nequi' ? '#c084fc' : '#38bdf8',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {v.metodo || 'Efectivo'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#34d399' }}>
                          ${Number(v.total).toLocaleString('es-CO')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDescargarFacturaPDF(v)}
                            style={{
                              background: '#334155',
                              color: '#38bdf8',
                              border: '1px solid #475569',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            <Download size={13} /> PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Columna Derecha: Métodos de Pago & Resumen */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700 }}>
                💳 Desglose por Método de Pago
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '10px 12px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
                    <Banknote size={16} /> <strong>Efectivo</strong>
                  </div>
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>${ventasEfectivo.toLocaleString('es-CO')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '10px 12px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc' }}>
                    <Smartphone size={16} /> <strong>Nequi / Transferencia</strong>
                  </div>
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>${ventasNequi.toLocaleString('es-CO')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '10px 12px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
                    <CreditCard size={16} /> <strong>Tarjeta Débito/Crédito</strong>
                  </div>
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>${ventasTarjeta.toLocaleString('es-CO')}</span>
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
          gridTemplateColumns: 'minmax(0, 2.5fr) minmax(300px, 1fr)',
          gap: '1.5rem',
          alignItems: 'start'
        }}>
          {/* Tabla de Productos */}
          <div style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Boxes size={20} color="#38bdf8" /> Catálogo de Productos y Existencias
                </h3>
                <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                  Control de stock, precios y reposición ({productos.length} productos)
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={cargarProductos}
                  disabled={cargandoProductos}
                  style={{
                    background: '#334155',
                    color: '#cbd5e1',
                    border: 'none',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    cursor: cargandoProductos ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={14} className={cargandoProductos ? 'spin' : ''} />
                  {cargandoProductos ? 'Cargando...' : 'Recargar'}
                </button>

                <button
                  type="button"
                  onClick={handleAbrirCrearProducto}
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={16} /> Nuevo Producto
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{
                flex: 1,
                minWidth: '220px',
                display: 'flex',
                alignItems: 'center',
                background: '#0f172a',
                border: '1px solid #475569',
                borderRadius: '8px',
                padding: '0 12px',
                gap: '8px'
              }}>
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o código..."
                  value={busquedaProductos}
                  onChange={(e) => setBusquedaProductos(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', padding: '8px 0', width: '100%', outline: 'none', fontSize: '0.85rem' }}
                />
              </div>

              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                style={{ background: '#0f172a', border: '1px solid #475569', color: '#cbd5e1', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                {categoriasUnicas.map(cat => (
                  <option key={cat} value={cat}>{cat === 'Todas' ? 'Todas las categorías' : cat}</option>
                ))}
              </select>

              <select
                value={filtroStock}
                onChange={(e) => setFiltroStock(e.target.value)}
                style={{ background: '#0f172a', border: '1px solid #475569', color: '#cbd5e1', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <option value="todos">Todos los niveles</option>
                <option value="bajo">⚠️ Bajo Stock</option>
                <option value="agotado">🔴 Agotados</option>
              </select>
            </div>

            {/* Tabla */}
            <div style={{ border: '1px solid #334155', borderRadius: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', width: '50px' }}>Item</th>
                    <th style={{ padding: '10px 12px' }}>Producto</th>
                    <th style={{ padding: '10px 12px' }}>Categoría</th>
                    <th style={{ padding: '10px 12px' }}>Precio</th>
                    <th style={{ padding: '10px 12px' }}>Stock</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargandoProductos ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#38bdf8' }}>
                        🔄 Consultando catálogo en la BD...
                      </td>
                    </tr>
                  ) : productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No se encontraron productos.
                      </td>
                    </tr>
                  ) : (
                    productosFiltrados.map((prod) => {
                      const stockNum = Number(prod.stock) || 0;
                      const stockMin = Number(prod.stock_minimo) || 5;
                      const esAgotado = stockNum === 0;
                      const esBajo = stockNum <= stockMin && stockNum > 0;

                      return (
                        <tr key={prod.id} style={{ borderTop: '1px solid #334155' }}>
                          <td style={{ padding: '10px 12px', fontSize: '1.2rem', textAlign: 'center' }}>
                            {prod.emoji || '📦'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{prod.nombre}</div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Cód: {prod.codigo_barras || prod.codigo || `ID-${prod.id}`}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600 }}>
                              {prod.categoria || prod.categoria_nombre || 'General'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#34d399' }}>
                            ${(Number(prod.precio) || Number(prod.precio_venta) || 0).toLocaleString('es-CO')}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                background: esAgotado ? 'rgba(239, 68, 68, 0.2)' : esBajo ? 'rgba(245, 158, 11, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                color: esAgotado ? '#f87171' : esBajo ? '#fbbf24' : '#4ade80',
                                border: `1px solid ${esAgotado ? 'rgba(239, 68, 68, 0.4)' : esBajo ? 'rgba(245, 158, 11, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.78rem',
                                fontWeight: 700
                              }}>
                                {esAgotado ? '🔴 Agotado' : esBajo ? `⚠️ ${stockNum} un.` : `🟢 ${stockNum} un.`}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleAjusteRapidoStock(prod, 1)}
                                style={{ background: '#334155', color: '#fff', border: 'none', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAjusteRapidoStock(prod, -1)}
                                style={{ background: '#334155', color: '#fff', border: 'none', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
                              >
                                -
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleAbrirEditarProducto(prod)}
                                style={{ background: '#334155', color: '#38bdf8', border: '1px solid #475569', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                              >
                                <Edit2 size={13} /> Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminarProducto(prod.id, prod.nombre)}
                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer' }}
                              >
                                <Trash2 size={13} />
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <WeatherWidget />

            {(isAdmin || isSupervisor) && (
              <div style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700 }}>
                  ⚡ Acceso Rápido POS
                </h4>
                <button
                  onClick={onAbrirPos}
                  style={{
                    background: '#059669',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  Abrir Terminal Cajero POS
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SECCIÓN DE USUARIOS (SOLO ADMIN Y SUPERVISOR) */}
      {tabActiva === 'usuarios' && canManageUsers && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)',
          gap: '1.5rem',
          alignItems: 'start'
        }}>
          {/* Contenedor de la Tabla de Usuarios */}
          <div style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={20} color="#38bdf8" /> Usuarios Registrados en la Base de Datos
                </h3>
                <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                  Tabla <code>tienda_comunitaria.usuarios</code> ({usuarios.length} registros cargados)
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={cargarUsuarios}
                  disabled={cargandoUsuarios}
                  style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '7px 12px', borderRadius: '8px', cursor: cargandoUsuarios ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  <RefreshCw size={14} className={cargandoUsuarios ? 'spin' : ''} />
                  Recargar
                </button>

                <button
                  type="button"
                  onClick={() => setModalNuevoUsuario(true)}
                  style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <UserPlus size={16} /> Nuevo Usuario
                </button>
              </div>
            </div>

            {/* Buscador */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #475569', borderRadius: '8px', padding: '0 12px', gap: '8px' }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Buscar usuario por nombre o correo..."
                value={busquedaUsuarios}
                onChange={(e) => setBusquedaUsuarios(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', padding: '8px 0', width: '100%', outline: 'none', fontSize: '0.85rem' }}
              />
            </div>

            {/* Tabla de Usuarios con los 5 roles */}
            <div style={{ border: '1px solid #334155', borderRadius: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', width: '45px' }}>#</th>
                    <th style={{ padding: '10px 12px' }}>Nombre</th>
                    <th style={{ padding: '10px 12px' }}>Correo Electrónico</th>
                    <th style={{ padding: '10px 12px' }}>Rol Asignado</th>
                    <th style={{ padding: '10px 12px' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cargandoUsuarios ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#38bdf8' }}>
                        🔄 Consultando usuarios en la base de datos...
                      </td>
                    </tr>
                  ) : usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((u) => {
                      const infoRol = obtenerInfoRol(u.id_rol ?? u.rol ?? u.role);
                      const idRolNum = u.id_rol ?? infoRol.id_rol;
                      const idEstadoNum = u.id_estado ?? 1;

                      return (
                        <tr key={u.id || u.correo} style={{ borderTop: '1px solid #334155' }}>
                          <td style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>{u.id}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f8fafc' }}>{u.nombre || u.email || 'Sin nombre'}</td>
                          <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                            <code style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                              {u.correo || u.email}
                            </code>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              background: infoRol.bg,
                              color: infoRol.color,
                              border: `1px solid ${infoRol.border}`,
                              padding: '3px 9px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {infoRol.icon} {infoRol.label} (#{idRolNum})
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ color: Number(idEstadoNum) === 1 ? '#4ade80' : '#f87171', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                              {Number(idEstadoNum) === 1 ? <CheckCircle size={14} /> : <XCircle size={14} />}
                              {Number(idEstadoNum) === 1 ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <WeatherWidget />
          </div>
        </div>
      )}

      {/* MODAL: Crear Nuevo Producto */}
      {modalNuevoProducto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '480px', color: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="#38bdf8" /> Registrar Nuevo Producto
              </h3>
              <button onClick={() => setModalNuevoProducto(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleGuardarNuevoProducto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Nombre del Producto *</label>
                <input type="text" value={formularioProducto.nombre} onChange={(e) => setFormularioProducto({ ...formularioProducto, nombre: e.target.value })} required style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Categoría *</label>
                  <select value={formularioProducto.categoria} onChange={(e) => setFormularioProducto({ ...formularioProducto, categoria: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
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
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Emoji</label>
                  <input type="text" value={formularioProducto.emoji} onChange={(e) => setFormularioProducto({ ...formularioProducto, emoji: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Precio (COP) *</label>
                  <input type="number" value={formularioProducto.precio} onChange={(e) => setFormularioProducto({ ...formularioProducto, precio: e.target.value })} required min="1" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Stock *</label>
                  <input type="number" value={formularioProducto.stock} onChange={(e) => setFormularioProducto({ ...formularioProducto, stock: e.target.value })} required min="0" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModalNuevoProducto(false)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
                <button type="submit" disabled={guardandoProducto} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Crear Producto</button>
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
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '480px', color: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} color="#38bdf8" /> Editar Producto
              </h3>
              <button onClick={() => setModalEditarProducto(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleGuardarEdicionProducto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Nombre *</label>
                <input type="text" value={formularioProducto.nombre} onChange={(e) => setFormularioProducto({ ...formularioProducto, nombre: e.target.value })} required style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Precio (COP) *</label>
                  <input type="number" value={formularioProducto.precio} onChange={(e) => setFormularioProducto({ ...formularioProducto, precio: e.target.value })} required min="1" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Stock *</label>
                  <input type="number" value={formularioProducto.stock} onChange={(e) => setFormularioProducto({ ...formularioProducto, stock: e.target.value })} required min="0" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModalEditarProducto(false)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
                <button type="submit" disabled={guardandoProducto} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Guardar Cambios</button>
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
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '440px', color: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="#818cf8" /> Crear Usuario en BD
              </h3>
              <button onClick={() => setModalNuevoUsuario(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCrearUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Nombre</label>
                <input type="text" value={nuevoUsuario.nombre} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })} required style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Correo</label>
                <input type="email" value={nuevoUsuario.correo} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })} required style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Contraseña</label>
                <input type="password" value={nuevoUsuario.contraseña} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, contraseña: e.target.value })} required style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Rol (id_rol)</label>
                <select value={nuevoUsuario.id_rol} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, id_rol: Number(e.target.value) })} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {ROLES_DB.map((r) => (
                    <option key={r.id} value={r.id}>{r.icon} {r.nombre} - {r.label} (id: {r.id})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModalNuevoUsuario(false)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
                <button type="submit" disabled={creandoUsuario} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Guardar en BD</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardView;
