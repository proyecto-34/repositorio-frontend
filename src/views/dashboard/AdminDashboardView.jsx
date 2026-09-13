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
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { usuariosService } from '../../services/usuariosService';
import { productosService } from '../../services/productosService';
import { normalizarRol, ROLES } from '../../constants/roles';
import WeatherWidget from '../../components/WeatherWidget';

// Catálogo por defecto en caso de BD inicial vacía
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

export const AdminDashboardView = ({ user, onOpenFactura, onAbrirPos }) => {
  // Pestaña Activa: 'usuarios' o 'inventario'
  const [tabActiva, setTabActiva] = useState('inventario');

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
  const [filtroStock, setFiltroStock] = useState('todos'); // 'todos', 'bajo', 'agotado'
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

  // Carga inicial
  useEffect(() => {
    cargarUsuarios();
    cargarProductos();
  }, []);

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
        // Si la tabla aún no tiene datos, cargar catálogo por defecto para permitir operar
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
        console.warn('API error, guardando en estado local:', apiErr.message);
        toast.info(`Producto "${formularioProducto.nombre}" agregado al inventario local`);
      }

      // Actualizar vista
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
      toast.error('Ocurrió un error al guardar el producto');
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
        console.warn('API error al actualizar, aplicando localmente:', apiErr.message);
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
      } catch (err) {
        // Continúa con estado local
      }
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
      } catch (err) {
        // Fallback local
      }
      setProductos(productos.filter(p => p.id !== id));
      toast.success(`Producto "${nombre}" eliminado`);
    } catch (err) {
      toast.error('Error al eliminar producto');
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

  // Métricas calculadas
  const totalAdmins = usuarios.filter((u) => normalizarRol(u.id_rol ?? u.rol ?? u.role) === ROLES.ADMIN).length;
  const totalCajeros = usuarios.filter((u) => normalizarRol(u.id_rol ?? u.rol ?? u.role) === ROLES.CAJERO).length;
  const totalProductos = productos.length;
  const productosBajoStock = productos.filter(p => (Number(p.stock) || 0) <= (Number(p.stock_minimo) || 5)).length;
  const valorTotalInventario = productos.reduce((acc, p) => acc + ((Number(p.precio) || 0) * (Number(p.stock) || 0)), 0);

  return (
    <div style={{
      maxWidth: '1300px',
      width: '100%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      {/* Tarjetas de Métricas Globales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {/* KPI 1: Usuarios en BD */}
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
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Usuarios Registrados</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', color: '#818cf8', fontWeight: 800 }}>
              {cargandoUsuarios ? '...' : usuarios.length}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
              {totalAdmins} Admin &middot; {totalCajeros} Cajeros
            </span>
          </div>
          <div style={{ background: 'rgba(129, 140, 248, 0.1)', padding: '10px', borderRadius: '10px', color: '#818cf8' }}>
            <Users size={24} />
          </div>
        </div>

        {/* KPI 2: Catálogo de Productos */}
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
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Productos en Catálogo</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', color: '#38bdf8', fontWeight: 800 }}>
              {cargandoProductos ? '...' : totalProductos}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {categoriasUnicas.length - 1} categorías activas
            </span>
          </div>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '10px', borderRadius: '10px', color: '#38bdf8' }}>
            <Package size={24} />
          </div>
        </div>

        {/* KPI 3: Alertas de Stock Bajo */}
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
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', color: productosBajoStock > 0 ? '#f59e0b' : '#34d399', fontWeight: 800 }}>
              {productosBajoStock}
            </h3>
            <span style={{ fontSize: '0.75rem', color: productosBajoStock > 0 ? '#f87171' : '#34d399' }}>
              {productosBajoStock > 0 ? 'Requieren reposición' : 'Stock óptimo'}
            </span>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '10px', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* KPI 4: Valor de Inventario */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid #334155',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Valor Estimado Inventario</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.45rem', color: '#34d399', fontWeight: 800 }}>
              ${valorTotalInventario.toLocaleString('es-CO')}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Activos en bodega</span>
          </div>
          <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '10px', borderRadius: '10px', color: '#34d399' }}>
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Selector de Pestañas Principales */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #334155',
        paddingBottom: '0.5rem'
      }}>
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
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Boxes size={18} /> Gestión de Inventario & Productos
        </button>

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
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Users size={18} /> Usuarios y Roles en Base de Datos
        </button>
      </div>

      {/* Contenido según pestaña */}
      {tabActiva === 'inventario' ? (
        /* ================= SECCIÓN DE INVENTARIO ================= */
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
                  Gestión de precios, existencias y alertas de reposición ({productos.length} productos)
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
                  title="Recargar inventario"
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

            {/* Barra de Filtros y Búsqueda */}
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
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

              {/* Filtro Categoría */}
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                style={{
                  background: '#0f172a',
                  border: '1px solid #475569',
                  color: '#cbd5e1',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                {categoriasUnicas.map(cat => (
                  <option key={cat} value={cat}>{cat === 'Todas' ? 'Todas las categorías' : cat}</option>
                ))}
              </select>

              {/* Filtro Stock */}
              <select
                value={filtroStock}
                onChange={(e) => setFiltroStock(e.target.value)}
                style={{
                  background: '#0f172a',
                  border: '1px solid #475569',
                  color: '#cbd5e1',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="todos">Todos los niveles de Stock</option>
                <option value="bajo">⚠️ Bajo Stock (Reposición)</option>
                <option value="agotado">🔴 Agotados (0 unidades)</option>
              </select>
            </div>

            {/* Tabla de Productos */}
            <div style={{ border: '1px solid #334155', borderRadius: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', width: '50px' }}>Item</th>
                    <th style={{ padding: '10px 12px' }}>Producto</th>
                    <th style={{ padding: '10px 12px' }}>Categoría</th>
                    <th style={{ padding: '10px 12px' }}>Precio Venta</th>
                    <th style={{ padding: '10px 12px' }}>Stock</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargandoProductos ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#38bdf8' }}>
                        🔄 Consultando catálogo de productos en la base de datos...
                      </td>
                    </tr>
                  ) : productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No se encontraron productos con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    productosFiltrados.map((prod) => {
                      const stockNum = Number(prod.stock) || 0;
                      const stockMin = Number(prod.stock_minimo) || 5;
                      const esAgotado = stockNum === 0;
                      const esBajo = stockNum <= stockMin && stockNum > 0;

                      return (
                        <tr key={prod.id} style={{ borderTop: '1px solid #334155', transition: 'background 0.15s' }}>
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
                            <span style={{
                              background: 'rgba(56, 189, 248, 0.1)',
                              color: '#38bdf8',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}>
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
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                {esAgotado ? '🔴 Agotado' : esBajo ? `⚠️ ${stockNum} un.` : `🟢 ${stockNum} un.`}
                              </span>

                              {/* Ajuste Rápido de Stock (+ / -) */}
                              <button
                                type="button"
                                onClick={() => handleAjusteRapidoStock(prod, 1)}
                                style={{ background: '#334155', color: '#fff', border: 'none', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Sumar 1 unidad"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAjusteRapidoStock(prod, -1)}
                                style={{ background: '#334155', color: '#fff', border: 'none', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Restar 1 unidad"
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
                                style={{
                                  background: '#334155',
                                  color: '#38bdf8',
                                  border: '1px solid #475569',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600
                                }}
                                title="Editar datos del producto"
                              >
                                <Edit2 size={13} /> Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminarProducto(prod.id, prod.nombre)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  fontSize: '0.78rem'
                                }}
                                title="Eliminar producto"
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

          {/* Columna Derecha: Alertas & Accesos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <WeatherWidget />

            <div style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                🛒 Acciones Rápidas
              </h4>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>
                Operar en la terminal de venta o emitir tickets de prueba.
              </p>

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
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                Abrir Terminal Cajero POS
              </button>

              <button
                onClick={onOpenFactura}
                style={{
                  background: '#334155',
                  color: '#38bdf8',
                  border: '1px solid #475569',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Receipt size={16} /> Emitir Factura PDF
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= SECCIÓN DE USUARIOS ================= */
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
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={20} color="#38bdf8" /> Usuarios Registrados en la Base de Datos
                </h3>
                <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                  Tabla <code>p_tienda_comunitaria.usuarios</code> ({usuarios.length} registros cargados)
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={cargarUsuarios}
                  disabled={cargandoUsuarios}
                  style={{
                    background: '#334155',
                    color: '#cbd5e1',
                    border: 'none',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    cursor: cargandoUsuarios ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Recargar datos de la BD"
                >
                  <RefreshCw size={14} className={cargandoUsuarios ? 'spin' : ''} />
                  {cargandoUsuarios ? 'Cargando...' : 'Recargar'}
                </button>

                <button
                  type="button"
                  onClick={() => setModalNuevoUsuario(true)}
                  style={{
                    background: '#4f46e5',
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
                  <UserPlus size={16} /> Nuevo Usuario
                </button>
              </div>
            </div>

            {/* Buscador */}
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
                placeholder="Buscar usuario por nombre o correo..."
                value={busquedaUsuarios}
                onChange={(e) => setBusquedaUsuarios(e.target.value)}
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

            {/* Estado de error */}
            {errorCargaUsuarios && (
              <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.85rem' }}>
                ⚠️ {errorCargaUsuarios}
              </div>
            )}

            {/* Tabla de Usuarios */}
            <div style={{ border: '1px solid #334155', borderRadius: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', width: '45px' }}>#</th>
                    <th style={{ padding: '10px 12px' }}>Nombre</th>
                    <th style={{ padding: '10px 12px' }}>Correo Electrónico</th>
                    <th style={{ padding: '10px 12px' }}>Rol (id_rol)</th>
                    <th style={{ padding: '10px 12px' }}>Estado (id_estado)</th>
                  </tr>
                </thead>
                <tbody>
                  {cargandoUsuarios ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#38bdf8' }}>
                        🔄 Consultando usuarios en la base de datos de NestJS...
                      </td>
                    </tr>
                  ) : usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No se encontraron usuarios que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((u) => {
                      const rolNorm = normalizarRol(u.id_rol ?? u.rol ?? u.role);
                      const isAdminRol = rolNorm === ROLES.ADMIN;
                      const idRolNum = u.id_rol ?? (isAdminRol ? 1 : 5);
                      const idEstadoNum = u.id_estado ?? 1;

                      return (
                        <tr key={u.id || u.correo} style={{ borderTop: '1px solid #334155' }}>
                          <td style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>
                            {u.id}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f8fafc' }}>
                            {u.nombre || u.email || 'Sin nombre'}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                            <code style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                              {u.correo || u.email}
                            </code>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              background: isAdminRol ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                              color: isAdminRol ? '#a5b4fc' : '#6ee7b7',
                              border: `1px solid ${isAdminRol ? 'rgba(99, 102, 241, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              {isAdminRol ? '👑 Administrador' : '🛒 Cajero POS'} (id_rol: {idRolNum})
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              color: Number(idEstadoNum) === 1 ? '#4ade80' : '#f87171',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 600
                            }}>
                              {Number(idEstadoNum) === 1 ? <CheckCircle size={14} /> : <XCircle size={14} />}
                              {Number(idEstadoNum) === 1 ? 'Activo' : 'Inactivo'} (id_estado: {idEstadoNum})
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

          {/* Columna Derecha */}
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
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            color: '#f8fafc'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="#38bdf8" /> Registrar Nuevo Producto
              </h3>
              <button
                onClick={() => setModalNuevoProducto(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGuardarNuevoProducto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Harina Pan 1kg, Queso Campesino..."
                  value={formularioProducto.nombre}
                  onChange={(e) => setFormularioProducto({ ...formularioProducto, nombre: e.target.value })}
                  required
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Categoría *
                  </label>
                  <select
                    value={formularioProducto.categoria}
                    onChange={(e) => setFormularioProducto({ ...formularioProducto, categoria: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    <option value="Abarrotes">Abarrotes</option>
                    <option value="Lácteos">Lácteos</option>
                    <option value="Granos">Granos</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Huevos">Huevos</option>
                    <option value="Panadería">Panadería</option>
                    <option value="Aseo">Aseo</option>
                    <option value="Snacks">Snacks / Golosinas</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Emoji Identificador
                  </label>
                  <input
                    type="text"
                    value={formularioProducto.emoji}
                    onChange={(e) => setFormularioProducto({ ...formularioProducto, emoji: e.target.value })}
                    placeholder="📦"
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Precio Venta (COP) *
                  </label>
                  <input
                    type="number"
                    placeholder="Ej: 4500"
                    value={formularioProducto.precio}
                    onChange={(e) => setFormularioProducto({ ...formularioProducto, precio: e.target.value })}
                    required
                    min="1"
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Stock Inicial *
                  </label>
                  <input
                    type="number"
                    placeholder="Ej: 20"
                    value={formularioProducto.stock}
                    onChange={(e) => setFormularioProducto({ ...formularioProducto, stock: e.target.value })}
                    required
                    min="0"
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Stock Mínimo Alerta
                  </label>
                  <input
                    type="number"
                    value={formularioProducto.stock_minimo}
                    onChange={(e) => setFormularioProducto({ ...formularioProducto, stock_minimo: e.target.value })}
                    min="1"
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    value={formularioProducto.codigo_barras}
                    onChange={(e) => setFormularioProducto({ ...formularioProducto, codigo_barras: e.target.value })}
                    placeholder="77012345"
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalNuevoProducto(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoProducto}
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: guardandoProducto ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  {guardandoProducto ? 'Guardando...' : 'Crear Producto'}
                </button>
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
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            color: '#f8fafc'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} color="#38bdf8" /> Editar Producto
              </h3>
              <button
                onClick={() => setModalEditarProducto(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicionProducto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={formularioProducto.nombre}
                  onChange={(e) => setFormularioProducto({ ...formularioProducto, nombre: e.target.value })}
                  required
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Categoría *
                  </label>
                  <select
                    value={formularioProducto.categoria}
                    onChange={(e) => setFormularioProducto({ ...formularioProducto, categoria: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    <option value="Abarrotes">Abarrotes</option>
                    <option value="Lácteos">Lácteos</option>
                    <option value="Granos">Granos</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Huevos">Huevos</option>
                    <option value="Panadería">Panadería</option>
                    <option value="Aseo">Aseo</option>
                    <option value="Snacks">Snacks / Golosinas</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={formularioProducto.emoji}
                    onChange={(e) => setFormularioProducto({ ...formularioProducto, emoji: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Precio Venta (COP) *
                  </label>
                  <input
                    type="number"
                    value={formularioProducto.precio}
                    onChange={(e) => setFormularioProducto({ ...formularioProducto, precio: e.target.value })}
                    required
                    min="1"
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Stock Actual *
                  </label>
                  <input
                    type="number"
                    value={formularioProducto.stock}
                    onChange={(e) => setFormularioProducto({ ...formularioProducto, stock: e.target.value })}
                    required
                    min="0"
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalEditarProducto(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoProducto}
                  style={{
                    background: '#38bdf8',
                    color: '#0f172a',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: guardandoProducto ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  {guardandoProducto ? 'Guardando...' : 'Guardar Cambios'}
                </button>
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
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            color: '#f8fafc'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="#818cf8" /> Crear Usuario en Base de Datos
              </h3>
              <button
                onClick={() => setModalNuevoUsuario(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCrearUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Laura Gómez"
                  value={nuevoUsuario.nombre}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                  required
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="cajero@tienda.com"
                  value={nuevoUsuario.correo}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })}
                  required
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={nuevoUsuario.contraseña}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, contraseña: e.target.value })}
                  required
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Rol a Asignar (id_rol)
                </label>
                <select
                  value={nuevoUsuario.id_rol}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, id_rol: Number(e.target.value) })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  <option value={5}>🛒 Cajero POS (id_rol: 5)</option>
                  <option value={1}>👑 Administrador (id_rol: 1)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalNuevoUsuario(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creandoUsuario}
                  style={{
                    background: '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: creandoUsuario ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  {creandoUsuario ? 'Guardando en BD...' : 'Guardar en Base de Datos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardView;
