import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Receipt, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  CheckCircle2, 
  Sparkles,
  Package,
  UserCheck,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { facturacionService } from '../../services/facturacionService';
import WeatherWidget from '../../components/WeatherWidget';

// Catálogo de productos común en Tienda Comunitaria
const PRODUCTOS_INICIALES = [
  { id: 1, nombre: 'Leche Entera 1L', categoria: 'Lácteos', precio: 4200, stock: 24, emoji: '🥛' },
  { id: 2, nombre: 'Arroz Diana 1kg', categoria: 'Granos', precio: 4800, stock: 40, emoji: '🍚' },
  { id: 3, nombre: 'Huevos AA x Unidad', categoria: 'Huevos', precio: 600, stock: 120, emoji: '🥚' },
  { id: 4, nombre: 'Aceite Vegetal 900ml', categoria: 'Abarrotes', precio: 9500, stock: 15, emoji: '🌻' },
  { id: 5, nombre: 'Pan Tajado Bimbo', categoria: 'Panadería', precio: 6500, stock: 18, emoji: '🍞' },
  { id: 6, nombre: 'Café Sello Rojo 250g', categoria: 'Bebidas', precio: 7800, stock: 30, emoji: '☕' },
  { id: 7, nombre: 'Azúcar Morena 1kg', categoria: 'Abarrotes', precio: 4300, stock: 25, emoji: '🥣' },
  { id: 8, nombre: 'Jabón Rey x Unidad', categoria: 'Aseo', precio: 2500, stock: 50, emoji: '🧼' },
  { id: 9, nombre: 'Gaseosa Coca-Cola 1.5L', categoria: 'Bebidas', precio: 5500, stock: 20, emoji: '🥤' },
  { id: 10, nombre: 'Lentejas 500g', categoria: 'Granos', precio: 3800, stock: 35, emoji: '🍲' },
];

export const CajeroPosView = ({ user }) => {
  const [catalogo, setCatalogo] = useState(PRODUCTOS_INICIALES);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [carrito, setCarrito] = useState([]);
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final');
  const [clienteDoc, setClienteDoc] = useState('222222222');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [ventasTurno, setVentasTurno] = useState({ total: 0, transacciones: 0 });

  const categorias = ['Todas', ...new Set(PRODUCTOS_INICIALES.map((p) => p.categoria))];

  const productosFiltrados = catalogo.filter((prod) => {
    const coincideNombre = prod.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCat = categoriaSeleccionada === 'Todas' || prod.categoria === categoriaSeleccionada;
    return coincideNombre && coincideCat;
  });

  // Agregar producto al carrito
  const agregarAlCarrito = (producto) => {
    const itemExistente = carrito.find((item) => item.id === producto.id);
    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock) {
        toast.warning(`No hay más stock disponible de ${producto.nombre}`);
        return;
      }
      setCarrito(
        carrito.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1, total: (item.cantidad + 1) * item.precio }
            : item
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
          total: producto.precio,
          emoji: producto.emoji,
        },
      ]);
    }
    toast.success(`${producto.nombre} añadido`);
  };

  // Modificar cantidad en carrito
  const actualizarCantidad = (id, delta) => {
    setCarrito(
      carrito
        .map((item) => {
          if (item.id === id) {
            const nuevaCantidad = item.cantidad + delta;
            return nuevaCantidad > 0
              ? { ...item, cantidad: nuevaCantidad, total: nuevaCantidad * item.precio }
              : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter((item) => item.id !== id));
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    toast.info('Carrito vaciado');
  };

  // Totales
  const subtotal = carrito.reduce((acc, item) => acc + item.total, 0);
  const iva = Math.round(subtotal * 0.19);
  const totalPagar = subtotal;
  const cambio = Math.max(0, (Number(montoRecibido) || 0) - totalPagar);

  // Completar Venta y Generar Factura PDF
  const handleFinalizarVenta = () => {
    if (carrito.length === 0) {
      toast.error('El carrito de compras está vacío');
      return;
    }

    if (metodoPago === 'Efectivo' && Number(montoRecibido) < totalPagar) {
      toast.error(`El monto recibido ($${Number(montoRecibido).toLocaleString('es-CO')}) es menor al total`);
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

      // Actualizar métricas del turno
      setVentasTurno((prev) => ({
        total: prev.total + totalPagar,
        transacciones: prev.transacciones + 1,
      }));

      // Descontar stock localmente
      setCatalogo((prevCatalogo) =>
        prevCatalogo.map((prod) => {
          const itemVendido = carrito.find((c) => c.id === prod.id);
          if (itemVendido) {
            return { ...prod, stock: Math.max(0, prod.stock - itemVendido.cantidad) };
          }
          return prod;
        })
      );

      // Limpiar formulario
      setCarrito([]);
      setMontoRecibido('');
      toast.success(`¡Venta #${numFactura} completada y ticket PDF generado!`);
    } catch {
      toast.error('Error al generar comprobante de venta');
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.8fr) minmax(360px, 1.2fr)',
      gap: '1.5rem',
      maxWidth: '1400px',
      width: '100%',
      margin: '0 auto',
      alignItems: 'start'
    }}>
      {/* Columna Izquierda: Catálogo y Búsqueda */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {/* Cabecera del POS */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b, #0f172a)',
          border: '1px solid #059669',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
              <ShoppingCart size={22} />
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Punto de Venta (POS)</h2>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Atención de mostrador &middot; Cajero: <strong style={{ color: '#f8fafc' }}>{user?.nombre || user?.email || 'Cajero'}</strong>
            </p>
          </div>

          {/* Resumen del Turno */}
          <div style={{
            display: 'flex',
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1px solid #334155'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Ventas del Turno</span>
              <strong style={{ color: '#34d399', fontSize: '1rem' }}>
                ${ventasTurno.total.toLocaleString('es-CO')}
              </strong>
            </div>
            <div style={{ borderLeft: '1px solid #334155', paddingLeft: '12px' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Tickets</span>
              <strong style={{ color: '#38bdf8', fontSize: '1rem' }}>{ventasTurno.transacciones}</strong>
            </div>
          </div>
        </div>

        {/* Barra de Búsqueda y Categorías */}
        <div style={{
          background: '#1e293b',
          padding: '1rem',
          borderRadius: '14px',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: '#0f172a',
              border: '1px solid #475569',
              borderRadius: '8px',
              padding: '0 12px',
              gap: '8px'
            }}>
              <Search size={18} color="#94a3b8" />
              <input
                type="text"
                placeholder="Buscar por nombre (ej: Leche, Arroz, Café)..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 0',
                  width: '100%',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          {/* Filtros de Categorías */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaSeleccionada(cat)}
                style={{
                  background: categoriaSeleccionada === cat ? '#10b981' : '#0f172a',
                  color: categoriaSeleccionada === cat ? '#022c22' : '#cbd5e1',
                  border: '1px solid',
                  borderColor: categoriaSeleccionada === cat ? '#10b981' : '#334155',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
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
          gap: '12px'
        }}>
          {productosFiltrados.map((prod) => (
            <div
              key={prod.id}
              onClick={() => agregarAlCarrito(prod)}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#38bdf8')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#334155')}
            >
              <div>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '6px' }}>
                  {prod.emoji}
                </span>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#f8fafc', fontWeight: 600 }}>
                  {prod.nombre}
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>
                  {prod.categoria} &middot; Stock: {prod.stock}
                </span>
              </div>

              <div style={{
                marginTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #334155',
                paddingTop: '8px'
              }}>
                <strong style={{ color: '#34d399', fontSize: '1rem' }}>
                  ${prod.precio.toLocaleString('es-CO')}
                </strong>
                <button
                  type="button"
                  style={{
                    background: '#059669',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '6px',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Añadir a la venta"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Columna Derecha: Carrito de Venta y Cobro */}
      <section style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '16px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'sticky',
        top: '1rem'
      }}>
        {/* Cabecera del Carrito */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #334155',
          paddingBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={20} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>
              Ticket de Venta ({carrito.reduce((acc, c) => acc + c.cantidad, 0)})
            </h3>
          </div>
          {carrito.length > 0 && (
            <button
              onClick={vaciarCarrito}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f87171',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Trash2 size={14} /> Vaciar
            </button>
          )}
        </div>

        {/* Datos Rápidos del Cliente */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '8px',
          background: '#0f172a',
          padding: '10px',
          borderRadius: '10px',
          border: '1px solid #334155'
        }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Cliente</label>
            <input
              type="text"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              style={{ background: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '4px 8px', borderRadius: '6px', width: '100%', fontSize: '0.8rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Documento</label>
            <input
              type="text"
              value={clienteDoc}
              onChange={(e) => setClienteDoc(e.target.value)}
              style={{ background: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '4px 8px', borderRadius: '6px', width: '100%', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {/* Lista de Ítems en Carrito */}
        <div style={{
          maxHeight: '260px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '4px'
        }}>
          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
              <ShoppingCart size={36} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Selecciona productos del catálogo para agregarlos al ticket de venta.</p>
            </div>
          ) : (
            carrito.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#0f172a',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #334155'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.emoji} {item.nombre}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    ${item.precio.toLocaleString('es-CO')} c/u
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => actualizarCantidad(item.id, -1)}
                    style={{ background: '#334155', border: 'none', color: '#fff', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => actualizarCantidad(item.id, 1)}
                    style={{ background: '#334155', border: 'none', color: '#fff', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <strong style={{ color: '#38bdf8', fontSize: '0.85rem', marginLeft: '12px', minWidth: '60px', textAlign: 'right' }}>
                  ${item.total.toLocaleString('es-CO')}
                </strong>
              </div>
            ))
          )}
        </div>

        {/* Método de Pago */}
        <div>
          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
            Método de Pago
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {['Efectivo', 'Nequi', 'Tarjeta'].map((metodo) => (
              <button
                key={metodo}
                type="button"
                onClick={() => setMetodoPago(metodo)}
                style={{
                  background: metodoPago === metodo ? '#38bdf8' : '#0f172a',
                  color: metodoPago === metodo ? '#0f172a' : '#cbd5e1',
                  border: '1px solid',
                  borderColor: metodoPago === metodo ? '#38bdf8' : '#334155',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {metodo}
              </button>
            ))}
          </div>
        </div>

        {/* Monto Recibido y Cambio (para efectivo) */}
        {metodoPago === 'Efectivo' && (
          <div style={{
            background: '#0f172a',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #334155',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            alignItems: 'center'
          }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Recibido ($)</label>
              <input
                type="number"
                placeholder={totalPagar.toString()}
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
                style={{ background: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '6px', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Cambio / Vueltas</span>
              <strong style={{ color: '#4ade80', fontSize: '0.95rem' }}>
                ${cambio.toLocaleString('es-CO')}
              </strong>
            </div>
          </div>
        )}

        {/* Totales y Botón de Cobro */}
        <div style={{
          background: '#0f172a',
          padding: '12px',
          borderRadius: '10px',
          border: '1px solid #334155',
          marginTop: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>Subtotal:</span>
            <span>${subtotal.toLocaleString('es-CO')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
            <span>IVA (19% inc.):</span>
            <span>${iva.toLocaleString('es-CO')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: '#34d399', marginTop: '8px', borderTop: '1px solid #334155', paddingTop: '6px' }}>
            <span>TOTAL:</span>
            <span>${totalPagar.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <button
          onClick={handleFinalizarVenta}
          disabled={carrito.length === 0}
          style={{
            background: carrito.length === 0 ? '#334155' : 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            border: 'none',
            padding: '12px',
            borderRadius: '10px',
            cursor: carrito.length === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 800,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: carrito.length > 0 ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
          }}
        >
          <Receipt size={18} /> Cobrar y Emitir Factura PDF
        </button>
      </section>
    </div>
  );
};

export default CajeroPosView;
