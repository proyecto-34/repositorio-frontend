import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { productosService } from '../../../services/productosService';
import categoriasService, { CATEGORIAS_DEFAULT } from '../../../services/categoriasService';
import Can from '../../../components/Can';
import useConfirm from '../../../hooks/useConfirm';

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
  const { confirm, ConfirmDialog } = useConfirm();
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
    const ok = await confirm({
      title: 'Eliminar Producto',
      message: `¿Estás seguro de que deseas eliminar "${nombre}" del catálogo? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
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
    const q = busquedaProductos.toLowerCase().trim();
    const coincideTexto =
      !q ||
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div className="inventario-layout-grid">
        {/* Columna Izquierda: Tabla de Productos y Filtros */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '18px',
          padding: '1.6rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '-0.3px' }}>
              Catálogo de Productos y Existencias
            </h3>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Control de stock, precios y reposición ({productos.length} productos)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onRecargar}
              disabled={cargando}
              style={{
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: cargando ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem',
              }}
            >
              {cargando ? 'Cargando...' : 'Recargar'}
            </button>

            {(isAdmin || isSupervisor) && (
              <>
                <button
                  type="button"
                  onClick={() => setModalCategoriaAbierto(true)}
                  style={{
                    background: 'var(--accent-primary-subtle)',
                    color: 'var(--accent-primary)',
                    border: '1px solid var(--accent-primary-border)',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                  }}
                >
                  + Nueva Categoría
                </button>

                <button
                  type="button"
                  onClick={handleAbrirCrearProducto}
                  style={{
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    boxShadow: '0 3px 10px rgba(30, 91, 184, 0.25)',
                  }}
                >
                  + Nuevo Producto
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filtros con Espaciado Generoso */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: '260px',
              background: 'var(--bg-subtle)',
              borderRadius: '10px',
              padding: '0 16px',
              border: '1px solid var(--border-input)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="Buscar producto por nombre o código de barras..."
              value={busquedaProductos}
              onChange={(e) => setBusquedaProductos(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '11px 0',
                width: '100%',
                outline: 'none',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-input)',
              color: 'var(--text-primary)',
              padding: '11px 16px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
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
              background: currentFiltroStock !== 'todos' ? 'var(--color-warning-subtle)' : 'var(--bg-subtle)',
              border: currentFiltroStock !== 'todos' ? '1px solid var(--color-warning)' : '1px solid var(--border-input)',
              color: currentFiltroStock !== 'todos' ? 'var(--color-warning)' : 'var(--text-primary)',
              padding: '11px 16px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: currentFiltroStock !== 'todos' ? 700 : 600,
              outline: 'none',
              cursor: 'pointer',
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
              background: '#fef3c7',
              border: '1px solid #fde68a',
              padding: '10px 16px',
              borderRadius: '10px',
              color: '#92400e',
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
                color: '#ffffff',
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

        {/* Tabla de Productos Espaciosa */}
        <div style={{ borderRadius: '14px', overflowX: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '15px 20px', fontWeight: 700 }}>Producto</th>
                <th style={{ padding: '15px 20px', fontWeight: 700 }}>Categoría</th>
                <th style={{ padding: '15px 20px', fontWeight: 700 }}>Precio Unitario</th>
                <th style={{ padding: '15px 20px', fontWeight: 700 }}>Existencias</th>
                <th style={{ padding: '15px 20px', textAlign: 'right', fontWeight: 700 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--accent-primary)', fontSize: '0.95rem' }}>
                    Consultando catálogo en la BD...
                  </td>
                </tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      {currentFiltroStock === 'bajo' ? (
                        <>
                          <span style={{ fontSize: '2.4rem' }}>🛡️</span>
                          <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#22c55e', fontWeight: 700 }}>
                            ¡Inventario en nivel óptimo!
                          </h4>
                          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', lineHeight: '1.4' }}>
                            No hay productos que requieran reposición en este momento. Todos los artículos tienen existencias por encima de su stock mínimo.
                          </p>
                          <button
                            type="button"
                            onClick={() => updateFiltroStock('todos')}
                            style={{
                              marginTop: '8px',
                              background: 'var(--accent-primary)',
                              color: '#fff',
                              border: 'none',
                              padding: '10px 20px',
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
                          <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#22c55e', fontWeight: 700 }}>
                            ¡Ningún producto agotado!
                          </h4>
                          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', lineHeight: '1.4' }}>
                            Todo el catálogo cuenta con disponibilidad en existencias.
                          </p>
                          <button
                            type="button"
                            onClick={() => updateFiltroStock('todos')}
                            style={{
                              marginTop: '8px',
                              background: 'var(--accent-primary)',
                              color: '#fff',
                              border: 'none',
                              padding: '10px 20px',
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
                          <h4 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                            No se encontraron productos
                          </h4>
                          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                            Ningún producto coincide con &ldquo;{busquedaProductos}&rdquo;
                          </p>
                          <button
                            type="button"
                            onClick={() => setBusquedaProductos('')}
                            style={{
                              marginTop: '8px',
                              background: 'var(--bg-surface-elevated)',
                              color: 'var(--accent-primary)',
                              border: '1px solid var(--border-color)',
                              padding: '9px 18px',
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
                        <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>
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
                      style={{
                        background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.94rem' }}>{prod.nombre}</div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', display: 'inline-block' }}>
                          Cód: {prod.codigo_barras || prod.codigo || `ID-${prod.id}`}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            background: 'var(--accent-primary-subtle)',
                            color: 'var(--accent-primary)',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            letterSpacing: '0.2px',
                            border: '1px solid var(--accent-primary-border)',
                          }}
                        >
                          {prod.categoria || prod.categoria_nombre || 'General'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 800, color: '#16a34a', fontSize: '0.95rem' }}>
                        ${(Number(prod.precio) || Number(prod.precio_venta) || 0).toLocaleString('es-CO')}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              background: esAgotado
                                ? '#fee2e2'
                                : esBajo
                                ? '#fef3c7'
                                : '#dcfce7',
                              color: esAgotado ? '#b91c1c' : esBajo ? '#b45309' : '#15803d',
                              border: `1px solid ${esAgotado ? '#fecaca' : esBajo ? '#fde68a' : '#bbf7d0'}`,
                              padding: '4px 11px',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                            }}
                          >
                            {esAgotado ? 'Agotado' : esBajo ? `${stockNum} un. (Bajo)` : `${stockNum} un.`}
                          </span>

                          <Can do="edit" on="inventario">
                            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-input)', overflow: 'hidden' }}>
                              <button
                                type="button"
                                onClick={() => handleAjusteRapidoStock(prod, -1)}
                                title="Restar 1 unidad"
                                style={{
                                  background: 'transparent',
                                  color: 'var(--text-primary)',
                                  border: 'none',
                                  width: '28px',
                                  height: '28px',
                                  cursor: 'pointer',
                                  fontWeight: 800,
                                  fontSize: '0.9rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAjusteRapidoStock(prod, 1)}
                                title="Sumar 1 unidad"
                                style={{
                                  background: 'transparent',
                                  color: 'var(--text-primary)',
                                  border: 'none',
                                  borderLeft: '1px solid var(--border-input)',
                                  width: '28px',
                                  height: '28px',
                                  cursor: 'pointer',
                                  fontWeight: 800,
                                  fontSize: '0.9rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                +
                              </button>
                            </div>
                          </Can>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <Can do="edit" on="inventario">
                            <button
                              type="button"
                              onClick={() => handleAbrirEditarProducto(prod)}
                              style={{
                                background: 'var(--accent-primary-subtle)',
                                color: 'var(--accent-primary)',
                                border: '1px solid var(--accent-primary-border)',
                                padding: '7px 14px',
                                borderRadius: '9px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                transition: 'all 0.15s ease',
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
                                background: 'var(--color-danger-subtle)',
                                color: 'var(--color-danger)',
                                border: '1px solid var(--color-danger-border)',
                                padding: '7px 12px',
                                borderRadius: '9px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                transition: 'all 0.15s ease',
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

      {/* Columna Derecha: Estado del Inventario & Acceso Rápido POS (según diseño de referencia) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Estado del Inventario
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                padding: '11px 16px',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Productos</span>
              <strong style={{ color: 'var(--accent-primary)', fontSize: '1.05rem', fontWeight: 800 }}>
                {productos.length}
              </strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                padding: '11px 16px',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Stock Bajo / Crítico</span>
              <strong style={{ color: 'var(--color-danger)', fontSize: '1.05rem', fontWeight: 800 }}>
                {productos.filter((p) => Number(p.stock) <= (Number(p.stock_minimo) || 5)).length}
              </strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                padding: '11px 16px',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Categorías</span>
              <strong style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 800 }}>
                {listaCategorias.length}
              </strong>
            </div>
          </div>
        </div>

        {!isSupervisor && (
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 800 }}>
              Acceso Rápido POS
            </h4>
            <button
              type="button"
              onClick={onAbrirPos}
              style={{
                background: 'var(--accent-primary)',
                color: '#ffffff',
                border: 'none',
                padding: '13px 18px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.9rem',
                boxShadow: '0 4px 14px rgba(30, 91, 184, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              🛒 Abrir Terminal Cajero POS
            </button>
          </div>
        )}
      </div>
    </div>

      {/* MODAL UNIFICADO: Crear / Editar Producto */}
      {modalAbierto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--bg-modal-overlay)',
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
              backgroundColor: 'var(--bg-surface)',
              border: 'none',
              borderRadius: '18px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '480px',
              color: 'var(--text-primary)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.12)',
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
                  color: 'var(--text-muted)',
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
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={formularioProducto.nombre}
                  onChange={(e) => setFormularioProducto({ ...formularioProducto, nombre: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-input)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Categoría *
                    </label>
                    <button
                      type="button"
                      onClick={() => setModalCategoriaAbierto(true)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-primary)',
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
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-input)',
                      color: 'var(--text-primary)',
                      padding: '10px 14px',
                      borderRadius: '8px',
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
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Cód. Barras
                  </label>
                  <input
                    type="text"
                    value={formularioProducto.codigo_barras}
                    onChange={(e) => setFormularioProducto({ ...formularioProducto, codigo_barras: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-input)',
                      color: 'var(--text-primary)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
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
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-input)',
                      color: 'var(--text-primary)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
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
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-input)',
                      color: 'var(--text-primary)',
                      padding: '10px 14px',
                      borderRadius: '8px',
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
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-input)',
                    padding: '9px 16px',
                    borderRadius: '8px',
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
                    background: '#1e5bb8',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: '8px',
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
            backgroundColor: 'var(--bg-modal-overlay)',
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
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '430px',
              color: 'var(--text-primary)',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.12)',
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
                  color: 'var(--text-muted)',
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
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
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
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-input)',
                    color: 'var(--text-primary)',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Categorías actuales en la Base de Datos */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Categorías en Base de Datos ({listaCategorias.length}):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                  {listaCategorias.map((c) => (
                    <span
                      key={c.id}
                      style={{
                        background: 'var(--accent-primary-subtle)',
                        color: 'var(--accent-primary)',
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
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-input)',
                    padding: '9px 16px',
                    borderRadius: '8px',
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
                    background: '#1e5bb8',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: '8px',
                    cursor: guardandoCategoria ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  {guardandoCategoria ? 'Guardando...' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación moderno */}
      <ConfirmDialog />
    </div>
  );
};

export default InventarioTab;
