import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Eye, EyeOff, LogOut, Clock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import './AutoLockGuard.css';

const STORAGE_LOCK_KEY = 'tienda_auto_lock_seconds';
const STORAGE_IS_LOCKED = 'tienda_session_locked';

export const TIEMPOS_INACTIVIDAD = [
  { valor: 15, label: '15 seg (Demo en Vivo)' },
  { valor: 30, label: '30 seg (Demo Rápido)' },
  { valor: 60, label: '1 minuto' },
  { valor: 300, label: '5 minutos (Recomendado)' },
  { valor: 600, label: '10 minutos' },
  { valor: 0, label: 'Desactivado' },
];

export const AutoLockGuard = ({ onLogout }) => {
  const { user, isAuthenticated } = useAuth();
  const [isLocked, setIsLocked] = useState(() => {
    return localStorage.getItem(STORAGE_IS_LOCKED) === 'true';
  });

  const [tiempoSegundos, setTiempoSegundos] = useState(() => {
    const guardado = localStorage.getItem(STORAGE_LOCK_KEY);
    return guardado !== null ? Number(guardado) : 300; // 5 minutos por defecto
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validando, setValidando] = useState(false);
  const timerRef = useRef(null);

  // Guardar configuración de tiempo
  const cambiarTiempo = (segundos) => {
    const num = Number(segundos);
    setTiempoSegundos(num);
    localStorage.setItem(STORAGE_LOCK_KEY, String(num));
    toast.info(
      num === 0
        ? 'Bloqueo automático desactivado'
        : `Bloqueo automático configurado en ${TIEMPOS_INACTIVIDAD.find((t) => t.valor === num)?.label || `${num}s`}`,
      { duration: 2500 }
    );
  };

  // Bloquea manualmente la pantalla
  const bloquearPantalla = () => {
    if (!isAuthenticated || !user) return;
    setIsLocked(true);
    localStorage.setItem(STORAGE_IS_LOCKED, 'true');
  };

  // Listener para bloqueo manual desde el Navbar
  useEffect(() => {
    const handleForzar = () => bloquearPantalla();
    window.addEventListener('tc_lock_screen', handleForzar);
    return () => window.removeEventListener('tc_lock_screen', handleForzar);
  }, [isAuthenticated, user]);

  // Temporizador de inactividad
  useEffect(() => {
    if (!isAuthenticated || !user || tiempoSegundos === 0 || isLocked) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const reiniciarTemporizador = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        bloquearPantalla();
        toast.warning('Pantalla bloqueada por inactividad');
      }, tiempoSegundos * 1000);
    };

    // Eventos de actividad humana
    const eventos = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    eventos.forEach((evt) => window.addEventListener(evt, reiniciarTemporizador, { passive: true }));

    // Iniciar temporizador inicial
    reiniciarTemporizador();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      eventos.forEach((evt) => window.removeEventListener(evt, reiniciarTemporizador));
    };
  }, [isAuthenticated, user, tiempoSegundos, isLocked]);

  // Desbloqueo mediante contraseña
  const handleDesbloquear = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('Por favor escribe tu contraseña para desbloquear');
      return;
    }

    setValidando(true);
    try {
      // Validar credenciales contra el backend
      const correo = user?.email || user?.correo;
      if (correo) {
        await authService.login({
          email: correo,
          password: password.trim(),
        });
      }

      setIsLocked(false);
      localStorage.removeItem(STORAGE_IS_LOCKED);
      setPassword('');
      toast.success('¡Sesión desbloqueada!');
    } catch (err) {
      toast.error('Contraseña incorrecta. Inténtalo nuevamente.');
    } finally {
      setValidando(false);
    }
  };

  // Desbloqueo rápido para demostración en clase (por si no recuerdan la clave en vivo)
  const handleDesbloqueoDemo = () => {
    setIsLocked(false);
    localStorage.removeItem(STORAGE_IS_LOCKED);
    setPassword('');
    toast.success('Sesión desbloqueada (Modo Demostración)');
  };

  // Si no está bloqueado o no está autenticado, no renderiza overlay
  if (!isAuthenticated || !isLocked) return null;

  return (
    <div className="auto-lock-overlay">
      <div className="auto-lock-card">
        <div className="auto-lock-icon-wrap">
          <Lock size={32} />
        </div>

        <div>
          <h2 className="auto-lock-title">Sesión Bloqueada</h2>
          <p className="auto-lock-desc">
            Por seguridad, la pantalla se bloqueó tras detectar inactividad. Ingresa tu contraseña para continuar exactamente donde estabas.
          </p>
        </div>

        <div className="auto-lock-user-badge">
          <ShieldCheck size={16} color="#16a34a" />
          <span>{user?.nombre || user?.email || 'Usuario Activo'}</span>
        </div>

        <form onSubmit={handleDesbloquear} className="auto-lock-form">
          <div className="auto-lock-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña del usuario..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auto-lock-input"
              autoFocus
              disabled={validando}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="auto-lock-toggle-pass"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={validando || !password.trim()}
            className="auto-lock-btn-unlock"
          >
            <Unlock size={18} />
            <span>{validando ? 'Comprobando...' : 'Desbloquear Sesión'}</span>
          </button>

          <button
            type="button"
            onClick={handleDesbloqueoDemo}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.74rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              marginTop: '2px',
            }}
            title="Desbloquear inmediatamente para pruebas"
          >
            Desbloqueo rápido (Demostración)
          </button>
        </form>

        <div className="auto-lock-footer-row">
          <button
            type="button"
            onClick={() => {
              setIsLocked(false);
              localStorage.removeItem(STORAGE_IS_LOCKED);
              if (onLogout) onLogout();
            }}
            className="auto-lock-btn-logout"
          >
            <LogOut size={14} />
            <span>Cerrar Sesión</span>
          </button>

          <div className="auto-lock-timer-config">
            <Clock size={13} />
            <select
              value={tiempoSegundos}
              onChange={(e) => cambiarTiempo(Number(e.target.value))}
              className="auto-lock-select-time"
              title="Cambiar tiempo de inactividad para demostración"
            >
              {TIEMPOS_INACTIVIDAD.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoLockGuard;
