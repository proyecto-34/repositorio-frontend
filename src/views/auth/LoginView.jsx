import { useState } from 'react';
import { toast } from 'sonner';
import { 
  Store, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  ShieldCheck 
} from 'lucide-react';
import authService from '../../services/authService';
import MotivationalQuote from '../../components/MotivationalQuote';
import './LoginView.css';

/**
 * Vista de Inicio de Sesión
 * Permite a los usuarios ingresar credenciales para autenticarse con NestJS
 * e incluye una tarjeta motivacional integrada
 */
export const LoginView = ({ onLoginSuccess }) => {
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
      const result = await authService.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      toast.success('¡Inicio de sesión exitoso!');
      
      if (onLoginSuccess) {
        onLoginSuccess(result);
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Error al iniciar sesión. Verifica tus credenciales.';

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
        {/* Cabecera con Icono y Marca */}
        <div className="login-header">
          <div className="brand-icon">
            <Store size={26} />
          </div>
          <h1>Tienda Comunitaria</h1>
          <p>Ingresa tus credenciales para acceder</p>
        </div>

        {/* Formulario de Autenticación */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico / Usuario</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
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
              <Lock className="input-icon" size={18} />
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
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Tarjeta de Frase Motivacional Integrada */}
        <MotivationalQuote />

        {/* Pie de seguridad */}
        <div className="login-footer">
          <p>
            <ShieldCheck size={16} /> Autenticación segura con JWT & NestJS
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
