import React, { useState, useEffect } from 'react';
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
import { ROLES, ROLE_BADGES } from './constants/roles';

function App() {
  const { 
    user, 
    activeRole, 
    isAdmin, 
    isCajero, 
    cambiarRolActivo, 
    logout, 
    isAuthenticated 
  } = useAuth();

  const [vistaActual, setVistaActual] = useState(() => {
    return localStorage.getItem('token') ? 'dashboard' : 'login';
  });
  const [modalFacturaAbierto, setModalFacturaAbierto] = useState(false);

  const handleLoginSuccess = (data) => {
    setVistaActual('dashboard');
    toast.success(`¡Bienvenido ${data.user?.nombre || data.user?.email || ''}!`);
  };

  const handleLogout = () => {
    logout();
    setVistaActual('login');
    toast.info('Sesión cerrada');
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

      {/* Barra superior de navegación */}
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
        {/* Marca y selector de vista */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#38bdf8', color: '#0f172a', padding: '6px', borderRadius: '8px', display: 'flex' }}>
              <Store size={18} />
            </div>
            <strong style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: 800 }}>
              Tienda Comunitaria
            </strong>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => setVistaActual('login')}
              style={{
                background: vistaActual === 'login' ? '#38bdf8' : '#1e293b',
                color: vistaActual === 'login' ? '#0f172a' : '#cbd5e1',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem'
              }}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setVistaActual('dashboard')}
              style={{
                background: vistaActual === 'dashboard' ? '#38bdf8' : '#1e293b',
                color: vistaActual === 'dashboard' ? '#0f172a' : '#cbd5e1',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem'
              }}
            >
              Panel ({roleInfo.label})
            </button>
          </div>
        </div>

        {/* Selector interactivo de Roles (Demo / RBAC) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(30, 41, 59, 0.9)',
          border: '1px solid #334155',
          borderRadius: '10px',
          padding: '3px 6px',
          gap: '4px'
        }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', padding: '0 4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowRightLeft size={12} /> Rol Detectado:
          </span>
          <button
            type="button"
            onClick={() => {
              cambiarRolActivo(ROLES.ADMIN);
              toast.info('Vista de Administrador activada');
            }}
            style={{
              background: isAdmin ? '#4338ca' : 'transparent',
              color: isAdmin ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: isAdmin ? 700 : 500,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
            title="Ver vista como Administrador"
          >
            👑 Admin
          </button>
          <button
            type="button"
            onClick={() => {
              cambiarRolActivo(ROLES.CAJERO);
              toast.info('Vista de Cajero POS activada');
            }}
            style={{
              background: isCajero ? '#065f46' : 'transparent',
              color: isCajero ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: isCajero ? 700 : 500,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
            title="Ver vista como Cajero POS"
          >
            🛒 Cajero POS
          </button>
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

      {/* Cuerpo principal de la aplicación */}
      <main style={{
        minHeight: 'calc(100vh - 60px)',
        backgroundColor: '#0f172a',
        padding: vistaActual === 'login' ? 0 : '1.5rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {vistaActual === 'login' ? (
          <LoginView onLoginSuccess={handleLoginSuccess} />
        ) : (
          /* Renderizado Condicional por Rol de la Base de Datos */
          isAdmin ? (
            <AdminDashboardView
              user={user}
              onOpenFactura={() => setModalFacturaAbierto(true)}
              onAbrirPos={() => cambiarRolActivo(ROLES.CAJERO)}
            />
          ) : (
            <CajeroPosView user={user} />
          )
        )}
      </main>
    </>
  );
}

export default App;
