import React, { useState, useEffect, useRef } from 'react';
import { notificacionesService } from '../services/notificacionesService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import '../styles/notification-bell.css';

export const NotificationBell = () => {
  const { activeRole, user, isAuthenticated } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState('todas'); // 'todas' | 'mi_rol' | 'alertas' | 'no_leidas' | 'eventos' | 'info'
  const [limiteVisual, setLimiteVisual] = useState(6);
  const dropdownRef = useRef(null);
  
  // Control de toasts proactivos
  const primerCargueRef = useRef(true);
  const avisadasToastRef = useRef(new Set());

  useEffect(() => {
    // Si no está autenticado o es un rol sin gestión de inventario/notificaciones (cajero, contador), no cargar
    if (!isAuthenticated || !user || (activeRole !== 'admin' && activeRole !== 'supervisor')) {
      setNotificaciones([]);
      return;
    }

    cargarNotificaciones(true);
    // Polling ligero cada 60s
    const interval = setInterval(() => {
      cargarNotificaciones(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [activeRole, isAuthenticated, user]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickAfuera = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAbierto(false);
      }
    };
    if (abierto) {
      document.addEventListener('mousedown', handleClickAfuera);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickAfuera);
    };
  }, [abierto]);

  const cargarNotificaciones = async (esPrimerCargue = false) => {
    try {
      const data = await notificacionesService.obtenerNotificaciones({ limit: 60, page: 1 });
      if (Array.isArray(data)) {
        // Filtrar automáticamente para mostrar solo las notificaciones pertinentes al rol actual
        const dataFiltradaRol = notificacionesService.filtrarPorRol(data, activeRole);
        setNotificaciones(dataFiltradaRol);

        // 2. Notificaciones Toast Proactivas (Sonner) - Solo para Admin y Supervisor
        if (esPrimerCargue && primerCargueRef.current) {
          if (activeRole === 'admin' || activeRole === 'supervisor') {
            const alertasSinLeer = dataFiltradaRol.filter((n) => !n.leida && n.tipo === 'ALERTA');
            if (alertasSinLeer.length > 0) {
              toast.warning(`⚠️ Inventario: Tienes ${alertasSinLeer.length} alerta(s) de stock pendientes.`, {
                duration: 4500,
              });
            }
          }
          // Registrar IDs existentes para no spammear
          dataFiltradaRol.forEach((n) => avisadasToastRef.current.add(n.id));
          primerCargueRef.current = false;
        } else if (!esPrimerCargue) {
          // Detectar nuevas notificaciones entrantes durante el polling
          const nuevas = dataFiltradaRol.filter((n) => !n.leida && !avisadasToastRef.current.has(n.id));
          nuevas.forEach((n) => {
            avisadasToastRef.current.add(n.id);
            if (n.tipo === 'ALERTA') {
              toast.warning(n.mensaje, {
                description: 'Alerta crítica de inventario',
                duration: 5000,
              });
            } else if (n.tipo === 'EVENTO') {
              toast.info(n.mensaje, {
                description: 'Nuevo evento en el sistema',
                duration: 4000,
              });
            }
          });
        }
      }
    } catch (err) {
      console.warn('Error al cargar notificaciones:', err.message);
    }
  };

  const noLeidas = notificaciones.filter((n) => !n.leida);
  const totalNoLeidas = noLeidas.length;

  const handleMarcarLeida = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificacionesService.marcarComoLeida(id);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
    } catch (err) {
      toast.error('No se pudo marcar como leída');
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      const idsNoLeidas = noLeidas.map((n) => n.id);
      await notificacionesService.marcarTodasComoLeidas(idsNoLeidas);
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (err) {
      toast.error('Error al actualizar notificaciones');
    }
  };

  const handleEliminar = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificacionesService.eliminarNotificacion(id);
      setNotificaciones((prev) => prev.filter((n) => n.id !== id));
      toast.info('Notificación descartada');
    } catch (err) {
      toast.error('Error al descartar notificación');
    }
  };

  const handleDescartarLeidas = async () => {
    const idsLeidas = notificaciones.filter((n) => n.leida).map((n) => n.id);
    if (idsLeidas.length === 0) {
      toast.info('No hay notificaciones leídas para limpiar');
      return;
    }
    try {
      await notificacionesService.descartarLeidas(idsLeidas);
      setNotificaciones((prev) => prev.filter((n) => !n.leida));
      toast.success(`Se descartaron ${idsLeidas.length} notificaciones leídas`);
    } catch (err) {
      toast.error('Error al descartar leídas');
    }
  };

  const formatTiempo = (fechaIso) => {
    try {
      const fecha = new Date(fechaIso);
      const diffMs = Date.now() - fecha.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMin < 1) return 'Justo ahora';
      if (diffMin < 60) return `Hace ${diffMin} min`;
      if (diffHoras < 24) return `Hace ${diffHoras} h`;
      return `Hace ${diffDias} d`;
    } catch {
      return '';
    }
  };

  const getTipoEstilo = (tipo) => {
    const t = String(tipo || 'INFO').toUpperCase();
    switch (t) {
      case 'EVENTO':
        return {
          color: '#34d399',
          bg: 'rgba(52, 211, 153, 0.15)',
          border: 'rgba(52, 211, 153, 0.3)',
          label: 'EVENTO',
        };
      case 'INFO':
        return {
          color: '#38bdf8',
          bg: 'rgba(56, 189, 248, 0.15)',
          border: 'rgba(56, 189, 248, 0.3)',
          label: 'INFO',
        };
      case 'ALERTA':
      case 'STOCK':
        return {
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.3)',
          label: 'ALERTA',
        };
      default:
        return {
          color: '#c4b5fd',
          bg: 'rgba(139, 92, 246, 0.15)',
          border: 'rgba(139, 92, 246, 0.3)',
          label: t,
        };
    }
  };

  // 4. Las notificaciones ya vienen filtradas por el rol del usuario autenticado
  const notificacionesFiltradas = notificaciones.filter((n) => {
    if (filtro === 'alertas') return n.tipo === 'ALERTA';
    if (filtro === 'no_leidas') return !n.leida;
    if (filtro === 'eventos') return n.tipo === 'EVENTO';
    if (filtro === 'info') return n.tipo === 'INFO';
    return true;
  });

  // 5. Paginación / Límite de carga visual
  const notificacionesVisibles = notificacionesFiltradas.slice(0, limiteVisual);
  const restantes = notificacionesFiltradas.length - notificacionesVisibles.length;

  return (
    <div ref={dropdownRef} className="notification-bell-container">
      {/* Botón de la Campana */}
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        title="Centro de Notificaciones"
        className={`notification-bell-btn ${abierto ? 'active' : ''} ${totalNoLeidas > 0 ? 'has-unread' : ''}`}
      >
        {/* Icono de Campana SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Badge Flotante con Contador */}
        {totalNoLeidas > 0 && (
          <span className="notification-bell-badge">
            {totalNoLeidas > 9 ? '9+' : totalNoLeidas}
          </span>
        )}
      </button>

      {/* Menú Desplegable (Dropdown) */}
      {abierto && (
        <div className="notification-bell-dropdown">
          {/* Cabecera del Panel */}
          <div className="notification-bell-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong>Notificaciones</strong>
              {totalNoLeidas > 0 ? (
                <span className="notification-badge-unread">
                  {totalNoLeidas} nuevas
                </span>
              ) : (
                <span className="notification-badge-uptodate">
                  Al día
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {totalNoLeidas > 0 && (
                <button
                  type="button"
                  onClick={handleMarcarTodasLeidas}
                  className="notification-btn-readall"
                >
                  Marcar leídas
                </button>
              )}
            </div>
          </div>

          {/* Filtros rápidos */}
          <div className="notification-filter-bar">
            {[
              { id: 'todas', label: 'Todas' },
              { id: 'alertas', label: '⚠️ Alertas' },
              { id: 'no_leidas', label: `No leídas (${totalNoLeidas})` },
              { id: 'eventos', label: 'Eventos' },
              { id: 'info', label: 'Info' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFiltro(f.id);
                  setLimiteVisual(6);
                }}
                className={`notification-filter-btn ${filtro === f.id ? 'active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de Notificaciones con Paginación */}
          <div className="notification-list-scroll">
            {notificacionesVisibles.length === 0 ? (
              <div className="notification-empty">
                <div style={{ fontSize: '1.75rem', marginBottom: '6px' }}>📭</div>
                No hay notificaciones en este filtro
              </div>
            ) : (
              notificacionesVisibles.map((item) => {
                const badge = getTipoEstilo(item.tipo);
                return (
                  <div
                    key={item.id}
                    onClick={() => !item.leida && handleMarcarLeida(item.id)}
                    className={`notification-item ${item.leida ? 'leida' : ''}`}
                  >
                    <div className="notification-item-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {!item.leida && <span className="notification-item-unread-dot" />}
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: badge.color,
                            backgroundColor: badge.bg,
                            border: `1px solid ${badge.border}`,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {badge.label}
                        </span>

                        {item.usuario_id && (
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                            Usuario #{item.usuario_id}
                          </span>
                        )}
                      </div>

                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        {formatTiempo(item.fecha)}
                      </span>
                    </div>

                    <p className={`notification-item-text ${item.leida ? 'leida' : ''}`}>
                      {item.mensaje}
                    </p>

                    {/* Acciones flotantes */}
                    <div className="notification-item-actions">
                      {!item.leida && (
                        <button
                          type="button"
                          onClick={(e) => handleMarcarLeida(item.id, e)}
                          className="notification-btn-subaction"
                        >
                          Marcar leída
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleEliminar(item.id, e)}
                        title="Descartar permanentemente"
                        className="notification-btn-discard"
                      >
                        Descartar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pie del Dropdown: Cargar más y Limpiar leídas */}
          <div className="notification-bell-footer">
            {restantes > 0 ? (
              <button
                type="button"
                onClick={() => setLimiteVisual((prev) => prev + 6)}
                className="notification-btn-loadmore"
              >
                Cargar más (+{restantes})
              </button>
            ) : (
              <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
                Mostrando {notificacionesVisibles.length} de {notificacionesFiltradas.length}
              </span>
            )}

            {notificaciones.some((n) => n.leida) && (
              <button
                type="button"
                onClick={handleDescartarLeidas}
                className="notification-btn-clearread"
              >
                🗑️ Limpiar leídas
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
