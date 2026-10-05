import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  BarChart3, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Database, 
  Cpu, 
  Sparkles,
  Users,
  LogIn,
  Store,
  Receipt,
  TrendingUp,
  Clock,
  Shield,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES_DB } from '../../constants/roles';
import './HomeView.css';

export const HomeView = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isCajero, user } = useAuth();

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
      badge: 'Cajero / POS',
      color: 'emerald'
    },
    {
      icon: <Package className="feature-icon text-amber" size={28} />,
      title: 'Control de Inventario',
      description: 'Gestión de existencias en tiempo real con monitoreo de stock mínimo, alertas automáticas de agotamiento y categorización de productos.',
      badge: 'Bodega / Stock',
      color: 'amber'
    },
    {
      icon: <Truck className="feature-icon text-blue" size={28} />,
      title: 'Proveedores y Compras',
      description: 'Registro de proveedores comerciales y órdenes de entrada de mercancía para reabastecer el inventario de manera controlada y trazable.',
      badge: 'Abastecimiento',
      color: 'blue'
    },
    {
      icon: <BarChart3 className="feature-icon text-purple" size={28} />,
      title: 'Reportes y Analítica',
      description: 'Métricas de rendimiento, balances de ingresos, ventas diarias/mensuales con gráficos interactivos y desglose financiero de rentabilidad.',
      badge: 'Contabilidad',
      color: 'purple'
    },
    {
      icon: <Receipt className="feature-icon text-violet" size={28} />,
      title: 'Facturación y PDF',
      description: 'Generación y exportación de facturas electrónicas y comprobantes de venta oficiales en formato PDF con jsPDF y AutoTable.',
      badge: 'Comprobantes',
      color: 'violet'
    },
    {
      icon: <ShieldCheck className="feature-icon text-indigo" size={28} />,
      title: 'Seguridad RBAC (4 Roles)',
      description: 'Control de acceso granular basado en roles (Admin, Contador, Supervisor y Cajero) con autenticación protegida por JWT.',
      badge: 'Seguridad',
      color: 'indigo'
    }
  ];

  const techStack = [
    { name: 'React 19', role: 'Frontend UI Dinámico', icon: <Cpu size={20} /> },
    { name: 'Vite', role: 'Bundler de Alta Velocidad', icon: <Sparkles size={20} /> },
    { name: 'NestJS', role: 'Backend Modular & REST API', icon: <Layers size={20} /> },
    { name: 'PostgreSQL', role: 'Base de Datos Relacional', icon: <Database size={20} /> },
    { name: 'JWT + RBAC', role: 'Autenticación & Permisos', icon: <KeyRound size={20} /> },
    { name: 'Recharts', role: 'Analítica Visual', icon: <TrendingUp size={20} /> }
  ];

  return (
    <div className="landing-wrapper">
      {/* Barra de navegación de la Landing */}
      <header className="landing-header">
        <div className="landing-brand">
          <div className="brand-badge-dot"></div>
          <div className="brand-text-block">
            <span className="brand-title">Tienda Comunitaria</span>
            <span className="brand-subtitle">Software de Gestión & POS</span>
          </div>
        </div>

        <nav className="landing-nav-actions">
          <a href="#modulos" className="nav-link">Módulos</a>
          <a href="#roles" className="nav-link">Roles RBAC</a>
          <a href="#arquitectura" className="nav-link">Arquitectura</a>
          
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

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow-bg"></div>
        <div className="hero-badge-tag">
          <Sparkles size={15} />
          <span>Proyecto de Software • Semestre 6</span>
        </div>

        <h1 className="hero-title">
          Sistema Integral de Gestión Comercial & <span className="text-gradient">Punto de Venta</span>
        </h1>

        <p className="hero-description">
          Plataforma modular desarrollada para optimizar la operación de tiendas comunitarias y negocios minoristas: 
          ventas en caja (POS), control de existencias, facturación PDF, abastecimiento con proveedores y reportes contables en tiempo real.
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

        {/* Mini stats cards */}
        <div className="hero-stats-grid">
          <div className="stat-card">
            <div className="stat-number">5</div>
            <div className="stat-label">Roles RBAC Especializados</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">100%</div>
            <div className="stat-label">Control de Stock en Tiempo Real</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">PDF</div>
            <div className="stat-label">Emisión de Facturas y Reportes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">REST</div>
            <div className="stat-label">Arquitectura Fullstack Modular</div>
          </div>
        </div>
      </section>

      {/* Sección: Módulos del Sistema */}
      <section id="modulos" className="section-container">
        <div className="section-header">
          <span className="section-badge">Capacidades del Sistema</span>
          <h2 className="section-title">Módulos Funcionales Diseñados para la Operación</h2>
          <p className="section-subtitle">
            Cada área del negocio cuenta con una herramienta especializada para garantizar rapidez, integridad de datos y control financiero.
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

      {/* Sección: Roles y Permisos (RBAC) */}
      <section id="roles" className="section-container section-roles">
        <div className="section-header">
          <span className="section-badge">Control de Acceso</span>
          <h2 className="section-title">Modelo de Seguridad RBAC (5 Roles)</h2>
          <p className="section-subtitle">
            Garantiza que cada usuario acceda únicamente a las vistas y funciones acordes a su responsabilidad en la tienda.
          </p>
        </div>

        <div className="roles-grid">
          {ROLES_DB.map((r) => (
            <div key={r.id} className="role-card">
              <div className="role-card-header">
                <span className="role-emoji">{r.icon}</span>
                <div>
                  <h4 className="role-name">{r.label}</h4>
                  <span className="role-tag">Rol #{r.id} ({r.nombre})</span>
                </div>
              </div>
              <ul className="role-features">
                {r.id === 1 && (
                  <>
                    <li><CheckCircle2 size={15} /> Control total de usuarios y roles</li>
                    <li><CheckCircle2 size={15} /> Configuración global de la tienda</li>
                    <li><CheckCircle2 size={15} /> Acceso a todos los módulos y reportes</li>
                  </>
                )}
                {r.id === 2 && (
                  <>
                    <li><CheckCircle2 size={15} /> Balances y métricas financieras</li>
                    <li><CheckCircle2 size={15} /> Arqueo de ingresos y métodos de pago</li>
                    <li><CheckCircle2 size={15} /> Exportación de reportes contables</li>
                  </>
                )}
                {r.id === 3 && (
                  <>
                    <li><CheckCircle2 size={15} /> Catálogo de productos y categorías</li>
                    <li><CheckCircle2 size={15} /> Control de existencias y stock mínimo</li>
                    <li><CheckCircle2 size={15} /> Registro de entradas de compras</li>
                  </>
                )}
                {r.id === 4 && (
                  <>
                    <li><CheckCircle2 size={15} /> Supervisión de caja y movimientos</li>
                    <li><CheckCircle2 size={15} /> Monitoreo de actividad de usuarios</li>
                    <li><CheckCircle2 size={15} /> Anulaciones y auditoría operativa</li>
                  </>
                )}
                {r.id === 5 && (
                  <>
                    <li><CheckCircle2 size={15} /> Terminal de venta rápida en caja</li>
                    <li><CheckCircle2 size={15} /> Búsqueda por código de barras</li>
                    <li><CheckCircle2 size={15} /> Emisión de comprobantes al cliente</li>
                  </>
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Sección: Arquitectura y Stack Tecnológico */}
      <section id="arquitectura" className="section-container">
        <div className="section-header">
          <span className="section-badge">Stack de Ingeniería</span>
          <h2 className="section-title">Arquitectura Fullstack Moderna y Desacoplada</h2>
          <p className="section-subtitle">
            Construido siguiendo las mejores prácticas de desarrollo web, separación de responsabilidades y escalabilidad.
          </p>
        </div>

        <div className="tech-grid">
          {techStack.map((tech, idx) => (
            <div key={idx} className="tech-card">
              <div className="tech-icon">{tech.icon}</div>
              <div className="tech-info">
                <h4>{tech.name}</h4>
                <p>{tech.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="cta-banner-section">
        <div className="cta-banner">
          <div className="cta-content">
            <h2 className="cta-title">¿Listo para operar el sistema?</h2>
            <p className="cta-desc">
              Inicia sesión con tus credenciales de usuario o explora los diferentes perfiles del sistema para evaluar el funcionamiento.
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
            <p>Proyecto de Software 3 • Universidad / Semestre 6</p>
          </div>
          <div className="footer-right">
            <span>Sistema POS & Gestión Comercial • Versión 1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeView;
