import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  BarChart3, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  LogIn,
  Receipt,
  TrendingUp,
  Clock,
  HeartHandshake,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/ThemeToggle';
import FontSizeToggle from '../../components/FontSizeToggle';
import './HomeView.css';

export const HomeView = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isCajero, user } = useAuth();
  const heroRef = useRef(null);

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;

    const handleMouseMove = (e) => {
      const rect = heroEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      heroEl.style.setProperty('--mouse-x', `${x}px`);
      heroEl.style.setProperty('--mouse-y', `${y}px`);
    };

    heroEl.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      heroEl.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleCtaClick = () => {
    if (isAuthenticated) {
      if (isCajero) {
        navigate('/cajero');
      } else {
        navigate('/admin');
      }
    } else {
      navigate('/login');
    }
  };

  const modulos = [
    {
      icon: <ShoppingCart className="feature-icon text-emerald" size={28} />,
      title: 'Punto de Venta (POS)',
      description: 'Caja rápida optimizada para ventas fluidas, lector de código de barras, calculadora de cambio y múltiples medios de pago (Efectivo, Tarjeta, Nequi).',
      badge: 'Cajero / Ventas',
      color: 'emerald'
    },
    {
      icon: <Package className="feature-icon text-amber" size={28} />,
      title: 'Control de Inventario',
      description: 'Gestión de existencias en tiempo real con monitoreo de stock mínimo, alertas automáticas de agotamiento y categorización de productos.',
      badge: 'Bodega / Existencias',
      color: 'amber'
    },
    {
      icon: <Truck className="feature-icon text-blue" size={28} />,
      title: 'Proveedores y Abastecimiento',
      description: 'Registro de proveedores comerciales y órdenes de entrada de mercancía para reabastecer el inventario de manera controlada y trazable.',
      badge: 'Compras',
      color: 'blue'
    },
    {
      icon: <BarChart3 className="feature-icon text-purple" size={28} />,
      title: 'Reportes y Finanzas',
      description: 'Métricas de rendimiento, balances de ingresos, ventas diarias y mensuales con gráficos claros y desglose financiero de rentabilidad.',
      badge: 'Contabilidad',
      color: 'purple'
    },
    {
      icon: <Receipt className="feature-icon text-violet" size={28} />,
      title: 'Facturación y Comprobantes',
      description: 'Generación y descarga de comprobantes de venta oficiales en formato PDF con detalle de productos, IVA y método de pago.',
      badge: 'Facturas PDF',
      color: 'violet'
    },
    {
      icon: <ShieldCheck className="feature-icon text-indigo" size={28} />,
      title: 'Seguridad Multi-Usuario',
      description: 'Control de acceso protegido para que el administrador, cajero, supervisor y contador tengan sus propias funciones asignadas.',
      badge: 'Acceso Protegido',
      color: 'indigo'
    }
  ];

  return (
    <div className="landing-wrapper">
      {/* Barra de navegación de la Landing (Fijada en la cabecera) */}
      <header className="landing-header">
        <div className="landing-brand">
          <div className="brand-badge-dot"></div>
          <div className="brand-text-block">
            <span className="brand-title">Tienda Comunitaria</span>
            <span className="brand-subtitle">Software de Gestión Comercial & POS</span>
          </div>
        </div>

        <nav className="landing-nav-actions">
          <a href="#modulos" className="nav-link">Módulos</a>
          <a href="#beneficios" className="nav-link">Beneficios</a>
          
          <FontSizeToggle />
          <ThemeToggle />

          {isAuthenticated ? (
            <button onClick={handleCtaClick} className="btn-header-cta">
              <span>Ir al Panel ({user?.nombre || 'Sesión Activa'})</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="btn-header-cta">
              <LogIn size={16} />
              <span>Iniciar Sesión</span>
            </button>
          )}
        </nav>
      </header>

      {/* Hero Section con resplandor y cuadrícula interactiva al cursor */}
      <section ref={heroRef} className="hero-section">
        <div className="hero-grid-pattern"></div>
        <div className="hero-glow-bg"></div>
        <div className="hero-badge-tag">
          <Sparkles size={15} />
          <span>Solución Comercial para Tiendas y Negocios</span>
        </div>

        <h1 className="hero-title">
          Sistema Integral de Gestión Comercial & <span className="text-gradient">Punto de Venta</span>
        </h1>

        <p className="hero-description">
          Plataforma moderna diseñada para facilitar la operación diaria de tiendas comunitarias y minimercados: 
          atención ágil en caja (POS), control de existencias en tiempo real, facturación PDF, abastecimiento con proveedores y balances contables claros.
        </p>

        <div className="hero-actions">
          <button onClick={handleCtaClick} className="btn-primary-hero">
            <span>{isAuthenticated ? 'Acceder al Dashboard' : 'Ingresar al Sistema'}</span>
            <ArrowRight size={18} />
          </button>
          <a href="#modulos" className="btn-secondary-hero">
            <span>Explorar Módulos</span>
          </a>
        </div>
      </section>

      {/* Sección: Módulos del Sistema */}
      <section id="modulos" className="section-container">
        <div className="section-header">
          <span className="section-badge">Capacidades del Sistema</span>
          <h2 className="section-title">Módulos Funcionales Diseñados para la Operación</h2>
          <p className="section-subtitle">
            Cada área del negocio cuenta con una herramienta especializada para garantizar rapidez en la atención, inventario exacto y control financiero.
          </p>
        </div>

        <div className="modules-grid">
          {modulos.map((mod, idx) => (
            <div key={idx} className={`module-card card-${mod.color}`}>
              <div className="module-card-header">
                <div className="module-icon-box">{mod.icon}</div>
                <span className="module-badge">{mod.badge}</span>
              </div>
              <h3 className="module-title">{mod.title}</h3>
              <p className="module-description">{mod.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sección: Beneficios para el Comerciante (Enfoque de Negocio) */}
      <section id="beneficios" className="section-container">
        <div className="section-header">
          <span className="section-badge">Ventajas para el Negocio</span>
          <h2 className="section-title">¿Por qué Elegir este Sistema para tu Tienda?</h2>
          <p className="section-subtitle">
            Beneficios concretos pensados en el tendero, los cajeros y la comunidad de clientes.
          </p>
        </div>

        <div className="modules-grid">
          <div className="module-card card-emerald">
            <div className="module-card-header">
              <div className="module-icon-box"><TrendingUp className="feature-icon text-emerald" size={28} /></div>
              <span className="module-badge">Cero Pérdidas</span>
            </div>
            <h3 className="module-title">Control Total de Inventario</h3>
            <p className="module-description">
              Sabrás con precisión qué productos tienes disponibles, cuáles se están agotando y cuándo hacer pedidos a tus proveedores sin quedarte sin mercancía.
            </p>
          </div>

          <div className="module-card card-blue">
            <div className="module-card-header">
              <div className="module-icon-box"><Clock className="feature-icon text-blue" size={28} /></div>
              <span className="module-badge">Atención Rápida</span>
            </div>
            <h3 className="module-title">Cobro Ágil y sin Filas</h3>
            <p className="module-description">
              Atiende a tus clientes en segundos con búsqueda instantánea, cálculo automático de vueltas y soporte para pagos en efectivo, Nequi o tarjeta.
            </p>
          </div>

          <div className="module-card card-purple">
            <div className="module-card-header">
              <div className="module-icon-box"><BadgeCheck className="feature-icon text-purple" size={28} /></div>
              <span className="module-badge">Cuentas Claras</span>
            </div>
            <h3 className="module-title">Cierre de Caja y Balances Diarios</h3>
            <p className="module-description">
              Consulta al instante los ingresos reales del día, el IVA recaudado y los productos más vendidos sin necesidad de cuadernos ni cálculos manuales.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final Adaptable a Modo Claro y Oscuro */}
      <section className="cta-banner-section">
        <div className="cta-banner">
          <div className="cta-content">
            <h2 className="cta-title">¿Listo para operar el sistema?</h2>
            <p className="cta-desc">
              Inicia sesión con tus credenciales de usuario para comenzar a vender en caja o administrar el inventario de tu tienda.
            </p>
          </div>
          <button onClick={handleCtaClick} className="btn-cta-large">
            <LogIn size={20} />
            <span>{isAuthenticated ? 'Volver al Sistema' : 'Ir al Inicio de Sesión'}</span>
          </button>
        </div>
      </section>

      {/* Pie de Página */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-left">
            <span className="footer-brand">Tienda Comunitaria</span>
            <p>Sistema POS & Gestión Comercial para Negocios y Minimercados</p>
          </div>
          <div className="footer-right">
            <span>Versión 1.0 • Operación en Tiempo Real</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeView;
