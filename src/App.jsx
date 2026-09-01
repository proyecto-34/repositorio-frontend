import React, { useState, useEffect } from 'react';
import axiosClient from './api/axiosClient';

function App() {
  const [backendData, setBackendData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const probarConexion = () => {
    setCargando(true);
    setError(null);
    setBackendData(null);

    // Petición a: http://localhost:3000/api/v1/health (o la configurada en .env)
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
    <div style={{ padding: '2.5rem', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '2rem auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1f2937' }}>
        🔌 Prueba de Conexión NestJS ↔ React
      </h1>

      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Endpoint consultado: <code>{axiosClient.defaults.baseURL}/health</code>
      </p>

      {cargando && (
        <div style={{ color: '#2563eb', background: '#eff6ff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          🔄 Conectando con NestJS...
        </div>
      )}

      {error && (
        <div style={{ color: '#dc2626', background: '#fee2e2', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fca5a5' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>❌ Error al conectar</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{error}</p>
        </div>
      )}

      {backendData && (
        <div style={{ color: '#16a34a', background: '#f0fdf4', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #86efac' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>✅ Backend Conectado con Éxito</h3>
          <p style={{ margin: '0.25rem 0' }}><strong>Mensaje:</strong> {backendData.mensaje || JSON.stringify(backendData)}</p>
          {backendData.status && <p style={{ margin: '0.25rem 0' }}><strong>Estado:</strong> {backendData.status}</p>}
          {backendData.fecha && <p style={{ margin: '0.25rem 0' }}><strong>Fecha servidor:</strong> {backendData.fecha}</p>}
        </div>
      )}

      <button
        onClick={probarConexion}
        disabled={cargando}
        style={{
          backgroundColor: cargando ? '#9ca3af' : '#2563eb',
          color: '#ffffff',
          padding: '0.6rem 1.2rem',
          border: 'none',
          borderRadius: '6px',
          cursor: cargando ? 'not-allowed' : 'pointer',
          fontWeight: 600,
        }}
      >
        {cargando ? 'Reintentando...' : 'Volver a probar conexión'}
      </button>
    </div>
  );
}

export default App;
