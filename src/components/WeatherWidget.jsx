import React, { useState, useEffect } from 'react';
import {
  Sun,
  CloudSun,
  CloudRain,
  Cloud,
  CloudLightning,
  Snowflake,
  Loader2
} from 'lucide-react';
import { weatherService, interpretarCodigoClima } from '../services/weatherService';

/**
 * Componente WeatherWidget
 * Muestra el clima en tiempo real sin bordes feos y adaptado al tema Deep Indigo
 */
export const WeatherWidget = () => {
  const [climaInfo, setClimaInfo] = useState(null);
  const [ciudadInput, setCiudadInput] = useState('Mocoa');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const consultarClimaPorCiudad = async (ciudad) => {
    setCargando(true);
    setError(null);
    try {
      const data = await weatherService.obtenerPorCiudad(ciudad);
      setClimaInfo(data);
    } catch (err) {
      setError(err.message || 'No se pudo obtener el clima');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    consultarClimaPorCiudad('Mocoa');
  }, []);

  const handleBuscar = (e) => {
    e.preventDefault();
    if (ciudadInput.trim()) {
      consultarClimaPorCiudad(ciudadInput.trim());
    }
  };

  const renderIcono = (codigo) => {
    const { icono } = interpretarCodigoClima(codigo);
    const props = { size: 38 };
    switch (icono) {
      case 'Sun': return <Sun {...props} color="#f59e0b" />;
      case 'CloudSun': return <CloudSun {...props} color="#fbbf24" />;
      case 'CloudRain': return <CloudRain {...props} color="#60a5fa" />;
      case 'CloudLightning': return <CloudLightning {...props} color="#c084fc" />;
      case 'Snowflake': return <Snowflake {...props} color="#93c5fd" />;
      default: return <Cloud {...props} color="#94a3b8" />;
    }
  };

  return (
    <div style={{
      background: '#151c2c',
      color: '#ffffff',
      padding: '1.4rem',
      borderRadius: '18px',
      maxWidth: '100%',
      width: '100%',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      border: 'none'
    }}>
      {/* Buscador de Ciudad */}
      <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '8px', marginBottom: '1.1rem' }}>
        <input
          type="text"
          placeholder="Buscar ciudad..."
          value={ciudadInput}
          onChange={(e) => setCiudadInput(e.target.value)}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: '10px',
            border: 'none',
            background: '#0b0f19',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={cargando}
          style={{
            background: '#8b5cf6',
            border: 'none',
            borderRadius: '10px',
            padding: '9px 14px',
            cursor: 'pointer',
            color: '#fff',
            fontSize: '0.82rem',
            fontWeight: 700,
          }}
        >
          Buscar
        </button>
      </form>

      {/* Estado de Carga */}
      {cargando && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem 0', gap: '8px', color: '#c4b5fd' }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.85rem' }}>Consultando clima...</span>
        </div>
      )}

      {/* Mensaje de Error */}
      {error && !cargando && (
        <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Datos del Clima */}
      {!cargando && climaInfo && climaInfo.clima && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.88rem' }}>
            <span>Clima en <strong style={{ color: '#f8fafc' }}>{climaInfo.ciudad}{climaInfo.pais ? `, ${climaInfo.pais}` : ''}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.8rem 0' }}>
            <div>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>
                {Math.round(climaInfo.clima.temperature_2m)}°C
              </span>
              <p style={{ margin: 0, color: '#c4b5fd', fontSize: '0.88rem', fontWeight: 600 }}>
                {interpretarCodigoClima(climaInfo.clima.weather_code).texto}
              </p>
            </div>
            <div>
              {renderIcono(climaInfo.clima.weather_code)}
            </div>
          </div>

          {/* Métricas: Humedad y Viento */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            background: '#0b0f19',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            border: 'none',
            color: '#94a3b8'
          }}>
            <div>
              <span>Humedad: <strong style={{ color: '#f8fafc' }}>{climaInfo.clima.relative_humidity_2m}%</strong></span>
            </div>
            <div>
              <span>Viento: <strong style={{ color: '#f8fafc' }}>{climaInfo.clima.wind_speed_10m} km/h</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;
