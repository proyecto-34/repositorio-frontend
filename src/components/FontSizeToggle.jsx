import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import './FontSizeToggle.css';

const STORAGE_KEY = 'tienda_font_size';

const NIVELES = [
  { id: 'normal', label: '100%', nombre: 'Normal', icon: 'aA' },
  { id: 'large', label: 'Grande', nombre: 'Grande (112%)', icon: 'aA+' },
  { id: 'xlarge', label: 'Extra', nombre: 'Extra Grande (125%)', icon: 'aA++' },
];

export const FontSizeToggle = ({ className = '', silent = false }) => {
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'normal';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    localStorage.setItem(STORAGE_KEY, fontSize);
  }, [fontSize]);

  const alternarTamano = () => {
    const currentIndex = NIVELES.findIndex((n) => n.id === fontSize);
    const nextIndex = (currentIndex + 1) % NIVELES.length;
    const nuevoNivel = NIVELES[nextIndex];

    setFontSize(nuevoNivel.id);
    if (!silent) {
      toast.info(`Tamaño de letra: ${nuevoNivel.nombre}`, { duration: 1800 });
    }
  };

  const nivelActual = NIVELES.find((n) => n.id === fontSize) || NIVELES[0];

  return (
    <button
      type="button"
      onClick={alternarTamano}
      className={`font-size-toggle-btn notranslate ${className}`}
      translate="no"
      title={`Accesibilidad: Tamaño de letra actual (${nivelActual.nombre}). Clic para cambiar.`}
      aria-label={`Cambiar tamaño de letra. Actual: ${nivelActual.nombre}`}
    >
      <span className="font-size-icon" aria-hidden="true">
        {nivelActual.icon}
      </span>
      <span className="font-size-badge">
        {nivelActual.label}
      </span>
    </button>
  );
};

export default FontSizeToggle;
