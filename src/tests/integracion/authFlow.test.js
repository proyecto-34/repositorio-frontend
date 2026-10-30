import { describe, it, expect, beforeEach, vi } from 'vitest';
import authService from '../../services/authService';
import axiosClient from '../../api/axiosClient';

describe('Pruebas de Integración - Flujo de Autenticación y Persistencia (authService.js)', () => {

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Inicio de sesión (login)', () => {
    it('debe enviar credenciales al backend, recibir respuesta exitosa y persistir el usuario y token en localStorage', async () => {
      // Mock de respuesta exitosa del servidor NestJS
      const mockRespuestaBackend = {
        data: {
          token: 'token_jwt_seguro_xyz_123',
          usuario: {
            id: 2,
            nombre: 'Carlos Cajero',
            correo: 'cajero@tienda.com',
            id_rol: 2,
            rol: 'cajero'
          }
        }
      };

      vi.spyOn(axiosClient, 'post').mockResolvedValue(mockRespuestaBackend);

      const resultado = await authService.login({
        correo: 'cajero@tienda.com',
        contraseña: '123456'
      });

      // Valida que el servicio devuelva el token y usuario
      expect(resultado.token).toBe('token_jwt_seguro_xyz_123');
      expect(resultado.user.nombre).toBe('Carlos Cajero');
      expect(resultado.user.rol).toBe('cajero');

      // Valida persistencia real en localStorage (Integración frontend con almacenamiento)
      expect(localStorage.getItem('token')).toBe('token_jwt_seguro_xyz_123');
      const usuarioGuardado = JSON.parse(localStorage.getItem('user'));
      expect(usuarioGuardado.correo).toBe('cajero@tienda.com');
      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('Cierre de sesión (logout)', () => {
    it('debe limpiar completamente los datos de usuario y token de localStorage', () => {
      // Simular que el usuario ya estaba logueado
      localStorage.setItem('token', 'token_activo_456');
      localStorage.setItem('user', JSON.stringify({ nombre: 'Admin' }));

      expect(authService.isAuthenticated()).toBe(true);

      // Ejecutar logout
      authService.logout();

      // Validar que se limpiaron las credenciales
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getStoredUser()).toBeNull();
    });
  });
});

