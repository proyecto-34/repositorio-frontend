import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_BADGES, ROLES } from '../../constants/roles';

/**
 * Vista de Error 403: Acceso Prohibido / Denegado
 * Se muestra cuando un usuario autenticado intenta acceder a una ruta para la cual no tiene permisos.
 */
export const ForbiddenView = () => {
  const navigate = useNavigate();
  const { user, activeRole, isCajero, logout } = useAuth();

  const roleInfo = ROLE_BADGES[activeRole] || ROLE_BADGES[ROLES.ADMIN];

  const handleGoHome = () => {
    if (isCajero) {
      navigate('/cajero');
    } else {
      navigate('/admin');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        backgroundColor: '#151c2c',
        borderRadius: '20px',
        padding: '2.5rem',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem'
      }}>
        {/* Icono de Seguridad */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ef4444'
        }}>
          <ShieldAlert size={40} />
        </div>

        {/* Código y Título */}
        <div>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#ef4444',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Error 403 • Prohibido
          </span>
          <h1 style={{
            margin: '0.5rem 0 0.25rem 0',
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#f8fafc',
            letterSpacing: '-0.5px'
          }}>
            Acceso No Autorizado
          </h1>
          <p style={{
            margin: 0,
            fontSize: '0.92rem',
            color: '#94a3b8',
            lineHeight: 1.5
          }}>
            Tu cuenta actual no cuenta con los privilegios requeridos para ver este recurso o módulo del sistema.
          </p>
        </div>

        {/* Detalle de Identidad y Rol */}
        {user && (
          <div style={{
            width: '100%',
            backgroundColor: '#0b0f19',
            borderRadius: '12px',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxSizing: 'border-box'
          }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Usuario</span>
              <strong style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>{user.nombre || user.correo || 'Usuario'}</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Rol Activo</span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: roleInfo.color || '#c4b5fd',
                backgroundColor: roleInfo.bg || 'rgba(139, 92, 246, 0.2)',
                padding: '3px 8px',
                borderRadius: '6px',
                display: 'inline-block'
              }}>
                {roleInfo.label}
              </span>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          width: '100%',
          marginTop: '0.5rem'
        }}>
          <button
            type="button"
            onClick={handleGoHome}
            style={{
              flex: 1,
              backgroundColor: '#8b5cf6',
              color: '#ffffff',
              border: 'none',
              padding: '12px 18px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
          >
            <Home size={16} />
            Ir a mi Panel
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              backgroundColor: '#1e273d',
              color: '#cbd5e1',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d3748'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e273d'}
          >
            <ArrowLeft size={16} />
            Volver
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: 'none',
              padding: '12px 14px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.color = '#f87171';
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenView;
