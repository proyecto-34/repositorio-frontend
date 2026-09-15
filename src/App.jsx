import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { 
  Receipt, 
  ShoppingCart, 
  Users, 
  Package, 
  Layers, 
  ArrowRightLeft, 
  Store 
} from 'lucide-react';
import LoginView from './views/auth/LoginView';
import CajeroPosView from './views/dashboard/CajeroPosView';
import AdminDashboardView from './views/dashboard/AdminDashboardView';
import FacturaModal from './components/FacturaModal';
import axiosClient from './api/axiosClient';
import { useAuth } from './context/AuthContext';
import { ROLES, ROLES_DB, ROLE_BADGES } from './constants/roles';
import ProtectedRoute from './routes/ProtectedRoute';

function App() {
  const { 
    user, 
    activeRole, 
    isAdmin, 
    isCajero,
    isInventario,
    isContador,
    isSupervisor,
    cambiarRolActivo, 
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
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #1e293b',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
          flexWrap: 'wrap',
          gap: '0.75rem',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          {/* Marca */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#38bdf8', color: '#0f172a', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                <Store size={18} />
              </div>
              <strong style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: 800 }}>
                Tienda Comunitaria
              </strong>
            </div>
          </div>

          {/* Perfil del usuario y factura */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setModalFacturaAbierto(true)}
            style={{
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '5px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Receipt size={15} /> Factura PDF
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{
                background: roleInfo.bg,
                color: roleInfo.color,
                border: `1px solid ${roleInfo.border}`,
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {roleInfo.icon} {roleInfo.label}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                {user.nombre || user.email || 'Usuario'}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
              >
                Salir
              </button>
            </div>
          )}
        </div>
        </nav>
      )}

      {/* Cuerpo principal de la aplicación */}
      <main style={{
        minHeight: 'calc(100vh - 60px)',
        backgroundColor: '#0f172a',
        padding: location.pathname === '/login' ? 0 : '1.5rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
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
