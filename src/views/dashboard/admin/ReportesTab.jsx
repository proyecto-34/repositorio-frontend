import React, { useState } from 'react';
import { toast } from 'sonner';
import { facturacionService } from '../../../services/facturacionService';

export const ReportesTab = ({
  ventas = [],
  cargando = false,
  onRecargar,
}) => {
  const [busquedaFactura, setBusquedaFactura] = useState('');

  // Métricas financieras calculadas
  const totalVentasBrutas = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const totalIvaRecaudado = Math.round(totalVentasBrutas * 0.19);
  const totalVentasNetas = totalVentasBrutas - totalIvaRecaudado;
  const ventasEfectivo = ventas
    .filter((v) => (v.metodo || '').toUpperCase().includes('EFECTIVO'))
    .reduce((acc, v) => acc + Number(v.total || 0), 0);
  const ventasNequi = ventas
    .filter((v) => (v.metodo || '').toUpperCase().includes('TRANSF') || (v.metodo || '').toUpperCase().includes('NEQUI'))
    .reduce((acc, v) => acc + Number(v.total || 0), 0);
  const ventasTarjeta = ventas
    .filter((v) => (v.metodo || '').toUpperCase().includes('TARJETA'))
    .reduce((acc, v) => acc + Number(v.total || 0), 0);

  const ventasFiltradas = ventas.filter((v) => {
    const q = busquedaFactura.toLowerCase();
    const doc = String(v.documento || v.cliente || '').toLowerCase();
    return (
      String(v.id).toLowerCase().includes(q) ||
      doc.includes(q) ||
      (v.metodo && v.metodo.toLowerCase().includes(q))
    );
  });

  const handleDescargarFacturaPDF = (v) => {
    try {
      const docVal = v.documento || (typeof v.cliente === 'string' && /^\d+$/.test(v.cliente.replace(/[-.]/g, '')) ? v.cliente : '222222222222');
      facturacionService.generarTicketPDF({
        id: v.id,
        numeroFactura: `FAC-${String(v.id).padStart(6, '0')}`,
        cajero: v.cajero || 'Cajero POS',
        cliente: docVal,
        documento: docVal,
        clienteDoc: docVal,
        items: v.items || [],
        productos: v.items || [],
        total: v.total,
        metodoPago: v.metodo || 'EFECTIVO',
      });
      toast.success(`Factura #${v.id} descargada en PDF`);
    } catch (err) {
      toast.error('Error al generar PDF de la factura');
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.4fr) minmax(320px, 1fr)',
        gap: '1.75rem',
        alignItems: 'start',
      }}
    >
      {/* Historial de Facturas */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '18px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
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
            gap: '10px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
              Registro Contable y Facturación
            </h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Detalle de ingresos brutos, IVA recaudado y comprobantes emitidos
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                try {
                  facturacionService.generarReporteFinancieroDiarioPDF(ventas);
                  toast.success('Reporte financiero diario descargado en PDF');
                } catch {
                  toast.error('Error al generar reporte diario');
                }
              }}
              disabled={ventas.length === 0}
              style={{
                background: '#1e5bb8',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: ventas.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
              }}
            >
              📄 Exportar Balance PDF
            </button>

            <button
              type="button"
              onClick={onRecargar}
              disabled={cargando}
              style={{
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-secondary)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: cargando ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem',
                transition: 'background 0.2s ease',
              }}
            >
              {cargando ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas Contables */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
          }}
        >
          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 700,
              }}
            >
              Ventas Netas
            </span>
            <strong style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', fontWeight: 800 }}>
              ${totalVentasNetas.toLocaleString('es-CO')}
            </strong>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 700,
              }}
            >
              IVA Recaudado (19%)
            </span>
            <strong style={{ color: '#d97706', fontSize: '1.2rem', fontWeight: 800 }}>
              ${totalIvaRecaudado.toLocaleString('es-CO')}
            </strong>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 700,
              }}
            >
              Total Facturado
            </span>
            <strong style={{ color: '#16a34a', fontSize: '1.2rem', fontWeight: 800 }}>
              ${totalVentasBrutas.toLocaleString('es-CO')}
            </strong>
          </div>
        </div>

        {/* Buscador de Facturas */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '8px',
            padding: '0 14px',
            border: '1px solid var(--border-input)',
          }}
        >
          <input
            type="text"
            placeholder="Buscar factura por Nro, C.C./NIT o Método de Pago..."
            value={busquedaFactura}
            onChange={(e) => setBusquedaFactura(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              padding: '12px 0',
              width: '100%',
              outline: 'none',
              fontSize: '0.88rem',
            }}
          />
        </div>

        {/* Tabla de Facturas */}
        <div style={{ borderRadius: '12px', overflowX: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Nro. Factura</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Fecha</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>C.C. / NIT</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Método</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Total</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>
                  Comprobante
                </th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay facturas registradas.
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((v, idx) => (
                  <tr
                    key={v.id}
                    style={{
                      background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      FAC-{v.id}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(v.fecha).toLocaleString('es-CO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {v.documento || (typeof v.cliente === 'string' && v.cliente !== 'Consumidor Final' ? v.cliente : '222222222222')}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          background: 'var(--accent-primary-subtle)',
                          color: 'var(--accent-primary)',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {v.metodo || 'Efectivo'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#16a34a' }}>
                      ${Number(v.total).toLocaleString('es-CO')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleDescargarFacturaPDF(v)}
                        style={{
                          background: 'var(--bg-subtle)',
                          color: 'var(--accent-primary)',
                          border: '1px solid var(--border-input)',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                        }}
                      >
                        Descargar PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Columna Derecha: Métodos de Pago */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '16px',
            padding: '1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Desglose por Método de Pago
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                padding: '12px 14px',
                borderRadius: '10px',
              }}
            >
              <strong style={{ color: '#16a34a' }}>Efectivo</strong>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                ${ventasEfectivo.toLocaleString('es-CO')}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                padding: '12px 14px',
                borderRadius: '10px',
              }}
            >
              <strong style={{ color: 'var(--accent-primary)' }}>Nequi / Transferencia</strong>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                ${ventasNequi.toLocaleString('es-CO')}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                padding: '12px 14px',
                borderRadius: '10px',
              }}
            >
              <strong style={{ color: '#0284c7' }}>Tarjeta Débito/Crédito</strong>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                ${ventasTarjeta.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesTab;
