import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Vista de Error 404: Página no encontrada
 * Se muestra cuando se intenta acceder a una ruta inexistente.
 */
export const NotFoundView = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isCajero } = useAuth();

  const handleGoHome = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (isCajero) {
      navigate('/cajero');
    } else {
      navigate('/admin');
    }
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
        maxWidth: '500px',
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
        {/* Icono */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'rgba(139, 92, 246, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8b5cf6'
        }}>
          <FileQuestion size={40} />
        </div>

        {/* Código y Título */}
        <div>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#8b5cf6',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Error 404 • No Encontrado
          </span>
          <h1 style={{
            margin: '0.5rem 0 0.25rem 0',
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#f8fafc',
            letterSpacing: '-0.5px'
          }}>
            Página No Encontrada
          </h1>
          <p style={{
            margin: 0,
            fontSize: '0.92rem',
            color: '#94a3b8',
            lineHeight: 1.5
          }}>
            La ruta que buscas no existe o ha sido movida a otra dirección.
          </p>
        </div>

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
            {isAuthenticated ? 'Ir al Inicio' : 'Ir al Login'}
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
            Regresar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundView;
