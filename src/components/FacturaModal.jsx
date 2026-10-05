import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { facturacionService } from '../services/facturacionService';
import { formatearCOP } from '../utils/formatters';
import '../styles/factura-modal.css';

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
    <div className="factura-modal-overlay">
      <div className="factura-modal-card">
        {/* Cabecera */}
        <div className="factura-modal-header">
          <div>
            <h2 className="factura-modal-title">Facturación Automática (BD)</h2>
            <span className="factura-modal-subtitle">Comprobantes y tickets del sistema</span>
          </div>
          <button onClick={onClose} className="factura-modal-btn-close">
            ✕
          </button>
        </div>

        {/* Selector de Ventas de la BD */}
        <div className="factura-modal-selector-row">
          <select
            value={ventaId}
            onChange={(e) => seleccionarVenta(e.target.value)}
            disabled={cargando}
            className="factura-modal-select"
          >
            {ventas.length === 0 && <option value="">No hay ventas registradas</option>}
            {ventas.map((v) => {
              const clienteDoc = v.documento || (typeof v.cliente === 'object' ? (v.cliente?.documento || v.cliente?.cedula || v.cliente?.nit) : v.cliente) || '222222222222';
              return (
                <option key={v.id} value={v.id}>
                  Venta #{v.id} — C.C./NIT: {clienteDoc} — {formatearCOP(v.total)}
                </option>
              );
            })}
          </select>
          <button
            type="button"
            onClick={cargarVentas}
            title="Recargar ventas"
            className="factura-modal-btn-reload"
          >
            {cargando ? '...' : 'Recargar'}
          </button>
        </div>

        {/* Previsualización de Datos */}
        {cargando ? (
          <div className="factura-modal-loading">
            <Loader2 size={26} className="spin-icon" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Cargando datos de detalle_venta...</p>
          </div>
        ) : facturaData ? (
          <div className="factura-modal-details-body">
            {/* Info Resumen */}
            <div className="factura-modal-summary-grid">
              <div><strong>Factura:</strong> <span>{enc.nro_factura || `FAC-${ventaId}`}</span></div>
              <div>
                <strong>C.C. / NIT:</strong>{' '}
                <span>
                  {enc.documento || (typeof enc.cliente === 'object' ? (enc.cliente?.documento || enc.cliente?.cedula || enc.cliente?.nit) : enc.cliente) || '222222222222'}
                </span>
              </div>
              <div>
                <strong>Cajero:</strong>{' '}
                <span>
                  {typeof enc.cajero === 'object'
                    ? enc.cajero?.nombre || 'Cajero'
                    : enc.cajero || 'Cajero'}
                </span>
              </div>
            </div>

            {/* Tabla de detalle_venta */}
            <div className="factura-modal-table-wrapper">
              <table className="factura-modal-table">
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th>Cant.</th>
                    <th>Producto</th>
                    <th style={{ textAlign: 'right' }}>Unitario</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ color: '#f8fafc' }}>{it.cantidad}</td>
                      <td style={{ fontWeight: 600, color: '#f8fafc' }}>{it.producto}</td>
                      <td style={{ textAlign: 'right', color: '#94a3b8' }}>{formatearCOP(it.precio_unitario)}</td>
                      <td style={{ textAlign: 'right', color: '#22c55e', fontWeight: 700 }}>
                        {formatearCOP(it.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="factura-modal-total-box">
              <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>Total Venta (BD):</span>
              <span className="factura-modal-total-amount">
                {formatearCOP(total)}
              </span>
            </div>
          </div>
        ) : null}

        {/* Botón de Descarga */}
        <div className="factura-modal-actions">
          <button onClick={onClose} className="factura-modal-btn-cancel">
            Cerrar
          </button>
          <button
            onClick={handleDescargar}
            disabled={!facturaData || descargando || cargando}
            className="factura-modal-btn-download"
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
