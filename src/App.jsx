import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import LoginView from './views/auth/LoginView';
import CajeroPosView from './views/dashboard/CajeroPosView';
import AdminDashboardView from './views/dashboard/AdminDashboardView';
import FacturaModal from './components/FacturaModal';
import { useAuth } from './context/AuthContext';
import { ROLES, ROLE_BADGES } from './constants/roles';
import ProtectedRoute from './routes/ProtectedRoute';

function App() {
  const { 
    user, 
    activeRole, 
    isCajero,
    logout, 
    isAuthenticated 
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [modalFacturaAbierto, setModalFacturaAbierto] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info('Sesión cerrada');
    navigate('/login');
  };

  const roleInfo = ROLE_BADGES[activeRole] || ROLE_BADGES[ROLES.ADMIN];

  return (
    <>
      {/* Notificaciones globales */}
      <Toaster position="top-right" richColors />

      {/* Modal de Facturación Rápida */}
      <FacturaModal
        isOpen={modalFacturaAbierto}
        onClose={() => setModalFacturaAbierto(false)}
      />

      {/* Barra superior de navegación (Oculta en el login) */}
      {location.pathname !== '/login' && (
        <nav style={{
          backgroundColor: '#151c2c',
          border: 'none',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
          padding: '0.85rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
          flexWrap: 'wrap',
          gap: '0.75rem',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          width: '100%'
        }}>
          {/* Marca - Sin iconos, texto elegante y moderno */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#8b5cf6',
              display: 'inline-block'
            }} />
            <strong style={{ color: '#f8fafc', fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.3px' }}>
              Tienda Comunitaria
            </strong>
          </div>

          {/* Acciones y Perfil */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              onClick={() => setModalFacturaAbierto(true)}
              style={{
                background: '#8b5cf6',
                color: '#ffffff',
                border: 'none',
                padding: '7px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
            >
              Factura PDF
            </button>

            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  background: 'rgba(139, 92, 246, 0.18)',
                  color: '#c4b5fd',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.3px'
                }}>
                  {roleInfo.label}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                  {user.nombre || user.email || 'Usuario'}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.color = '#f87171';
                  }}
                >
                  Salir
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Cuerpo principal de la aplicación en pantalla completa */}
      <main style={{
        minHeight: location.pathname === '/login' ? '100vh' : 'calc(100vh - 65px)',
        backgroundColor: '#0b0f19',
        padding: location.pathname === '/login' ? 0 : '1.5rem 2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          
          <Route path="/cajero" element={
            <ProtectedRoute allowedRoles={[ROLES.CAJERO, ROLES.SUPERVISOR, ROLES.ADMIN]}>
              <CajeroPosView user={user} />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.INVENTARIO, ROLES.CONTADOR]}>
              <AdminDashboardView
                user={user}
                onOpenFactura={() => setModalFacturaAbierto(true)}
                onAbrirPos={() => navigate('/cajero')}
              />
            </ProtectedRoute>
          } />

          <Route path="*" element={
            <Navigate to={isAuthenticated ? (isCajero ? '/cajero' : '/admin') : '/login'} replace />
          } />
        </Routes>
      </main>
    </>
  );
}

export default App;
