import { describe, it, expect } from 'vitest';
import {
  validarEmail,
  validarPassword,
  validarCampoRequerido,
  validarMontoPositivo,
} from '../../utils/validators';

describe('Validadores de formularios', () => {
  it('acepta emails válidos y rechaza inválidos', () => {
    expect(validarEmail('cajero@tienda.com')).toBe(true);
    expect(validarEmail('cajero@')).toBe(false);
    expect(validarEmail('sin-arroba.com')).toBe(false);
    expect(validarEmail('')).toBe(false);
  });

  it('exige contraseña de mínimo 6 caracteres', () => {
    expect(validarPassword('123')).toBe(false);
    expect(validarPassword('123456')).toBe(true);
    expect(validarPassword(null)).toBe(false);
  });

  it('rechaza campos vacíos o solo con espacios', () => {
    expect(validarCampoRequerido('   ')).toBe(false);
    expect(validarCampoRequerido('')).toBe(false);
    expect(validarCampoRequerido('Arroz')).toBe(true);
  });

  it('solo acepta montos numéricos mayores a cero', () => {
    expect(validarMontoPositivo(1500)).toBe(true);
    expect(validarMontoPositivo('2500')).toBe(true);
    expect(validarMontoPositivo(0)).toBe(false);
    expect(validarMontoPositivo(-10)).toBe(false);
    expect(validarMontoPositivo('abc')).toBe(false);
  });
});