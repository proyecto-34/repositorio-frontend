import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// --- Mocks (se hoistean automáticamente antes de los imports) ---
vi.mock('../../api/axiosClient', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

// Componentes decorativos que podrían requerir otros providers
vi.mock('../../components/MotivationalQuote', () => ({ default: () => null }));
vi.mock('../../components/ThemeToggle', () => ({ default: () => null }));
vi.mock('../../components/FontSizeToggle', () => ({ default: () => null }));

import axiosClient from '../../api/axiosClient';
import { toast } from 'sonner';
import { AuthProvider } from '../../context/AuthContext';
import LoginView from '../../views/auth/LoginView';
import { ROLES } from '../../constants/roles';

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route path="/admin" element={<h1>Panel Admin</h1>} />
          <Route path="/cajero" element={<h1>Panel Cajero</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

const llenarYEnviar = async (email, password) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/correo/i), email);
  await user.type(screen.getByLabelText(/^contrase.a$/i), password);
  await user.click(screen.getByRole('button', { name: /ingresar al sistema/i }));
};

describe('Integración: LoginView + AuthContext + authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('login de admin: llama a la API, guarda sesión y navega a /admin', async () => {
    axiosClient.post.mockResolvedValue({
      data: { token: 'abc123', user: { id: 1, nombre: 'Ana', rol: ROLES.ADMIN } },
    });

    renderLogin();
    await llenarYEnviar('ana@tienda.com', '123456');

    expect(await screen.findByText('Panel Admin')).toBeInTheDocument();
    expect(axiosClient.post).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('token')).toBe('abc123');
    expect(JSON.parse(localStorage.getItem('user')).nombre).toBe('Ana');
    expect(toast.success).toHaveBeenCalled();
  });

  it('login de cajero: navega a /cajero', async () => {
    axiosClient.post.mockResolvedValue({
      data: { token: 'xyz789', user: { id: 2, nombre: 'Luis', rol: ROLES.CAJERO } },
    });

    renderLogin();
    await llenarYEnviar('luis@tienda.com', '123456');

    expect(await screen.findByText('Panel Cajero')).toBeInTheDocument();
  });

  it('credenciales incorrectas: muestra el error y NO guarda sesión', async () => {
    axiosClient.post.mockRejectedValue({
      response: { status: 401, data: { message: 'Credenciales inválidas' } },
    });

    renderLogin();
    await llenarYEnviar('ana@tienda.com', 'mala-clave');

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Credenciales inválidas')
    );
    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.queryByText('Panel Admin')).not.toBeInTheDocument();
  });
});