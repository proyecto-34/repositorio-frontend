import React, { useState, useEffect, useRef } from 'react';
import { MonitorSmartphone, ArrowRightLeft, LogOut, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

/**
 * Componente que replica el comportamiento de WhatsApp Web:
 * Bloquea pestañas duplicadas del mismo usuario en el navegador y permite
 * recuperar el control de la sesión mediante el botón "Usar aquí".
 */
export const ActiveTabLock = ({ onLogout }) => {
  const { user, isAuthenticated } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);

  // Identificador único inmutable para esta pestaña específica
  const tabId = useRef(
    `tab_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`
  ).current;

  const channelRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsBlocked(false);
      return;
    }

    const userId = user.id || user.email || 'global_user';
    const channelName = `tc_session_channel_${userId}`;

    // 1. Inicializar BroadcastChannel para comunicación entre pestañas
    let channel = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel(channelName);
        channelRef.current = channel;

        channel.onmessage = (event) => {
          const data = event.data;
          if (!data || data.senderTabId === tabId) return;

          // Si otra pestaña reclama la sesión o hace "Usar aquí", esta pestaña se bloquea
          if (data.type === 'CLAIM_SESSION' || data.type === 'TAKE_OVER') {
            setIsBlocked(true);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel no soportado, usando fallback de localStorage', e);
    }

    // 2. Fallback con evento 'storage' para compatibilidad completa
    const handleStorageChange = (e) => {
      if (e.key === `tc_active_tab_${userId}` && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload.senderTabId && payload.senderTabId !== tabId) {
            setIsBlocked(true);
          }
        } catch {
          // Ignorar error de parseo
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. Al abrir esta pestaña, reclamamos la sesión activa
    const claimPayload = {
      type: 'CLAIM_SESSION',
      senderTabId: tabId,
      timestamp: Date.now(),
    };

    if (channel) {
      channel.postMessage(claimPayload);
    }
    localStorage.setItem(`tc_active_tab_${userId}`, JSON.stringify(claimPayload));

    // Limpieza al desmontar la pestaña
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (channel) {
        channel.close();
      }
    };
  }, [isAuthenticated, user, tabId]);

  // Función "Usar aquí" (Idéntica a WhatsApp Web)
  const handleUsarAqui = () => {
    if (!user) return;
    const userId = user.id || user.email || 'global_user';

    const takeOverPayload = {
      type: 'TAKE_OVER',
      senderTabId: tabId,
      timestamp: Date.now(),
    };

    // Notificar a las demás pestañas para que se bloqueen
    if (channelRef.current) {
      channelRef.current.postMessage(takeOverPayload);
    }
    localStorage.setItem(`tc_active_tab_${userId}`, JSON.stringify(takeOverPayload));

    setIsBlocked(false);
    toast.success('Sesión activa transferida a esta pestaña');
  };

  if (!isBlocked) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          padding: '2.5rem',
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--card-shadow-elevated)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Ícono animado */}
        <div
          style={{
            width: '74px',
            height: '74px',
            borderRadius: '22px',
            background: 'var(--accent-primary-subtle)',
            border: '1px solid var(--accent-primary-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
          }}
        >
          <MonitorSmartphone size={38} />
        </div>

        {/* Títulos */}
        <div>
          <h2
            style={{
              margin: '0 0 8px 0',
              fontSize: '1.45rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
            }}
          >
            Tienda Comunitaria está abierto en otra ventana
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            Tienes una sesión activa de tu cuenta abierta en otra pestaña o navegador. Para evitar conflictos en la caja y duplicidad de ventas, solo puedes interactuar en una pestaña a la vez.
          </p>
        </div>

        {/* Info del usuario activo */}
        {user && (
          <div
            style={{
              background: 'var(--bg-subtle)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--border-color)',
            }}
          >
            <ShieldAlert size={15} color="var(--accent-primary)" />
            <span>Cuenta activa: <strong>{user.nombre || user.email}</strong></span>
          </div>
        )}

        {/* Botones de acción */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '100%',
            marginTop: '0.5rem',
          }}
        >
          <button
            type="button"
            onClick={handleUsarAqui}
            style={{
              background: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              padding: '13px 24px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'var(--btn-shadow)',
              transition: 'transform 0.15s ease, background 0.15s ease',
            }}
          >
            <ArrowRightLeft size={18} />
            Usar aquí
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              style={{
                background: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-input)',
                padding: '11px 20px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveTabLock;
