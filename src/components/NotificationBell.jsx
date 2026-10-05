import React, { useState, useEffect, useRef } from 'react';
import { notificacionesService } from '../services/notificacionesService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

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
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Botón de la Campana */}
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        title="Centro de Notificaciones"
        style={{
          background: abierto ? '#1e273d' : 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: totalNoLeidas > 0 ? '#fbbf24' : '#cbd5e1',
          position: 'relative',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#1e273d')}
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = abierto
            ? '#1e273d'
            : 'rgba(255, 255, 255, 0.06)')
        }
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
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
              animation: 'pulse 2s infinite',
            }}
          >
            {totalNoLeidas > 9 ? '9+' : totalNoLeidas}
          </span>
        )}
      </button>

      {/* Menú Desplegable (Dropdown) */}
      {abierto && (
        <div
          style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            width: '380px',
            maxWidth: '92vw',
            backgroundColor: '#151c2c',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75)',
            zIndex: 100,
            overflow: 'hidden',
            animation: 'fadeIn 0.18s ease-out',
          }}
        >
          {/* Cabecera del Panel */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#111726',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 800 }}>
                Notificaciones
              </strong>
              {totalNoLeidas > 0 ? (
                <span
                  style={{
                    background: 'rgba(239, 68, 68, 0.18)',
                    color: '#f87171',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {totalNoLeidas} nuevas
                </span>
              ) : (
                <span
                  style={{
                    background: 'rgba(52, 211, 153, 0.15)',
                    color: '#34d399',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  Al día
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {totalNoLeidas > 0 && (
                <button
                  type="button"
                  onClick={handleMarcarTodasLeidas}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#a78bfa',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Marcar leídas
                </button>
              )}
            </div>
          </div>

          {/* Filtros rápidos con soporte de rol */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '8px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              backgroundColor: '#131929',
              overflowX: 'auto',
            }}
          >
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
                style={{
                  background: filtro === f.id ? '#8b5cf6' : 'rgba(255, 255, 255, 0.04)',
                  color: filtro === f.id ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de Notificaciones con Paginación */}
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {notificacionesVisibles.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '0.85rem',
                }}
              >
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
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      backgroundColor: item.leida ? 'transparent' : 'rgba(139, 92, 246, 0.05)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = item.leida
                        ? 'transparent'
                        : 'rgba(139, 92, 246, 0.05)')
                    }
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {!item.leida && (
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: '#8b5cf6',
                              display: 'inline-block',
                            }}
                          />
                        )}
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

                    <p
                      style={{
                        margin: 0,
                        color: item.leida ? '#cbd5e1' : '#f8fafc',
                        fontSize: '0.82rem',
                        fontWeight: item.leida ? 400 : 600,
                        lineHeight: '1.4',
                      }}
                    >
                      {item.mensaje}
                    </p>

                    {/* Acciones flotantes */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '10px',
                        marginTop: '6px',
                      }}
                    >
                      {!item.leida && (
                        <button
                          type="button"
                          onClick={(e) => handleMarcarLeida(item.id, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#a78bfa',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            padding: 0,
                            fontWeight: 600,
                          }}
                        >
                          Marcar leída
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleEliminar(item.id, e)}
                        title="Descartar permanentemente"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
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
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#111726',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
            }}
          >
            {restantes > 0 ? (
              <button
                type="button"
                onClick={() => setLimiteVisual((prev) => prev + 6)}
                style={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: '#c4b5fd',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)')}
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
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
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
