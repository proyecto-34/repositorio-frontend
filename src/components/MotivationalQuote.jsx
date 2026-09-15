import { useState, useEffect, useCallback } from 'react';
import quoteService from '../services/quoteService';
import './MotivationalQuote.css';

/**
 * Componente que muestra una frase motivacional en español
 * Sin iconos decorativos, con estética limpia
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
          Frase del Día
        </span>
        <button
          type="button"
          className="refresh-quote-btn"
          onClick={cargarFrase}
          disabled={loading}
          title="Obtener otra frase motivacional"
        >
          {loading ? 'Cargando...' : 'Cambiar frase'}
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
