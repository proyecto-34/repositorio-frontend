import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Search,
  RefreshCw,
  Trash2,
  Plus,
  Minus,
  User as UserIcon,
  DollarSign,
  Receipt,
  CreditCard,
  Smartphone,
  Banknote,
  ShoppingBag,
  CheckCircle2,
  X,
} from 'lucide-react';
import { facturacionService } from '../../services/facturacionService';
import { productosService } from '../../services/productosService';
import pagosService from '../../services/pagosService';
import { formatearCOP } from '../../utils/formatters';
import '../../styles/pos.css';

export const CajeroPosView = ({ user }) => {
  const [catalogo, setCatalogo] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [carrito, setCarrito] = useState([]);
  const [clienteDoc, setClienteDoc] = useState('222222222222');
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
      if (Array.isArray(data)) {
        const normalizados = data.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          categoria: p.categoria || p.categoria_nombre || 'General',
          precio: Number(p.precio) || Number(p.precio_venta) || 0,
          stock: Number(p.stock !== undefined && p.stock !== null ? p.stock : (p.cantidad ?? 0)),
          codigo_barras: p.codigo_barras || p.codigo || '',
        }));
        setCatalogo(normalizados);
      } else {
        setCatalogo([]);
      }
    } catch (err) {
      console.warn('Error al cargar catálogo de la BD:', err.message);
      setCatalogo([]);
    } finally {
      setCargandoCatalogo(false);
    }
  };

  // Categorías con conteo de productos para píldoras dinámicas
  const categorias = useMemo(() => {
    const conteo = {};
    catalogo.forEach((p) => {
      const cat = p.categoria || 'General';
      conteo[cat] = (conteo[cat] || 0) + 1;
    });
    return [
      { nombre: 'Todas', total: catalogo.length },
      ...Object.keys(conteo).map((nombre) => ({ nombre, total: conteo[nombre] })),
    ];
  }, [catalogo]);

  // Mapa rápido de productos en carrito para feedback visual en las tarjetas
  const carritoMap = useMemo(() => {
    const map = new Map();
    carrito.forEach((item) => map.set(item.id, item));
    return map;
  }, [carrito]);

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
          const cantActual = Number(item.cantidad) || 0;
          const nuevaCantidad = cantActual + cambioQty;
          if (nuevaCantidad <= 0) return null;
          if (item.stockMax && nuevaCantidad > item.stockMax) {
            toast.warning(`Stock máximo disponible para ${item.nombre}: ${item.stockMax}`);
            return item;
          }
          return { ...item, cantidad: nuevaCantidad, total: nuevaCantidad * item.precio };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const establecerCantidadDirecta = (id, valor) => {
    if (valor === '') {
      setCarrito((prev) =>
        prev.map((item) => (item.id === id ? { ...item, cantidad: '', total: 0 } : item))
      );
      return;
    }

    const num = parseInt(valor, 10);
    if (isNaN(num)) return;

    setCarrito((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          let nuevaQty = Math.max(1, num);
          if (item.stockMax && nuevaQty > item.stockMax) {
            toast.warning(`Stock máximo disponible para ${item.nombre}: ${item.stockMax}`);
            nuevaQty = item.stockMax;
          }
          return { ...item, cantidad: nuevaQty, total: nuevaQty * item.precio };
        }
        return item;
      })
    );
  };

  const handleBlurCantidad = (id) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const cant = Number(item.cantidad);
          if (!cant || cant < 1) {
            return { ...item, cantidad: 1, total: item.precio };
          }
        }
        return item;
      })
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
      const docVal = (clienteDoc || '').trim() || '222222222222';
      const ventaPayload = {
        total: Number(totalPagar) || 0,
        cliente: docVal,
        documento: docVal,
        detalles: carrito.map((item) => {
          const qty = Math.max(1, Number(item.cantidad) || 1);
          return {
            id_producto: Number(item.id),
            cantidad: qty,
            subtotal: Number(item.total || (item.precio * qty)),
          };
        }),
      };

      // 2. Enviar a NestJS (POST /ventas): inserta en BD y descuenta stock
      const ventaGuardada = await facturacionService.registrarVenta(ventaPayload);

      // 3. Registrar el Pago en la BD (POST /pagos)
      const metodoMapeado = metodoPago === 'Tarjeta' ? 'TARJETA' : (metodoPago === 'Nequi' ? 'TRANSFERENCIA' : 'EFECTIVO');
      try {
        await pagosService.crearPago({
          ventaId: ventaGuardada.id,
          metodo: metodoMapeado,
          monto: Number(totalPagar),
        });
      } catch (pagoErr) {
        console.warn('Error al registrar pago en la BD:', pagoErr);
      }

      const nroFactura = ventaGuardada?.id 
        ? `FAC-${String(ventaGuardada.id).padStart(6, '0')}` 
        : `FAC-000001`;

      // 4. Generar y descargar el comprobante PDF oficial con C.C. / NIT
      try {
        facturacionService.generarTicketPDF({
          numeroFactura: nroFactura,
          cajero: user?.nombre || user?.email || 'Cajero de Turno',
          cliente: docVal,
          documento: docVal,
          clienteDoc: docVal,
          productos: carrito,
          metodoPago: metodoMapeado,
          montoRecibido: Number(montoRecibido) || totalPagar,
        });
      } catch (pdfErr) {
        console.warn('No se pudo generar el PDF pero la venta fue guardada en BD:', pdfErr);
      }

      // 5. Actualizar estadísticas del turno
      setVentasTurno((prev) => ({
        total: prev.total + totalPagar,
        transacciones: prev.transacciones + 1,
      }));

      // 6. Recargar catálogo para refrescar el stock real descontado
      await cargarCatalogo();

      // 7. Limpiar carrito y campos
      setCarrito([]);
      setMontoRecibido('');
      setClienteDoc('222222222222');
      toast.success(`¡Venta #${nroFactura} registrada exitosamente en la BD!`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al procesar la venta en la BD';
      toast.error(`Error: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
    } finally {
      setGuardandoVenta(false);
    }
  };

  const totalUnidadesCarrito = useMemo(() => {
    return carrito.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0);
  }, [carrito]);

  // Sugerencias de efectivo redondeado
  const sugerenciasEfectivo = useMemo(() => {
    if (totalPagar <= 0) return [];
    const list = [totalPagar];
    const red10 = Math.ceil(totalPagar / 10000) * 10000;
    if (red10 > totalPagar && !list.includes(red10)) list.push(red10);
    const red20 = Math.ceil(totalPagar / 20000) * 20000;
    if (red20 > totalPagar && !list.includes(red20)) list.push(red20);
    const red50 = Math.ceil(totalPagar / 50000) * 50000;
    if (red50 > totalPagar && !list.includes(red50)) list.push(red50);
    return list.slice(0, 4);
  }, [totalPagar]);

  return (
    <div className="pos-container">
      {/* Columna Izquierda: Catálogo y Búsqueda */}
      <section className="pos-catalog-section">
        {/* Cabecera del POS */}
        <div className="pos-header-card">
          <div className="pos-header-left">
            <span className="pos-header-status-badge">
              <span className="pos-header-status-dot" />
              Terminal en Línea · BD Sincronizada
            </span>
            <div className="pos-header-title-row">
              <h2 className="pos-header-title">Punto de Venta (POS)</h2>
            </div>
            <p className="pos-header-subtitle">
              <UserIcon size={14} style={{ color: 'var(--text-muted)' }} />
              Atención en caja &middot; Cajero: <strong>{user?.nombre || user?.email || 'Cajero de Turno'}</strong>
            </p>
          </div>

          {/* Resumen del Turno con Micro-Tarjetas */}
          <div className="pos-turn-summary">
            <div className="pos-turn-stat-card">
              <div className="pos-turn-stat-icon green">
                <DollarSign size={18} />
              </div>
              <div>
                <span className="pos-turn-stat-label">Ventas del Turno</span>
                <strong className="pos-turn-stat-value-green notranslate" translate="no">
                  {formatearCOP(ventasTurno.total)}
                </strong>
              </div>
            </div>

            <div className="pos-turn-stat-card">
              <div className="pos-turn-stat-icon blue">
                <Receipt size={18} />
              </div>
              <div>
                <span className="pos-turn-stat-label">Tickets Emitidos</span>
                <strong className="pos-turn-stat-value-purple">
                  {ventasTurno.transacciones}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtro de Categorías */}
        <div className="pos-search-card">
          <div className="pos-search-row">
            <div className="pos-search-input-wrapper">
              <Search size={18} className="pos-search-input-icon" />
              <input
                type="text"
                placeholder="Buscar por nombre o código de barras..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pos-search-input"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="pos-search-clear-btn"
                  title="Limpiar búsqueda"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={cargarCatalogo}
              disabled={cargandoCatalogo}
              className="pos-btn-reload"
              title="Recargar catálogo desde la base de datos"
            >
              <RefreshCw size={15} style={{ animation: cargandoCatalogo ? 'posPulse 1s linear infinite' : 'none' }} />
              <span>{cargandoCatalogo ? 'Cargando...' : 'Actualizar'}</span>
            </button>
          </div>

          {/* Categorías con Contador */}
          <div className="pos-categories-pill-list">
            {categorias.map((cat) => (
              <button
                key={cat.nombre}
                type="button"
                onClick={() => setCategoriaSeleccionada(cat.nombre)}
                className={`pos-category-pill ${categoriaSeleccionada === cat.nombre ? 'active' : ''}`}
              >
                <span>{cat.nombre}</span>
                <span className="pos-category-pill-count">{cat.total}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cuadrícula de Productos */}
        <div className="pos-products-grid">
          {productosFiltrados.map((prod) => {
            const agotado = prod.stock <= 0;
            const bajo = prod.stock < 10 && !agotado;
            const stockClase = agotado ? 'agotado' : bajo ? 'bajo' : 'normal';
            const itemInCart = carritoMap.get(prod.id);

            return (
              <div
                key={prod.id}
                onClick={() => !agotado && agregarAlCarrito(prod)}
                className={`pos-product-card ${agotado ? 'agotado' : ''} ${itemInCart ? 'in-cart' : ''}`}
                title={agotado ? 'Producto agotado' : `Clic para agregar al ticket (Stock: ${prod.stock})`}
              >
                {itemInCart && (
                  <span className="pos-in-cart-indicator">
                    <ShoppingBag size={11} /> {itemInCart.cantidad}
                  </span>
                )}

                <div className="pos-product-card-top">
                  <span className="pos-category-badge">{prod.categoria}</span>
                  <span className={`pos-stock-badge ${stockClase}`}>
                    <span className="pos-stock-dot" />
                    {agotado ? 'Agotado' : `${prod.stock} un.`}
                  </span>
                </div>

                <div className="pos-product-name">{prod.nombre}</div>

                <span className="pos-card-sku">
                  Cód: {prod.codigo_barras || `ID-${prod.id}`}
                </span>

                <div className="pos-product-bottom">
                  <strong className="pos-product-price notranslate" translate="no">
                    {formatearCOP(prod.precio)}
                  </strong>
                  <div className="pos-btn-add">
                    <Plus size={13} />
                    <span>{itemInCart ? 'Sumar' : 'Agregar'}</span>
                  </div>
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
          <div className="pos-ticket-title-row">
            <Receipt size={22} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 className="pos-ticket-title">Ticket de Venta</h3>
              <span className="pos-ticket-subtitle">
                {totalUnidadesCarrito} {totalUnidadesCarrito === 1 ? 'unidad' : 'unidades'} · {carrito.length} {carrito.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>
          </div>

          {carrito.length > 0 && (
            <button
              type="button"
              onClick={vaciarCarrito}
              className="pos-btn-vaciar"
              title="Vaciar ticket completo"
            >
              <Trash2 size={13} />
              <span>Vaciar</span>
            </button>
          )}
        </div>

        {/* Documento del Cliente (C.C. / NIT) */}
        <div className="pos-customer-card">
          <div className="pos-customer-header">
            <label className="pos-field-label">
              <UserIcon size={13} />
              C.C. / NIT del Cliente
            </label>
            <button
              type="button"
              onClick={() => setClienteDoc('222222222222')}
              className="pos-quick-consumer-btn"
              title="Usar documento de Consumidor Final predeterminado"
            >
              Consumidor Final
            </button>
          </div>
          <input
            type="text"
            value={clienteDoc}
            onChange={(e) => setClienteDoc(e.target.value)}
            placeholder="222222222222"
            className="pos-field-input"
          />
        </div>

        {/* Lista de Items del Carrito */}
        <div className="pos-cart-list">
          {carrito.length === 0 ? (
            <div className="pos-cart-empty">
              <ShoppingBag size={34} className="pos-cart-empty-icon" />
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                El ticket está vacío
              </p>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Selecciona productos del catálogo para comenzar a facturar.
              </span>
            </div>
          ) : (
            carrito.map((item) => (
              <div key={item.id} className="pos-cart-item">
                <div className="pos-cart-item-info">
                  <div className="pos-cart-item-name" title={item.nombre}>
                    {item.nombre}
                  </div>
                  <span className="pos-cart-item-price notranslate" translate="no">
                    {formatearCOP(item.precio)} c/u
                  </span>
                </div>

                <div className="pos-cart-item-actions">
                  <div className="pos-qty-stepper">
                    <button
                      type="button"
                      onClick={() => actualizarCantidad(item.id, -1)}
                      className="pos-btn-step"
                      title="Disminuir cantidad"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus size={13} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={item.stockMax || 9999}
                      value={item.cantidad}
                      onChange={(e) => establecerCantidadDirecta(item.id, e.target.value)}
                      onBlur={() => handleBlurCantidad(item.id)}
                      className="pos-qty-input"
                      title="Escribe la cantidad directamente"
                    />
                    <button
                      type="button"
                      onClick={() => actualizarCantidad(item.id, 1)}
                      className="pos-btn-step"
                      title="Aumentar cantidad"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <strong className="pos-cart-item-total notranslate" translate="no">
                    {formatearCOP(item.total)}
                  </strong>

                  <button
                    type="button"
                    onClick={() => eliminarDelCarrito(item.id)}
                    className="pos-btn-quitar"
                    title="Quitar este producto"
                    aria-label="Quitar producto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selector de Método de Pago */}
        <div className="pos-payment-section">
          <label className="pos-field-label">Método de Pago</label>
          <div className="pos-payment-grid">
            <button
              type="button"
              onClick={() => setMetodoPago('Efectivo')}
              className={`pos-payment-btn ${metodoPago === 'Efectivo' ? 'active' : ''}`}
            >
              <Banknote size={18} />
              <span>Efectivo</span>
            </button>

            <button
              type="button"
              onClick={() => setMetodoPago('Nequi')}
              className={`pos-payment-btn ${metodoPago === 'Nequi' ? 'active' : ''}`}
            >
              <Smartphone size={18} />
              <span>Nequi</span>
            </button>

            <button
              type="button"
              onClick={() => setMetodoPago('Tarjeta')}
              className={`pos-payment-btn ${metodoPago === 'Tarjeta' ? 'active' : ''}`}
            >
              <CreditCard size={18} />
              <span>Tarjeta</span>
            </button>
          </div>
        </div>

        {/* Monto Recibido y Cambio */}
        {metodoPago === 'Efectivo' && (
          <div className="pos-cash-calculator">
            {totalPagar > 0 && (
              <div className="pos-cash-quick-chips">
                {sugerenciasEfectivo.map((monto, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMontoRecibido(monto.toString())}
                    className="pos-quick-chip"
                  >
                    {idx === 0 ? 'Exacto' : formatearCOP(monto)}
                  </button>
                ))}
              </div>
            )}

            <div className="pos-cash-inputs-grid">
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
                <strong className="pos-cash-change notranslate" translate="no">
                  {formatearCOP(cambio)}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Totales y Botón de Cobro */}
        <div className="pos-totals-card notranslate" translate="no">
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
          {guardandoVenta ? (
            <>
              <RefreshCw size={18} style={{ animation: 'posPulse 1s linear infinite' }} />
              <span>Procesando y Guardando en BD...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={20} />
              <span>Cobrar y Emitir Factura PDF</span>
            </>
          )}
        </button>
      </section>
    </div>
  );
};

export default CajeroPosView;
