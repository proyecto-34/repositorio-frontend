import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import HomeView from './views/home/HomeView';
import LoginView from './views/auth/LoginView';
import { Lock } from 'lucide-react';
import NotificationBell from './components/NotificationBell';
import ThemeToggle from './components/ThemeToggle';
import FontSizeToggle from './components/FontSizeToggle';
import ActiveTabLock from './components/ActiveTabLock';
import AutoLockGuard from './components/AutoLockGuard';
import { useAuth } from './context/AuthContext';
import { ROLES, ROLE_BADGES } from './constants/roles';
import ProtectedRoute from './routes/ProtectedRoute';
import './styles/navbar.css';

// Code-Splitting (Lazy Loading) para optimizar el bundle de carga inicial
const CajeroPosView = lazy(() => import('./views/dashboard/CajeroPosView'));
const AdminDashboardView = lazy(() => import('./views/dashboard/AdminDashboardView'));
const FacturaModal = lazy(() => import('./components/FacturaModal'));
const ForbiddenView = lazy(() => import('./views/errors/ForbiddenView'));
const NotFoundView = lazy(() => import('./views/errors/NotFoundView'));

const ModuleLoader = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    color: 'var(--text-muted)'
  }}>
    <div style={{
      width: '38px',
      height: '38px',
      borderRadius: '50%',
      border: '3px solid var(--border-color)',
      borderTopColor: 'var(--accent-primary)',
      animation: 'appSpin 0.75s linear infinite'
    }} />
    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Cargando módulo...</span>
    <style>{`@keyframes appSpin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

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
  const isAdminPage = location.pathname.startsWith('/admin');
  const roleInfo = ROLE_BADGES[activeRole] || ROLE_BADGES[ROLES.ADMIN];

  return (
    <>
      {/* Control de sesión única de pestaña estilo WhatsApp Web */}
      <ActiveTabLock onLogout={handleLogout} />

      {/* Bloqueo automático por inactividad y seguridad (Auto-Lock) */}
      <AutoLockGuard onLogout={handleLogout} />

      {/* Notificaciones globales en la esquina inferior */}
      <Toaster position="bottom-right" richColors closeButton />

      {/* Modal de Facturación Rápida (Cargado diferido) */}
      <Suspense fallback={null}>
        <FacturaModal
          isOpen={modalFacturaAbierto}
          onClose={() => setModalFacturaAbierto(false)}
        />
      </Suspense>

      {/* Barra superior de navegación para vistas privadas estándar (en admin se usa su propia barra integrada) */}
      {!isPublicPage && !isAdminPage && (
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
            <span className="app-navbar-brand-tag">POS Cloud</span>
          </div>

          {/* Acciones y Perfil */}
          <div className="app-navbar-actions">
            <div className="app-navbar-utilities">
              {/* Bloqueo Manual de Pantalla por Seguridad */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('tc_lock_screen'))}
                className="app-navbar-btn-lock"
                title="Bloquear pantalla ahora (Seguridad de Caja)"
                aria-label="Bloquear pantalla"
              >
                <Lock size={15} />
              </button>

              {/* Selector de Accesibilidad: Tamaño de Texto (WCAG) */}
              <FontSizeToggle />

              {/* Alternador de Modo Claro / Modo Oscuro */}
              <ThemeToggle />

              {/* Centro de Notificaciones de la BD (Solo Admin y Supervisor) */}
              {(activeRole === ROLES.ADMIN || activeRole === ROLES.SUPERVISOR) && (
                <NotificationBell />
              )}
            </div>

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
      <main className={`app-main-layout ${isPublicPage ? 'public' : 'private'} ${isAdminPage ? 'admin-layout-root' : ''}`}>
        <Suspense fallback={<ModuleLoader />}>
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
                  onLogout={handleLogout}
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
        </Suspense>
      </main>
    </>
  );
}

export default App;
