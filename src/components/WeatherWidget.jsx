import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  CloudSun, 
  CloudRain, 
  Cloud, 
  CloudLightning, 
  Snowflake, 
  Wind, 
  Droplets, 
  Search, 
  MapPin, 
  Loader2 
} from 'lucide-react';
import { weatherService, interpretarCodigoClima } from '../services/weatherService';

/**
 * Componente WeatherWidget
 * Muestra el clima en tiempo real con soporte de geolocalización y búsqueda por ciudad
 */
export const WeatherWidget = () => {
  const [climaInfo, setClimaInfo] = useState(null);
  const [ciudadInput, setCiudadInput] = useState('Bogotá');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Consulta el clima por nombre de ciudad
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

  // Al montar el componente: intenta usar geolocalización o usa la ciudad por defecto
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const data = await weatherService.obtenerPorCoordenadas(
              pos.coords.latitude,
              pos.coords.longitude
            );
            setClimaInfo({
              ciudad: 'Mi Ubicación',
              pais: 'Actual',
              clima: data.current,
            });
          } catch {
            consultarClimaPorCiudad('Bogotá');
          } finally {
            setCargando(false);
          }
        },
        () => {
          // Si el usuario deniega los permisos de geolocalización
          consultarClimaPorCiudad('Bogotá');
        }
      );
    } else {
      consultarClimaPorCiudad('Bogotá');
    }
  }, []);

  const handleBuscar = (e) => {
    e.preventDefault();
    if (ciudadInput.trim()) {
      consultarClimaPorCiudad(ciudadInput.trim());
    }
  };

  // Renderizado dinámico del icono según el clima
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
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      color: '#ffffff',
      padding: '1.25rem',
      borderRadius: '16px',
      maxWidth: '360px',
      width: '100%',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Buscador de Ciudad */}
      <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Buscar ciudad (ej: Medellín, Lima)..."
          value={ciudadInput}
          onChange={(e) => setCiudadInput(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #334155',
            background: '#0f172a',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={cargando}
          style={{
            background: '#38bdf8',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            fontWeight: 600,
          }}
        >
          <Search size={18} />
        </button>
      </form>

      {/* Estado de Carga */}
      {cargando && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem 0', gap: '8px', color: '#38bdf8' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.9rem' }}>Consultando clima...</span>
        </div>
      )}

      {/* Mensaje de Error */}
      {error && !cargando && (
        <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Datos del Clima */}
      {!cargando && climaInfo && climaInfo.clima && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.9rem' }}>
            <MapPin size={16} />
            <span>{climaInfo.ciudad}{climaInfo.pais ? `, ${climaInfo.pais}` : ''}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0' }}>
            <div>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>
                {Math.round(climaInfo.clima.temperature_2m)}°C
              </span>
              <p style={{ margin: 0, color: '#38bdf8', fontSize: '0.9rem', fontWeight: 500 }}>
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
            background: 'rgba(51, 65, 85, 0.5)',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            border: '1px solid #334155'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Droplets size={16} color="#60a5fa" />
              <span>Humedad: {climaInfo.clima.relative_humidity_2m}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wind size={16} color="#94a3b8" />
              <span>Viento: {climaInfo.clima.wind_speed_10m} km/h</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;
