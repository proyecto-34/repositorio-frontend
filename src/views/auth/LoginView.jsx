import { useState } from 'react';
import { toast } from 'sonner';
import { 
  Eye, 
  EyeOff, 
  Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES, normalizarRol } from '../../constants/roles';
import MotivationalQuote from '../../components/MotivationalQuote';
import './LoginView.css';

/**
 * Vista de Inicio de Sesión
 * Minimalista, sin bordes, paleta Deep Indigo & Violeta
 */
export const LoginView = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      toast.success('¡Inicio de sesión exitoso!');
      
      const userRole = normalizarRol(result.user?.id_rol || result.user?.rol || result.user?.role);
      
      if (userRole === ROLES.CAJERO) {
        navigate('/cajero');
      } else {
        navigate('/admin');
      }
    } catch (error) {
      let errorMsg = 'Error al iniciar sesión. Verifica tus credenciales.';

      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMsg = 'No se pudo conectar con el servidor backend (http://localhost:3000). Verifica que el servidor NestJS esté iniciado.';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }

      toast.error(
        Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Cabecera limpia y tipográfica */}
        <div className="login-header">
          <span className="login-header-badge">Acceso al Sistema</span>
          <h1>Tienda Comunitaria</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        {/* Formulario de Autenticación */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico / Usuario</label>
            <div className="input-wrapper">
              <input
                id="email"
                type="text"
                name="email"
                placeholder="usuario@tienda.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <span>Recordar sesión</span>
            </label>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="spin-icon" size={18} />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <span>Ingresar al Sistema</span>
            )}
          </button>
        </form>

        {/* Frase Motivacional Integrada */}
        <MotivationalQuote />

        {/* Pie informativo */}
        <div className="login-footer">
          <p>Autenticación segura con JWT & NestJS</p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
