import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, Trash2, X } from 'lucide-react';

export const ConfirmModal = ({
  isOpen = false,
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Sí, continuar',
  cancelText = 'Cancelar',
  variant = 'danger', // 'danger' | 'warning' | 'info'
  onConfirm,
  onCancel,
}) => {
  // Manejo de tecla Escape y Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onCancel) onCancel();
      } else if (e.key === 'Enter') {
        if (onConfirm) onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const iconColor = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#3b82f6';
  const iconBg = isDanger
    ? 'rgba(239, 68, 68, 0.12)'
    : isWarning
    ? 'rgba(245, 158, 11, 0.12)'
    : 'rgba(59, 130, 246, 0.12)';
  const iconBorder = isDanger
    ? 'rgba(239, 68, 68, 0.25)'
    : isWarning
    ? 'rgba(245, 158, 11, 0.25)'
    : 'rgba(59, 130, 246, 0.25)';

  const btnConfirmBg = isDanger
    ? '#dc2626'
    : isWarning
    ? '#d97706'
    : 'var(--accent-primary)';
  const btnConfirmShadow = isDanger
    ? '0 4px 14px rgba(220, 38, 38, 0.35)'
    : isWarning
    ? '0 4px 14px rgba(217, 119, 6, 0.35)'
    : '0 4px 14px rgba(30, 91, 184, 0.35)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.25rem',
        animation: 'confirmFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '22px',
          padding: '2.2rem 2.4rem',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1.25rem',
          position: 'relative',
          animation: 'confirmScaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar (X) */}
        <button
          type="button"
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          title="Cerrar ventana"
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        {/* Icono Principal con efecto Glow */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: iconBg,
            border: `1px solid ${iconBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: iconColor,
            boxShadow: `0 8px 24px ${iconBg}`,
          }}
        >
          {isDanger ? (
            <Trash2 size={30} />
          ) : isWarning ? (
            <AlertTriangle size={30} />
          ) : (
            <Info size={30} />
          )}
        </div>

        {/* Título y Mensaje */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3
            style={{
              margin: 0,
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
            }}
          >
            {title}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '0.92rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            {message}
          </p>
        </div>

        {/* Banner de Advertencia Adicional */}
        {isDanger && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ef4444',
              fontSize: '0.8rem',
              fontWeight: 600,
              textAlign: 'left',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>Esta acción no se puede deshacer y afectará los registros del sistema.</span>
          </div>
        )}

        {/* Botones de Acción */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            width: '100%',
            marginTop: '8px',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '12px 18px',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1.2,
              background: btnConfirmBg,
              border: 'none',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: btnConfirmShadow,
              transition: 'all 0.15s ease',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confirmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes confirmScaleUp {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
