import { describe, it, expect, beforeEach, vi } from 'vitest';
import axiosClient from '../../api/axiosClient';

describe('Pruebas de Integración - Interceptores HTTP de Seguridad (axiosClient.js)', () => {

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    // Simular que estamos en una ruta privada como /cajero
    window.history.pushState({}, '', '/cajero');
  });

  describe('Interceptor de Peticiones (Request Interceptor)', () => {
    it('debe inyectar el encabezado "Authorization: Bearer <token>" cuando existe sesión activa en localStorage', async () => {
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fakeToken123';
      localStorage.setItem('token', fakeToken);

      const requestHandler = axiosClient.interceptors.request.handlers[0];
      const config = { headers: {} };

      const resultadoConfig = await requestHandler.fulfilled(config);

      expect(resultadoConfig.headers.Authorization).toBe(`Bearer ${fakeToken}`);
    });

    it('no debe inyectar el encabezado Authorization si no hay token guardado', async () => {
      const requestHandler = axiosClient.interceptors.request.handlers[0];
      const config = { headers: {} };

      const resultadoConfig = await requestHandler.fulfilled(config);

      expect(resultadoConfig.headers.Authorization).toBeUndefined();
    });
  });

  describe('Interceptor de Respuestas (Response Interceptor - Manejo 401)', () => {
    it('debe limpiar las credenciales de localStorage cuando el backend responde con 401 (No Autorizado)', async () => {
      localStorage.setItem('token', 'token_expirado_abc');
      localStorage.setItem('user', JSON.stringify({ nombre: 'Cajero 1' }));

      const responseHandler = axiosClient.interceptors.response.handlers[0];

      const error401 = {
        config: { url: '/productos' },
        response: { status: 401, data: { message: 'Token expirado' } },
      };

      try {
        await responseHandler.rejected(error401);
      } catch {
        // Se espera el rechazo de la promesa
      }

      // Debe haber limpiado las credenciales por seguridad
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('debe retornar la respuesta exitosa intacta cuando el status es 200/201', async () => {
      const responseHandler = axiosClient.interceptors.response.handlers[0];
      const mockResponse = { status: 200, data: [{ id: 1, nombre: 'Producto 1' }] };

      const res = await responseHandler.fulfilled(mockResponse);

      expect(res.data).toEqual(mockResponse.data);
      expect(res.status).toBe(200);
    });
  });
});
