import axios from 'axios';

// URLs públicas de la API Open-Meteo (sin necesidad de API Key)
const GEO_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Mapeo de códigos meteorológicos WMO a descripciones legibles e iconos
 */
export const interpretarCodigoClima = (code) => {
  if (code === 0) return { texto: 'Despejado / Soleado', icono: 'Sun' };
  if ([1, 2, 3].includes(code)) return { texto: 'Parcialmente Nublado', icono: 'CloudSun' };
  if ([45, 48].includes(code)) return { texto: 'Niebla', icono: 'CloudFog' };
  if ([51, 53, 55, 61, 63, 65].includes(code)) return { texto: 'Lluvia', icono: 'CloudRain' };
  if ([71, 73, 75, 85, 86].includes(code)) return { texto: 'Nieve', icono: 'Snowflake' };
  if ([95, 96, 99].includes(code)) return { texto: 'Tormenta Eléctrica', icono: 'CloudLightning' };
  return { texto: 'Nublado', icono: 'Cloud' };
};

export const weatherService = {
  /**
   * Obtiene el clima actual a partir de latitud y longitud
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   */
  obtenerPorCoordenadas: async (lat, lon) => {
    const response = await axios.get(WEATHER_API_URL, {
      params: {
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
        timezone: 'auto',
      },
    });
    return response.data;
  },

  /**
   * Busca las coordenadas de una ciudad por nombre y consulta su clima actual
   * @param {string} nombreCiudad - Nombre de la ciudad (ej: "Bogotá", "Madrid", "Medellín")
   */
  obtenerPorCiudad: async (nombreCiudad) => {
    const geoRes = await axios.get(GEO_API_URL, {
      params: { 
        name: nombreCiudad, 
        count: 1, 
        language: 'es' 
      },
    });

    if (!geoRes.data.results || geoRes.data.results.length === 0) {
      throw new Error(`No se encontró la ciudad "${nombreCiudad}"`);
    }

    const { latitude, longitude, name, country } = geoRes.data.results[0];
    const climaData = await weatherService.obtenerPorCoordenadas(latitude, longitude);

    return {
      ciudad: name,
      pais: country || '',
      clima: climaData.current,
    };
  },
};

export default weatherService;
