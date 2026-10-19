import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  History, 
  Search, 
  RefreshCw, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  ShoppingCart, 
  Package, 
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';
import auditoriaService from '../../../services/auditoriaService';

export const AuditoriaTab = () => {
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('TODOS');

  useEffect(() => {
    cargarAuditoria();
  }, []);

  const cargarAuditoria = async () => {
    setCargando(true);
    try {
      const res = await auditoriaService.obtenerLogs({ limit: 100, page: 1 });
      setLogs(res.logs || []);
      setTotalLogs(res.total || 0);
    } catch (err) {
      toast.error('Error al consultar eventos de auditoría');
    } finally {
      setCargando(false);
    }
  };

  // Clasificación de eventos según estándar OWASP de alta criticidad
  const categorizarEvento = (log) => {
    const act = (log.accion || '').toUpperCase();
    const mod = (log.modulo || '').toUpperCase();

    if (act.includes('DELETE') || act.includes('ELIMINAR') || act.includes('ANULAR')) {
      return 'ELIMINACIONES';
    }
    if (act.includes('LOGIN') || act.includes('AUTH') || mod.includes('USUARIO') || act.includes('ROL')) {
      return 'SEGURIDAD';
    }
    if (act.includes('VENTA') || act.includes('PAGO') || mod.includes('VENTA') || mod.includes('PAGO')) {
      return 'VENTAS';
    }
    if (mod.includes('PRODUCT') || mod.includes('INVENTARIO') || mod.includes('COMPRA') || act.includes('STOCK')) {
      return 'INVENTARIO';
    }
    return 'GENERAL';
  };

  // Conteo de métricas de auditoría
  const statsAuditoria = useMemo(() => {
    return {
      seguridad: logs.filter((l) => categorizarEvento(l) === 'SEGURIDAD').length,
      ventas: logs.filter((l) => categorizarEvento(l) === 'VENTAS').length,
      inventario: logs.filter((l) => categorizarEvento(l) === 'INVENTARIO').length,
      eliminaciones: logs.filter((l) => categorizarEvento(l) === 'ELIMINACIONES').length,
    };
  }, [logs]);

  // Filtro inteligente en memoria
  const logsFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return logs.filter((l) => {
      const cat = categorizarEvento(l);
      const matchCategoria = categoriaActiva === 'TODOS' || cat === categoriaActiva;

      const matchBusqueda =
        !q ||
        String(l.id).includes(q) ||
        (l.accion && l.accion.toLowerCase().includes(q)) ||
        (l.modulo && l.modulo.toLowerCase().includes(q)) ||
        (l.detalles && l.detalles.toLowerCase().includes(q)) ||
        (l.usuario?.nombre && l.usuario.nombre.toLowerCase().includes(q)) ||
        (l.usuario?.correo && l.usuario.correo.toLowerCase().includes(q));

      return matchCategoria && matchBusqueda;
    });
  }, [logs, busqueda, categoriaActiva]);

  // Estilos visuales con semántica de severidad
  const getBadgeStyle = (accion = '') => {
    const act = accion.toUpperCase();
    if (act.includes('DELETE') || act.includes('ELIMINAR') || act.includes('ANULAR') || act.includes('FALLIDO')) {
      return { bg: 'var(--color-danger-subtle)', color: 'var(--color-danger)', border: 'var(--color-danger-border)', label: 'Crítico' };
    }
    if (act.includes('LOGIN') || act.includes('AUTH') || act.includes('ROL')) {
      return { bg: 'var(--color-info-subtle)', color: 'var(--color-info)', border: 'var(--accent-primary-border)', label: 'Seguridad' };
    }
    if (act.includes('VENTA') || act.includes('PAGO')) {
      return { bg: 'var(--color-success-subtle)', color: 'var(--color-success)', border: 'var(--color-success-border)', label: 'Caja' };
    }
    if (act.includes('UPDATE') || act.includes('ACTUALIZAR') || act.includes('STOCK')) {
      return { bg: 'var(--color-warning-subtle)', color: 'var(--color-warning)', border: 'rgba(245, 158, 11, 0.3)', label: 'Ajuste' };
    }
    return { bg: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)', border: 'var(--accent-primary-border)', label: 'Operación' };
  };

  // Exportar auditoría a CSV (Compatible directo con Microsoft Excel)
  const handleExportarCSV = () => {
    if (logsFiltrados.length === 0) {
      toast.warning('No hay eventos de auditoría para exportar');
      return;
    }

    try {
      const encabezados = ['ID', 'Fecha y Hora', 'Usuario', 'Correo', 'Modulo', 'Accion', 'Detalles'];
      const filas = logsFiltrados.map((l) => [
        `#${l.id}`,
        l.fecha ? new Date(l.fecha).toLocaleString('es-CO') : 'N/A',
        `"${(l.usuario?.nombre || 'Sistema').replace(/"/g, '""')}"`,
        `"${(l.usuario?.correo || 'N/A').replace(/"/g, '""')}"`,
        `"${(l.modulo || 'GENERAL').replace(/"/g, '""')}"`,
        `"${(l.accion || 'OPERACION').replace(/"/g, '""')}"`,
        `"${(l.detalles || 'Sin detalles').replace(/"/g, '""')}"`,
      ]);

      const contenidoCSV = '\uFEFF' + [encabezados.join(';'), ...filas.map((f) => f.join(';'))].join('\r\n');
      const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Auditoria_TiendaComunitaria_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Auditoría exportada exitosamente a Excel (CSV)');
    } catch (e) {
      toast.error('Error al generar archivo CSV');
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Tarjeta de Encabezado y Principio de Auditoría */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={22} color="#1e5bb8" />
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                Auditoría y Trazabilidad de Eventos Críticos
              </h3>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: 'var(--accent-primary-subtle)',
                  color: 'var(--accent-primary)',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  border: '1px solid var(--accent-primary-border)',
                }}
              >
                OWASP / ISO 27001
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.5 }}>
              Solo se registran acciones de alto impacto (Seguridad, Movimientos de Caja y Modificaciones de Inventario). 
              Se excluyen consultas de lectura ordinarias para garantizar una auditoría limpia, legal y sin saturar la base de datos.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExportarCSV}
              disabled={logsFiltrados.length === 0}
              style={{
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: logsFiltrados.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
              }}
              title="Descargar eventos en formato Excel (CSV)"
            >
              <FileSpreadsheet size={15} />
              <span>Exportar Excel (CSV)</span>
            </button>

            <button
              type="button"
              onClick={cargarAuditoria}
              disabled={cargando}
              style={{
                background: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-input)',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: cargando ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={14} className={cargando ? 'spin-icon' : ''} />
              <span>{cargando ? 'Consultando...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>

        {/* Tarjetas KPI de Eventos Críticos (Argumentación Persuasiva) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
          <div
            onClick={() => setCategoriaActiva('SEGURIDAD')}
            style={{
              background: categoriaActiva === 'SEGURIDAD' ? 'var(--accent-primary-subtle)' : 'var(--bg-subtle)',
              border: `1px solid ${categoriaActiva === 'SEGURIDAD' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              borderRadius: '10px',
              padding: '12px 14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>SEGURIDAD & ACCESO</span>
              <KeyRound size={16} color="#0284c7" />
            </div>
            <strong style={{ fontSize: '1.25rem', color: '#0284c7', display: 'block', marginTop: '4px' }}>
              {statsAuditoria.seguridad}
            </strong>
          </div>

          <div
            onClick={() => setCategoriaActiva('VENTAS')}
            style={{
              background: categoriaActiva === 'VENTAS' ? 'var(--color-success-subtle)' : 'var(--bg-subtle)',
              border: `1px solid ${categoriaActiva === 'VENTAS' ? 'var(--color-success)' : 'var(--border-color)'}`,
              borderRadius: '10px',
              padding: '12px 14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>VENTAS & CAJA</span>
              <ShoppingCart size={16} color="#16a34a" />
            </div>
            <strong style={{ fontSize: '1.25rem', color: '#16a34a', display: 'block', marginTop: '4px' }}>
              {statsAuditoria.ventas}
            </strong>
          </div>

          <div
            onClick={() => setCategoriaActiva('INVENTARIO')}
            style={{
              background: categoriaActiva === 'INVENTARIO' ? 'var(--accent-primary-subtle)' : 'var(--bg-subtle)',
              border: `1px solid ${categoriaActiva === 'INVENTARIO' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              borderRadius: '10px',
              padding: '12px 14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>STOCK & COMPRAS</span>
              <Package size={16} color="#8b5cf6" />
            </div>
            <strong style={{ fontSize: '1.25rem', color: '#8b5cf6', display: 'block', marginTop: '4px' }}>
              {statsAuditoria.inventario}
            </strong>
          </div>

          <div
            onClick={() => setCategoriaActiva('ELIMINACIONES')}
            style={{
              background: categoriaActiva === 'ELIMINACIONES' ? 'var(--color-danger-subtle)' : 'var(--bg-subtle)',
              border: `1px solid ${categoriaActiva === 'ELIMINACIONES' ? 'var(--color-danger)' : 'var(--border-color)'}`,
              borderRadius: '10px',
              padding: '12px 14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>BAJAS / BORRADOS</span>
              <AlertTriangle size={16} color="#ef4444" />
            </div>
            <strong style={{ fontSize: '1.25rem', color: '#ef4444', display: 'block', marginTop: '4px' }}>
              {statsAuditoria.eliminaciones}
            </strong>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
              minWidth: '240px',
              background: 'var(--bg-surface)',
              borderRadius: '8px',
              border: '1px solid var(--border-input)',
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Buscar por usuario, acción, detalle o ticket..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '10px 0',
                width: '100%',
                outline: 'none',
                fontSize: '0.88rem',
              }}
            />
          </div>

          {/* Selector de Categorías Críticas */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'TODOS', label: 'Todos los Eventos' },
              { id: 'SEGURIDAD', label: 'Seguridad' },
              { id: 'VENTAS', label: 'Caja POS' },
              { id: 'INVENTARIO', label: 'Stock & Bodega' },
              { id: 'ELIMINACIONES', label: 'Eliminaciones' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaActiva(cat.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: categoriaActiva === cat.id ? 'var(--accent-primary)' : 'var(--border-color)',
                  background: categoriaActiva === cat.id ? 'var(--accent-primary)' : 'var(--bg-surface)',
                  color: categoriaActiva === cat.id ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla de Logs de Auditoría */}
        <div style={{ borderRadius: '12px', overflowX: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}># ID</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Fecha / Hora Exacta</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Responsable (Usuario)</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Módulo</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Acción Registrada</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Detalles del Evento</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--accent-primary)' }}>
                    Consultando logs de auditoría en MySQL...
                  </td>
                </tr>
              ) : logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay eventos de auditoría para este criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                logsFiltrados.map((log, idx) => {
                  const badge = getBadgeStyle(log.accion);
                  const fechaStr = log.fecha
                    ? new Date(log.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' })
                    : '-';

                  return (
                    <tr
                      key={log.id}
                      style={{
                        background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontWeight: 700 }}>
                        #{log.id}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {fechaStr}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {log.usuario?.nombre || `Usuario #${log.usuarioId || 'Sistema'}`}
                        </div>
                        {log.usuario?.correo && (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {log.usuario.correo}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            background: 'var(--bg-surface-elevated)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {log.modulo || 'GENERAL'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            padding: '3px 9px',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            display: 'inline-block',
                          }}
                        >
                          {log.accion}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '280px', wordBreak: 'break-word' }}>
                        {log.detalles || 'Sin detalles adicionales'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditoriaTab;
