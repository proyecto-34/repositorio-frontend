import axios from 'axios';

/**
 * Colección de respaldo de frases motivacionales en español
 * Garantiza que la aplicación siempre muestre una frase incluso si no hay conexión externa
 */
const FRASES_RESPALDO = [
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

/**
 * Servicio para obtener frases motivacionales en español desde una API externa
 */
export const quoteService = {
  /**
   * Obtiene una frase motivacional aleatoria en español
   * Consume una fuente externa y cuenta con respaldo automático ante fallos
   * @returns {Promise<{ texto: string, autor: string, fuente: string }>}
   */
  getRandomQuote: async () => {
    try {
      // Intentar obtener desde fuente externa de citas en español
      const response = await axios.get(
        'https://raw.githubusercontent.com/johan/spanish-inspirational-quotes/main/quotes.json',
        { timeout: 3500 }
      );

      if (Array.isArray(response.data) && response.data.length > 0) {
        const randomIndex = Math.floor(Math.random() * response.data.length);
        const item = response.data[randomIndex];
        return {
          texto: item.frase || item.quote || item.texto,
          autor: item.autor || item.author || "Anónimo",
          fuente: 'api_externa'
        };
      }
    } catch {
      // Si la API externa no responde o no hay internet, usamos el respaldo local
    }

    // Fallback garantizado con frase aleatoria
    const randomIndex = Math.floor(Math.random() * FRASES_RESPALDO.length);
    return {
      ...FRASES_RESPALDO[randomIndex],
      fuente: 'local'
    };
  },

  /**
   * Obtiene la lista completa de frases locales
   */
  getFallbackQuotes: () => FRASES_RESPALDO,
};

export default quoteService;
