import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import ProtectedRoute from '../../routes/ProtectedRoute';
import { ROLES } from '../../constants/roles';

const renderApp = (ruta) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<h1>Pantalla Login</h1>} />
          <Route path="/forbidden" element={<h1>Acceso Prohibido</h1>} />
          <Route
            path="/caja"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.CAJERO]}>
                <h1>Pantalla Caja</h1>
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <h1>Pantalla Usuarios</h1>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

const iniciarSesion = (rol) => {
  localStorage.setItem('token', 'token-falso');
  localStorage.setItem('user', JSON.stringify({ id: 1, nombre: 'Test', rol }));
};

describe('Integración: ProtectedRoute + AuthProvider + Router', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirige a /login si no hay sesión', () => {
    renderApp('/caja');
    expect(screen.getByText('Pantalla Login')).toBeInTheDocument();
  });

  it('permite a un cajero entrar a /caja', () => {
    iniciarSesion(ROLES.CAJERO);
    renderApp('/caja');
    expect(screen.getByText('Pantalla Caja')).toBeInTheDocument();
  });

  it('redirige a /forbidden si un cajero intenta entrar a una ruta solo de admin', () => {
    iniciarSesion(ROLES.CAJERO);
    renderApp('/usuarios');
    expect(screen.getByText('Acceso Prohibido')).toBeInTheDocument();
    expect(screen.queryByText('Pantalla Usuarios')).not.toBeInTheDocument();
  });

  it('permite a un admin entrar a /usuarios', () => {
    iniciarSesion(ROLES.ADMIN);
    renderApp('/usuarios');
    expect(screen.getByText('Pantalla Usuarios')).toBeInTheDocument();
  });
});