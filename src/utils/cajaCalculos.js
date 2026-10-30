/**
 * Utilidades para cálculos financieros del Punto de Venta (POS) y Caja
 */

/**
 * Calcula subtotal, IVA del 19%, total a pagar y cambio (vueltas) para una venta
 * @param {Array} carrito - Lista de productos en el carrito con cantidad y precio/total
 * @param {number|string} montoRecibido - Dinero entregado por el cliente en efectivo
 * @returns {Object} { totalPagar, iva, subtotal, cambio, esPagoSuficiente }
 */
export const calcularTotalesVenta = (carrito = [], montoRecibido = 0) => {
  if (!Array.isArray(carrito) || carrito.length === 0) {
    return { totalPagar: 0, iva: 0, subtotal: 0, cambio: 0, esPagoSuficiente: false };
  }

  const totalPagar = carrito.reduce((acc, item) => {
    const itemTotal = Number(item.total) || (Number(item.cantidad || 0) * Number(item.precio || 0));
    return acc + Math.max(0, itemTotal);
  }, 0);

  const iva = Math.round(totalPagar * 0.19);
  const subtotal = Math.max(0, totalPagar - iva);
  const recibidoNum = Math.max(0, Number(montoRecibido) || 0);
  const cambio = Math.max(0, recibidoNum - totalPagar);
  const esPagoSuficiente = totalPagar > 0 && recibidoNum >= totalPagar;

  return {
    totalPagar,
    iva,
    subtotal,
    cambio,
    esPagoSuficiente,
  };
};

/**
 * Valida si un producto puede añadirse al carrito según su stock disponible en bodega
 * @param {number} cantidadActualEnCarrito
 * @param {number} cantidadAAgregar
 * @param {number} stockBodega
 * @returns {boolean}
 */
export const validarStockDisponible = (cantidadActualEnCarrito = 0, cantidadAAgregar = 1, stockBodega = 0) => {
  if (stockBodega <= 0) return false;
  return (cantidadActualEnCarrito + cantidadAAgregar) <= stockBodega;
};
