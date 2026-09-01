import { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import quoteService from '../services/quoteService';
import './MotivationalQuote.css';

/**
 * Componente que muestra una frase motivacional en español
 * Obtenida dinámicamente desde un servicio externo con botón de recarga
 */
export const MotivationalQuote = () => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargarFrase = useCallback(async () => {
    setLoading(true);
    try {
      const data = await quoteService.getRandomQuote();
      setQuote(data);
    } catch {
      // En caso de error inesperado, usar respaldo
      const fallback = quoteService.getFallbackQuotes()[0];
      setQuote(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let montado = true;
    quoteService.getRandomQuote().then((data) => {
      if (montado) {
        setQuote(data);
        setLoading(false);
      }
    });

    return () => {
      montado = false;
    };
  }, []);

  return (
    <div className="motivational-card">
      <div className="motivational-header">
        <span className="motivational-title">
          <Sparkles size={14} /> Frase del Día
        </span>
        <button
          type="button"
          className="refresh-quote-btn"
          onClick={cargarFrase}
          disabled={loading}
          title="Obtener otra frase motivacional"
          aria-label="Obtener otra frase motivacional"
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div className="motivational-content">
        {loading && !quote ? (
          <div className="quote-skeleton">
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
          </div>
        ) : (
          <>
            <p className="quote-text">"{quote?.texto}"</p>
            <p className="quote-author">— {quote?.autor}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default MotivationalQuote;
