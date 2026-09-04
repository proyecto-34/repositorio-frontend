import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Receipt, CloudSun, Server, LogIn } from 'lucide-react';
import LoginView from './views/auth/LoginView';
import WeatherWidget from './components/WeatherWidget';
import FacturaModal from './components/FacturaModal';
import axiosClient from './api/axiosClient';

function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [vistaActual, setVistaActual] = useState('login'); // 'login' | 'dashboard'
  const [backendData, setBackendData] = useState(null);
  const [cargandoBackend, setCargandoBackend] = useState(false);
  const [errorBackend, setErrorBackend] = useState(null);
  const [modalFacturaAbierto, setModalFacturaAbierto] = useState(false);

  const probarConexion = () => {
    setCargandoBackend(true);
    setErrorBackend(null);
    axiosClient.get('/health')
      .then((res) => {
        setBackendData(res.data);
      })
      .catch((err) => {
        setErrorBackend(err.response?.data?.message || err.message || 'Sin conexión');
      })
      .finally(() => {
        setCargandoBackend(false);
      });
  };

  useEffect(() => {
    probarConexion();
  }, []);

  const handleLoginSuccess = (data) => {
    setUser(data.user || { email: 'usuario@tienda.com' });
    setVistaActual('dashboard');
    toast.success('¡Bienvenido al panel principal!');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setVistaActual('login');
    toast.info('Sesión cerrada');
  };

  return (
    <>
      {/* Contenedor de notificaciones Toast */}
      <Toaster position="top-right" richColors />

      {/* Modal de Facturación */}
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
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <strong style={{ color: '#38bdf8', fontSize: '1.1rem' }}>🏪 Tienda Comunitaria</strong>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setVistaActual('login')}
              style={{
                background: vistaActual === 'login' ? '#38bdf8' : '#1e293b',
                color: vistaActual === 'login' ? '#0f172a' : '#cbd5e1',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem'
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
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              Panel & Módulos
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setModalFacturaAbierto(true)}
            style={{
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Receipt size={16} /> Emitir Factura PDF
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                👤 {user.email || user.nombre || 'Usuario'}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Renderizado de Vistas */}
      <main>
        {vistaActual === 'login' ? (
          <LoginView onLoginSuccess={handleLoginSuccess} />
        ) : (
          <div style={{
            minHeight: 'calc(100vh - 60px)',
            backgroundColor: '#0f172a',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2rem'
          }}>
            <header style={{ textAlign: 'center' }}>
              <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: '#38bdf8', fontWeight: 800 }}>
                Panel de Control & Integraciones
              </h1>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
                Módulos integrados: Clima en vivo, Facturación PDF POS y Conexión NestJS
              </p>
            </header>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2rem',
              justifyContent: 'center',
              maxWidth: '1000px',
              width: '100%'
            }}>
              {/* Tarjeta 1: Emisión de Factura */}
              <div style={{
                background: 'linear-gradient(135deg, #064e3b, #022c22)',
                padding: '1.25rem',
                borderRadius: '16px',
                border: '1px solid #047857',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                maxWidth: '300px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', marginBottom: '0.5rem' }}>
                    <Receipt size={22} />
                    <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Facturación POS
                    </h3>
                  </div>
                  <p style={{ color: '#a7f3d0', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    Genera tickets térmicos de venta en formato PDF de 80mm con desglose de IVA y totales.
                  </p>
                </div>

                <button
                  onClick={() => setModalFacturaAbierto(true)}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#022c22',
                    padding: '0.75rem 1.2rem',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '1.25rem'
                  }}
                >
                  <Receipt size={18} /> Nueva Factura
                </button>
              </div>

              {/* Tarjeta 2: Widget de Clima */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <WeatherWidget />
              </div>

              {/* Tarjeta 3: Estado del Backend NestJS */}
              <div style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                padding: '1.25rem',
                borderRadius: '16px',
                border: '1px solid #334155',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                maxWidth: '300px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>
                    🔌 Backend NestJS
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 1rem 0' }}>
                    URL: <code style={{ color: '#38bdf8' }}>{axiosClient.defaults.baseURL}/health</code>
                  </p>

                  {cargandoBackend && (
                    <div style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                      🔄 Verificando conexión...
                    </div>
                  )}

                  {errorBackend && (
                    <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.85rem' }}>
                      ❌ Sin conexión ({errorBackend})
                    </div>
                  )}

                  {backendData && (
                    <div style={{ color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.3)', fontSize: '0.85rem' }}>
                      <p style={{ margin: '0 0 0.25rem 0' }}><strong>✅ Conectado</strong></p>
                      <p style={{ margin: 0, fontSize: '0.8rem' }}>{backendData.mensaje || 'Servidor activo'}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={probarConexion}
                  disabled={cargandoBackend}
                  style={{
                    backgroundColor: cargandoBackend ? '#475569' : '#38bdf8',
                    color: '#0f172a',
                    padding: '0.65rem 1.2rem',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: cargandoBackend ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    marginTop: '1.25rem'
                  }}
                >
                  {cargandoBackend ? 'Consultando...' : 'Reintentar conexión'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default App;
