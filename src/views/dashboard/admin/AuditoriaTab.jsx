import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, ShieldAlert, History, User, Clock, Filter, RefreshCw } from 'lucide-react';
import auditoriaService from '../../../services/auditoriaService';

export const AuditoriaTab = () => {
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('TODOS');

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
      toast.error('Error al cargar logs de auditoría');
    } finally {
      setCargando(false);
    }
  };

  const modulosUnicos = ['TODOS', ...new Set(logs.map((l) => String(l.modulo || 'GENERAL').toUpperCase()))];

  const logsFiltrados = logs.filter((l) => {
    const q = busqueda.toLowerCase();
    const moduloMatch = filtroModulo === 'TODOS' || String(l.modulo || '').toUpperCase() === filtroModulo;
    const textoMatch =
      String(l.id).includes(q) ||
      (l.accion && l.accion.toLowerCase().includes(q)) ||
      (l.modulo && l.modulo.toLowerCase().includes(q)) ||
      (l.detalles && l.detalles.toLowerCase().includes(q)) ||
      (l.usuario?.nombre && l.usuario.nombre.toLowerCase().includes(q)) ||
      (l.usuario?.correo && l.usuario.correo.toLowerCase().includes(q));

    return moduloMatch && textoMatch;
  });

  const getBadgeStyle = (accion = '') => {
    const act = accion.toUpperCase();
    if (act.includes('LOGIN') || act.includes('AUTH')) {
      return { bg: 'var(--color-info-subtle)', color: 'var(--color-info)' };
    }
    if (act.includes('VENTA') || act.includes('PAGO')) {
      return { bg: 'var(--color-success-subtle)', color: 'var(--color-success)' };
    }
    if (act.includes('DELETE') || act.includes('ELIMINAR')) {
      return { bg: 'var(--color-danger-subtle)', color: 'var(--color-danger)' };
    }
    if (act.includes('UPDATE') || act.includes('ACTUALIZAR')) {
      return { bg: 'var(--color-warning-subtle)', color: 'var(--color-warning)' };
    }
    return { bg: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)' };
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Contenedor Principal */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '16px',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={20} color="#1e5bb8" />
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                Auditoría y Trazabilidad del Sistema
              </h3>
            </div>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Registro inmutable de actividades en la BD ({totalLogs} eventos registrados)
            </p>
          </div>

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
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} className={cargando ? 'spin-icon' : ''} />
            {cargando ? 'Consultando...' : 'Actualizar'}
          </button>
        </div>

        {/* Filtros */}
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
              placeholder="Buscar por acción, usuario o detalles..."
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

          <select
            value={filtroModulo}
            onChange={(e) => setFiltroModulo(e.target.value)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-input)',
              color: 'var(--text-primary)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              outline: 'none',
            }}
          >
            {modulosUnicos.map((m) => (
              <option key={m} value={m}>
                {m === 'TODOS' ? 'Todos los módulos' : m}
              </option>
            ))}
          </select>
        </div>

        {/* Tabla de Logs */}
        <div style={{ borderRadius: '12px', overflowX: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}># ID</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Fecha / Hora</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Usuario</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Módulo</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Acción</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--accent-primary)' }}>
                    Consultando logs de auditoría en la BD...
                  </td>
                </tr>
              ) : logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron eventos de auditoría.
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
                            color: '#334155',
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
                            padding: '3px 9px',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                          }}
                        >
                          {log.accion}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '240px', wordBreak: 'break-all' }}>
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
