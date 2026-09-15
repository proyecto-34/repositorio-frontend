import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { facturacionService } from '../services/facturacionService';

export const FacturaModal = ({ isOpen, onClose }) => {
  const [ventas, setVentas] = useState([]);
  const [ventaId, setVentaId] = useState('');
  const [facturaData, setFacturaData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState(false);

  // Cargar lista de ventas al abrir
  const cargarVentas = async () => {
    setCargando(true);
    try {
      const res = await facturacionService.obtenerVentas();
      const lista = res?.data || (Array.isArray(res) ? res : []);
      setVentas(lista);
      if (lista.length > 0) {
        seleccionarVenta(lista[0].id);
      }
    } catch {
      toast.error('No se pudieron cargar las ventas de la BD');
    } finally {
      setCargando(false);
    }
  };

  // Consultar detalle_venta de la venta seleccionada
  const seleccionarVenta = async (id) => {
    if (!id) return;
    setVentaId(id);
    setCargando(true);
    try {
      const data = await facturacionService.obtenerFacturaPorVentaId(id);
      setFacturaData(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al consultar detalle de venta');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (isOpen) cargarVentas();
  }, [isOpen]);

  if (!isOpen) return null;

  // Descargar PDF
  const handleDescargar = () => {
    if (!facturaData) {
      toast.error('Selecciona una venta primero');
      return;
    }
    setDescargando(true);
    try {
      facturacionService.generarTicketPDF(facturaData);
      toast.success('¡Factura PDF generada y descargada!');
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el PDF');
    } finally {
      setDescargando(false);
    }
  };

  const enc = facturaData?.encabezado || {};
  const items = facturaData?.items || [];
  const total = Number(facturaData?.totales?.total || 0);

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(11, 15, 25, 0.8)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 50, padding: '1rem', fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#151c2c', color: '#f8fafc', borderRadius: '18px',
        border: 'none', width: '100%', maxWidth: '620px',
        maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', display: 'flex',
        flexDirection: 'column', gap: '1.25rem', boxShadow: '0 25px 60px rgba(0,0,0,0.7)'
      }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Facturación Automática (BD)</h2>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Comprobantes y tickets del sistema</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 700 }}>
            ✕
          </button>
        </div>

        {/* Selector de Ventas de la BD */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={ventaId}
            onChange={(e) => seleccionarVenta(e.target.value)}
            disabled={cargando}
            style={{
              flex: 1, background: '#0b0f19', border: 'none', color: '#fff',
              padding: '10px 14px', borderRadius: '10px', fontSize: '0.88rem', outline: 'none'
            }}
          >
            {ventas.length === 0 && <option value="">No hay ventas registradas</option>}
            {ventas.map((v) => (
              <option key={v.id} value={v.id}>
                Venta #{v.id} — Cliente: {v.cliente || 'Consumidor'} — ${Number(v.total).toLocaleString('es-CO')}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={cargarVentas}
            title="Recargar ventas"
            style={{ background: '#1e273d', border: 'none', color: '#c4b5fd', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
          >
            {cargando ? '...' : 'Recargar'}
          </button>
        </div>

        {/* Previsualización de Datos */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#c4b5fd' }}>
            <Loader2 size={26} className="spin-icon" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Cargando datos de detalle_venta...</p>
          </div>
        ) : facturaData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Info Resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#0b0f19', padding: '12px 16px', borderRadius: '12px', fontSize: '0.82rem' }}>
              <div><strong style={{ color: '#94a3b8' }}>Factura:</strong> <span style={{ color: '#f8fafc' }}>{enc.nro_factura || `FAC-${ventaId}`}</span></div>
              <div><strong style={{ color: '#94a3b8' }}>Cliente:</strong> <span style={{ color: '#f8fafc' }}>{enc.cliente || 'Consumidor'}</span></div>
              <div><strong style={{ color: '#94a3b8' }}>Cajero:</strong> <span style={{ color: '#f8fafc' }}>{enc.cajero || 'Cajero'}</span></div>
            </div>

            {/* Tabla de detalle_venta */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#0b0f19', border: 'none' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(30, 39, 61, 0.4)', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Cant.</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Producto</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Unitario</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(21, 28, 44, 0.3)' }}>
                      <td style={{ padding: '10px 12px', color: '#f8fafc' }}>{it.cantidad}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f8fafc' }}>{it.producto}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#94a3b8' }}>${Number(it.precio_unitario).toLocaleString('es-CO')}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#22c55e', fontWeight: 700 }}>
                        ${Number(it.subtotal).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0b0f19', padding: '12px 16px', borderRadius: '12px', border: 'none' }}>
              <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>Total Venta (BD):</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#22c55e' }}>
                ${total.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        ) : null}

        {/* Botón de Descarga */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '0.5rem' }}>
          <button onClick={onClose} style={{ background: '#1e273d', border: 'none', color: '#cbd5e1', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            Cerrar
          </button>
          <button
            onClick={handleDescargar}
            disabled={!facturaData || descargando || cargando}
            style={{
              background: '#8b5cf6', border: 'none', color: '#ffffff', padding: '10px 22px',
              borderRadius: '10px', cursor: 'pointer', fontWeight: 700, display: 'flex',
              alignItems: 'center', gap: '8px', fontSize: '0.88rem',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)'
            }}
          >
            {descargando && <Loader2 size={16} className="spin-icon" />}
            Descargar Factura PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacturaModal;
