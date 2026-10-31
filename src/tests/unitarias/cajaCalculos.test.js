import { describe, it, expect } from 'vitest';
import { calcularTotalesVenta, validarStockDisponible } from '../../utils/cajaCalculos';

describe('Pruebas Unitarias - Cálculos de Caja y POS (cajaCalculos.js)', () => {

  describe('calcularTotalesVenta', () => {
    it('debe calcular correctamente total, 19% de IVA y subtotal para un carrito con productos', () => {
      const carrito = [
        { id: 1, nombre: 'Arroz 1kg', precio: 5000, cantidad: 2, total: 10000 },
        { id: 2, nombre: 'Aceite 500ml', precio: 8000, cantidad: 1, total: 8000 },
      ];

      const resultado = calcularTotalesVenta(carrito, 20000);

      expect(resultado.totalPagar).toBe(18000);
      expect(resultado.iva).toBe(Math.round(18000 * 0.19)); // 3420
      expect(resultado.subtotal).toBe(18000 - Math.round(18000 * 0.19)); // 14580
      expect(resultado.cambio).toBe(2000); // 20000 - 18000
      expect(resultado.esPagoSuficiente).toBe(true);
    });

    it('debe calcular cambio en 0 y marcar pago insuficiente si el cliente entrega menos dinero', () => {
      const carrito = [
        { id: 1, nombre: 'Leche 1L', precio: 4500, cantidad: 2, total: 9000 },
      ];

      const resultado = calcularTotalesVenta(carrito, 5000);

      expect(resultado.totalPagar).toBe(9000);
      expect(resultado.cambio).toBe(0);
      expect(resultado.esPagoSuficiente).toBe(false);
    });

    it('debe retornar ceros de forma segura si el carrito está vacío o es nulo', () => {
      const resultadoVacio = calcularTotalesVenta([]);
      expect(resultadoVacio.totalPagar).toBe(0);
      expect(resultadoVacio.iva).toBe(0);
      expect(resultadoVacio.cambio).toBe(0);
      expect(resultadoVacio.esPagoSuficiente).toBe(false);

      const resultadoNulo = calcularTotalesVenta(null);
      expect(resultadoNulo.totalPagar).toBe(0);
      expect(resultadoNulo.esPagoSuficiente).toBe(false);
    });
  });

  describe('validarStockDisponible', () => {
    it('debe permitir agregar producto si la cantidad solicitada no supera el stock de bodega', () => {
      const permitido = validarStockDisponible(2, 3, 10); // Carrito: 2, Agrega: 3, Stock: 10
      expect(permitido).toBe(true);
    });

    it('debe rechazar si la cantidad acumulada excede las existencias', () => {
      const rechazado = validarStockDisponible(8, 3, 10); // Carrito: 8 + 3 = 11 > 10
      expect(rechazado).toBe(false);
    });

    it('debe rechazar si el producto tiene stock 0 o negativo', () => {
      expect(validarStockDisponible(0, 1, 0)).toBe(false);
      expect(validarStockDisponible(0, 1, -5)).toBe(false);
    });
  });
});

