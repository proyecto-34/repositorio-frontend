import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { facturacionService } from '../../services/facturacionService';
import { productosService } from '../../services/productosService';
import { formatearCOP } from '../../utils/formatters';
import '../../styles/pos.css';

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
  const [guardandoVenta, setGuardandoVenta] = useState(false);

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
          categoria: p.categoria || p.categoria_nombre || 'General',
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

  // Categorías dinámicas memoizadas
  const categorias = useMemo(() => {
    return ['Todas', ...new Set(catalogo.map((p) => p.categoria || 'General'))];
  }, [catalogo]);

  // Filtro de productos optimizado
  const productosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return catalogo.filter((prod) => {
      const coincideNombre = (
        (prod.nombre && prod.nombre.toLowerCase().includes(q)) ||
        (prod.codigo_barras && prod.codigo_barras.toLowerCase().includes(q))
      );
      const cat = prod.categoria || 'General';
      const coincideCat = categoriaSeleccionada === 'Todas' || cat === categoriaSeleccionada;
      return coincideNombre && coincideCat;
    });
  }, [catalogo, busqueda, categoriaSeleccionada]);

  // Totales de la venta memoizados
  const { totalPagar, iva, subtotal, cambio } = useMemo(() => {
    const total = carrito.reduce((acc, item) => acc + item.total, 0);
    const imp = Math.round(total * 0.19);
    const sub = total - imp;
    const vueltas = Math.max(0, (Number(montoRecibido) || 0) - total);
    return { totalPagar: total, iva: imp, subtotal: sub, cambio: vueltas };
  }, [carrito, montoRecibido]);

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

  const actualizarCantidad = (id, cambioQty) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nuevaCantidad = item.cantidad + cambioQty;
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

  const handleFinalizarVenta = async () => {
    if (carrito.length === 0) {
      toast.error('El ticket de venta está vacío');
      return;
    }

    if (metodoPago === 'Efectivo' && Number(montoRecibido) < totalPagar) {
      toast.error(`El monto recibido (${formatearCOP(montoRecibido)}) es menor al total (${formatearCOP(totalPagar)})`);
      return;
    }

    setGuardandoVenta(true);

    try {
      // 1. Preparar payload según CreateVentaDto de NestJS
      const ventaPayload = {
        total: Number(totalPagar) || 0,
        cliente: (clienteNombre || '').trim() || 'Consumidor Final',
        detalles: carrito.map((item) => ({
          id_producto: Number(item.id),
          cantidad: Number(item.cantidad),
          subtotal: Number(item.total || (item.precio * item.cantidad)),
        })),
      };

      // 2. Enviar a NestJS (POST /ventas): inserta en BD y descuenta stock
      const ventaGuardada = await facturacionService.registrarVenta(ventaPayload);

      const nroFactura = ventaGuardada?.id 
        ? `FAC-${String(ventaGuardada.id).padStart(4, '0')}` 
        : `FAC-${Math.floor(1000 + Math.random() * 9000)}`;

      // 3. Generar y descargar el comprobante PDF oficial
      try {
        facturacionService.generarTicketPDF({
          numeroFactura: nroFactura,
          cajero: user?.nombre || user?.email || 'Cajero de Turno',
          cliente: { nombre: clienteNombre, documento: clienteDoc },
          productos: carrito,
          metodoPago,
          montoRecibido: Number(montoRecibido) || totalPagar,
        });
      } catch (pdfErr) {
        console.warn('No se pudo generar el PDF pero la venta fue guardada en BD:', pdfErr);
      }

      // 4. Actualizar estadísticas del turno
      setVentasTurno((prev) => ({
        total: prev.total + totalPagar,
        transacciones: prev.transacciones + 1,
      }));

      // 5. Recargar catálogo para refrescar el stock real descontado
      await cargarCatalogo();

      // 6. Limpiar carrito y campos
      setCarrito([]);
      setMontoRecibido('');
      toast.success(`¡Venta #${nroFactura} registrada exitosamente en la BD!`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al procesar la venta en la BD';
      toast.error(`Error: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
    } finally {
      setGuardandoVenta(false);
    }
  };

  return (
    <div className="pos-container">
      {/* Columna Izquierda: Catálogo y Búsqueda */}
      <section className="pos-catalog-section">
        {/* Cabecera del POS */}
        <div className="pos-header-card">
          <div>
            <div className="pos-header-title-row">
              <span className="pos-header-dot" />
              <h2 className="pos-header-title">Punto de Venta (POS)</h2>
            </div>
            <p className="pos-header-subtitle">
              Atención en caja &middot; Cajero: <strong>{user?.nombre || user?.email || 'Cajero'}</strong>
            </p>
          </div>

          {/* Resumen del Turno */}
          <div className="pos-turn-summary">
            <div>
              <span className="pos-turn-stat-label">Ventas del Turno</span>
              <strong className="pos-turn-stat-value-green">{formatearCOP(ventasTurno.total)}</strong>
            </div>
            <div style={{ paddingLeft: '14px' }}>
              <span className="pos-turn-stat-label">Tickets</span>
              <strong className="pos-turn-stat-value-purple">{ventasTurno.transacciones}</strong>
            </div>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtro de Categorías */}
        <div className="pos-search-card">
          <div className="pos-search-row">
            <div className="pos-search-input-wrapper">
              <input
                type="text"
                placeholder="Buscar por nombre o código de barras..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pos-search-input"
              />
            </div>

            <button
              type="button"
              onClick={cargarCatalogo}
              disabled={cargandoCatalogo}
              className="pos-btn-reload"
            >
              {cargandoCatalogo ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>

          {/* Categorías */}
          <div className="pos-categories-pill-list">
            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaSeleccionada(cat)}
                className={`pos-category-pill ${categoriaSeleccionada === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Cuadrícula de Productos */}
        <div className="pos-products-grid">
          {productosFiltrados.map((prod) => {
            const agotado = prod.stock <= 0;
            const stockClase = agotado ? 'agotado' : prod.stock < 10 ? 'bajo' : 'normal';

            return (
              <div
                key={prod.id}
                onClick={() => !agotado && agregarAlCarrito(prod)}
                className={`pos-product-card ${agotado ? 'agotado' : ''}`}
              >
                <div className="pos-product-card-top">
                  <span className="pos-category-badge">{prod.categoria}</span>
                  <span className={`pos-stock-badge ${stockClase}`}>
                    {agotado ? 'Agotado' : `${prod.stock} un.`}
                  </span>
                </div>

                <div className="pos-product-name">{prod.nombre}</div>

                <div className="pos-product-bottom">
                  <strong className="pos-product-price">{formatearCOP(prod.precio)}</strong>
                  <div className="pos-btn-add">+ Agregar</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Columna Derecha: Ticket de Venta y Cobro */}
      <section className="pos-ticket-panel">
        {/* Encabezado del Ticket */}
        <div className="pos-ticket-header">
          <div>
            <h3 className="pos-ticket-title">Ticket de Venta</h3>
            <span className="pos-ticket-subtitle">
              {carrito.length} {carrito.length === 1 ? 'producto' : 'productos'} agregados
            </span>
          </div>
          {carrito.length > 0 && (
            <button type="button" onClick={vaciarCarrito} className="pos-btn-vaciar">
              Vaciar
            </button>
          )}
        </div>

        {/* Datos del Cliente */}
        <div className="pos-customer-card">
          <div>
            <label className="pos-field-label">Cliente</label>
            <input
              type="text"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              className="pos-field-input"
            />
          </div>
          <div>
            <label className="pos-field-label">C.C. / NIT</label>
            <input
              type="text"
              value={clienteDoc}
              onChange={(e) => setClienteDoc(e.target.value)}
              className="pos-field-input purple"
            />
          </div>
        </div>

        {/* Lista de Items del Carrito */}
        <div className="pos-cart-list">
          {carrito.length === 0 ? (
            <div className="pos-cart-empty">
              <p style={{ margin: 0, fontSize: '0.88rem' }}>Selecciona productos del catálogo para agregarlos al ticket.</p>
            </div>
          ) : (
            carrito.map((item) => (
              <div key={item.id} className="pos-cart-item">
                <div className="pos-cart-item-info">
                  <div className="pos-cart-item-name">{item.nombre}</div>
                  <span className="pos-cart-item-price">{formatearCOP(item.precio)} c/u</span>
                </div>

                <div className="pos-cart-item-actions">
                  <div className="pos-qty-stepper">
                    <button
                      type="button"
                      onClick={() => actualizarCantidad(item.id, -1)}
                      className="pos-btn-step"
                    >
                      -
                    </button>
                    <span className="pos-qty-display">{item.cantidad}</span>
                    <button
                      type="button"
                      onClick={() => actualizarCantidad(item.id, 1)}
                      className="pos-btn-step"
                    >
                      +
                    </button>
                  </div>

                  <strong className="pos-cart-item-total">{formatearCOP(item.total)}</strong>

                  <button
                    type="button"
                    onClick={() => eliminarDelCarrito(item.id)}
                    className="pos-btn-quitar"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selector de Método de Pago */}
        <div className="pos-payment-section">
          <label className="pos-field-label" style={{ marginBottom: '8px' }}>Método de Pago</label>
          <div className="pos-payment-grid">
            {['Efectivo', 'Nequi', 'Tarjeta'].map((metodo) => (
              <button
                key={metodo}
                type="button"
                onClick={() => setMetodoPago(metodo)}
                className={`pos-payment-btn ${metodoPago === metodo ? 'active' : ''}`}
              >
                {metodo}
              </button>
            ))}
          </div>
        </div>

        {/* Monto Recibido y Cambio */}
        {metodoPago === 'Efectivo' && (
          <div className="pos-cash-calculator">
            <div>
              <label className="pos-field-label">Recibido ($)</label>
              <input
                type="number"
                placeholder={totalPagar.toString()}
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
                className="pos-cash-input"
              />
            </div>
            <div>
              <span className="pos-field-label">Cambio / Vueltas</span>
              <strong className="pos-cash-change">{formatearCOP(cambio)}</strong>
            </div>
          </div>
        )}

        {/* Totales y Botón de Cobro */}
        <div className="pos-totals-card">
          <div className="pos-totals-row">
            <span>Subtotal</span>
            <span>{formatearCOP(subtotal)}</span>
          </div>
          <div className="pos-totals-row">
            <span>IVA (19% inc.)</span>
            <span>{formatearCOP(iva)}</span>
          </div>
          <div className="pos-totals-row grand-total">
            <span>TOTAL</span>
            <span className="amount">{formatearCOP(totalPagar)}</span>
          </div>
        </div>

        <button
          onClick={handleFinalizarVenta}
          disabled={carrito.length === 0 || guardandoVenta}
          className="pos-btn-checkout"
        >
          {guardandoVenta ? 'Procesando y Guardando en BD...' : 'Cobrar y Emitir Factura PDF'}
        </button>
      </section>
    </div>
  );
};

export default CajeroPosView;
