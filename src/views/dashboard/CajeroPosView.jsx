import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { facturacionService } from '../../services/facturacionService';
import { productosService } from '../../services/productosService';

// Catálogo de respaldo inicial
const PRODUCTOS_INICIALES = [
  { id: 1, nombre: 'Leche Entera 1L', categoria: 'Lácteos', precio: 4200, stock: 24 },
  { id: 2, nombre: 'Arroz Diana 1kg', categoria: 'Granos', precio: 4800, stock: 40 },
  { id: 3, nombre: 'Huevos AA x Unidad', categoria: 'Huevos', precio: 600, stock: 120 },
  { id: 4, nombre: 'Aceite Vegetal 900ml', categoria: 'Abarrotes', precio: 9500, stock: 15 },
  { id: 5, nombre: 'Pan Tajado Bimbo', categoria: 'Panadería', precio: 6500, stock: 18 },
  { id: 6, nombre: 'Café Sello Rojo 250g', categoria: 'Bebidas', precio: 7800, stock: 30 },
  { id: 7, nombre: 'Azúcar Morena 1kg', categoria: 'Abarrotes', precio: 4300, stock: 25 },
  { id: 8, nombre: 'Jabón Rey x Unidad', categoria: 'Aseo', precio: 2500, stock: 50 },
  { id: 9, nombre: 'Gaseosa Coca-Cola 1.5L', categoria: 'Bebidas', precio: 5500, stock: 20 },
  { id: 10, nombre: 'Lentejas 500g', categoria: 'Granos', precio: 3800, stock: 35 },
];

export const CajeroPosView = ({ user }) => {
  const [catalogo, setCatalogo] = useState(PRODUCTOS_INICIALES);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [carrito, setCarrito] = useState([]);
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final');
  const [clienteDoc, setClienteDoc] = useState('222222222');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [ventasTurno, setVentasTurno] = useState({ total: 0, transacciones: 0 });

  useEffect(() => {
    cargarCatalogo();
  }, []);

  const cargarCatalogo = async () => {
    setCargandoCatalogo(true);
    try {
      const data = await productosService.obtenerProductos();
      if (Array.isArray(data) && data.length > 0) {
        const normalizados = data.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          categoria: p.categoria || p.categoria_nombre || 'Abarrotes',
          precio: Number(p.precio) || Number(p.precio_venta) || 0,
          stock: Number(p.stock) !== undefined ? Number(p.stock) : 10,
          codigo_barras: p.codigo_barras || p.codigo || '',
        }));
        setCatalogo(normalizados);
      }
    } catch (err) {
      console.warn('Usando catálogo inicial por respaldo:', err.message);
    } finally {
      setCargandoCatalogo(false);
    }
  };

  const categorias = ['Todas', ...new Set(catalogo.map((p) => p.categoria || 'General'))];

  const productosFiltrados = catalogo.filter((prod) => {
    const q = busqueda.toLowerCase();
    const coincideNombre = (
      (prod.nombre && prod.nombre.toLowerCase().includes(q)) ||
      (prod.codigo_barras && prod.codigo_barras.toLowerCase().includes(q))
    );
    const cat = prod.categoria || 'General';
    const coincideCat = categoriaSeleccionada === 'Todas' || cat === categoriaSeleccionada;
    return coincideNombre && coincideCat;
  });

  const agregarAlCarrito = (producto) => {
    if (producto.stock <= 0) {
      toast.error(`"${producto.nombre}" está agotado`);
      return;
    }

    const itemExistente = carrito.find((item) => item.id === producto.id);
    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock) {
        toast.warning(`Stock máximo alcanzado para "${producto.nombre}" (${producto.stock} disponibles)`);
        return;
      }
      setCarrito(carrito.map((item) =>
        item.id === producto.id
          ? { ...item, cantidad: item.cantidad + 1, total: (item.cantidad + 1) * item.precio }
          : item
      ));
    } else {
      setCarrito([...carrito, {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 1,
        total: producto.precio,
        stockMax: producto.stock
      }]);
    }
  };

  const actualizarCantidad = (id, cambio) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nuevaCantidad = item.cantidad + cambio;
          if (nuevaCantidad <= 0) return null;
          if (nuevaCantidad > item.stockMax) {
            toast.warning(`Stock máximo disponible: ${item.stockMax}`);
            return item;
          }
          return { ...item, cantidad: nuevaCantidad, total: nuevaCantidad * item.precio };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter((item) => item.id !== id));
  };

  const vaciarCarrito = () => {
    setCarrito([]);
  };

  const totalPagar = carrito.reduce((acc, item) => acc + item.total, 0);
  const iva = Math.round(totalPagar * 0.19);
  const subtotal = totalPagar - iva;
  const cambio = Math.max(0, (Number(montoRecibido) || 0) - totalPagar);

  const handleFinalizarVenta = () => {
    if (carrito.length === 0) {
      toast.error('El ticket de venta está vacío');
      return;
    }

    if (metodoPago === 'Efectivo' && Number(montoRecibido) < totalPagar) {
      toast.error(`El monto recibido ($${Number(montoRecibido).toLocaleString('es-CO')}) es menor al total ($${totalPagar.toLocaleString('es-CO')})`);
      return;
    }

    const numFactura = `FAC-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      facturacionService.generarTicketPDF({
        numeroFactura: numFactura,
        cajero: user?.nombre || user?.email || 'Cajero de Turno',
        cliente: { nombre: clienteNombre, documento: clienteDoc },
        productos: carrito,
        metodoPago,
        montoRecibido: Number(montoRecibido) || totalPagar,
      });

      setVentasTurno((prev) => ({
        total: prev.total + totalPagar,
        transacciones: prev.transacciones + 1,
      }));

      setCatalogo((prevCatalogo) =>
        prevCatalogo.map((prod) => {
          const itemVendido = carrito.find((c) => c.id === prod.id);
          if (itemVendido) {
            const nuevoStock = Math.max(0, prod.stock - itemVendido.cantidad);
            productosService.actualizarProducto(prod.id, { stock: nuevoStock }).catch(() => {});
            return { ...prod, stock: nuevoStock };
          }
          return prod;
        })
      );

      setCarrito([]);
      setMontoRecibido('');
      toast.success(`¡Venta #${numFactura} registrada y ticket PDF descargado!`);
    } catch {
      toast.error('Error al generar comprobante de venta');
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.9fr) minmax(360px, 1.1fr)',
      gap: '1.75rem',
      maxWidth: '100%',
      width: '100%',
      margin: 0,
      alignItems: 'start'
    }}>
      {/* Columna Izquierda: Catálogo y Búsqueda */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Cabecera del POS - Estilo Deep Indigo sin bordes */}
        <div style={{
          background: '#151c2c',
          borderRadius: '16px',
          padding: '1.4rem 1.6rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
          border: 'none'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.4px', color: '#f8fafc' }}>
                Punto de Venta (POS)
              </h2>
            </div>
            <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Atención en caja &middot; Cajero: <strong style={{ color: '#f8fafc' }}>{user?.nombre || user?.email || 'Cajero'}</strong>
            </p>
          </div>

          {/* Resumen del Turno */}
          <div style={{
            display: 'flex',
            gap: '16px',
            background: '#0b0f19',
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Ventas del Turno
              </span>
              <strong style={{ color: '#22c55e', fontSize: '1.1rem', fontWeight: 800 }}>
                ${ventasTurno.total.toLocaleString('es-CO')}
              </strong>
            </div>
            <div style={{ paddingLeft: '14px' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tickets
              </span>
              <strong style={{ color: '#8b5cf6', fontSize: '1.1rem', fontWeight: 800 }}>
                {ventasTurno.transacciones}
              </strong>
            </div>
          </div>
        </div>

        {/* Barra de Búsqueda y Categorías */}
        <div style={{
          background: '#151c2c',
          padding: '1.25rem',
          borderRadius: '16px',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: '#0b0f19',
              borderRadius: '10px',
              padding: '0 14px',
              border: 'none'
            }}>
              <input
                type="text"
                placeholder="Buscar por nombre o código de barras..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  padding: '12px 0',
                  width: '100%',
                  outline: 'none',
                  fontSize: '0.92rem'
                }}
              />
            </div>

            <button
              type="button"
              onClick={cargarCatalogo}
              disabled={cargandoCatalogo}
              style={{
                background: '#1e273d',
                color: '#cbd5e1',
                border: 'none',
                padding: '0 18px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#283552'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#1e273d'}
            >
              {cargandoCatalogo ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>

          {/* Categorías */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaSeleccionada(cat)}
                style={{
                  background: categoriaSeleccionada === cat ? '#8b5cf6' : '#0b0f19',
                  color: categoriaSeleccionada === cat ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '7px 16px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Cuadrícula de Productos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '1rem'
        }}>
          {productosFiltrados.map((prod) => {
            const agotado = prod.stock <= 0;
            return (
              <div
                key={prod.id}
                onClick={() => !agotado && agregarAlCarrito(prod)}
                style={{
                  background: agotado ? 'rgba(21, 28, 44, 0.4)' : '#151c2c',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '1.1rem',
                  cursor: agotado ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'relative',
                  opacity: agotado ? 0.5 : 1,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.15s ease, background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!agotado) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.background = '#1e273d';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!agotado) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = '#151c2c';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    color: '#c4b5fd',
                    background: 'rgba(139, 92, 246, 0.15)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontWeight: 600
                  }}>
                    {prod.categoria}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '3px 8px',
                    borderRadius: '10px',
                    background: agotado ? 'rgba(239, 68, 68, 0.15)' : prod.stock < 10 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                    color: agotado ? '#f87171' : prod.stock < 10 ? '#fbbf24' : '#4ade80',
                    fontWeight: 700
                  }}>
                    {agotado ? 'Agotado' : `${prod.stock} un.`}
                  </span>
                </div>

                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem', lineHeight: '1.3', marginTop: '4px' }}>
                  {prod.nombre}
                </div>

                <div style={{
                  marginTop: 'auto',
                  paddingTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <strong style={{ color: '#22c55e', fontSize: '1.05rem', fontWeight: 800 }}>
                    ${prod.precio.toLocaleString('es-CO')}
                  </strong>
                  <div style={{
                    background: agotado ? '#1e273d' : '#8b5cf6',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}>
                    + Agregar
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Columna Derecha: Ticket de Venta y Cobro */}
      <section style={{
        background: '#151c2c',
        border: 'none',
        borderRadius: '16px',
        padding: '1.4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.1rem',
        position: 'sticky',
        top: '80px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Encabezado del Ticket */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 800 }}>
              Ticket de Venta
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {carrito.length} {carrito.length === 1 ? 'producto' : 'productos'} agregados
            </span>
          </div>
          {carrito.length > 0 && (
            <button
              type="button"
              onClick={vaciarCarrito}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: 'none',
                color: '#f87171',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 600
              }}
            >
              Vaciar
            </button>
          )}
        </div>

        {/* Datos del Cliente */}
        <div style={{
          background: '#0b0f19',
          padding: '12px 14px',
          borderRadius: '12px',
          border: 'none',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Cliente</label>
            <input
              type="text"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', width: '100%', outline: 'none', fontWeight: 700 }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '2px', fontWeight: 600 }}>C.C. / NIT</label>
            <input
              type="text"
              value={clienteDoc}
              onChange={(e) => setClienteDoc(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#c4b5fd', fontSize: '0.85rem', width: '100%', outline: 'none', fontWeight: 700 }}
            />
          </div>
        </div>

        {/* Lista de Items del Carrito */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '260px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>Selecciona productos del catálogo para agregarlos al ticket de venta.</p>
            </div>
          ) : (
            carrito.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#0b0f19',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                    {item.nombre}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    ${item.precio.toLocaleString('es-CO')} c/u
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#151c2c', borderRadius: '6px', padding: '3px' }}>
                    <button
                      type="button"
                      onClick={() => actualizarCantidad(item.id, -1)}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 8px', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', minWidth: '18px', textAlign: 'center' }}>
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => actualizarCantidad(item.id, 1)}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 8px', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                      +
                    </button>
                  </div>

                  <strong style={{ color: '#22c55e', fontSize: '0.88rem', minWidth: '65px', textAlign: 'right' }}>
                    ${item.total.toLocaleString('es-CO')}
                  </strong>

                  <button
                    type="button"
                    onClick={() => eliminarDelCarrito(item.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Método de Pago */}
        <div>
          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
            Método de Pago
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {['Efectivo', 'Nequi', 'Tarjeta'].map((metodo) => (
              <button
                key={metodo}
                type="button"
                onClick={() => setMetodoPago(metodo)}
                style={{
                  background: metodoPago === metodo ? '#8b5cf6' : '#0b0f19',
                  color: metodoPago === metodo ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                {metodo}
              </button>
            ))}
          </div>
        </div>

        {/* Monto Recibido y Cambio */}
        {metodoPago === 'Efectivo' && (
          <div style={{
            background: '#0b0f19',
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            alignItems: 'center'
          }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Recibido ($)</label>
              <input
                type="number"
                placeholder={totalPagar.toString()}
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
                style={{ background: '#151c2c', border: 'none', color: '#fff', padding: '8px', borderRadius: '6px', width: '100%', fontSize: '0.88rem', fontWeight: 700, outline: 'none' }}
              />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Cambio / Vueltas</span>
              <strong style={{ color: '#22c55e', fontSize: '1.05rem', fontWeight: 800 }}>
                ${cambio.toLocaleString('es-CO')}
              </strong>
            </div>
          </div>
        )}

        {/* Totales y Botón de Cobro */}
        <div style={{
          background: '#0b0f19',
          padding: '14px',
          borderRadius: '12px',
          border: 'none',
          marginTop: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#94a3b8' }}>
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString('es-CO')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
            <span>IVA (19% inc.)</span>
            <span>${iva.toLocaleString('es-CO')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginTop: '10px' }}>
            <span>TOTAL</span>
            <span style={{ color: '#22c55e' }}>${totalPagar.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <button
          onClick={handleFinalizarVenta}
          disabled={carrito.length === 0}
          style={{
            background: carrito.length === 0 ? '#1e273d' : '#8b5cf6',
            color: '#fff',
            border: 'none',
            padding: '14px',
            borderRadius: '12px',
            cursor: carrito.length === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 800,
            fontSize: '0.95rem',
            transition: 'background 0.2s ease',
            boxShadow: carrito.length > 0 ? '0 4px 20px rgba(139, 92, 246, 0.4)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (carrito.length > 0) e.currentTarget.style.background = '#7c3aed';
          }}
          onMouseLeave={(e) => {
            if (carrito.length > 0) e.currentTarget.style.background = '#8b5cf6';
          }}
        >
          Cobrar y Emitir Factura PDF
        </button>
      </section>
    </div>
  );
};

export default CajeroPosView;
