import { describe, it, expect } from 'vitest';
import { ROLES, normalizarRol, obtenerInfoRol, ROLE_BADGES } from '../../constants/roles';

describe('Pruebas Unitarias - Control de Acceso y Roles RBAC (roles.js)', () => {

  // Grupo 1: Normalización de roles desde la base de datos
  describe('normalizarRol', () => {
    it('debe mapear correctamente los IDs numéricos de la base de datos MySQL', () => {
      expect(normalizarRol(1)).toBe(ROLES.ADMIN);
      expect(normalizarRol(2)).toBe(ROLES.CAJERO);
      expect(normalizarRol(3)).toBe(ROLES.SUPERVISOR);
      expect(normalizarRol(4)).toBe(ROLES.CONTADOR);
    });

    it('debe reconocer nombres de rol en texto sin importar mayúsculas o espacios', () => {
      expect(normalizarRol('admin')).toBe(ROLES.ADMIN);
      expect(normalizarRol('ADMINISTRADOR')).toBe(ROLES.ADMIN);
      expect(normalizarRol('cajero')).toBe(ROLES.CAJERO);
      expect(normalizarRol('Caja POS')).toBe(ROLES.CAJERO);
      expect(normalizarRol('supervisor')).toBe(ROLES.SUPERVISOR);
      expect(normalizarRol('contador')).toBe(ROLES.CONTADOR);
    });

    it('debe manejar objetos devueltos por el backend relacional', () => {
      expect(normalizarRol({ id_rol: 2, nombre: 'CAJERO' })).toBe(ROLES.CAJERO);
      expect(normalizarRol({ rol: 'supervisor' })).toBe(ROLES.SUPERVISOR);
      expect(normalizarRol([{ id: 4 }])).toBe(ROLES.CONTADOR);
    });

    it('debe asignar rol seguro por defecto ante valores nulos o indefinidos', () => {
      expect(normalizarRol(null)).toBe(ROLES.ADMIN);
      expect(normalizarRol(undefined)).toBe(ROLES.ADMIN);
      expect(normalizarRol('')).toBe(ROLES.ADMIN);
    });
  });

  // Grupo 2: Atributos visuales de los badges de rol
  describe('obtenerInfoRol', () => {
    it('debe devolver la información de insignia correcta para el Cajero POS', () => {
      const badgeCajero = obtenerInfoRol(2);
      expect(badgeCajero.label).toBe('CAJERO');
      expect(badgeCajero.nombreCompleto).toBe('Cajero POS');
      expect(badgeCajero.icon).toBe('🛒');
      expect(badgeCajero.color).toBe('#d1fae5');
    });

    it('debe devolver la insignia correcta para el Administrador', () => {
      const badgeAdmin = obtenerInfoRol(1);
      expect(badgeAdmin.label).toBe('ADMIN');
      expect(badgeAdmin.nombreCompleto).toBe('Administrador');
      expect(badgeAdmin.icon).toBe('👑');
    });

    it('debe devolver la insignia del Admin como fallback cuando el rol no existe', () => {
      const fallback = obtenerInfoRol(999);
      expect(fallback.label).toBe('ADMIN');
    });
  });
});

