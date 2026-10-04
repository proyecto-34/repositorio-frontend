import React, { useState } from 'react';
import { toast } from 'sonner';
import { facturacionService } from '../../../services/facturacionService';
import WeatherWidget from '../../../components/WeatherWidget';

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
    .filter((v) => v.metodo === 'Efectivo')
    .reduce((acc, v) => acc + Number(v.total || 0), 0);
  const ventasNequi = ventas
    .filter((v) => v.metodo === 'Nequi')
    .reduce((acc, v) => acc + Number(v.total || 0), 0);
  const ventasTarjeta = ventas
    .filter((v) => v.metodo === 'Tarjeta')
    .reduce((acc, v) => acc + Number(v.total || 0), 0);

  const ventasFiltradas = ventas.filter((v) => {
    const q = busquedaFactura.toLowerCase();
    return (
      String(v.id).toLowerCase().includes(q) ||
      (v.cliente && v.cliente.toLowerCase().includes(q)) ||
      (v.metodo && v.metodo.toLowerCase().includes(q))
    );
  });

  const handleDescargarFacturaPDF = (v) => {
    try {
      facturacionService.generarTicketPDF({
        numeroFactura: `FAC-${v.id}`,
        cajero: v.cajero || 'Cajero de Turno',
        cliente: {
          nombre: v.cliente || 'Consumidor Final',
          documento: v.documento || '222222222',
        },
        productos: v.items || [],
        total: v.total,
        metodoPago: v.metodo || 'Efectivo',
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
          background: '#151c2c',
          borderRadius: '18px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          border: 'none',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
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
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800 }}>
              Registro Contable y Facturación
            </h3>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
              Detalle de ingresos brutos, IVA recaudado y comprobantes emitidos
            </p>
          </div>

          <button
            type="button"
            onClick={onRecargar}
            disabled={cargando}
            style={{
              background: '#1e273d',
              color: '#cbd5e1',
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

        {/* Tarjetas de Métricas Contables */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
          }}
        >
          <div style={{ background: '#0b0f19', padding: '14px', borderRadius: '12px', border: 'none' }}>
            <span
              style={{
                fontSize: '0.72rem',
                color: '#94a3b8',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Ventas Netas
            </span>
            <strong style={{ color: '#8b5cf6', fontSize: '1.2rem', fontWeight: 800 }}>
              ${totalVentasNetas.toLocaleString('es-CO')}
            </strong>
          </div>
          <div style={{ background: '#0b0f19', padding: '14px', borderRadius: '12px', border: 'none' }}>
            <span
              style={{
                fontSize: '0.72rem',
                color: '#94a3b8',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              IVA Recaudado (19%)
            </span>
            <strong style={{ color: '#f59e0b', fontSize: '1.2rem', fontWeight: 800 }}>
              ${totalIvaRecaudado.toLocaleString('es-CO')}
            </strong>
          </div>
          <div style={{ background: '#0b0f19', padding: '14px', borderRadius: '12px', border: 'none' }}>
            <span
              style={{
                fontSize: '0.72rem',
                color: '#94a3b8',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Total Facturado
            </span>
            <strong style={{ color: '#22c55e', fontSize: '1.2rem', fontWeight: 800 }}>
              ${totalVentasBrutas.toLocaleString('es-CO')}
            </strong>
          </div>
        </div>

        {/* Buscador de Facturas */}
        <div
          style={{
            background: '#0b0f19',
            borderRadius: '10px',
            padding: '0 14px',
            border: 'none',
          }}
        >
          <input
            type="text"
            placeholder="Buscar factura por Nro, Cliente o Método de Pago..."
            value={busquedaFactura}
            onChange={(e) => setBusquedaFactura(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              padding: '12px 0',
              width: '100%',
              outline: 'none',
              fontSize: '0.88rem',
            }}
          />
        </div>

        {/* Tabla de Facturas */}
        <div style={{ borderRadius: '12px', overflowX: 'auto', background: '#0b0f19', border: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 39, 61, 0.4)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Nro. Factura</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Fecha</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Cliente</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Método</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Total</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>
                  Comprobante
                </th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    No hay facturas registradas.
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((v, idx) => (
                  <tr
                    key={v.id}
                    style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(21, 28, 44, 0.4)' }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#c4b5fd' }}>
                      FAC-{v.id}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '0.8rem' }}>
                      {new Date(v.fecha).toLocaleString('es-CO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#f8fafc', fontWeight: 600 }}>
                      {v.cliente || 'Consumidor Final'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          background: 'rgba(139, 92, 246, 0.15)',
                          color: '#c4b5fd',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {v.metodo || 'Efectivo'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#22c55e' }}>
                      ${Number(v.total).toLocaleString('es-CO')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleDescargarFacturaPDF(v)}
                        style={{
                          background: '#1e273d',
                          color: '#c4b5fd',
                          border: 'none',
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

      {/* Columna Derecha: Métodos de Pago & Clima */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div
          style={{
            background: '#151c2c',
            borderRadius: '18px',
            padding: '1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            border: 'none',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
          }}
        >
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 800 }}>
            Desglose por Método de Pago
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0b0f19',
                padding: '12px 14px',
                borderRadius: '10px',
              }}
            >
              <strong style={{ color: '#22c55e' }}>Efectivo</strong>
              <span style={{ fontWeight: 800, color: '#f8fafc' }}>
                ${ventasEfectivo.toLocaleString('es-CO')}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0b0f19',
                padding: '12px 14px',
                borderRadius: '10px',
              }}
            >
              <strong style={{ color: '#c4b5fd' }}>Nequi / Transferencia</strong>
              <span style={{ fontWeight: 800, color: '#f8fafc' }}>
                ${ventasNequi.toLocaleString('es-CO')}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0b0f19',
                padding: '12px 14px',
                borderRadius: '10px',
              }}
            >
              <strong style={{ color: '#38bdf8' }}>Tarjeta Débito/Crédito</strong>
              <span style={{ fontWeight: 800, color: '#f8fafc' }}>
                ${ventasTarjeta.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>

        <WeatherWidget />
      </div>
    </div>
  );
};

export default ReportesTab;
