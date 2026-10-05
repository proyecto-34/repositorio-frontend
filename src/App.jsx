import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import HomeView from './views/home/HomeView';
import LoginView from './views/auth/LoginView';
import CajeroPosView from './views/dashboard/CajeroPosView';
import AdminDashboardView from './views/dashboard/AdminDashboardView';
import FacturaModal from './components/FacturaModal';
import NotificationBell from './components/NotificationBell';
import ActiveTabLock from './components/ActiveTabLock';
import { useAuth } from './context/AuthContext';
import { ROLES, ROLE_BADGES } from './constants/roles';
import ProtectedRoute from './routes/ProtectedRoute';
import ForbiddenView from './views/errors/ForbiddenView';
import NotFoundView from './views/errors/NotFoundView';
import './styles/navbar.css';

function App() {
  const { 
    user, 
    activeRole, 
    logout, 
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [modalFacturaAbierto, setModalFacturaAbierto] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info('Sesión cerrada');
    navigate('/login');
  };

  const isPublicPage = location.pathname === '/' || location.pathname === '/login';
  const roleInfo = ROLE_BADGES[activeRole] || ROLE_BADGES[ROLES.ADMIN];

  return (
    <>
      {/* Control de sesión única de pestaña estilo WhatsApp Web */}
      <ActiveTabLock onLogout={handleLogout} />

      {/* Notificaciones globales */}
      <Toaster position="top-right" richColors />

      {/* Modal de Facturación Rápida */}
      <FacturaModal
        isOpen={modalFacturaAbierto}
        onClose={() => setModalFacturaAbierto(false)}
      />

      {/* Barra superior de navegación */}
      {!isPublicPage && (
        <nav className="app-navbar">
          {/* Marca */}
          <div 
            onClick={() => navigate('/')}
            className="app-navbar-brand"
            title="Ir a la portada del sistema"
          >
            <span className="app-navbar-brand-dot" />
            <strong className="app-navbar-brand-text">
              Tienda Comunitaria
            </strong>
          </div>

          {/* Acciones y Perfil */}
          <div className="app-navbar-actions">
            {/* Centro de Notificaciones de la BD (Solo Admin y Supervisor) */}
            {(activeRole === ROLES.ADMIN || activeRole === ROLES.SUPERVISOR) && (
              <NotificationBell />
            )}

            {activeRole !== ROLES.SUPERVISOR && (
              <button
                onClick={() => setModalFacturaAbierto(true)}
                className="app-navbar-btn-pdf"
              >
                Factura PDF
              </button>
            )}

            {user && (
              <div className="app-navbar-user-box">
                <span className="app-navbar-role-badge">
                  {roleInfo.label}
                </span>
                <span className="app-navbar-user-email">
                  {user.nombre || user.email || 'Usuario'}
                </span>
                <button
                  onClick={handleLogout}
                  className="app-navbar-btn-logout"
                >
                  Salir
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Cuerpo principal de la aplicación */}
      <main className={`app-main-layout ${isPublicPage ? 'public' : 'private'}`}>
        <Routes>
          {/* Ruta principal: Presentación del proyecto */}
          <Route path="/" element={<HomeView />} />
          
          {/* Ruta de autenticación */}
          <Route path="/login" element={<LoginView />} />
          
          <Route path="/cajero" element={
            <ProtectedRoute allowedRoles={[ROLES.CAJERO, ROLES.ADMIN]}>
              <CajeroPosView user={user} />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CONTADOR]}>
              <AdminDashboardView
                user={user}
                onOpenFactura={() => setModalFacturaAbierto(true)}
                onAbrirPos={() => navigate('/cajero')}
              />
            </ProtectedRoute>
          } />

          {/* Ruta de Acceso Denegado (403) */}
          <Route path="/forbidden" element={<ForbiddenView />} />
          
          {/* Ruta pública 404 explícita */}
          <Route path="/not-found" element={<NotFoundView />} />

          {/* Cualquier otra ruta no coincidente muestra Error 404 */}
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
