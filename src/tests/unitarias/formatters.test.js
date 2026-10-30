import { describe, it, expect } from 'vitest';
import { formatearCOP, formatearFecha, formatearFechaCorta } from '../../utils/formatters';

describe('Pruebas Unitarias - Utilidades de Formateo (formatters.js)', () => {

    // Prueba 1: Formato de Moneda Colombiana (COP)
    describe('formatearCOP', () => {
        it('debe formatear un número entero a moneda COP con signo pesos', () => {
            const resultado = formatearCOP(15000);
            // Remueve espacios especiales de localización para comparar limpiamente
            expect(resultado.replace(/\s/g, ' ')).toContain('$ 15.000');
        });

        it('debe devolver $ 0 cuando el valor sea 0, nulo o texto inválido', () => {
            expect(formatearCOP(0).replace(/\s/g, ' ')).toBe('$ 0');
            expect(formatearCOP(null).replace(/\s/g, ' ')).toBe('$ 0');
            expect(formatearCOP(undefined).replace(/\s/g, ' ')).toBe('$ 0');
            expect(formatearCOP('texto_invalido').replace(/\s/g, ' ')).toBe('$ 0');
        });

        it('debe manejar montos grandes de ventas correctamente', () => {
            const resultado = formatearCOP(1250000);
            expect(resultado.replace(/\s/g, ' ')).toContain('$ 1.250.000');
        });
    });

    // Prueba 2: Formato de Fechas
    describe('formatearFecha', () => {
        it('debe retornar "N/A" si la fecha es nula, vacía o indefinida', () => {
            expect(formatearFecha(null)).toBe('N/A');
            expect(formatearFecha(undefined)).toBe('N/A');
            expect(formatearFecha('')).toBe('N/A');
        });

        it('debe convertir un string ISO a fecha legible con año', () => {
            const fechaIso = '2026-10-29T10:30:00Z';
            const resultado = formatearFecha(fechaIso);
            expect(resultado).toContain('2026');
        });
    });

    // Prueba 3: Formato de Fecha Corta
    describe('formatearFechaCorta', () => {
        it('debe retornar "N/A" cuando no se suministra fecha', () => {
            expect(formatearFechaCorta(null)).toBe('N/A');
        });
    });
});