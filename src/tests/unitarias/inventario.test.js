import { describe, it, expect } from 'vitest';
import {
  esStockBajo,
  filtrarProductos,
  calcularValorInventario,
} from '../../utils/inventario';

const productos = [
  { id: 1, nombre: 'Arroz Diana', categoria: 'Granos', stock: 3, stockMinimo: 5, precio: 4500 },
  { id: 2, nombre: 'Aceite Gourmet', categoria: 'Aceites', stock: 20, stockMinimo: 5, precio: 12000 },
  { id: 3, nombre: 'Arepa Doña Paisa', categoria: 'Harinas', stock: 5, stockMinimo: 5, precio: 3000 },
];

describe('Utilidades de inventario', () => {
  it('detecta stock bajo cuando stock <= stockMinimo', () => {
    expect(esStockBajo(productos[0])).toBe(true);
    expect(esStockBajo(productos[1])).toBe(false);
    expect(esStockBajo(productos[2])).toBe(true); // límite exacto
  });

  it('filtra productos por nombre sin importar mayúsculas', () => {
    const r = filtrarProductos(productos, 'arroz');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(1);
  });

  it('devuelve todos los productos si la búsqueda está vacía', () => {
    expect(filtrarProductos(productos, '')).toHaveLength(3);
  });

  it('calcula el valor total del inventario (stock * precio)', () => {
    // 3*4500 + 20*12000 + 5*3000 = 13500 + 240000 + 15000
    expect(calcularValorInventario(productos)).toBe(268500);
  });

  it('retorna 0 con inventario vacío', () => {
    expect(calcularValorInventario([])).toBe(0);
  });
});