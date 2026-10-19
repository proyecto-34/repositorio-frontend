import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, XCircle, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

/**
 * Control de pestaña única estilo WhatsApp Web:
 * Cuando se abre una nueva pestaña, la pestaña anterior se desconecta
 * automáticamente de inmediato (sin bucles ni botones invasivos de 'Cerrar sesión'),
 * protegiendo las transacciones de caja y evitando ventas duplicadas.
 */
export const ActiveTabLock = () => {
  const { user, isAuthenticated } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);

  // Identificador único inmutable para esta pestaña específica
  const tabId = useRef(
    `tab_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`
  ).current;

  const channelRef = useRef(null);
  const userId = user?.id || user?.email || (isAuthenticated ? 'authenticated_user' : null);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setIsBlocked(false);
      return;
    }

    const channelName = `tc_session_channel_${userId}`;

    // Desconectar esta pestaña si otra pestaña más reciente reclama la sesión activa
    const desconectarEstaPestana = () => {
      setIsBlocked(true);
      // Intentar cerrar automáticamente la pestaña antigua (si el navegador lo permite)
      try {
        window.close();
      } catch {
        // En Chrome/Edge window.close() solo cierra ventanas abiertas por script
      }
    };

    // 1. Inicializar BroadcastChannel para comunicación entre pestañas
    let channel = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel(channelName);
        channelRef.current = channel;

        channel.onmessage = (event) => {
          const data = event.data;
          if (!data || data.senderTabId === tabId) return;

          // Si otra pestaña reclama la sesión, esta se desconecta de inmediato
          if (data.type === 'CLAIM_SESSION' || data.type === 'TAKE_OVER') {
            desconectarEstaPestana();
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
            desconectarEstaPestana();
          }
        } catch {
          // Ignorar error de parseo
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. Al abrir esta pestaña nueva, toma automáticamente la sesión activa
    const claimPayload = {
      type: 'CLAIM_SESSION',
      senderTabId: tabId,
      timestamp: Date.now(),
    };

    if (channel) {
      channel.postMessage(claimPayload);
    }
    localStorage.setItem(`tc_active_tab_${userId}`, JSON.stringify(claimPayload));

    // Limpieza al desmontar
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (channel) {
        channel.close();
      }
    };
  }, [isAuthenticated, userId, tabId]);

  // Cerrar esta pestaña
  const handleCerrarPestana = () => {
    window.close();
    // Si el navegador bloquea window.close() por política de seguridad:
    setTimeout(() => {
      toast.info('Para cerrar esta pestaña, presiona Ctrl + W o haz clic en la [X] de tu navegador.', {
        duration: 4000,
      });
    }, 250);
  };

  // Transferir la sesión activa de vuelta a esta pestaña
  const handleReanudarAqui = () => {
    if (!userId) return;

    const takeOverPayload = {
      type: 'TAKE_OVER',
      senderTabId: tabId,
      timestamp: Date.now(),
    };

    // Notificar a las demás pestañas para que se desconecten
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
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
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
          padding: '2.5rem 2rem',
          maxWidth: '480px',
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
        {/* Ícono de desconexión */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
          }}
        >
          <ExternalLink size={36} />
        </div>

        {/* Título y explicación directa */}
        <div>
          <h2
            style={{
              margin: '0 0 8px 0',
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
            }}
          >
            Se abrió el sistema en otra pestaña
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '0.92rem',
              color: 'var(--text-muted)',
              lineHeight: 1.55,
            }}
          >
            Para proteger la integridad del inventario y evitar cobros duplicados en caja, esta pestaña se desconectó automáticamente. Tu sesión continúa activa en la otra ventana.
          </p>
        </div>

        {/* Acciones claras: Cerrar pestaña sin preguntas ambiguas */}
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
            onClick={handleCerrarPestana}
            style={{
              background: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'var(--btn-shadow)',
              transition: 'all 0.15s ease',
            }}
          >
            <XCircle size={18} />
            Cerrar esta pestaña
          </button>

          <button
            type="button"
            onClick={handleReanudarAqui}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textDecoration: 'underline',
              opacity: 0.85,
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
          >
            <ArrowRightLeft size={14} />
            ¿Deseas volver a usar el sistema aquí? Transferir sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveTabLock;
