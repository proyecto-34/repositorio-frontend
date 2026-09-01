import axios from 'axios';

/**
 * Servicio para consumir la API pública oficial de DummyJSON Quotes
 * Documentación oficial: https://dummyjson.com/docs/quotes
 */

// Diccionario de respaldo y traducción de citas
const FRASES_ESPANOL = [
  { texto: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", autor: "Robert Collier" },
  { texto: "La mejor forma de predecir el futuro es creándolo.", autor: "Peter Drucker" },
  { texto: "No cuentes los días, haz que los días cuenten.", autor: "Muhammad Ali" },
  { texto: "El único modo de hacer un gran trabajo es amar lo que haces.", autor: "Steve Jobs" },
  { texto: "La confianza en uno mismo es el primer secreto del éxito.", autor: "Ralph Waldo Emerson" },
  { texto: "Cree que puedes y ya habrás recorrido la mitad del camino.", autor: "Theodore Roosevelt" },
  { texto: "El trabajo en equipo divide el trabajo y multiplica los resultados.", autor: "Anónimo" },
  { texto: "La disciplina tarde o temprano vencerá a la inteligencia.", autor: "Yokoi Kenji" },
  { texto: "Tu actitud, no tu aptitud, determinará tu altitud.", autor: "Zig Ziglar" },
  { texto: "El secreto para salir adelante es comenzar.", autor: "Mark Twain" }
];

export const quoteService = {
  /**
   * Obtiene una frase aleatoria de la API pública DummyJSON Quotes
   * Endpoint: https://dummyjson.com/quotes/random
   * @returns {Promise<{ texto: string, autor: string, id?: number }>}
   */
  getRandomQuote: async () => {
    try {
      const response = await axios.get('https://dummyjson.com/quotes/random', {
        timeout: 4000,
      });

      if (response.data && response.data.quote) {
        return {
          texto: response.data.quote,
          autor: response.data.author || 'Autor desconocido',
          id: response.data.id,
          fuente: 'DummyJSON API (https://dummyjson.com/docs/quotes)'
        };
      }
    } catch {
      // Si la API no responde, seleccionamos una frase local
    }

    const randomIndex = Math.floor(Math.random() * FRASES_ESPANOL.length);
    return {
      ...FRASES_ESPANOL[randomIndex],
      fuente: 'Colección local'
    };
  },

  /**
   * Obtiene la colección de respaldo
   */
  getFallbackQuotes: () => FRASES_ESPANOL,
};

export default quoteService;
