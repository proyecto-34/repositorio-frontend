import React, { useState, useEffect } from 'react';
import { X, Receipt, Download, RefreshCw, Loader2, Database } from 'lucide-react';
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
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 50, padding: '1rem', fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: '16px',
        border: '1px solid #334155', width: '100%', maxWidth: '600px',
        maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', display: 'flex',
        flexDirection: 'column', gap: '1.25rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
      }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={22} color="#38bdf8" />
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Facturación Automática (BD)</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Selector de Ventas de la BD */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={ventaId}
            onChange={(e) => seleccionarVenta(e.target.value)}
            disabled={cargando}
            style={{
              flex: 1, background: '#0f172a', border: '1px solid #0284c7', color: '#fff',
              padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem'
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
            style={{ background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
          >
            <RefreshCw size={16} className={cargando ? 'spin-icon' : ''} />
          </button>
        </div>

        {/* Previsualización de Datos */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#38bdf8' }}>
            <Loader2 size={28} className="spin-icon" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Cargando datos de detalle_venta...</p>
          </div>
        ) : facturaData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Info Resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#0f172a', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
              <div><strong style={{ color: '#94a3b8' }}>Factura:</strong> {enc.nro_factura || `FAC-${ventaId}`}</div>
              <div><strong style={{ color: '#94a3b8' }}>Cliente:</strong> {enc.cliente || 'Consumidor'}</div>
              <div><strong style={{ color: '#94a3b8' }}>Cajero:</strong> {enc.cajero || 'Cajero'}</div>
            </div>

            {/* Tabla de detalle_venta */}
            <div style={{ border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>Cant.</th>
                    <th style={{ padding: '8px 10px' }}>Producto</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Unitario</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #334155' }}>
                      <td style={{ padding: '8px 10px' }}>{it.cantidad}</td>
                      <td style={{ padding: '8px 10px' }}>{it.producto}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>${Number(it.precio_unitario).toLocaleString('es-CO')}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#38bdf8', fontWeight: 600 }}>
                        ${Number(it.subtotal).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '10px 14px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Venta (BD):</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4ade80' }}>
                ${total.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        ) : null}

        {/* Botón de Descarga */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
          <button onClick={onClose} style={{ background: '#334155', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Cerrar
          </button>
          <button
            onClick={handleDescargar}
            disabled={!facturaData || descargando || cargando}
            style={{
              background: '#38bdf8', border: 'none', color: '#0f172a', padding: '8px 18px',
              borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex',
              alignItems: 'center', gap: '6px', fontSize: '0.85rem'
            }}
          >
            {descargando ? <Loader2 size={16} className="spin-icon" /> : <Download size={16} />}
            Descargar Factura PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacturaModal;
