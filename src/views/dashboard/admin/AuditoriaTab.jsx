import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, ShieldAlert, History, User, Clock, Filter, RefreshCw } from 'lucide-react';
import auditoriaService from '../../../services/auditoriaService';
import WeatherWidget from '../../../components/WeatherWidget';

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
      return { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' };
    }
    if (act.includes('VENTA') || act.includes('PAGO')) {
      return { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' };
    }
    if (act.includes('DELETE') || act.includes('ELIMINAR')) {
      return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' };
    }
    if (act.includes('UPDATE') || act.includes('ACTUALIZAR')) {
      return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' };
    }
    return { bg: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd' };
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.5fr) minmax(320px, 1fr)',
        gap: '1.75rem',
        alignItems: 'start',
      }}
    >
      {/* Contenedor Principal */}
      <div
        style={{
          background: '#151c2c',
          borderRadius: '18px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={20} color="#38bdf8" />
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800 }}>
                Auditoría y Trazabilidad del Sistema
              </h3>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
              Registro inmutable de actividades en la BD ({totalLogs} eventos registrados)
            </p>
          </div>

          <button
            type="button"
            onClick={cargarAuditoria}
            disabled={cargando}
            style={{
              background: '#1e273d',
              color: '#cbd5e1',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '10px',
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
              background: '#0b0f19',
              borderRadius: '10px',
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
                color: '#fff',
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
              background: '#0b0f19',
              border: 'none',
              color: '#cbd5e1',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.85rem',
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
        <div style={{ borderRadius: '12px', overflowX: 'auto', background: '#0b0f19' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 39, 61, 0.4)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}># ID</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Fecha / Hora</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Usuario</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Módulo</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Acción</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: '#c4b5fd' }}>
                    Consultando logs de auditoría en la BD...
                  </td>
                </tr>
              ) : logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
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
                      style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(21, 28, 44, 0.4)' }}
                    >
                      <td style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 700 }}>
                        #{log.id}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#cbd5e1', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {fechaStr}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ color: '#f8fafc', fontWeight: 600 }}>
                          {log.usuario?.nombre || `Usuario #${log.usuarioId || 'Sistema'}`}
                        </div>
                        {log.usuario?.correo && (
                          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {log.usuario.correo}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#e2e8f0',
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
                      <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '0.8rem', maxWidth: '240px', wordBreak: 'break-all' }}>
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

      {/* Columna Derecha: Clima & Resumen */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div
          style={{
            background: '#151c2c',
            borderRadius: '18px',
            padding: '1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
          }}
        >
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 800 }}>
            Seguridad y Cumplimiento
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Cada inicio de sesión, venta, registro de pago y modificación de catálogo queda auditado
            con marca de tiempo UTC y relación del usuario que ejecutó la operación.
          </p>
          <div style={{ background: '#0b0f19', padding: '12px', borderRadius: '10px', marginTop: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, display: 'block' }}>
              Base de Datos
            </span>
            <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
              tienda_comunitaria.auditoria
            </strong>
          </div>
        </div>

        <WeatherWidget />
      </div>
    </div>
  );
};

export default AuditoriaTab;
