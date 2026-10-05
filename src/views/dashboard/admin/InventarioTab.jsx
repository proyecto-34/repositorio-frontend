import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { productosService } from '../../../services/productosService';
import categoriasService, { CATEGORIAS_DEFAULT } from '../../../services/categoriasService';
import WeatherWidget from '../../../components/WeatherWidget';
import Can from '../../../components/Can';

export const InventarioTab = ({
  productos = [],
  cargando = false,
  onRecargar,
  onAbrirPos,
  isAdmin = false,
  isSupervisor = false,
  filtroStock = 'todos',
  setFiltroStock,
}) => {
  const [busquedaProductos, setBusquedaProductos] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroStockLocal, setFiltroStockLocal] = useState('todos');

  // Categorías reales de la Base de Datos
  const [listaCategorias, setListaCategorias] = useState(CATEGORIAS_DEFAULT);
  const [modalCategoriaAbierto, setModalCategoriaAbierto] = useState(false);
  const [nombreNuevaCategoria, setNombreNuevaCategoria] = useState('');
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      const data = await categoriasService.obtenerCategorias();
      if (Array.isArray(data) && data.length > 0) {
        setListaCategorias(data);
      }
    } catch (e) {
      console.warn('Error al cargar categorías de la BD:', e);
    }
  };

  const handleGuardarCategoria = async (e) => {
    e.preventDefault();
    if (!nombreNuevaCategoria.trim()) {
      toast.error('Por favor escribe el nombre de la categoría');
      return;
    }

    setGuardandoCategoria(true);
    try {
      const nueva = await categoriasService.crearCategoria(nombreNuevaCategoria.trim());
      const nombreCreado = nueva?.nombre || nombreNuevaCategoria.trim();
      toast.success(`Categoría "${nombreCreado}" guardada en la base de datos MySQL`);

      const catsActualizadas = await categoriasService.obtenerCategorias();
      setListaCategorias(catsActualizadas);

      // Si el modal de producto está abierto, seleccionamos la nueva categoría
      if (nueva?.id) {
        setFormularioProducto((prev) => ({
          ...prev,
          id_categoria: nueva.id,
          categoria: nueva.nombre || nombreCreado,
        }));
      }

      setNombreNuevaCategoria('');
      setModalCategoriaAbierto(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al guardar categoría en la BD';
      toast.error(`Error: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
    } finally {
      setGuardandoCategoria(false);
    }
  };

  // Si el componente padre controla filtroStock, lo usamos; si no, el local
  const currentFiltroStock = filtroStock !== undefined ? filtroStock : filtroStockLocal;
  const updateFiltroStock = setFiltroStock || setFiltroStockLocal;

  // Modal unificado para crear y editar producto
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [guardandoProducto, setGuardandoProducto] = useState(false);

  const [formularioProducto, setFormularioProducto] = useState({
    nombre: '',
    id_categoria: 1,
    categoria: 'Granos',
    precio: '',
    stock: '',
    stock_minimo: '5',
    codigo_barras: '',
  });

  const handleAbrirCrearProducto = () => {
    setProductoEditando(null);
    setFormularioProducto({
      nombre: '',
      id_categoria: 1,
      categoria: 'Granos',
      precio: '',
      stock: '',
      stock_minimo: '5',
      codigo_barras: `770${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setModalAbierto(true);
  };

  const handleAbrirEditarProducto = (prod) => {
    setProductoEditando(prod);
    setFormularioProducto({
      nombre: prod.nombre || '',
      id_categoria: Number(prod.id_categoria ?? prod.categoria?.id ?? 1),
      categoria: prod.categoria?.nombre || prod.categoria || 'Granos',
      precio: prod.precio || prod.precio_venta || '',
      stock: prod.stock !== undefined && prod.stock !== null ? prod.stock : (prod.cantidad ?? ''),
      stock_minimo: prod.stock_minimo || '5',
      codigo_barras: prod.codigo_barras || prod.codigo || '',
    });
    setModalAbierto(true);
  };

  const handleGuardarProducto = async (e) => {
    e.preventDefault();
    if (!formularioProducto.nombre || !formularioProducto.precio || formularioProducto.stock === '') {
      toast.error('Por favor completa los campos requeridos del producto');
      return;
    }

    setGuardandoProducto(true);
    try {
      if (productoEditando) {
        await productosService.actualizarProducto(productoEditando.id, formularioProducto);
        toast.success(`Producto "${formularioProducto.nombre}" actualizado correctamente en la BD`);
      } else {
        await productosService.crearProducto(formularioProducto);
        toast.success(`Producto "${formularioProducto.nombre}" guardado en la base de datos`);
      }

      if (onRecargar) await onRecargar();
      setModalAbierto(false);
      setProductoEditando(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al guardar el producto en la BD';
      toast.error(`Error: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
    } finally {
      setGuardandoProducto(false);
    }
  };

  const handleAjusteRapidoStock = async (prod, delta) => {
    const nuevoStock = Math.max(0, (Number(prod.stock) || 0) + delta);
    try {
      await productosService.actualizarProducto(prod.id, { stock: nuevoStock });
      toast.success(`Stock de ${prod.nombre}: ${nuevoStock} unidades`);
      if (onRecargar) onRecargar();
    } catch (err) {
      toast.error('No se pudo ajustar el stock');
    }
  };

  const handleEliminarProducto = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${nombre}" del catálogo?`)) return;
    try {
      await productosService.eliminarProducto(id);
      toast.success(`Producto "${nombre}" eliminado`);
      if (onRecargar) onRecargar();
    } catch (err) {
      toast.error('Error al eliminar producto');
    }
  };

  // Filtrado de productos
  const categoriasUnicas = [
    'Todas',
    ...new Set([
      ...listaCategorias.map((c) => c.nombre),
      ...productos.map((p) => p.categoria || p.categoria_nombre || 'General'),
    ]),
  ];

  const productosFiltrados = productos.filter((p) => {
    const q = busquedaProductos.toLowerCase();
    const coincideTexto =
      (p.nombre && p.nombre.toLowerCase().includes(q)) ||
      (p.codigo_barras && p.codigo_barras.toLowerCase().includes(q)) ||
      (p.codigo && p.codigo.toLowerCase().includes(q));

    const cat = p.categoria || p.categoria_nombre || 'General';
    const coincideCat = filtroCategoria === 'Todas' || cat === filtroCategoria;

    const stockNum = Number(p.stock) || 0;
    const stockMin = Number(p.stock_minimo) || 5;

    let coincideStock = true;
    if (currentFiltroStock === 'bajo') {
      coincideStock = stockNum <= stockMin;
    } else if (currentFiltroStock === 'agotado') {
      coincideStock = stockNum === 0;
    }

    return coincideTexto && coincideCat && coincideStock;
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.5fr) minmax(320px, 1fr)',
        gap: '1.75rem',
        alignItems: 'start',
      }}
    >
      {/* Tabla de Productos */}
      <div
        style={{
          background: '#151c2c',
          borderRadius: '18px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          border: 'none',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
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
              onClick={onRecargar}
              disabled={cargando}
              style={{
                background: '#1e273d',
                color: '#cbd5e1',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: cargando ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem',
              }}
            >
              {cargando ? 'Cargando...' : 'Recargar'}
            </button>

            <Can do="create" on="inventario">
              <button
                type="button"
                onClick={() => setModalCategoriaAbierto(true)}
                style={{
                  background: '#1e273d',
                  color: '#c4b5fd',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                + Nueva Categoría
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
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                }}
              >
                + Nuevo Producto
              </button>
            </Can>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
              minWidth: '220px',
              background: '#0b0f19',
              borderRadius: '10px',
              padding: '0 14px',
              border: 'none',
            }}
          >
            <input
              type="text"
              placeholder="Buscar producto por nombre o código..."
              value={busquedaProductos}
              onChange={(e) => setBusquedaProductos(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                padding: '10px 0',
                width: '100%',
                outline: 'none',
                fontSize: '0.88rem',
              }}
            />
          </div>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            style={{
              background: '#0b0f19',
              border: 'none',
              color: '#cbd5e1',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.85rem',
            }}
          >
            {categoriasUnicas.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'Todas' ? 'Todas las categorías' : cat}
              </option>
            ))}
          </select>

          <select
            value={currentFiltroStock}
            onChange={(e) => updateFiltroStock(e.target.value)}
            style={{
              background: currentFiltroStock !== 'todos' ? '#271f38' : '#0b0f19',
              border: currentFiltroStock !== 'todos' ? '1px solid #f59e0b' : 'none',
              color: currentFiltroStock !== 'todos' ? '#fbbf24' : '#cbd5e1',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: currentFiltroStock !== 'todos' ? 700 : 400,
            }}
          >
            <option value="todos">Todos los niveles</option>
            <option value="bajo">Bajo Stock</option>
            <option value="agotado">Agotados</option>
          </select>
        </div>

        {/* Banner de Filtro de Stock Activo */}
        {currentFiltroStock !== 'todos' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              padding: '10px 16px',
              borderRadius: '12px',
              color: '#fbbf24',
              fontSize: '0.85rem',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>⚠️</span>
              <span>
                Filtro activo:{' '}
                <strong>
                  {currentFiltroStock === 'bajo'
                    ? 'Productos con Alerta de Stock'
                    : 'Productos Agotados'}
                </strong>{' '}
                ({productosFiltrados.length} encontrados de {productos.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => updateFiltroStock('todos')}
              style={{
                background: '#f59e0b',
                color: '#0b0f19',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              ✕ Ver catálogo completo ({productos.length})
            </button>
          </div>
        )}

        {/* Tabla de Productos */}
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
              {cargando ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: '#c4b5fd' }}>
                    Consultando catálogo en la BD...
                  </td>
                </tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      {currentFiltroStock === 'bajo' ? (
                        <>
                          <span style={{ fontSize: '2.4rem' }}>🛡️</span>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#22c55e', fontWeight: 700 }}>
                            ¡Inventario en nivel óptimo!
                          </h4>
                          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', maxWidth: '420px', lineHeight: '1.4' }}>
                            No hay productos que requieran reposición en este momento. Todos los artículos tienen existencias por encima de su stock mínimo.
                          </p>
                          <button
                            type="button"
                            onClick={() => updateFiltroStock('todos')}
                            style={{
                              marginTop: '8px',
                              background: '#8b5cf6',
                              color: '#fff',
                              border: 'none',
                              padding: '8px 18px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                            }}
                          >
                            Ver todos los productos ({productos.length})
                          </button>
                        </>
                      ) : currentFiltroStock === 'agotado' ? (
                        <>
                          <span style={{ fontSize: '2.4rem' }}>✅</span>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#22c55e', fontWeight: 700 }}>
                            ¡Ningún producto agotado!
                          </h4>
                          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', maxWidth: '420px', lineHeight: '1.4' }}>
                            Todo el catálogo cuenta con disponibilidad en existencias.
                          </p>
                          <button
                            type="button"
                            onClick={() => updateFiltroStock('todos')}
                            style={{
                              marginTop: '8px',
                              background: '#8b5cf6',
                              color: '#fff',
                              border: 'none',
                              padding: '8px 18px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                            }}
                          >
                            Ver todos los productos ({productos.length})
                          </button>
                        </>
                      ) : busquedaProductos ? (
                        <>
                          <span style={{ fontSize: '2.4rem' }}>🔍</span>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>
                            No se encontraron productos
                          </h4>
                          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
                            Ningún producto coincide con &ldquo;{busquedaProductos}&rdquo;
                          </p>
                          <button
                            type="button"
                            onClick={() => setBusquedaProductos('')}
                            style={{
                              marginTop: '8px',
                              background: '#1e273d',
                              color: '#c4b5fd',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                            }}
                          >
                            Limpiar búsqueda
                          </button>
                        </>
                      ) : (
                        <div style={{ color: '#64748b' }}>
                          No hay productos registrados en la base de datos.
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((prod, idx) => {
                  const stockNum = Number(prod.stock) || 0;
                  const stockMin = Number(prod.stock_minimo) || 5;
                  const esAgotado = stockNum === 0;
                  const esBajo = stockNum <= stockMin && stockNum > 0;

                  return (
                    <tr
                      key={prod.id}
                      style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(21, 28, 44, 0.4)' }}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{prod.nombre}</div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Cód: {prod.codigo_barras || prod.codigo || `ID-${prod.id}`}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            background: 'rgba(139, 92, 246, 0.15)',
                            color: '#c4b5fd',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {prod.categoria || prod.categoria_nombre || 'General'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#22c55e' }}>
                        ${(Number(prod.precio) || Number(prod.precio_venta) || 0).toLocaleString('es-CO')}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              background: esAgotado
                                ? 'rgba(239, 68, 68, 0.2)'
                                : esBajo
                                ? 'rgba(245, 158, 11, 0.2)'
                                : 'rgba(34, 197, 94, 0.2)',
                              color: esAgotado ? '#f87171' : esBajo ? '#fbbf24' : '#4ade80',
                              padding: '3px 9px',
                              borderRadius: '10px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                            }}
                          >
                            {esAgotado ? 'Agotado' : esBajo ? `${stockNum} un. (Bajo)` : `${stockNum} un.`}
                          </span>

                          <Can do="edit" on="inventario">
                            <button
                              type="button"
                              onClick={() => handleAjusteRapidoStock(prod, 1)}
                              style={{
                                background: '#1e273d',
                                color: '#fff',
                                border: 'none',
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 800,
                              }}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAjusteRapidoStock(prod, -1)}
                              style={{
                                background: '#1e273d',
                                color: '#fff',
                                border: 'none',
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 800,
                              }}
                            >
                              -
                            </button>
                          </Can>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Can do="edit" on="inventario">
                            <button
                              type="button"
                              onClick={() => handleAbrirEditarProducto(prod)}
                              style={{
                                background: '#1e273d',
                                color: '#c4b5fd',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                              }}
                            >
                              Editar
                            </button>
                          </Can>
                          <Can do="delete" on="inventario">
                            <button
                              type="button"
                              onClick={() => handleEliminarProducto(prod.id, prod.nombre)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                border: 'none',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                              }}
                            >
                              Eliminar
                            </button>
                          </Can>
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

      {/* Columna Derecha: Clima & Acceso Rápido POS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <WeatherWidget />

        {(isAdmin || isSupervisor) && (
          <div
            style={{
              background: '#151c2c',
              borderRadius: '18px',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              border: 'none',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
            }}
          >
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
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
              }}
            >
              Abrir Terminal Cajero POS
            </button>
          </div>
        )}
      </div>

      {/* MODAL UNIFICADO: Crear / Editar Producto */}
      {modalAbierto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 15, 25, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#151c2c',
              border: 'none',
              borderRadius: '18px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '480px',
              color: '#f8fafc',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.4rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                {productoEditando ? 'Editar Producto' : 'Registrar Nuevo Producto'}
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleGuardarProducto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={formularioProducto.nombre}
                  onChange={(e) => setFormularioProducto({ ...formularioProducto, nombre: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    background: '#0b0f19',
                    border: 'none',
                    color: '#fff',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                      Categoría *
                    </label>
                    <button
                      type="button"
                      onClick={() => setModalCategoriaAbierto(true)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#c4b5fd',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      + Nueva
                    </button>
                  </div>
                  <select
                    value={formularioProducto.id_categoria || 1}
                    onChange={(e) => {
                      const selId = Number(e.target.value);
                      const catFound = listaCategorias.find((c) => c.id === selId);
                      setFormularioProducto({
                        ...formularioProducto,
                        id_categoria: selId,
                        categoria: catFound?.nombre || 'Granos',
                      });
                    }}
                    style={{
                      width: '100%',
                      background: '#0b0f19',
                      border: 'none',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  >
                    {listaCategorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.id} - {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Cód. Barras
                  </label>
                  <input
                    type="text"
                    value={formularioProducto.codigo_barras}
                    onChange={(e) => setFormularioProducto({ ...formularioProducto, codigo_barras: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#0b0f19',
                      border: 'none',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Precio (COP) *
                  </label>
                  <input
                    type="number"
                    value={formularioProducto.precio}
                    onChange={(e) => setFormularioProducto({ ...formularioProducto, precio: e.target.value })}
                    required
                    min="1"
                    style={{
                      width: '100%',
                      background: '#0b0f19',
                      border: 'none',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Cantidad en Stock *
                  </label>
                  <input
                    type="number"
                    value={formularioProducto.stock}
                    onChange={(e) => setFormularioProducto({ ...formularioProducto, stock: e.target.value })}
                    required
                    min="0"
                    style={{
                      width: '100%',
                      background: '#0b0f19',
                      border: 'none',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  style={{
                    background: '#1e273d',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoProducto}
                  style={{
                    background: '#8b5cf6',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: '10px',
                    cursor: guardandoProducto ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  {guardandoProducto
                    ? 'Guardando...'
                    : productoEditando
                    ? 'Guardar Cambios'
                    : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Categoría */}
      {modalCategoriaAbierto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 15, 25, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#151c2c',
              border: 'none',
              borderRadius: '18px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '430px',
              color: '#f8fafc',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Registrar Nueva Categoría
              </h3>
              <button
                type="button"
                onClick={() => setModalCategoriaAbierto(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarCategoria} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Bebidas, Aseo, Panadería, Enlatados..."
                  value={nombreNuevaCategoria}
                  onChange={(e) => setNombreNuevaCategoria(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    background: '#0b0f19',
                    border: 'none',
                    color: '#fff',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Categorías actuales en la Base de Datos */}
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Categorías en Base de Datos ({listaCategorias.length}):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                  {listaCategorias.map((c) => (
                    <span
                      key={c.id}
                      style={{
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#c4b5fd',
                        padding: '4px 9px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      #{c.id} {c.nombre}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalCategoriaAbierto(false)}
                  style={{
                    background: '#1e273d',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCategoria}
                  style={{
                    background: '#8b5cf6',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: '10px',
                    cursor: guardandoCategoria ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                  }}
                >
                  {guardandoCategoria ? 'Guardando...' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventarioTab;
