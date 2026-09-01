import React, { useState, useEffect } from 'react';
import axiosClient from './api/axiosClient';
import WeatherWidget from './components/WeatherWidget';

function App() {
  const [backendData, setBackendData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const probarConexion = () => {
    setCargando(true);
    setError(null);
    setBackendData(null);

    // Consulta el endpoint de verificación del backend NestJS
    axiosClient.get('/health')
      .then((res) => {
        setBackendData(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'No se pudo conectar al backend');
      })
      .finally(() => {
        setCargando(false);
      });
  };

  useEffect(() => {
    probarConexion();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2rem'
    }}>
      <header style={{ textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 800, color: '#38bdf8' }}>
          Sistema ERP / POS & Integraciones
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
          Demostración de integraciones de APIs: Backend NestJS y Clima Open-Meteo
        </p>
      </header>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '2rem',
        justifyContent: 'center',
        maxWidth: '900px',
        width: '100%'
      }}>
        {/* Sección: Widget del Clima */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1rem', color: '#cbd5e1', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
            🌤️ API del Clima
          </h2>
          <WeatherWidget />
        </div>

        {/* Sección: Estado del Backend NestJS */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          padding: '1.25rem',
          borderRadius: '16px',
          border: '1px solid #334155',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          maxWidth: '380px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ fontSize: '1rem', color: '#cbd5e1', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
              🔌 API Backend NestJS
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 1rem 0' }}>
              URL: <code style={{ color: '#38bdf8' }}>{axiosClient.defaults.baseURL}/health</code>
            </p>

            {cargando && (
              <div style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '1rem', borderRadius: '10px', fontSize: '0.9rem', textAlign: 'center' }}>
                🔄 Verificando conexión...
              </div>
            )}

            {error && (
              <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <h4 style={{ margin: '0 0 0.25rem 0' }}>❌ Sin conexión con Backend</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>{error}</p>
              </div>
            )}

            {backendData && (
              <div style={{ color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                <h4 style={{ margin: '0 0 0.25rem 0' }}>✅ Backend Conectado</h4>
                <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Mensaje:</strong> {backendData.mensaje || JSON.stringify(backendData)}</p>
                {backendData.status && <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Estado:</strong> {backendData.status}</p>}
                {backendData.fecha && <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}><strong>Hora:</strong> {backendData.fecha}</p>}
              </div>
            )}
          </div>

          <button
            onClick={probarConexion}
            disabled={cargando}
            style={{
              backgroundColor: cargando ? '#475569' : '#38bdf8',
              color: '#0f172a',
              padding: '0.65rem 1.2rem',
              border: 'none',
              borderRadius: '8px',
              cursor: cargando ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              marginTop: '1.25rem',
              transition: 'background 0.2s'
            }}
          >
            {cargando ? 'Consultando...' : 'Reintentar conexión'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
