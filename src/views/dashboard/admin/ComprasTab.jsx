import React, { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Truck, Eye, FileText, CheckCircle2, DollarSign, PackagePlus, Trash2, Calendar, CreditCard, Layers } from 'lucide-react';
import comprasService from '../../../services/comprasService';
import productosService from '../../../services/productosService';

export const ComprasTab = ({
  compras = [],
  proveedores = [],
  productos = [],
  cargando = false,
  onRecargar,
  onActualizarStock,
  canManage = true,
  proveedorInicial = null,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [modalNuevaCompra, setModalNuevaCompra] = useState(Boolean(proveedorInicial));
  const [modalDetalle, setModalDetalle] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Formulario de Nueva Compra
  const [idProveedor, setIdProveedor] = useState(proveedorInicial?.id || (proveedores[0]?.id || ''));
  const [nroFactura, setNroFactura] = useState('');
  const [metodoPago, setMetodoPago] = useState('Transferencia Bancaria');
  const [observaciones, setObservaciones] = useState('');
  const [itemsCompra, setItemsCompra] = useState([]);

  // Estado para agregar un ítem individual
  const [idProductoSeleccionado, setIdProductoSeleccionado] = useState('');
  const [cantidadItem, setCantidadItem] = useState(10);
  const [costoUnitarioItem, setCostoUnitarioItem] = useState('');

  // Filtrado de Compras
  const comprasFiltradas = compras.filter((c) => {
    const q = busqueda.toLowerCase();
    const provNombre = typeof c.proveedor === 'object' ? c.proveedor?.nombre : c.proveedor;
    const provContacto = typeof c.proveedor === 'object' ? c.proveedor?.contacto : '';
    const fact = c.nro_factura || `COMPRA-${c.id}`;

    return (
      fact.toLowerCase().includes(q) ||
      (provNombre && provNombre.toLowerCase().includes(q)) ||
      (provContacto && String(provContacto).toLowerCase().includes(q)) ||
      (c.metodo_pago && c.metodo_pago.toLowerCase().includes(q))
    );
  });

  // Métricas calculadas
  const totalInvertido = compras.reduce((acc, c) => acc + Number(c.total || 0), 0);
  const totalUnidadesIngresadas = compras.reduce((acc, c) => {
    const items = c.items || [];
    return acc + items.reduce((sum, it) => sum + Number(it.cantidad || 0), 0);
  }, 0);

  const handleAbrirNuevaCompra = (prov = null) => {
    if (prov) {
      setIdProveedor(prov.id);
    } else if (proveedores.length > 0) {
      setIdProveedor(proveedores[0].id);
    }
    setNroFactura(`FAC-PROV-${Math.floor(1000 + Math.random() * 9000)}`);
    setMetodoPago('Transferencia Bancaria');
    setObservaciones('');
    setItemsCompra([]);
    setIdProductoSeleccionado(productos[0]?.id || '');
    setCantidadItem(10);
    setCostoUnitarioItem(productos[0]?.precio ? Math.round(Number(productos[0].precio) * 0.7) : '');
    setModalNuevaCompra(true);
  };

  const handleSeleccionarProductoParaItem = (id) => {
    setIdProductoSeleccionado(id);
    const prod = productos.find((p) => p.id === Number(id) || p.id === id);
    if (prod) {
      const precioBase = Number(prod.precio) || Number(prod.precio_venta) || 5000;
      setCostoUnitarioItem(Math.round(precioBase * 0.7)); // Costo estimado 70% del PVP
    }
  };

  const handleAgregarItemACompra = () => {
    if (!idProductoSeleccionado) {
      toast.error('Selecciona un producto para agregar');
      return;
    }

    const prod = productos.find((p) => p.id === Number(idProductoSeleccionado) || p.id === idProductoSeleccionado);
    if (!prod) {
      toast.error('Producto no encontrado');
      return;
    }

    const cant = Number(cantidadItem) || 1;
    const costo = Number(costoUnitarioItem) || 0;

    if (cant <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (costo <= 0) {
      toast.error('El costo unitario debe ser mayor a 0');
      return;
    }

    // Verificar si ya está en la lista de items
    const existe = itemsCompra.find((it) => it.id_producto === prod.id);
    if (existe) {
      setItemsCompra(
        itemsCompra.map((it) =>
          it.id_producto === prod.id
            ? {
                ...it,
                cantidad: it.cantidad + cant,
                costo_unitario: costo,
                total: (it.cantidad + cant) * costo,
              }
            : it
        )
      );
    } else {
      setItemsCompra([
        ...itemsCompra,
        {
          id_producto: prod.id,
          producto_nombre: prod.nombre,
          categoria: prod.categoria || prod.categoria_nombre || 'General',
          stock_actual: Number(prod.stock) || 0,
          cantidad: cant,
          costo_unitario: costo,
          total: cant * costo,
        },
      ]);
    }

    toast.success(`"${prod.nombre}" agregado a la orden`);
  };

  const handleEliminarItemCompra = (idProd) => {
    setItemsCompra(itemsCompra.filter((it) => it.id_producto !== idProd));
  };

  const totalCompraActual = itemsCompra.reduce((acc, it) => acc + it.total, 0);

  const handleGuardarCompra = async (e) => {
    e.preventDefault();

    if (itemsCompra.length === 0) {
      toast.error('Debes agregar al menos un producto a la orden de compra');
      return;
    }

    const proveedorObj = proveedores.find((p) => p.id === Number(idProveedor) || p.id === idProveedor) || {
      id: idProveedor,
      nombre: 'Proveedor General',
      nit: '900.000.000-1',
    };

    setGuardando(true);
    try {
      const payload = {
        id_proveedor: Number(idProveedor),
        proveedor_obj: proveedorObj,
        nro_factura: nroFactura.trim() || `COMPRA-${Date.now()}`,
        fecha: new Date().toISOString(),
        metodo_pago: metodoPago,
        total: totalCompraActual,
        observaciones,
        detalles: itemsCompra.map((it) => ({
          id_producto: Number(it.id_producto),
          cantidad: Number(it.cantidad),
          subtotal: Number(it.total || it.subtotal || (it.cantidad * it.costo_unitario)),
        })),
        items: itemsCompra,
      };

      await comprasService.crearCompra(payload);

      if (onActualizarStock) {
        onActualizarStock(itemsCompra);
      }

      toast.success(
        `¡Compra registrada con éxito en la BD! El stock de los productos ha sido incrementado automáticamente.`,
        { duration: 5000 }
      );

      setModalNuevaCompra(false);
      if (onRecargar) onRecargar();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al registrar la orden de compra en la BD';
      toast.error(`Error al registrar compra: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleVerDetalle = (compra) => {
    setCompraSeleccionada(compra);
    setModalDetalle(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Cabecera del Módulo */}
      <div
        style={{
          background: '#151c2c',
          borderRadius: '16px',
          padding: '1.4rem 1.6rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
              Entradas de Mercancía & Compras a Proveedores
            </h2>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Registra abastecimientos, actualiza el stock automáticamente y controla los costos de adquisición
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => handleAbrirNuevaCompra()}
            style={{
              background: '#22c55e',
              color: '#0b0f19',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            <PackagePlus size={18} />
            Registrar Entrada / Compra
          </button>
        )}
      </div>

      {/* Tarjetas de Métricas de Compras */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div
          style={{
            background: '#151c2c',
            borderRadius: '14px',
            padding: '1.25rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
            Total Invertido en Compras
          </span>
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#38bdf8', fontWeight: 800 }}>
            ${totalInvertido.toLocaleString('es-CO')}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#7dd3fc' }}>Gasto acumulado en abastecimiento</span>
        </div>

        <div
          style={{
            background: '#151c2c',
            borderRadius: '14px',
            padding: '1.25rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
            Órdenes de Compra
          </span>
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#c4b5fd', fontWeight: 800 }}>
            {compras.length}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#a78bfa' }}>Facturas de compras procesadas</span>
        </div>

        <div
          style={{
            background: '#151c2c',
            borderRadius: '14px',
            padding: '1.25rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
            Unidades Ingresadas
          </span>
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#4ade80', fontWeight: 800 }}>
            {totalUnidadesIngresadas.toLocaleString('es-CO')}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#86efac' }}>Productos sumados al inventario</span>
        </div>
      </div>

      {/* Barra de Búsqueda */}
      <div
        style={{
          background: '#151c2c',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '500px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Buscar por factura, proveedor, NIT o método de pago..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              background: '#0b0f19',
              border: 'none',
              color: '#f8fafc',
              padding: '9px 14px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              outline: 'none',
            }}
          />
        </div>

        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Mostrando <strong>{comprasFiltradas.length}</strong> compras
        </span>
      </div>

      {/* Tabla de Historial de Compras */}
      <div
        style={{
          background: '#151c2c',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#1e273d', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Comprobante / Factura</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Fecha y Hora</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Proveedor</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Método de Pago</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'center' }}>Ítems</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'right' }}>Total Compra</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'center' }}>Estado</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    Cargando historial de compras...
                  </td>
                </tr>
              ) : comprasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    No hay compras registradas en este período.
                  </td>
                </tr>
              ) : (
                comprasFiltradas.map((c, idx) => {
                  const provNombre = typeof c.proveedor === 'object' ? c.proveedor?.nombre : c.proveedor || 'Proveedor';
                  const provNit = typeof c.proveedor === 'object' ? c.proveedor?.nit : '';
                  const itemsCount = (c.items || []).length;
                  const fechaStr = c.fecha ? new Date(c.fecha).toLocaleDateString('es-CO') : 'Reciente';

                  return (
                    <tr
                      key={c.id}
                      style={{
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} color="#38bdf8" />
                          <strong style={{ color: '#f8fafc', fontFamily: 'monospace' }}>
                            {c.nro_factura || `COMPRA-${c.id}`}
                          </strong>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#cbd5e1', fontSize: '0.85rem' }}>
                        {fechaStr}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div>
                          <strong style={{ color: '#f8fafc', display: 'block' }}>{provNombre}</strong>
                          {typeof c.proveedor === 'object' && c.proveedor?.contacto && (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tel: {c.proveedor.contacto}</span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#cbd5e1',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                          }}
                        >
                          {c.metodo_pago || 'Efectivo'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center', color: '#c4b5fd', fontWeight: 700 }}>
                        {itemsCount} productos
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#4ade80', fontWeight: 800, fontSize: '0.95rem' }}>
                        ${Number(c.total || 0).toLocaleString('es-CO')}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: '#4ade80',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={12} />
                          {c.estado || 'Completada'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleVerDetalle(c)}
                          title="Ver Detalle de Compra"
                          style={{
                            background: 'rgba(139, 92, 246, 0.15)',
                            color: '#c4b5fd',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <Eye size={14} /> Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Registrar Nueva Compra / Entrada de Mercancía */}
      {modalNuevaCompra && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 15, 25, 0.85)',
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
              borderRadius: '20px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '750px',
              maxHeight: '92vh',
              overflowY: 'auto',
              color: '#f8fafc',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* Cabecera Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PackagePlus size={24} color="#22c55e" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
                    Registrar Entrada de Mercancía (Compra)
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Aumenta automáticamente el stock del catálogo en tiempo real
                  </span>
                </div>
              </div>
              <button
                onClick={() => setModalNuevaCompra(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarCompra} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Sección 1: Datos Generales */}
              <div style={{ background: '#0b0f19', padding: '14px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  1. Información de la Factura de Compra
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Proveedor *
                    </label>
                    <select
                      value={idProveedor}
                      onChange={(e) => setIdProveedor(e.target.value)}
                      required
                      style={{ width: '100%', background: '#151c2c', border: 'none', color: '#fff', padding: '9px 12px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
                    >
                      {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} {p.contacto ? `(${p.contacto})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      N° Factura / Remisión
                    </label>
                    <input
                      type="text"
                      placeholder="FAC-PROV-1234"
                      value={nroFactura}
                      onChange={(e) => setNroFactura(e.target.value)}
                      required
                      style={{ width: '100%', background: '#151c2c', border: 'none', color: '#fff', padding: '9px 12px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Método de Pago
                    </label>
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      style={{ width: '100%', background: '#151c2c', border: 'none', color: '#fff', padding: '9px 12px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
                    >
                      <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Crédito 30 días">Crédito 30 días</option>
                      <option value="Crédito 15 días">Crédito 15 días</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección 2: Agregar Ítems al Pedido */}
              <div style={{ background: '#0b0f19', padding: '14px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.78rem', color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  2. Agregar Productos a la Entrada
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1.2fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Producto del Catálogo
                    </label>
                    <select
                      value={idProductoSeleccionado}
                      onChange={(e) => handleSeleccionarProductoParaItem(e.target.value)}
                      style={{ width: '100%', background: '#151c2c', border: 'none', color: '#fff', padding: '9px 12px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
                    >
                      <option value="">-- Selecciona producto --</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} (Stock actual: {p.stock || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Cantidad a Ingresar
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="10"
                      value={cantidadItem}
                      onChange={(e) => setCantidadItem(e.target.value)}
                      style={{ width: '100%', background: '#151c2c', border: 'none', color: '#fff', padding: '9px 12px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Costo Unitario ($ COP)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="3500"
                      value={costoUnitarioItem}
                      onChange={(e) => setCostoUnitarioItem(e.target.value)}
                      style={{ width: '100%', background: '#151c2c', border: 'none', color: '#fff', padding: '9px 12px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAgregarItemACompra}
                    style={{
                      background: '#8b5cf6',
                      color: '#ffffff',
                      border: 'none',
                      padding: '9px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      height: '38px',
                    }}
                  >
                    <Plus size={16} /> Agregar
                  </button>
                </div>

                {/* Lista de Ítems Agregados */}
                <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#151c2c', color: '#94a3b8' }}>
                        <th style={{ padding: '8px 12px' }}>Producto</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Stock Previo</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Ingreso (+)</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Nuevo Stock</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Costo Unit.</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Subtotal</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Quitar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsCompra.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '1.25rem', textAlign: 'center', color: '#64748b' }}>
                            Aún no has agregado productos a esta orden de compra.
                          </td>
                        </tr>
                      ) : (
                        itemsCompra.map((it) => (
                          <tr key={it.id_producto} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: '#f8fafc' }}>
                              {it.producto_nombre}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', color: '#94a3b8' }}>
                              {it.stock_actual}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>
                              +{it.cantidad}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', color: '#38bdf8', fontWeight: 700 }}>
                              {it.stock_actual + it.cantidad}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: '#cbd5e1' }}>
                              ${it.costo_unitario.toLocaleString('es-CO')}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: '#4ade80', fontWeight: 700 }}>
                              ${it.total.toLocaleString('es-CO')}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleEliminarItemCompra(it.id_producto)}
                                style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total y Botones de Acción */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0b0f19', padding: '14px 18px', borderRadius: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Total de la Orden de Compra:</span>
                  <strong style={{ fontSize: '1.4rem', color: '#4ade80', fontWeight: 800 }}>
                    ${totalCompraActual.toLocaleString('es-CO')} COP
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setModalNuevaCompra(false)}
                    style={{ background: '#1e273d', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando || itemsCompra.length === 0}
                    style={{
                      background: '#22c55e',
                      color: '#0b0f19',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
                    }}
                  >
                    {guardando ? 'Guardando Entrada...' : 'Confirmar e Incrementar Stock'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detalle de Factura de Compra */}
      {modalDetalle && compraSeleccionada && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 15, 25, 0.85)',
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
              borderRadius: '20px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '600px',
              color: '#f8fafc',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Detalle de Compra #{compraSeleccionada.nro_factura || compraSeleccionada.id}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Comprobante de entrada a bodega</span>
              </div>
              <button
                onClick={() => setModalDetalle(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#0b0f19', padding: '12px 16px', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
              <div>
                <strong style={{ color: '#94a3b8' }}>Proveedor:</strong>{' '}
                <span style={{ color: '#f8fafc' }}>
                  {typeof compraSeleccionada.proveedor === 'object' ? compraSeleccionada.proveedor?.nombre : compraSeleccionada.proveedor}
                </span>
              </div>
              <div>
                <strong style={{ color: '#94a3b8' }}>Contacto:</strong>{' '}
                <span style={{ color: '#cbd5e1' }}>
                  {typeof compraSeleccionada.proveedor === 'object' ? (compraSeleccionada.proveedor?.contacto || 'N/A') : 'N/A'}
                </span>
              </div>
              <div>
                <strong style={{ color: '#94a3b8' }}>Fecha:</strong>{' '}
                <span style={{ color: '#f8fafc' }}>
                  {compraSeleccionada.fecha ? new Date(compraSeleccionada.fecha).toLocaleString('es-CO') : 'N/A'}
                </span>
              </div>
              <div>
                <strong style={{ color: '#94a3b8' }}>Método de Pago:</strong>{' '}
                <span style={{ color: '#f8fafc' }}>{compraSeleccionada.metodo_pago || 'Efectivo'}</span>
              </div>
            </div>

            {/* Tabla de Items */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#0b0f19' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#1e273d', color: '#94a3b8' }}>
                    <th style={{ padding: '10px 12px' }}>Producto</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Cant.</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Costo Unit.</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(compraSeleccionada.items || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px 12px', color: '#f8fafc', fontWeight: 600 }}>
                        {it.producto_nombre || it.nombre || 'Producto'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#38bdf8', fontWeight: 700 }}>
                        {it.cantidad}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#cbd5e1' }}>
                        ${Number(it.costo_unitario || it.precio || 0).toLocaleString('es-CO')}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#4ade80', fontWeight: 700 }}>
                        ${Number(it.total || (it.cantidad * (it.costo_unitario || it.precio || 0))).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0b0f19', padding: '12px 16px', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Total de la Factura:</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#4ade80' }}>
                ${Number(compraSeleccionada.total || 0).toLocaleString('es-CO')} COP
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setModalDetalle(false)}
                style={{ background: '#1e273d', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprasTab;
