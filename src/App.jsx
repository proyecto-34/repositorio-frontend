import { useState } from 'react';
import { Toaster } from 'sonner';
import LoginView from './views/auth/LoginView';
import authService from './services/authService';
import { LogOut, User, Store, ShieldCheck } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getStoredUser());

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const handleLoginSuccess = (result) => {
    setCurrentUser(result.user);
  };

  return (
    <>
      <Toaster richColors position="top-right" />

      {!currentUser ? (
        <LoginView onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {/* Header */}
          <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.2rem 2rem',
            backgroundColor: '#1e293b',
            borderBottom: '1px solid #334155'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                padding: '0.6rem',
                borderRadius: '12px',
                display: 'flex',
                color: '#fff'
              }}>
                <Store size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>Tienda Comunitaria</h2>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Sesión Iniciada con Éxito</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </header>

          {/* Body */}
          <main style={{ maxWidth: '800px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
            <div style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <User size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>
                    ¡Bienvenido, {currentUser?.nombre || currentUser?.email || 'Usuario'}!
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Token JWT y sesión sincronizados con el backend NestJS
                  </p>
                </div>
              </div>

              <div style={{
                backgroundColor: '#0f172a',
                padding: '1.2rem',
                borderRadius: '10px',
                border: '1px solid #1e293b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#4ade80', fontSize: '0.9rem', fontWeight: 600 }}>
                  <ShieldCheck size={18} /> Datos de usuario en sesión:
                </div>
                <pre style={{ margin: 0, color: '#a5f3fc', fontSize: '0.85rem', overflowX: 'auto' }}>
                  {JSON.stringify(currentUser, null, 2)}
                </pre>
              </div>
            </div>
          </main>
        </div>
      )}
    </>
  );
}

export default App;
