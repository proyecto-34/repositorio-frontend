import { describe, it, expect } from 'vitest';
import {
  agruparVentasPorDia,
  calcularTotalVentas,
  productoMasVendido,
} from '../../utils/reportes';

const ventas = [
  { id: 1, fecha: '2026-10-28T10:00:00', total: 10000, items: [{ nombre: 'Arroz', cantidad: 2 }] },
  { id: 2, fecha: '2026-10-28T15:30:00', total: 5000, items: [{ nombre: 'Arroz', cantidad: 1 }, { nombre: 'Aceite', cantidad: 1 }] },
  { id: 3, fecha: '2026-10-29T09:00:00', total: 8000, items: [{ nombre: 'Aceite', cantidad: 1 }] },
];

describe('Utilidades de reportes (dashboard)', () => {
  it('agrupa las ventas por día sumando los totales', () => {
    const r = agruparVentasPorDia(ventas);
    expect(r).toEqual([
      { fecha: '2026-10-28', total: 15000 },
      { fecha: '2026-10-29', total: 8000 },
    ]);
  });

  it('calcula el total general de ventas', () => {
    expect(calcularTotalVentas(ventas)).toBe(23000);
  });

  it('identifica el producto más vendido por cantidad', () => {
    expect(productoMasVendido(ventas)).toEqual({ nombre: 'Arroz', cantidad: 3 });
  });

  it('maneja lista vacía sin romperse', () => {
    expect(agruparVentasPorDia([])).toEqual([]);
    expect(calcularTotalVentas([])).toBe(0);
    expect(productoMasVendido([])).toBeNull();
  });
});