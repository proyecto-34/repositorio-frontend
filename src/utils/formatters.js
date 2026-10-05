/**
 * Utilidades centralizadas de formateo de datos para la aplicación
 */

/**
 * Formatea un número como moneda colombiana (COP) sin decimales innecesarios
 * Ejemplo: 4500 -> "$ 4.500" o "$4.500"
 */
export const formatearCOP = (valor) => {
  const num = Number(valor) || 0;
  return `$${num.toLocaleString('es-CO')}`;
};

/**
 * Formatea una fecha ISO o string a formato legible en español
 */
export const formatearFecha = (fechaIso) => {
  if (!fechaIso) return 'N/A';
  try {
    return new Date(fechaIso).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(fechaIso);
  }
};

/**
 * Formatea una fecha corta (solo fecha)
 */
export const formatearFechaCorta = (fechaIso) => {
  if (!fechaIso) return 'N/A';
  try {
    return new Date(fechaIso).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return String(fechaIso);
  }
};
